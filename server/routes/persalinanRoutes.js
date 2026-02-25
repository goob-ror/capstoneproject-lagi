const express = require('express');
const router = express.Router();
const db = require('../database/db');
const auth = require('../middleware/auth');

// Get pregnancies ready to deliver (near HPL or past 37 weeks)
router.get('/pregnancies/ready-to-deliver', auth, async (req, res) => {
  try {
    const query = `
      SELECT 
        k.id,
        k.gravida,
        k.status_kehamilan,
        k.haid_terakhir,
        k.taksiran_persalinan,
        ibu.nama_lengkap as nama_ibu,
        ibu.nik_ibu,
        DATEDIFF(CURDATE(), k.haid_terakhir) as usia_kehamilan_hari,
        FLOOR(DATEDIFF(CURDATE(), k.haid_terakhir) / 7) as usia_kehamilan
      FROM kehamilan k
      JOIN ibu ON k.forkey_ibu = ibu.id
      WHERE k.status_kehamilan = 'Hamil'
        AND (
          DATEDIFF(CURDATE(), k.haid_terakhir) >= 259  -- 37 weeks
          OR DATEDIFF(k.taksiran_persalinan, CURDATE()) <= 14  -- Within 2 weeks of HPL
        )
        AND k.id NOT IN (
          SELECT DISTINCT forkey_hamil 
          FROM persalinan 
          WHERE forkey_hamil IS NOT NULL
        )
      ORDER BY k.taksiran_persalinan ASC
    `;
    
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching ready to deliver pregnancies:', error);
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
        ibu.tanggal_lahir,
        ibu.tinggi_badan,
        ibu.beratbadan,
        k.gravida,
        k.partus,
        k.abortus,
        k.taksiran_persalinan,
        DATEDIFF(CURDATE(), k.haid_terakhir) as usia_kehamilan_hari,
        FLOOR(DATEDIFF(CURDATE(), k.haid_terakhir) / 7) as usia_kehamilan,
        YEAR(CURDATE()) - YEAR(ibu.tanggal_lahir) - 
        (DATE_FORMAT(CURDATE(), '%m%d') < DATE_FORMAT(ibu.tanggal_lahir, '%m%d')) as usia
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

// Get all persalinan data with baby information
router.get('/', auth, async (req, res) => {
  try {
    const query = `
      SELECT 
        p.*,
        ibu.nama_lengkap as nama_ibu,
        ibu.nik_ibu,
        bidan.nama_lengkap as nama_bidan,
        GROUP_CONCAT(
          CONCAT_WS('|', 
            b.id, b.urutan_bayi, b.jenis_kelamin, b.berat_badan_lahir, 
            b.panjang_badan_lahir, b.kondisi, b.imunisasi_hb0, b.asfiksia
          ) SEPARATOR ';;'
        ) as bayi_data
      FROM persalinan p
      JOIN kehamilan k ON p.forkey_hamil = k.id
      JOIN ibu ON k.forkey_ibu = ibu.id
      JOIN bidan ON p.forkey_bidan = bidan.id
      LEFT JOIN bayi b ON p.id = b.forkey_persalinan
      GROUP BY p.id
      ORDER BY p.tanggal_persalinan DESC
    `;
    
    const [rows] = await db.execute(query);
    
    // Parse bayi data for each persalinan
    const parsedRows = rows.map(row => {
      if (row.bayi_data) {
        const bayiArray = row.bayi_data.split(';;').map(bayiStr => {
          const [id, urutan_bayi, jenis_kelamin, berat_badan_lahir, panjang_badan_lahir, kondisi, imunisasi, asfiksia] = bayiStr.split('|');
          return {
            id: parseInt(id),
            urutan_bayi: parseInt(urutan_bayi),
            jenis_kelamin,
            berat_badan_lahir: berat_badan_lahir ? parseInt(berat_badan_lahir) : null,
            panjang_badan_lahir: panjang_badan_lahir ? parseFloat(panjang_badan_lahir) : null,
            kondisi,
            imunisasi,
            asfiksia
          };
        });
        row.bayi = bayiArray;
      } else {
        row.bayi = [];
      }
      delete row.bayi_data;
      return row;
    });
    
    res.json(parsedRows);
  } catch (error) {
    console.error('Error fetching persalinan data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get persalinan by ID with baby information
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const persalinanQuery = `
      SELECT 
        p.*,
        ibu.nama_lengkap as nama_ibu,
        ibu.nik_ibu,
        bidan.nama_lengkap as nama_bidan
      FROM persalinan p
      JOIN kehamilan k ON p.forkey_hamil = k.id
      JOIN ibu ON k.forkey_ibu = ibu.id
      JOIN bidan ON p.forkey_bidan = bidan.id
      WHERE p.id = ?
    `;
    
    const [persalinanRows] = await db.execute(persalinanQuery, [id]);
    
    if (persalinanRows.length === 0) {
      return res.status(404).json({ message: 'Persalinan data not found' });
    }
    
    // Get baby data
    const bayiQuery = `
      SELECT * FROM bayi WHERE forkey_persalinan = ? ORDER BY urutan_bayi
    `;
    const [bayiRows] = await db.execute(bayiQuery, [id]);
    
    const result = {
      ...persalinanRows[0],
      bayi: bayiRows
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching persalinan data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new persalinan with baby data
router.post('/', auth, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      tanggal_persalinan, tempat_persalinan, penolong, cara_persalinan,
      komplikasi_ibu, perdarahan, robekan_jalan_lahir, jumlah_bayi,
      beri_ttd, keterangan, forkey_hamil, forkey_bidan,
      bayi // Array of baby data
    } = req.body;

    // Validate baby data
    if (!bayi || !Array.isArray(bayi) || bayi.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Baby data is required and must be an array' });
    }

    if (bayi.length !== (jumlah_bayi || 1)) {
      await connection.rollback();
      return res.status(400).json({ 
        message: `Number of babies (${bayi.length}) does not match jumlah_bayi (${jumlah_bayi || 1})` 
      });
    }

    // Get current pregnancy data to update GPA
    const [pregnancyData] = await connection.execute(
      'SELECT partus, forkey_ibu FROM kehamilan WHERE id = ?',
      [forkey_hamil]
    );

    if (pregnancyData.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Pregnancy data not found' });
    }

    const { partus, forkey_ibu } = pregnancyData[0];

    // Insert persalinan data (mother's delivery info only)
    const persalinanQuery = `
      INSERT INTO persalinan (
        tanggal_persalinan, tempat_persalinan, penolong, cara_persalinan,
        komplikasi_ibu, perdarahan, robekan_jalan_lahir, jumlah_bayi,
        beri_ttd, keterangan, forkey_hamil, forkey_bidan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [persalinanResult] = await connection.execute(persalinanQuery, [
      tanggal_persalinan, tempat_persalinan, penolong, cara_persalinan,
      komplikasi_ibu || null, perdarahan || 'Tidak', robekan_jalan_lahir || null,
      jumlah_bayi || 1, beri_ttd ? 1 : 0, keterangan || null, forkey_hamil, forkey_bidan
    ]);

    const persalinanId = persalinanResult.insertId;

    // Insert baby data for each baby
    const bayiQuery = `
      INSERT INTO bayi (
        forkey_persalinan, urutan_bayi, jenis_kelamin, berat_badan_lahir,
        panjang_badan_lahir, apgar_menit1, apgar_menit5, asfiksia, prematur,
        gangguan_napas, kondisi, imunisasi_hb0, inisiasi_menyusui_dini, vitamin_k1, salep_mata,
        status_risiko, keterangan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (let i = 0; i < bayi.length; i++) {
      const baby = bayi[i];
      await connection.execute(bayiQuery, [
        persalinanId,
        i + 1, // urutan_bayi
        baby.jenis_kelamin,
        baby.berat_badan_lahir || null,
        baby.panjang_badan_lahir || null,
        baby.apgar_menit1 || null,
        baby.apgar_menit5 || null,
        baby.asfiksia || 'Tidak',
        baby.prematur ? 1 : 0,
        baby.gangguan_napas ? 1 : 0,
        baby.kondisi || 'Sehat',
        baby.imunisasi_hb0 ? 1 : 0,
        baby.inisiasi_menyusui_dini ? 1 : 0,
        baby.vitamin_k1 ? 1 : 0,
        baby.salep_mata ? 1 : 0,
        baby.status_risiko || null,
        baby.keterangan || null
      ]);
    }

    // Update pregnancy status to 'Bersalin' and increment partus
    const newPartus = partus + 1;
    
    await connection.execute(
      'UPDATE kehamilan SET status_kehamilan = ?, partus = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['Bersalin', newPartus, forkey_hamil]
    );

    // Update any future pregnancies for this mother to reflect the new GPA
    await connection.execute(
      `UPDATE kehamilan SET partus = ? WHERE forkey_ibu = ? AND id > ?`,
      [newPartus, forkey_ibu, forkey_hamil]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Persalinan and baby data created successfully',
      persalinanId: persalinanId,
      jumlahBayi: bayi.length
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating persalinan:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  } finally {
    connection.release();
  }
});

// Update persalinan and baby data
router.put('/:id', auth, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      tanggal_persalinan, tempat_persalinan, penolong, cara_persalinan,
      komplikasi_ibu, perdarahan, robekan_jalan_lahir, jumlah_bayi,
      beri_ttd, keterangan, forkey_hamil, forkey_bidan,
      bayi // Array of baby data
    } = req.body;

    // Validate baby data
    if (!bayi || !Array.isArray(bayi) || bayi.length === 0) {
      await connection.rollback();
      return res.status(400).json({ message: 'Baby data is required and must be an array' });
    }

    if (bayi.length !== (jumlah_bayi || 1)) {
      await connection.rollback();
      return res.status(400).json({ 
        message: `Number of babies (${bayi.length}) does not match jumlah_bayi (${jumlah_bayi || 1})` 
      });
    }

    // Update persalinan data
    const persalinanQuery = `
      UPDATE persalinan SET
        tanggal_persalinan = ?, tempat_persalinan = ?, penolong = ?, cara_persalinan = ?,
        komplikasi_ibu = ?, perdarahan = ?, robekan_jalan_lahir = ?, jumlah_bayi = ?,
        beri_ttd = ?, keterangan = ?, forkey_hamil = ?, forkey_bidan = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] = await connection.execute(persalinanQuery, [
      tanggal_persalinan, tempat_persalinan, penolong, cara_persalinan,
      komplikasi_ibu || null, perdarahan || 'Tidak', robekan_jalan_lahir || null,
      jumlah_bayi || 1, beri_ttd ? 1 : 0, keterangan || null, 
      forkey_hamil, forkey_bidan, id
    ]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Persalinan data not found' });
    }

    // Delete existing baby records
    await connection.execute('DELETE FROM bayi WHERE forkey_persalinan = ?', [id]);

    // Insert updated baby data
    const bayiQuery = `
      INSERT INTO bayi (
        forkey_persalinan, urutan_bayi, jenis_kelamin, berat_badan_lahir,
        panjang_badan_lahir, apgar_menit1, apgar_menit5, asfiksia, prematur,
        gangguan_napas, kondisi, imunisasi_hb0, inisiasi_menyusui_dini, vitamin_k1, 
        salep_mata, status_risiko, keterangan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (let i = 0; i < bayi.length; i++) {
      const baby = bayi[i];
      await connection.execute(bayiQuery, [
        id,
        i + 1, // urutan_bayi
        baby.jenis_kelamin,
        baby.berat_badan_lahir || null,
        baby.panjang_badan_lahir || null,
        baby.apgar_menit1 || null,
        baby.apgar_menit5 || null,
        baby.asfiksia || 'Tidak',
        baby.prematur ? 1 : 0,
        baby.gangguan_napas ? 1 : 0,
        baby.kondisi || 'Sehat',
        baby.imunisasi_hb0 ? 1 : 0,
        baby.inisiasi_menyusui_dini ? 1 : 0,
        baby.vitamin_k1 ? 1 : 0,
        baby.salep_mata ? 1 : 0,
        baby.status_risiko || null,
        baby.keterangan || null
      ]);
    }

    await connection.commit();

    res.json({ 
      message: 'Persalinan and baby data updated successfully',
      jumlahBayi: bayi.length
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating persalinan:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  } finally {
    connection.release();
  }
});

// Delete persalinan and associated baby data
router.delete('/:id', auth, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    
    // Get the pregnancy ID and current GPA before deleting
    const [persalinanData] = await connection.execute(
      `SELECT p.forkey_hamil, k.partus, k.forkey_ibu 
       FROM persalinan p 
       JOIN kehamilan k ON p.forkey_hamil = k.id 
       WHERE p.id = ?`,
      [id]
    );

    if (persalinanData.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Persalinan data not found' });
    }

    const { forkey_hamil, partus, forkey_ibu } = persalinanData[0];

    // Delete baby data first (due to foreign key constraint)
    await connection.execute('DELETE FROM bayi WHERE forkey_persalinan = ?', [id]);

    // Delete persalinan data
    await connection.execute('DELETE FROM persalinan WHERE id = ?', [id]);

    // Update pregnancy status back to 'Hamil' and decrement partus
    const newPartus = Math.max(0, partus - 1); // Ensure partus doesn't go below 0
    
    await connection.execute(
      'UPDATE kehamilan SET status_kehamilan = ?, partus = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['Hamil', newPartus, forkey_hamil]
    );

    // Update any future pregnancies for this mother to reflect the corrected GPA
    await connection.execute(
      `UPDATE kehamilan SET partus = ? WHERE forkey_ibu = ? AND id > ?`,
      [newPartus, forkey_ibu, forkey_hamil]
    );

    await connection.commit();
    
    res.json({ 
      message: 'Persalinan and baby data deleted successfully, pregnancy status reverted, and GPA corrected' 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting persalinan:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;