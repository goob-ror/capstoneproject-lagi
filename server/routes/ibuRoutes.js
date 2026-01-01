const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const authMiddleware = require('../middleware/auth');

// Get all ibu (mothers)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*, kel.nama_kelurahan as kelurahan_nama, p.nama_posyandu
      FROM ibu i
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      LEFT JOIN wilker_posyandu p ON i.posyandu_id = p.id
      ORDER BY i.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Get ibu error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single ibu by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [ibuRows] = await pool.query(`
      SELECT i.*, kel.nama_kelurahan as kelurahan_nama, p.nama_posyandu
      FROM ibu i
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      LEFT JOIN wilker_posyandu p ON i.posyandu_id = p.id
      WHERE i.id = ?
    `, [req.params.id]);

    if (ibuRows.length === 0) {
      return res.status(404).json({ message: 'Ibu not found' });
    }

    const ibu = ibuRows[0];

    // Get current pregnancy data
    const [kehamilanRows] = await pool.query(
      'SELECT * FROM kehamilan WHERE forkey_ibu = ? ORDER BY created_at DESC LIMIT 1',
      [req.params.id]
    );

    // Get suami data
    const [suamiRows] = await pool.query(
      'SELECT * FROM suami WHERE forkey_ibu = ?',
      [req.params.id]
    );

    // Get riwayat penyakit
    const [riwayatRows] = await pool.query(
      'SELECT * FROM riwayat_penyakit WHERE forkey_ibu = ? ORDER BY tahun_diagnosis DESC',
      [req.params.id]
    );

    const result = {
      ...ibu,
      kehamilan: kehamilanRows.length > 0 ? kehamilanRows[0] : null,
      suami: suamiRows.length > 0 ? suamiRows[0] : null,
      riwayat_penyakit: riwayatRows
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
      tinggi_badan,
      buku_kia,
      pekerjaan,
      pendidikan,
      kelurahan_id,
      rt,
      alamat_lengkap,
      // Data Kehamilan
      gravida,
      partus,
      abortus,
      haid_terakhir,
      status_kehamilan,
      // Data Suami
      suami,
      // Riwayat Penyakit
      riwayat_penyakit
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

    // Find posyandu assignment based on kelurahan and RT
    let posyandu_id = null;
    if (kelurahan_id && rt) {
      const [posyanduRows] = await connection.query(
        'SELECT id, rt FROM wilker_posyandu WHERE kelurahan_id = ?',
        [kelurahan_id]
      );
      
      const rtPadded = rt.toString().padStart(2, '0');
      for (const posyandu of posyanduRows) {
        const rtNumbers = posyandu.rt.split(',').map(r => r.trim().padStart(2, '0'));
        if (rtNumbers.includes(rtPadded)) {
          posyandu_id = posyandu.id;
          break;
        }
      }
    }

    // Insert ibu data
    const [ibuResult] = await connection.query(
      `INSERT INTO ibu (nik_ibu, nama_lengkap, tanggal_lahir, no_hp, gol_darah, 
       rhesus, tinggi_badan, beratbadan, buku_kia, pekerjaan, pendidikan, kelurahan_id, rt, alamat_lengkap, posyandu_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nik_ibu, nama_lengkap, tanggal_lahir, no_hp, gol_darah, rhesus, tinggi_badan,
       req.body.beratbadan || null, buku_kia, pekerjaan, pendidikan, kelurahan_id, rt, alamat_lengkap, posyandu_id]
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

    // Insert suami data if provided
    if (suami && (suami.nik_suami || suami.nama_lengkap)) {
      await connection.query(
        `INSERT INTO suami (nik_suami, nama_lengkap, tanggal_lahir, no_hp, 
         gol_darah, pekerjaan, pendidikan, isPerokok, forkey_ibu) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [suami.nik_suami || null, suami.nama_lengkap || null, suami.tanggal_lahir || null,
         suami.no_hp || null, suami.gol_darah || null, suami.pekerjaan || null,
         suami.pendidikan || null, suami.isPerokok || false, ibuId]
      );
    }

    // Insert riwayat penyakit if provided
    if (riwayat_penyakit && riwayat_penyakit.length > 0) {
      for (const rp of riwayat_penyakit) {
        if (rp.nama_penyakit) {
          await connection.query(
            `INSERT INTO riwayat_penyakit (nama_penyakit, kategori_penyakit, 
             tahun_diagnosis, status_penyakit, keterangan, forkey_ibu) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [rp.nama_penyakit, rp.kategori_penyakit || 'Lainnya',
             rp.tahun_diagnosis || null, rp.status_penyakit || 'Sembuh',
             rp.keterangan || null, ibuId]
          );
        }
      }
    }

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
      tinggi_badan,
      buku_kia,
      pekerjaan,
      pendidikan,
      kelurahan_id,
      rt,
      alamat_lengkap,
      // Data Kehamilan
      gravida,
      partus,
      abortus,
      haid_terakhir,
      status_kehamilan,
      isAddingNewPregnancy,
      // Data Suami
      suami,
      // Riwayat Penyakit
      riwayat_penyakit
    } = req.body;

    // Start transaction
    await connection.beginTransaction();

    // Find posyandu assignment based on kelurahan and RT
    let posyandu_id = null;
    if (kelurahan_id && rt) {
      const [posyanduRows] = await connection.query(
        'SELECT id, rt FROM wilker_posyandu WHERE kelurahan_id = ?',
        [kelurahan_id]
      );
      
      const rtPadded = rt.toString().padStart(2, '0');
      for (const posyandu of posyanduRows) {
        const rtNumbers = posyandu.rt.split(',').map(r => r.trim().padStart(2, '0'));
        if (rtNumbers.includes(rtPadded)) {
          posyandu_id = posyandu.id;
          break;
        }
      }
    }

    // Update ibu data
    const [ibuResult] = await connection.query(
      `UPDATE ibu SET nik_ibu = ?, nama_lengkap = ?, tanggal_lahir = ?, 
       no_hp = ?, gol_darah = ?, rhesus = ?, tinggi_badan = ?, beratbadan = ?, buku_kia = ?, pekerjaan = ?, 
       pendidikan = ?, kelurahan_id = ?, rt = ?, alamat_lengkap = ?, posyandu_id = ? 
       WHERE id = ?`,
      [nik_ibu, nama_lengkap, tanggal_lahir, no_hp, gol_darah, rhesus, tinggi_badan,
       req.body.beratbadan || null, buku_kia, pekerjaan, pendidikan, kelurahan_id, rt, alamat_lengkap, posyandu_id, req.params.id]
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

    // Check if kehamilan record exists and its status
    const [kehamilanCheck] = await connection.query(
      'SELECT id, status_kehamilan FROM kehamilan WHERE forkey_ibu = ? ORDER BY created_at DESC LIMIT 1',
      [req.params.id]
    );

    if (kehamilanCheck.length > 0) {
      const latestPregnancy = kehamilanCheck[0];
      
      // If explicitly adding new pregnancy OR latest pregnancy is completed ("Selesai" or "Keguguran") 
      // and new status is active, create a new record instead of updating
      const isCompletedPregnancy = ['Selesai', 'Keguguran'].includes(latestPregnancy.status_kehamilan);
      const isNewActivePregnancy = !['Selesai', 'Keguguran'].includes(status_kehamilan);
      
      if (isAddingNewPregnancy || (isCompletedPregnancy && isNewActivePregnancy)) {
        // Create new pregnancy record for new pregnancy
        await connection.query(
          `INSERT INTO kehamilan (gravida, partus, abortus, haid_terakhir, 
           taksiran_persalinan, status_kehamilan, forkey_ibu) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [gravida || 1, partus || 0, abortus || 0, haid_terakhir, 
           taksiranPersalinan, status_kehamilan || 'Hamil', req.params.id]
        );
      } else {
        // Update existing kehamilan record (for active pregnancies or corrections)
        await connection.query(
          `UPDATE kehamilan SET gravida = ?, partus = ?, abortus = ?, 
           haid_terakhir = ?, taksiran_persalinan = ?, status_kehamilan = ? 
           WHERE id = ?`,
          [gravida || 1, partus || 0, abortus || 0, haid_terakhir, 
           taksiranPersalinan, status_kehamilan || 'Hamil', latestPregnancy.id]
        );
      }
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

    // Handle suami data
    if (suami) {
      const [suamiCheck] = await connection.query(
        'SELECT id FROM suami WHERE forkey_ibu = ?',
        [req.params.id]
      );

      if (suamiCheck.length > 0) {
        // Update existing suami record
        await connection.query(
          `UPDATE suami SET nik_suami = ?, nama_lengkap = ?, tanggal_lahir = ?, 
           no_hp = ?, gol_darah = ?, pekerjaan = ?, pendidikan = ?, isPerokok = ? 
           WHERE forkey_ibu = ?`,
          [suami.nik_suami || null, suami.nama_lengkap || null, suami.tanggal_lahir || null,
           suami.no_hp || null, suami.gol_darah || null, suami.pekerjaan || null,
           suami.pendidikan || null, suami.isPerokok || false, req.params.id]
        );
      } else if (suami.nik_suami || suami.nama_lengkap) {
        // Create new suami record
        await connection.query(
          `INSERT INTO suami (nik_suami, nama_lengkap, tanggal_lahir, no_hp, 
           gol_darah, pekerjaan, pendidikan, isPerokok, forkey_ibu) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [suami.nik_suami || null, suami.nama_lengkap || null, suami.tanggal_lahir || null,
           suami.no_hp || null, suami.gol_darah || null, suami.pekerjaan || null,
           suami.pendidikan || null, suami.isPerokok || false, req.params.id]
        );
      }
    }

    // Handle riwayat penyakit - delete all and re-insert
    if (riwayat_penyakit !== undefined) {
      // Delete existing riwayat penyakit
      await connection.query(
        'DELETE FROM riwayat_penyakit WHERE forkey_ibu = ?',
        [req.params.id]
      );

      // Insert new riwayat penyakit
      if (riwayat_penyakit.length > 0) {
        for (const rp of riwayat_penyakit) {
          if (rp.nama_penyakit) {
            await connection.query(
              `INSERT INTO riwayat_penyakit (nama_penyakit, kategori_penyakit, 
               tahun_diagnosis, status_penyakit, keterangan, forkey_ibu) 
               VALUES (?, ?, ?, ?, ?, ?)`,
              [rp.nama_penyakit, rp.kategori_penyakit || 'Lainnya',
               rp.tahun_diagnosis || null, rp.status_penyakit || 'Sembuh',
               rp.keterangan || null, req.params.id]
            );
          }
        }
      }
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
    const [ibuRows] = await pool.query(`
      SELECT i.*, kel.nama_kelurahan as kelurahan_nama, p.nama_posyandu
      FROM ibu i
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      LEFT JOIN wilker_posyandu p ON i.posyandu_id = p.id
      WHERE i.id = ?
    `, [id]);
    
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
    
    // Get medical history (riwayat penyakit)
    const [riwayatRows] = await pool.query(
      'SELECT * FROM riwayat_penyakit WHERE forkey_ibu = ? ORDER BY tahun_diagnosis DESC',
      [id]
    );
    
    // Get all pregnancy history
    const [pregnancyHistoryRows] = await pool.query(
      'SELECT * FROM kehamilan WHERE forkey_ibu = ? ORDER BY created_at DESC',
      [id]
    );
    
    // For each pregnancy, get its ANC visits
    const pregnancyHistory = [];
    for (const pregnancy of pregnancyHistoryRows) {
      const [ancRows] = await pool.query(
        `SELECT * FROM antenatal_care 
         WHERE forkey_hamil = ? 
         ORDER BY tanggal_kunjungan ASC`,
        [pregnancy.id]
      );
      
      pregnancyHistory.push({
        ...pregnancy,
        ancVisits: ancRows
      });
    }
    
    // Get ANC visits for current pregnancy
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
      complications,
      riwayat_penyakit: riwayatRows,
      pregnancyHistory
    });
  } catch (error) {
    console.error('Error fetching ibu detail:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
