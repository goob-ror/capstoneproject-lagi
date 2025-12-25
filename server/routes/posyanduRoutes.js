const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const auth = require('../middleware/auth');

// Get all posyandu with kelurahan info
router.get('/', auth, async (req, res) => {
  try {
    const query = `
      SELECT 
        wp.id,
        wp.nama_posyandu,
        wp.kelurahan_id,
        wp.rt,
        k.nama_kelurahan,
        wp.created_at,
        wp.updated_at
      FROM wilker_posyandu wp
      LEFT JOIN kelurahan k ON wp.kelurahan_id = k.id
      ORDER BY k.nama_kelurahan, wp.nama_posyandu
    `;
    
    const [rows] = await pool.query(query);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching posyandu:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data posyandu'
    });
  }
});

// Get all kelurahan
router.get('/kelurahan', auth, async (req, res) => {
  try {
    const query = `
      SELECT id, nama_kelurahan, created_at, updated_at
      FROM kelurahan
      ORDER BY nama_kelurahan
    `;
    
    const [rows] = await pool.query(query);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching kelurahan:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data kelurahan'
    });
  }
});

// Create new posyandu
router.post('/', auth, async (req, res) => {
  try {
    const { nama_posyandu, kelurahan_id, rt } = req.body;

    // Validation
    if (!nama_posyandu || !kelurahan_id || !rt) {
      return res.status(400).json({
        success: false,
        message: 'Nama posyandu, kelurahan, dan RT harus diisi'
      });
    }

    // Validate RT format (should be comma-separated numbers like "01,02,03")
    const rtPattern = /^(\d{2})(,\d{2})*$/;
    if (!rtPattern.test(rt)) {
      return res.status(400).json({
        success: false,
        message: 'Format RT tidak valid. Gunakan format: 01,02,03'
      });
    }

    // Check if kelurahan exists
    const [kelurahanCheck] = await pool.query(
      'SELECT id FROM kelurahan WHERE id = ?',
      [kelurahan_id]
    );

    if (kelurahanCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Kelurahan tidak ditemukan'
      });
    }

    // Check if posyandu name already exists in the same kelurahan
    const [existingPosyandu] = await pool.query(
      'SELECT id FROM wilker_posyandu WHERE nama_posyandu = ? AND kelurahan_id = ?',
      [nama_posyandu, kelurahan_id]
    );

    if (existingPosyandu.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Nama posyandu sudah ada di kelurahan ini'
      });
    }

    // Insert new posyandu
    const insertQuery = `
      INSERT INTO wilker_posyandu (nama_posyandu, kelurahan_id, rt)
      VALUES (?, ?, ?)
    `;

    const [result] = await pool.query(insertQuery, [nama_posyandu, kelurahan_id, rt]);

    res.status(201).json({
      success: true,
      message: 'Data posyandu berhasil ditambahkan',
      data: {
        id: result.insertId,
        nama_posyandu,
        kelurahan_id,
        rt
      }
    });
  } catch (error) {
    console.error('Error creating posyandu:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan data posyandu'
    });
  }
});

// Update posyandu
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_posyandu, kelurahan_id, rt } = req.body;

    // Validation
    if (!nama_posyandu || !kelurahan_id || !rt) {
      return res.status(400).json({
        success: false,
        message: 'Nama posyandu, kelurahan, dan RT harus diisi'
      });
    }

    // Validate RT format
    const rtPattern = /^(\d{2})(,\d{2})*$/;
    if (!rtPattern.test(rt)) {
      return res.status(400).json({
        success: false,
        message: 'Format RT tidak valid. Gunakan format: 01,02,03'
      });
    }

    // Check if posyandu exists
    const [existingPosyandu] = await pool.query(
      'SELECT id FROM wilker_posyandu WHERE id = ?',
      [id]
    );

    if (existingPosyandu.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data posyandu tidak ditemukan'
      });
    }

    // Check if kelurahan exists
    const [kelurahanCheck] = await pool.query(
      'SELECT id FROM kelurahan WHERE id = ?',
      [kelurahan_id]
    );

    if (kelurahanCheck.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Kelurahan tidak ditemukan'
      });
    }

    // Check if posyandu name already exists in the same kelurahan (excluding current record)
    const [duplicateCheck] = await pool.query(
      'SELECT id FROM wilker_posyandu WHERE nama_posyandu = ? AND kelurahan_id = ? AND id != ?',
      [nama_posyandu, kelurahan_id, id]
    );

    if (duplicateCheck.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Nama posyandu sudah ada di kelurahan ini'
      });
    }

    // Update posyandu
    const updateQuery = `
      UPDATE wilker_posyandu 
      SET nama_posyandu = ?, kelurahan_id = ?, rt = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await pool.query(updateQuery, [nama_posyandu, kelurahan_id, rt, id]);

    res.json({
      success: true,
      message: 'Data posyandu berhasil diperbarui',
      data: {
        id: parseInt(id),
        nama_posyandu,
        kelurahan_id,
        rt
      }
    });
  } catch (error) {
    console.error('Error updating posyandu:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data posyandu'
    });
  }
});

// Delete posyandu
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if posyandu exists
    const [existingPosyandu] = await pool.query(
      'SELECT id FROM wilker_posyandu WHERE id = ?',
      [id]
    );

    if (existingPosyandu.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data posyandu tidak ditemukan'
      });
    }

    // Check if posyandu is being used by any ibu
    const [ibuCheck] = await pool.query(
      'SELECT COUNT(*) as count FROM ibu WHERE posyandu_id = ?',
      [id]
    );

    if (ibuCheck[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus posyandu yang masih digunakan oleh data ibu'
      });
    }

    // Delete posyandu
    await pool.query('DELETE FROM wilker_posyandu WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Data posyandu berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting posyandu:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data posyandu'
    });
  }
});

module.exports = router;