const express = require('express');
const router = express.Router();
const db = require('../database/db');
const auth = require('../middleware/auth');

/**
 * POST /api/import/anc-context
 * Returns existing trimester visit counts per NIK for the kunjungan solver.
 */
router.post('/anc-context', auth, async (req, res) => {
  try {
    const { niks } = req.body;
    if (!Array.isArray(niks) || niks.length === 0) return res.json({});

    const cleanNiks = niks
      .filter(n => n && typeof n === 'string' && /^\d{1,16}$/.test(n.trim()))
      .map(n => n.trim());
    if (cleanNiks.length === 0) return res.json({});

    const placeholders = cleanNiks.map(() => '?').join(',');
    const [rows] = await db.execute(
      `SELECT
         ibu.nik_ibu,
         SUM(CASE WHEN DATEDIFF(anc.tanggal_kunjungan, k.haid_terakhir) BETWEEN 0 AND 91   THEN 1 ELSE 0 END) AS t1,
         SUM(CASE WHEN DATEDIFF(anc.tanggal_kunjungan, k.haid_terakhir) BETWEEN 92 AND 189 THEN 1 ELSE 0 END) AS t2,
         SUM(CASE WHEN DATEDIFF(anc.tanggal_kunjungan, k.haid_terakhir) >= 190             THEN 1 ELSE 0 END) AS t3
       FROM antenatal_care anc
       JOIN kehamilan k ON anc.forkey_hamil = k.id
       JOIN ibu         ON k.forkey_ibu     = ibu.id
       WHERE ibu.nik_ibu IN (${placeholders})
       GROUP BY ibu.nik_ibu`,
      cleanNiks
    );

    const context = {};
    rows.forEach(row => {
      context[row.nik_ibu] = {
        t1: Number(row.t1) || 0,
        t2: Number(row.t2) || 0,
        t3: Number(row.t3) || 0,
      };
    });
    res.json(context);
  } catch (error) {
    console.error('Import ANC context error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
/**
 * POST /api/import/commit
 *
 * Commits a batch of pre-validated import records to the database.
 * Only records with _importStatus === 'new' are processed.
 *
 * Deduplication (three levels, all checked inside the transaction):
 *   1. ibu      — by nik_ibu (INSERT or reuse existing)
 *   2. kehamilan — by forkey_ibu + haid_terakhir (INSERT or reuse existing)
 *   3. antenatal_care — by forkey_hamil + jenis_kunjungan (INSERT or SKIP)
 *
 * Request body:
 *   {
 *     records:    ImportRecord[],   // from localStorage preview
 *     locationMap: { [rowIndex]: { kelurahan_id, rt, posyandu_id } }
 *   }
 *
 * Response:
 *   {
 *     inserted:  { ibu, kehamilan, anc, lab, komplikasi },
 *     skipped:   { anc },
 *     errors:    [{ rowIndex, message }]
 *   }
 */
router.post('/commit', auth, async (req, res) => {
  const { records, locationMap = {} } = req.body;

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: 'Tidak ada data untuk diimpor.' });
  }

  // Only process importable records
  const importable = records.filter(r => r._importStatus === 'new');
  if (importable.length === 0) {
    return res.status(400).json({ message: 'Tidak ada baris dengan status "baru" untuk diimpor.' });
  }

  const connection = await db.getConnection();
  const result = {
    inserted: { ibu: 0, kehamilan: 0, anc: 0, lab: 0, komplikasi: 0 },
    skipped:  { anc: 0 },
    errors:   [],
  };

  try {
    await connection.beginTransaction();

    for (const record of importable) {
      const rowIndex = record._rowIndex;
      const { ibu, kehamilan, anc, lab, komplikasi, meta } = record;
      const loc = locationMap[rowIndex] || {};

      try {
        // ── Step 1: ibu ─────────────────────────────────────────────────────
        let ibuId;
        const [existingIbu] = await connection.execute(
          'SELECT id FROM ibu WHERE nik_ibu = ? LIMIT 1',
          [ibu.nik_ibu]
        );

        if (existingIbu.length > 0) {
          ibuId = existingIbu[0].id;
        } else {
          const [ibuResult] = await connection.execute(
            `INSERT INTO ibu
               (nik_ibu, nama_lengkap, tanggal_lahir, no_hp, tinggi_badan,
                buku_kia, pekerjaan, pendidikan, alamat_lengkap,
                kelurahan_id, rt, posyandu_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              ibu.nik_ibu,
              ibu.nama_lengkap,
              ibu.tanggal_lahir   || null,
              ibu.no_hp           || null,
              ibu.tinggi_badan    || null,
              ibu.buku_kia        || null,
              ibu.pekerjaan       || null,
              ibu.pendidikan      || null,
              ibu.alamat_lengkap  || null,
              loc.kelurahan_id    || null,
              loc.rt              || null,
              loc.posyandu_id     || null,
            ]
          );
          ibuId = ibuResult.insertId;
          result.inserted.ibu++;
        }

        // ── Step 2: kehamilan ────────────────────────────────────────────────
        let kehamilanId;
        const [existingKehamilan] = await connection.execute(
          'SELECT id FROM kehamilan WHERE forkey_ibu = ? AND haid_terakhir = ? LIMIT 1',
          [ibuId, kehamilan.haid_terakhir]
        );

        if (existingKehamilan.length > 0) {
          kehamilanId = existingKehamilan[0].id;
        } else {
          // Calculate taksiran_persalinan if not provided (HPHT + 280 days)
          let taksiranPersalinan = kehamilan.taksiran_persalinan || null;
          if (!taksiranPersalinan && kehamilan.haid_terakhir) {
            const hpht = new Date(kehamilan.haid_terakhir);
            taksiranPersalinan = new Date(hpht.getTime() + 280 * 24 * 60 * 60 * 1000)
              .toISOString().substring(0, 10);
          }

          const [kehamilanResult] = await connection.execute(
            `INSERT INTO kehamilan
               (gravida, partus, abortus, haid_terakhir, taksiran_persalinan,
                status_kehamilan, forkey_ibu)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              kehamilan.gravida          ?? 1,
              kehamilan.partus           ?? 0,
              kehamilan.abortus          ?? 0,
              kehamilan.haid_terakhir,
              taksiranPersalinan,
              kehamilan.status_kehamilan || 'Hamil',
              ibuId,
            ]
          );
          kehamilanId = kehamilanResult.insertId;
          result.inserted.kehamilan++;
        }

        // ── Step 3: ANC dedup check ──────────────────────────────────────────
        const [existingAnc] = await connection.execute(
          'SELECT id FROM antenatal_care WHERE forkey_hamil = ? AND jenis_kunjungan = ? LIMIT 1',
          [kehamilanId, anc.jenis_kunjungan]
        );

        if (existingAnc.length > 0) {
          result.skipped.anc++;
          continue; // skip this record — ANC visit already exists
        }

        // ── Step 4: lab_screening (optional) ────────────────────────────────
        let labScreeningId = null;
        if (record._hasLab) {
          const [labResult] = await connection.execute(
            `INSERT INTO lab_screening
               (hasil_lab_hb, lab_protein_urine, lab_gula_darah, hasil_lab_lainnya,
                skrining_gonorea, skrining_klamidia, skrining_hiv, status_art,
                skrining_sifilis, skrining_hbsag, skrining_tb,
                malaria_diberi_kelambu, terapi_malaria, status_malaria,
                terapi_kecacingan, status_kecacingan, forkey_hamil)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              lab.hasil_lab_hb       || null,
              lab.lab_protein_urine  || null,
              lab.lab_gula_darah     || null,
              lab.hasil_lab_lainnya  || null,
              lab.skrining_gonorea   || 'Belum Diperiksa',
              lab.skrining_klamidia  || 'Belum Diperiksa',
              lab.skrining_hiv       || 'Belum Diperiksa',
              lab.status_art         || null,
              lab.skrining_sifilis   || 'Belum Diperiksa',
              lab.skrining_hbsag     || 'Belum Diperiksa',
              lab.skrining_tb        || 'Belum Diperiksa',
              lab.malaria_diberi_kelambu || 'Tidak',
              lab.terapi_malaria     ? 1 : 0,
              lab.status_malaria     || 'Belum Diperiksa',
              lab.terapi_kecacingan  ? 1 : 0,
              lab.status_kecacingan  || 'Belum Diperiksa',
              kehamilanId,
            ]
          );
          labScreeningId = labResult.insertId;
          result.inserted.lab++;
        }

        // ── Step 5: antenatal_care ───────────────────────────────────────────
        const forkey_bidan = meta?.forkey_bidan || 1;

        const [ancResult] = await connection.execute(
          `INSERT INTO antenatal_care
             (tanggal_kunjungan, jenis_kunjungan, jenis_akses, pemeriksa,
              berat_badan, tekanan_darah, lila, tinggi_fundus,
              denyut_jantung_janin, confirm_usg,
              status_imunisasi_tt, beri_tablet_fe,
              hasil_usg, status_risiko_visit,
              hasil_temu_wicara, keterangan_anc,
              forkey_hamil, forkey_bidan, forkey_lab_screening)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            anc.tanggal_kunjungan,
            anc.jenis_kunjungan,
            anc.jenis_akses        || 'Murni',
            anc.pemeriksa          || 'Bidan',
            anc.berat_badan        || null,
            anc.tekanan_darah      || null,
            anc.lila               || null,
            anc.tinggi_fundus      || null,
            anc.denyut_jantung_janin || null,
            anc.confirm_usg        ? 1 : 0,
            anc.status_imunisasi_tt || null,
            anc.beri_tablet_fe     ? 1 : 0,
            anc.hasil_usg          || null,
            anc.status_risiko_visit || 'Normal',
            anc.hasil_temu_wicara  || null,
            anc.keterangan_anc     || null,
            kehamilanId,
            forkey_bidan,
            labScreeningId,
          ]
        );
        const ancId = ancResult.insertId;
        result.inserted.anc++;

        // ── Step 6: komplikasi (one row per flag) ────────────────────────────
        if (record._hasKomplikasi && Array.isArray(komplikasi)) {
          for (const k of komplikasi) {
            if (!k.nama_komplikasi || !k.tanggal_diagnosis) continue;
            await connection.execute(
              `INSERT INTO komplikasi
                 (nama_komplikasi, kejadian, tanggal_diagnosis,
                  rujuk_rs, nama_rs, keterangan,
                  forkey_hamil, forkey_anc)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                k.nama_komplikasi,
                k.kejadian          || 'Saat Hamil',
                k.tanggal_diagnosis,
                k.rujuk_rs          ? 1 : 0,
                k.nama_rs           || null,
                k.keterangan        || null,
                kehamilanId,
                ancId,
              ]
            );
            result.inserted.komplikasi++;
          }
        }

      } catch (rowError) {
        // Row-level error — log and continue, don't abort the whole batch
        result.errors.push({
          rowIndex,
          message: rowError.message || 'Unknown error',
        });
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: `Import selesai. ${result.inserted.anc} kunjungan ANC berhasil disimpan.`,
      result,
    });

  } catch (error) {
    await connection.rollback();
    console.error('Import commit error:', error);
    res.status(500).json({
      success: false,
      message: 'Import gagal — semua perubahan dibatalkan.',
      error: error.message,
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
