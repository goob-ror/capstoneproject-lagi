const express = require('express');
const router = express.Router();
const db = require('../database/db');
const auth = require('../middleware/auth');

// Get active pregnancies for dropdown (must be before /:id route)
router.get('/pregnancies/active', auth, async (req, res) => {
  try {
    const query = `
      SELECT 
        k.id,
        k.gravida,
        k.status_kehamilan,
        k.haid_terakhir,
        k.taksiran_persalinan,
        ibu.nama_lengkap as nama_ibu,
        ibu.nik_ibu
      FROM kehamilan k
      JOIN ibu ON k.forkey_ibu = ibu.id
      WHERE k.status_kehamilan = 'Hamil'
      ORDER BY ibu.nama_lengkap ASC
    `;
    
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching active pregnancies:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get mother data by pregnancy ID
router.get('/pregnancy/:pregnancyId/mother', auth, async (req, res) => {
  try {
    const { pregnancyId } = req.params;
    
    const query = `
      SELECT 
        ibu.id,
        ibu.nama_lengkap,
        ibu.nik_ibu,
        ibu.tinggi_badan,
        ibu.beratbadan
      FROM kehamilan k
      JOIN ibu ON k.forkey_ibu = ibu.id
      WHERE k.id = ?
    `;
    
    const [rows] = await db.execute(query, [pregnancyId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Mother data not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching mother data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get previous visits by pregnancy ID
router.get('/pregnancy/:pregnancyId/visits', auth, async (req, res) => {
  try {
    const { pregnancyId } = req.params;
    
    const query = `
      SELECT 
        id,
        tanggal_kunjungan,
        jenis_kunjungan,
        berat_badan,
        tekanan_darah,
        status_risiko_visit
      FROM antenatal_care
      WHERE forkey_hamil = ?
      ORDER BY tanggal_kunjungan DESC
      LIMIT 5
    `;
    
    const [rows] = await db.execute(query, [pregnancyId]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching previous visits:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Check if a specific visit type exists for a pregnancy
router.get('/pregnancy/:pregnancyId/visit/:jenisKunjungan', auth, async (req, res) => {
  try {
    const { pregnancyId, jenisKunjungan } = req.params;
    
    const query = `
      SELECT * FROM antenatal_care
      WHERE forkey_hamil = ? AND jenis_kunjungan = ?
      LIMIT 1
    `;
    
    const [rows] = await db.execute(query, [pregnancyId, jenisKunjungan]);
    
    if (rows.length === 0) {
      return res.json({ exists: false, data: null });
    }
    
    res.json({ exists: true, data: rows[0] });
  } catch (error) {
    console.error('Error checking existing visit:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all ANC visits with mother names
router.get('/', auth, async (req, res) => {
  try {
    const query = `
      SELECT 
        anc.*,
        ibu.nama_lengkap as nama_ibu,
        ibu.nik_ibu,
        bidan.nama_lengkap as nama_bidan
      FROM antenatal_care anc
      JOIN kehamilan k ON anc.forkey_hamil = k.id
      JOIN ibu ON k.forkey_ibu = ibu.id
      JOIN bidan ON anc.forkey_bidan = bidan.id
      ORDER BY anc.tanggal_kunjungan DESC
    `;
    
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching ANC data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get ANC visit by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const ancQuery = `
      SELECT 
        anc.*,
        ibu.nama_lengkap as nama_ibu,
        ibu.nik_ibu,
        bidan.nama_lengkap as nama_bidan
      FROM antenatal_care anc
      JOIN kehamilan k ON anc.forkey_hamil = k.id
      JOIN ibu ON k.forkey_ibu = ibu.id
      JOIN bidan ON anc.forkey_bidan = bidan.id
      WHERE anc.id = ?
    `;
    
    const [ancRows] = await db.execute(ancQuery, [id]);
    
    if (ancRows.length === 0) {
      return res.status(404).json({ message: 'ANC visit not found' });
    }

    const ancData = ancRows[0];

    // Get lab screening data if exists
    let labScreening = null;
    if (ancData.forkey_lab_screening) {
      const [labRows] = await db.execute(
        'SELECT * FROM lab_screening WHERE id = ?',
        [ancData.forkey_lab_screening]
      );
      labScreening = labRows[0] || null;
    }

    // Get jiwa screening data if exists
    let jiwaScreening = null;
    if (ancData.forkey_jiwa_screening) {
      const [jiwaRows] = await db.execute(
        'SELECT * FROM jiwa_screening WHERE id = ?',
        [ancData.forkey_jiwa_screening]
      );
      jiwaScreening = jiwaRows[0] || null;
    }

    res.json({
      ...ancData,
      lab_screening: labScreening,
      jiwa_screening: jiwaScreening
    });
  } catch (error) {
    console.error('Error fetching ANC visit:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new ANC visit
router.post('/', auth, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { ancData, labScreeningData, jiwaScreeningData } = req.body;

    let labScreeningId = null;
    let jiwaScreeningId = null;

    // Insert lab screening data if provided
    if (labScreeningData && Object.keys(labScreeningData).length > 0) {
      const labQuery = `
        INSERT INTO lab_screening (
          hasil_lab_hb, lab_protein_urine, lab_gula_darah, hasil_lab_lainnya,
          skrining_gonorea, skrining_klamidia, skrining_hiv, status_art,
          skrining_sifilis, skrining_hbsag, skrining_tb,
          malaria_diberi_kelambu, terapi_malaria, status_malaria,
          terapi_kecacingan, status_kecacingan, forkey_hamil
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [labResult] = await connection.execute(labQuery, [
        labScreeningData.hasil_lab_hb || null,
        labScreeningData.lab_protein_urine || 'Negatif',
        labScreeningData.lab_gula_darah || null,
        labScreeningData.hasil_lab_lainnya || null,
        labScreeningData.skrining_gonorea || 'Belum Diperiksa',
        labScreeningData.skrining_klamidia || 'Belum Diperiksa',
        labScreeningData.skrining_hiv || 'Belum Diperiksa',
        labScreeningData.status_art || null,
        labScreeningData.skrining_sifilis || 'Belum Diperiksa',
        labScreeningData.skrining_hbsag || 'Belum Diperiksa',
        labScreeningData.skrining_tb || 'Belum Diperiksa',
        labScreeningData.malaria_diberi_kelambu || 'Tidak',
        labScreeningData.terapi_malaria ? 1 : 0,
        labScreeningData.status_malaria || 'Belum Diperiksa',
        labScreeningData.terapi_kecacingan ? 1 : 0,
        labScreeningData.status_kecacingan || 'Belum Diperiksa',
        ancData.forkey_hamil
      ]);

      labScreeningId = labResult.insertId;
    }

    // Insert jiwa screening data if provided
    if (jiwaScreeningData && jiwaScreeningData.skrining_jiwa) {
      const jiwaQuery = `
        INSERT INTO jiwa_screening (skrining_jiwa, forkey_hamil)
        VALUES (?, ?)
      `;

      const [jiwaResult] = await connection.execute(jiwaQuery, [
        jiwaScreeningData.skrining_jiwa,
        ancData.forkey_hamil
      ]);

      jiwaScreeningId = jiwaResult.insertId;
    }

    // Insert ANC data
    const ancQuery = `
      INSERT INTO antenatal_care (
        tanggal_kunjungan, jenis_kunjungan, jenis_akses, pemeriksa,
        berat_badan, selisih_beratbadan, tekanan_darah, lila, tinggi_fundus,
        denyut_jantung_janin, detak_jantung, confirm_usg,
        status_imunisasi_tt, beri_tablet_fe,
        hasil_usg, status_kmk_usg, status_risiko_visit,
        hasil_temu_wicara, tata_laksana_kasus, keterangan_anc,
        forkey_hamil, forkey_bidan, forkey_lab_screening, forkey_jiwa_screening
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [ancResult] = await connection.execute(ancQuery, [
      ancData.tanggal_kunjungan,
      ancData.jenis_kunjungan,
      ancData.jenis_akses,
      ancData.pemeriksa,
      ancData.berat_badan || null,
      ancData.selisih_beratbadan || null,
      ancData.tekanan_darah || null,
      ancData.lila || null,
      ancData.tinggi_fundus || null,
      ancData.denyut_jantung_janin || null,
      ancData.detak_jantung || null,
      ancData.confirm_usg ? 1 : 0,
      ancData.status_imunisasi_tt || null,
      ancData.beri_tablet_fe ? 1 : 0,
      ancData.hasil_usg || null,
      ancData.status_kmk_usg || null,
      ancData.status_risiko_visit,
      ancData.hasil_temu_wicara || null,
      ancData.tata_laksana_kasus || null,
      ancData.keterangan_anc || null,
      ancData.forkey_hamil,
      ancData.forkey_bidan,
      labScreeningId,
      jiwaScreeningId
    ]);

    await connection.commit();

    res.status(201).json({
      message: 'ANC visit created successfully',
      id: ancResult.insertId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating ANC visit:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Update ANC visit
router.put('/:id', auth, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { ancData, labScreeningData, jiwaScreeningData } = req.body;

    // Get existing ANC data to check for lab and jiwa screening IDs
    const [existingAnc] = await connection.execute(
      'SELECT forkey_lab_screening, forkey_jiwa_screening FROM antenatal_care WHERE id = ?',
      [id]
    );

    if (existingAnc.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'ANC visit not found' });
    }

    const { forkey_lab_screening, forkey_jiwa_screening } = existingAnc[0];

    // Update or create lab screening data
    let labScreeningId = forkey_lab_screening;
    if (labScreeningData && Object.keys(labScreeningData).length > 0) {
      if (forkey_lab_screening) {
        // Update existing lab screening
        const labUpdateQuery = `
          UPDATE lab_screening SET
            hasil_lab_hb = ?, lab_protein_urine = ?, lab_gula_darah = ?, hasil_lab_lainnya = ?,
            skrining_gonorea = ?, skrining_klamidia = ?, skrining_hiv = ?, status_art = ?,
            skrining_sifilis = ?, skrining_hbsag = ?, skrining_tb = ?,
            malaria_diberi_kelambu = ?, terapi_malaria = ?, status_malaria = ?,
            terapi_kecacingan = ?, status_kecacingan = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;

        await connection.execute(labUpdateQuery, [
          labScreeningData.hasil_lab_hb || null,
          labScreeningData.lab_protein_urine || 'Negatif',
          labScreeningData.lab_gula_darah || null,
          labScreeningData.hasil_lab_lainnya || null,
          labScreeningData.skrining_gonorea || 'Belum Diperiksa',
          labScreeningData.skrining_klamidia || 'Belum Diperiksa',
          labScreeningData.skrining_hiv || 'Belum Diperiksa',
          labScreeningData.status_art || null,
          labScreeningData.skrining_sifilis || 'Belum Diperiksa',
          labScreeningData.skrining_hbsag || 'Belum Diperiksa',
          labScreeningData.skrining_tb || 'Belum Diperiksa',
          labScreeningData.malaria_diberi_kelambu || 'Tidak',
          labScreeningData.terapi_malaria ? 1 : 0,
          labScreeningData.status_malaria || 'Belum Diperiksa',
          labScreeningData.terapi_kecacingan ? 1 : 0,
          labScreeningData.status_kecacingan || 'Belum Diperiksa',
          forkey_lab_screening
        ]);
      } else {
        // Create new lab screening
        const labInsertQuery = `
          INSERT INTO lab_screening (
            hasil_lab_hb, lab_protein_urine, lab_gula_darah, hasil_lab_lainnya,
            skrining_gonorea, skrining_klamidia, skrining_hiv, status_art,
            skrining_sifilis, skrining_hbsag, skrining_tb,
            malaria_diberi_kelambu, terapi_malaria, status_malaria,
            terapi_kecacingan, status_kecacingan, forkey_hamil
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [labResult] = await connection.execute(labInsertQuery, [
          labScreeningData.hasil_lab_hb || null,
          labScreeningData.lab_protein_urine || 'Negatif',
          labScreeningData.lab_gula_darah || null,
          labScreeningData.hasil_lab_lainnya || null,
          labScreeningData.skrining_gonorea || 'Belum Diperiksa',
          labScreeningData.skrining_klamidia || 'Belum Diperiksa',
          labScreeningData.skrining_hiv || 'Belum Diperiksa',
          labScreeningData.status_art || null,
          labScreeningData.skrining_sifilis || 'Belum Diperiksa',
          labScreeningData.skrining_hbsag || 'Belum Diperiksa',
          labScreeningData.skrining_tb || 'Belum Diperiksa',
          labScreeningData.malaria_diberi_kelambu || 'Tidak',
          labScreeningData.terapi_malaria ? 1 : 0,
          labScreeningData.status_malaria || 'Belum Diperiksa',
          labScreeningData.terapi_kecacingan ? 1 : 0,
          labScreeningData.status_kecacingan || 'Belum Diperiksa',
          ancData.forkey_hamil
        ]);

        labScreeningId = labResult.insertId;
      }
    }

    // Update or create jiwa screening data
    let jiwaScreeningId = forkey_jiwa_screening;
    if (jiwaScreeningData && jiwaScreeningData.skrining_jiwa) {
      if (forkey_jiwa_screening) {
        // Update existing jiwa screening
        await connection.execute(
          'UPDATE jiwa_screening SET skrining_jiwa = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [jiwaScreeningData.skrining_jiwa, forkey_jiwa_screening]
        );
      } else {
        // Create new jiwa screening
        const [jiwaResult] = await connection.execute(
          'INSERT INTO jiwa_screening (skrining_jiwa, forkey_hamil) VALUES (?, ?)',
          [jiwaScreeningData.skrining_jiwa, ancData.forkey_hamil]
        );

        jiwaScreeningId = jiwaResult.insertId;
      }
    }

    // Update ANC data
    const ancUpdateQuery = `
      UPDATE antenatal_care SET
        tanggal_kunjungan = ?, jenis_kunjungan = ?, jenis_akses = ?, pemeriksa = ?,
        berat_badan = ?, selisih_beratbadan = ?, tekanan_darah = ?, lila = ?, tinggi_fundus = ?,
        denyut_jantung_janin = ?, detak_jantung = ?, confirm_usg = ?,
        status_imunisasi_tt = ?, beri_tablet_fe = ?,
        hasil_usg = ?, status_kmk_usg = ?, status_risiko_visit = ?,
        hasil_temu_wicara = ?, tata_laksana_kasus = ?, keterangan_anc = ?,
        forkey_hamil = ?, forkey_bidan = ?,
        forkey_lab_screening = ?, forkey_jiwa_screening = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] = await connection.execute(ancUpdateQuery, [
      ancData.tanggal_kunjungan,
      ancData.jenis_kunjungan,
      ancData.jenis_akses,
      ancData.pemeriksa,
      ancData.berat_badan || null,
      ancData.selisih_beratbadan || null,
      ancData.tekanan_darah || null,
      ancData.lila || null,
      ancData.tinggi_fundus || null,
      ancData.denyut_jantung_janin || null,
      ancData.detak_jantung || null,
      ancData.confirm_usg ? 1 : 0,
      ancData.status_imunisasi_tt || null,
      ancData.beri_tablet_fe ? 1 : 0,
      ancData.hasil_usg || null,
      ancData.status_kmk_usg || null,
      ancData.status_risiko_visit,
      ancData.hasil_temu_wicara || null,
      ancData.tata_laksana_kasus || null,
      ancData.keterangan_anc || null,
      ancData.forkey_hamil,
      ancData.forkey_bidan,
      labScreeningId,
      jiwaScreeningId,
      id
    ]);

    await connection.commit();

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ANC visit not found' });
    }

    res.json({ message: 'ANC visit updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating ANC visit:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Delete ANC visit
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.execute('DELETE FROM antenatal_care WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ANC visit not found' });
    }
    
    res.json({ message: 'ANC visit deleted successfully' });
  } catch (error) {
    console.error('Error deleting ANC visit:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
