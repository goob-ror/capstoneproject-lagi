const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const auth = require('../middleware/auth');

// Get all kelurahan
router.get('/', auth, async (req, res) => {
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

// Create new kelurahan
router.post('/', auth, async (req, res) => {
  try {
    const { nama_kelurahan } = req.body;

    // Validation
    if (!nama_kelurahan) {
      return res.status(400).json({
        success: false,
        message: 'Nama kelurahan harus diisi'
      });
    }

    // Check if kelurahan name already exists
    const [existingKelurahan] = await pool.query(
      'SELECT id FROM kelurahan WHERE nama_kelurahan = ?',
      [nama_kelurahan]
    );

    if (existingKelurahan.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Nama kelurahan sudah ada'
      });
    }

    // Insert new kelurahan
    const insertQuery = `
      INSERT INTO kelurahan (nama_kelurahan)
      VALUES (?)
    `;

    const [result] = await pool.query(insertQuery, [nama_kelurahan]);

    res.status(201).json({
      success: true,
      message: 'Data kelurahan berhasil ditambahkan',
      data: {
        id: result.insertId,
        nama_kelurahan
      }
    });
  } catch (error) {
    console.error('Error creating kelurahan:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan data kelurahan'
    });
  }
});

// Update kelurahan
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_kelurahan } = req.body;

    // Validation
    if (!nama_kelurahan) {
      return res.status(400).json({
        success: false,
        message: 'Nama kelurahan harus diisi'
      });
    }

    // Check if kelurahan exists
    const [existingKelurahan] = await pool.query(
      'SELECT id FROM kelurahan WHERE id = ?',
      [id]
    );

    if (existingKelurahan.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data kelurahan tidak ditemukan'
      });
    }

    // Check if kelurahan name already exists (excluding current record)
    const [duplicateCheck] = await pool.query(
      'SELECT id FROM kelurahan WHERE nama_kelurahan = ? AND id != ?',
      [nama_kelurahan, id]
    );

    if (duplicateCheck.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Nama kelurahan sudah ada'
      });
    }

    // Update kelurahan
    const updateQuery = `
      UPDATE kelurahan 
      SET nama_kelurahan = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await pool.query(updateQuery, [nama_kelurahan, id]);

    res.json({
      success: true,
      message: 'Data kelurahan berhasil diperbarui',
      data: {
        id: parseInt(id),
        nama_kelurahan
      }
    });
  } catch (error) {
    console.error('Error updating kelurahan:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui data kelurahan'
    });
  }
});

// Delete kelurahan
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if kelurahan exists
    const [existingKelurahan] = await pool.query(
      'SELECT id FROM kelurahan WHERE id = ?',
      [id]
    );

    if (existingKelurahan.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Data kelurahan tidak ditemukan'
      });
    }

    // Check if kelurahan is being used by any posyandu
    const [posyanduCheck] = await pool.query(
      'SELECT COUNT(*) as count FROM wilker_posyandu WHERE kelurahan_id = ?',
      [id]
    );

    if (posyanduCheck[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus kelurahan yang masih digunakan oleh posyandu'
      });
    }

    // Check if kelurahan is being used by any ibu
    const [ibuCheck] = await pool.query(
      'SELECT COUNT(*) as count FROM ibu WHERE kelurahan = (SELECT nama_kelurahan FROM kelurahan WHERE id = ?)',
      [id]
    );

    if (ibuCheck[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus kelurahan yang masih digunakan oleh data ibu'
      });
    }

    // Delete kelurahan
    await pool.query('DELETE FROM kelurahan WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Data kelurahan berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting kelurahan:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus data kelurahan'
    });
  }
});

// Get RT options based on kelurahan
router.get('/rt-options/:kelurahanId', auth, async (req, res) => {
  try {
    const { kelurahanId } = req.params;
    
    // Get all posyandu in the selected kelurahan with their RT coverage
    const query = `
      SELECT id, nama_posyandu, rt
      FROM wilker_posyandu
      WHERE kelurahan_id = ?
      ORDER BY nama_posyandu
    `;
    
    const [posyanduRows] = await pool.query(query, [kelurahanId]);
    
    // Extract all unique RT numbers from all posyandu in this kelurahan
    const rtSet = new Set();
    const posyanduRTMap = {};
    
    posyanduRows.forEach(posyandu => {
      const rtNumbers = posyandu.rt.split(',').map(rt => rt.trim().padStart(2, '0'));
      posyanduRTMap[posyandu.id] = {
        nama_posyandu: posyandu.nama_posyandu,
        rt_coverage: rtNumbers
      };
      
      rtNumbers.forEach(rt => rtSet.add(rt));
    });
    
    // Convert Set to sorted array
    const availableRT = Array.from(rtSet).sort();
    
    res.json({
      success: true,
      data: {
        availableRT,
        posyanduRTMap
      }
    });
  } catch (error) {
    console.error('Error fetching RT options:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data RT'
    });
  }
});

// Get posyandu assignment based on kelurahan and RT
router.get('/posyandu-assignment/:kelurahanId/:rt', auth, async (req, res) => {
  try {
    const { kelurahanId, rt } = req.params;
    
    // Find posyandu that covers this RT in the selected kelurahan
    const query = `
      SELECT id, nama_posyandu, rt
      FROM wilker_posyandu
      WHERE kelurahan_id = ?
    `;
    
    const [posyanduRows] = await pool.query(query, [kelurahanId]);
    
    // Check which posyandu covers this RT
    const rtPadded = rt.padStart(2, '0');
    let assignedPosyandu = null;
    
    for (const posyandu of posyanduRows) {
      const rtNumbers = posyandu.rt.split(',').map(rt => rt.trim().padStart(2, '0'));
      if (rtNumbers.includes(rtPadded)) {
        assignedPosyandu = {
          id: posyandu.id,
          nama_posyandu: posyandu.nama_posyandu,
          rt_coverage: rtNumbers.join(', ')
        };
        break;
      }
    }
    
    res.json({
      success: true,
      data: assignedPosyandu
    });
  } catch (error) {
    console.error('Error getting posyandu assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mendapatkan penugasan posyandu'
    });
  }
});

module.exports = router;