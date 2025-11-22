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
    const [rows] = await pool.query(
      'SELECT * FROM ibu WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Ibu not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get ibu error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new ibu
router.post('/', authMiddleware, async (req, res) => {
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
      alamat_lengkap
    } = req.body;

    // Check if NIK already exists
    const [existing] = await pool.query(
      'SELECT * FROM ibu WHERE nik_ibu = ?',
      [nik_ibu]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'NIK already exists' });
    }

    const [result] = await pool.query(
      `INSERT INTO ibu (nik_ibu, nama_lengkap, tanggal_lahir, no_hp, gol_darah, 
       rhesus, buku_kia, pekerjaan, pendidikan, kelurahan, alamat_lengkap) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nik_ibu, nama_lengkap, tanggal_lahir, no_hp, gol_darah, rhesus, 
       buku_kia, pekerjaan, pendidikan, kelurahan, alamat_lengkap]
    );

    res.status(201).json({
      message: 'Ibu created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create ibu error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update ibu
router.put('/:id', authMiddleware, async (req, res) => {
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
      alamat_lengkap
    } = req.body;

    const [result] = await pool.query(
      `UPDATE ibu SET nik_ibu = ?, nama_lengkap = ?, tanggal_lahir = ?, 
       no_hp = ?, gol_darah = ?, rhesus = ?, buku_kia = ?, pekerjaan = ?, 
       pendidikan = ?, kelurahan = ?, alamat_lengkap = ? 
       WHERE id = ?`,
      [nik_ibu, nama_lengkap, tanggal_lahir, no_hp, gol_darah, rhesus, 
       buku_kia, pekerjaan, pendidikan, kelurahan, alamat_lengkap, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ibu not found' });
    }

    res.json({ message: 'Ibu updated successfully' });
  } catch (error) {
    console.error('Update ibu error:', error);
    res.status(500).json({ message: 'Server error' });
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

module.exports = router;
