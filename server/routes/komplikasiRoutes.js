const express = require('express');
const router = express.Router();
const db = require('../database/db');
const auth = require('../middleware/auth');

// Get ANC visits by pregnancy ID
router.get('/anc/:pregnancyId', auth, async (req, res) => {
  try {
    const { pregnancyId } = req.params;
    
    const query = `
      SELECT 
        id,
        tanggal_kunjungan,
        jenis_kunjungan,
        tekanan_darah,
        lab_protein_urine
      FROM antenatal_care
      WHERE forkey_hamil = ?
      ORDER BY tanggal_kunjungan DESC
    `;
    
    const [rows] = await db.execute(query, [pregnancyId]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching ANC visits:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all komplikasi with mother names
router.get('/', auth, async (req, res) => {
  try {
    const query = `
      SELECT 
        k.*,
        ibu.nama_lengkap as nama_ibu,
        ibu.nik_ibu
      FROM komplikasi k
      JOIN kehamilan kh ON k.forkey_hamil = kh.id
      JOIN ibu ON kh.forkey_ibu = ibu.id
      ORDER BY k.tanggal_diagnosis DESC
    `;
    
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching komplikasi:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get komplikasi by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        k.*,
        ibu.nama_lengkap as nama_ibu,
        ibu.nik_ibu
      FROM komplikasi k
      JOIN kehamilan kh ON k.forkey_hamil = kh.id
      JOIN ibu ON kh.forkey_ibu = ibu.id
      WHERE k.id = ?
    `;
    
    const [rows] = await db.execute(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Komplikasi not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching komplikasi:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new komplikasi
router.post('/', auth, async (req, res) => {
  try {
    const {
      kode_diagnosis,
      nama_komplikasi,
      waktu_kejadian,
      tanggal_diagnosis,
      rujuk_rs,
      tanggal_rujukan,
      tekanan_darah,
      protein_urine,
      gejala_penyerta,
      terapi_diberikan,
      tingkat_keparahan,
      status_penanganan,
      keterangan,
      forkey_hamil,
      forkey_anc
    } = req.body;

    const query = `
      INSERT INTO komplikasi (
        kode_diagnosis, nama_komplikasi, waktu_kejadian, tanggal_diagnosis,
        rujuk_rs, tanggal_rujukan, tekanan_darah, protein_urine,
        gejala_penyerta, terapi_diberikan, tingkat_keparahan,
        status_penanganan, keterangan, forkey_hamil, forkey_anc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      kode_diagnosis || null,
      nama_komplikasi,
      waktu_kejadian,
      tanggal_diagnosis,
      rujuk_rs ? 1 : 0,
      tanggal_rujukan || null,
      tekanan_darah || null,
      protein_urine || null,
      gejala_penyerta || null,
      terapi_diberikan || null,
      tingkat_keparahan || null,
      status_penanganan,
      keterangan || null,
      forkey_hamil,
      forkey_anc || null
    ]);

    res.status(201).json({
      message: 'Komplikasi created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating komplikasi:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update komplikasi
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      kode_diagnosis,
      nama_komplikasi,
      waktu_kejadian,
      tanggal_diagnosis,
      rujuk_rs,
      tanggal_rujukan,
      tekanan_darah,
      protein_urine,
      gejala_penyerta,
      terapi_diberikan,
      tingkat_keparahan,
      status_penanganan,
      keterangan,
      forkey_hamil,
      forkey_anc
    } = req.body;

    const query = `
      UPDATE komplikasi SET
        kode_diagnosis = ?, nama_komplikasi = ?, waktu_kejadian = ?,
        tanggal_diagnosis = ?, rujuk_rs = ?, tanggal_rujukan = ?,
        tekanan_darah = ?, protein_urine = ?, gejala_penyerta = ?,
        terapi_diberikan = ?, tingkat_keparahan = ?, status_penanganan = ?,
        keterangan = ?, forkey_hamil = ?, forkey_anc = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] = await db.execute(query, [
      kode_diagnosis || null,
      nama_komplikasi,
      waktu_kejadian,
      tanggal_diagnosis,
      rujuk_rs ? 1 : 0,
      tanggal_rujukan || null,
      tekanan_darah || null,
      protein_urine || null,
      gejala_penyerta || null,
      terapi_diberikan || null,
      tingkat_keparahan || null,
      status_penanganan,
      keterangan || null,
      forkey_hamil,
      forkey_anc || null,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Komplikasi not found' });
    }

    res.json({ message: 'Komplikasi updated successfully' });
  } catch (error) {
    console.error('Error updating komplikasi:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete komplikasi
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.execute('DELETE FROM komplikasi WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Komplikasi not found' });
    }
    
    res.json({ message: 'Komplikasi deleted successfully' });
  } catch (error) {
    console.error('Error deleting komplikasi:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
