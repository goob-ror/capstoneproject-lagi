const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const authMiddleware = require('../middleware/auth');

// Get all ibu (mothers)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM ibu ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Get ibu error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single ibu by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [ibuRows] = await pool.query(
      'SELECT * FROM ibu WHERE id = ?',
      [req.params.id]
    );

    if (ibuRows.length === 0) {
      return res.status(404).json({ message: 'Ibu not found' });
    }

    const ibu = ibuRows[0];

    // Get current pregnancy data
    const [kehamilanRows] = await pool.query(
      'SELECT * FROM kehamilan WHERE forkey_ibu = ? ORDER BY created_at DESC LIMIT 1',
      [req.params.id]
    );

    const result = {
      ...ibu,
      kehamilan: kehamilanRows.length > 0 ? kehamilanRows[0] : null
    };

    res.json(result);
  } catch (error) {
    console.error('Get ibu error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new ibu
router.post('/', authMiddleware, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const {
      nik_ibu,
      nama_lengkap,
      tanggal_lahir,
      no_hp,
      gol_darah,
      rhesus,
      buku_kia,
      pekerjaan,
      pendidikan,
      kelurahan,
      alamat_lengkap,
      // Data Kehamilan
      gravida,
      partus,
      abortus,
      haid_terakhir,
      status_kehamilan
    } = req.body;

    // Check if NIK already exists
    const [existing] = await connection.query(
      'SELECT * FROM ibu WHERE nik_ibu = ?',
      [nik_ibu]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'NIK already exists' });
    }

    // Start transaction
    await connection.beginTransaction();

    // Insert ibu data
    const [ibuResult] = await connection.query(
      `INSERT INTO ibu (nik_ibu, nama_lengkap, tanggal_lahir, no_hp, gol_darah, 
       rhesus, buku_kia, pekerjaan, pendidikan, kelurahan, alamat_lengkap) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nik_ibu, nama_lengkap, tanggal_lahir, no_hp, gol_darah, rhesus, 
       buku_kia, pekerjaan, pendidikan, kelurahan, alamat_lengkap]
    );

    const ibuId = ibuResult.insertId;

    // Calculate taksiran_persalinan (estimated delivery date) - add 280 days to HPHT
    let taksiranPersalinan = null;
    if (haid_terakhir) {
      const hpht = new Date(haid_terakhir);
      taksiranPersalinan = new Date(hpht.getTime() + (280 * 24 * 60 * 60 * 1000));
    }

    // Insert kehamilan data
    await connection.query(
      `INSERT INTO kehamilan (gravida, partus, abortus, haid_terakhir, 
       taksiran_persalinan, status_kehamilan, forkey_ibu) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [gravida || 1, partus || 0, abortus || 0, haid_terakhir, 
       taksiranPersalinan, status_kehamilan || 'Hamil', ibuId]
    );

    // Commit transaction
    await connection.commit();

    res.status(201).json({
      message: 'Ibu and pregnancy data created successfully',
      id: ibuId
    });
  } catch (error) {
    // Rollback transaction on error
    await connection.rollback();
    console.error('Create ibu error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
});

// Update ibu
router.put('/:id', authMiddleware, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    const {
      nik_ibu,
      nama_lengkap,
      tanggal_lahir,
      no_hp,
      gol_darah,
      rhesus,
      buku_kia,
      pekerjaan,
      pendidikan,
      kelurahan,
      alamat_lengkap,
      // Data Kehamilan
      gravida,
      partus,
      abortus,
      haid_terakhir,
      status_kehamilan
    } = req.body;

    // Start transaction
    await connection.beginTransaction();

    // Update ibu data
    const [ibuResult] = await connection.query(
      `UPDATE ibu SET nik_ibu = ?, nama_lengkap = ?, tanggal_lahir = ?, 
       no_hp = ?, gol_darah = ?, rhesus = ?, buku_kia = ?, pekerjaan = ?, 
       pendidikan = ?, kelurahan = ?, alamat_lengkap = ? 
       WHERE id = ?`,
      [nik_ibu, nama_lengkap, tanggal_lahir, no_hp, gol_darah, rhesus, 
       buku_kia, pekerjaan, pendidikan, kelurahan, alamat_lengkap, req.params.id]
    );

    if (ibuResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Ibu not found' });
    }

    // Calculate taksiran_persalinan (estimated delivery date) - add 280 days to HPHT
    let taksiranPersalinan = null;
    if (haid_terakhir) {
      const hpht = new Date(haid_terakhir);
      taksiranPersalinan = new Date(hpht.getTime() + (280 * 24 * 60 * 60 * 1000));
    }

    // Check if kehamilan record exists
    const [kehamilanCheck] = await connection.query(
      'SELECT id FROM kehamilan WHERE forkey_ibu = ? ORDER BY created_at DESC LIMIT 1',
      [req.params.id]
    );

    if (kehamilanCheck.length > 0) {
      // Update existing kehamilan record
      await connection.query(
        `UPDATE kehamilan SET gravida = ?, partus = ?, abortus = ?, 
         haid_terakhir = ?, taksiran_persalinan = ?, status_kehamilan = ? 
         WHERE id = ?`,
        [gravida || 1, partus || 0, abortus || 0, haid_terakhir, 
         taksiranPersalinan, status_kehamilan || 'Hamil', kehamilanCheck[0].id]
      );
    } else {
      // Create new kehamilan record if it doesn't exist
      await connection.query(
        `INSERT INTO kehamilan (gravida, partus, abortus, haid_terakhir, 
         taksiran_persalinan, status_kehamilan, forkey_ibu) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [gravida || 1, partus || 0, abortus || 0, haid_terakhir, 
         taksiranPersalinan, status_kehamilan || 'Hamil', req.params.id]
      );
    }

    // Commit transaction
    await connection.commit();

    res.json({ message: 'Ibu and pregnancy data updated successfully' });
  } catch (error) {
    // Rollback transaction on error
    await connection.rollback();
    console.error('Update ibu error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    connection.release();
  }
});

// Delete ibu
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM ibu WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ibu not found' });
    }

    res.json({ message: 'Ibu deleted successfully' });
  } catch (error) {
    console.error('Delete ibu error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get detailed ibu information with pregnancy, ANC visits, and complications
router.get('/:id/detail', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get ibu data
    const [ibuRows] = await pool.query('SELECT * FROM ibu WHERE id = ?', [id]);
    
    if (ibuRows.length === 0) {
      return res.status(404).json({ message: 'Ibu not found' });
    }
    
    const ibu = ibuRows[0];
    
    // Get suami data
    const [suamiRows] = await pool.query('SELECT * FROM suami WHERE forkey_ibu = ?', [id]);
    const suami = suamiRows.length > 0 ? suamiRows[0] : null;
    
    // Get current pregnancy data
    const [kehamilanRows] = await pool.query(
      'SELECT * FROM kehamilan WHERE forkey_ibu = ? ORDER BY created_at DESC LIMIT 1',
      [id]
    );
    const kehamilan = kehamilanRows.length > 0 ? kehamilanRows[0] : null;
    
    // Get ANC visits if pregnancy exists
    let ancVisits = [];
    if (kehamilan) {
      const [ancRows] = await pool.query(
        `SELECT * FROM antenatal_care 
         WHERE forkey_hamil = ? 
         ORDER BY tanggal_kunjungan DESC`,
        [kehamilan.id]
      );
      ancVisits = ancRows;
    }
    
    // Get complications if pregnancy exists
    let complications = [];
    if (kehamilan) {
      const [compRows] = await pool.query(
        `SELECT * FROM komplikasi 
         WHERE forkey_hamil = ? 
         ORDER BY tanggal_diagnosis DESC`,
        [kehamilan.id]
      );
      complications = compRows;
    }
    
    res.json({
      ibu,
      suami,
      kehamilan,
      ancVisits,
      complications
    });
  } catch (error) {
    console.error('Error fetching ibu detail:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
