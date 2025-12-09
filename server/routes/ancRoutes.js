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
      WHERE anc.id = ?
    `;
    
    const [rows] = await db.execute(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'ANC visit not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching ANC visit:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new ANC visit
router.post('/', auth, async (req, res) => {
  try {
    const {
      tanggal_kunjungan, jenis_kunjungan, jenis_akses, pemeriksa,
      berat_badan, selisih_beratbadan, tekanan_darah, lila, tinggi_fundus, denyut_jantung_janin,
      status_imunisasi_tt, beri_tablet_fe, hasil_lab_hb, lab_protein_urine,
      lab_gula_darah, hasil_lab_lainnya, skrining_hiv, skrining_sifilis,
      skrining_hbsag, skrining_tb, terapi_malaria, terapi_kecacingan,
      hasil_usg, status_kmk_usg, status_risiko_visit, skrining_jiwa,
      hasil_temu_wicara, tata_laksana_kasus, keterangan_anc,
      forkey_hamil, forkey_bidan
    } = req.body;

    const query = `
      INSERT INTO antenatal_care (
        tanggal_kunjungan, jenis_kunjungan, jenis_akses, pemeriksa,
        berat_badan, selisih_beratbadan, tekanan_darah, lila, tinggi_fundus, denyut_jantung_janin,
        status_imunisasi_tt, beri_tablet_fe, hasil_lab_hb, lab_protein_urine,
        lab_gula_darah, hasil_lab_lainnya, skrining_hiv, skrining_sifilis,
        skrining_hbsag, skrining_tb, terapi_malaria, terapi_kecacingan,
        hasil_usg, status_kmk_usg, status_risiko_visit, skrining_jiwa,
        hasil_temu_wicara, tata_laksana_kasus, keterangan_anc,
        forkey_hamil, forkey_bidan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      tanggal_kunjungan, jenis_kunjungan, jenis_akses, pemeriksa,
      berat_badan || null, selisih_beratbadan || null, tekanan_darah || null, lila || null, 
      tinggi_fundus || null, denyut_jantung_janin || null,
      status_imunisasi_tt || null, beri_tablet_fe ? 1 : 0, 
      hasil_lab_hb || null, lab_protein_urine || null,
      lab_gula_darah || null, hasil_lab_lainnya || null, 
      skrining_hiv || 'Belum Diperiksa', skrining_sifilis || 'Belum Diperiksa',
      skrining_hbsag || 'Belum Diperiksa', skrining_tb || 'Belum Diperiksa', 
      terapi_malaria ? 1 : 0, terapi_kecacingan ? 1 : 0,
      hasil_usg || null, status_kmk_usg || null, status_risiko_visit,
      skrining_jiwa || null, hasil_temu_wicara || null, 
      tata_laksana_kasus || null, keterangan_anc || null,
      forkey_hamil, forkey_bidan
    ]);

    res.status(201).json({
      message: 'ANC visit created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating ANC visit:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update ANC visit
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tanggal_kunjungan, jenis_kunjungan, jenis_akses, pemeriksa,
      berat_badan, selisih_beratbadan, tekanan_darah, lila, tinggi_fundus, denyut_jantung_janin,
      status_imunisasi_tt, beri_tablet_fe, hasil_lab_hb, lab_protein_urine,
      lab_gula_darah, hasil_lab_lainnya, skrining_hiv, skrining_sifilis,
      skrining_hbsag, skrining_tb, terapi_malaria, terapi_kecacingan,
      hasil_usg, status_kmk_usg, status_risiko_visit, skrining_jiwa,
      hasil_temu_wicara, tata_laksana_kasus, keterangan_anc,
      forkey_hamil, forkey_bidan
    } = req.body;

    const query = `
      UPDATE antenatal_care SET
        tanggal_kunjungan = ?, jenis_kunjungan = ?, jenis_akses = ?, pemeriksa = ?,
        berat_badan = ?, selisih_beratbadan = ?, tekanan_darah = ?, lila = ?, tinggi_fundus = ?, 
        denyut_jantung_janin = ?, status_imunisasi_tt = ?, beri_tablet_fe = ?,
        hasil_lab_hb = ?, lab_protein_urine = ?, lab_gula_darah = ?, 
        hasil_lab_lainnya = ?, skrining_hiv = ?, skrining_sifilis = ?,
        skrining_hbsag = ?, skrining_tb = ?, terapi_malaria = ?, 
        terapi_kecacingan = ?, hasil_usg = ?, status_kmk_usg = ?,
        status_risiko_visit = ?, skrining_jiwa = ?, hasil_temu_wicara = ?,
        tata_laksana_kasus = ?, keterangan_anc = ?, forkey_hamil = ?, 
        forkey_bidan = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] = await db.execute(query, [
      tanggal_kunjungan, jenis_kunjungan, jenis_akses, pemeriksa,
      berat_badan || null, selisih_beratbadan || null, tekanan_darah || null, lila || null, 
      tinggi_fundus || null, denyut_jantung_janin || null,
      status_imunisasi_tt || null, beri_tablet_fe ? 1 : 0, 
      hasil_lab_hb || null, lab_protein_urine || null,
      lab_gula_darah || null, hasil_lab_lainnya || null, 
      skrining_hiv || 'Belum Diperiksa', skrining_sifilis || 'Belum Diperiksa',
      skrining_hbsag || 'Belum Diperiksa', skrining_tb || 'Belum Diperiksa', 
      terapi_malaria ? 1 : 0, terapi_kecacingan ? 1 : 0,
      hasil_usg || null, status_kmk_usg || null, status_risiko_visit,
      skrining_jiwa || null, hasil_temu_wicara || null, 
      tata_laksana_kasus || null, keterangan_anc || null,
      forkey_hamil, forkey_bidan, id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ANC visit not found' });
    }

    res.json({ message: 'ANC visit updated successfully' });
  } catch (error) {
    console.error('Error updating ANC visit:', error);
    res.status(500).json({ message: 'Internal server error' });
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
