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

// Get all persalinan data
router.get('/', auth, async (req, res) => {
  try {
    const query = `
      SELECT 
        p.*,
        ibu.nama_lengkap as nama_ibu,
        ibu.nik_ibu,
        bidan.nama_lengkap as nama_bidan
      FROM persalinan p
      JOIN kehamilan k ON p.forkey_hamil = k.id
      JOIN ibu ON k.forkey_ibu = ibu.id
      JOIN bidan ON p.forkey_bidan = bidan.id
      ORDER BY p.tanggal_persalinan DESC
    `;
    
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching persalinan data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get persalinan by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
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
    
    const [rows] = await db.execute(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Persalinan data not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching persalinan data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new persalinan
router.post('/', auth, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      tanggal_persalinan, tempat_persalinan, penolong, cara_persalinan,
      komplikasi_ibu, perdarahan, robekan_jalan_lahir, jumlah_bayi,
      jenis_kelamin_bayi, berat_badan_bayi, panjang_badan_bayi,
      kondisi_bayi, asfiksia, keterangan_bayi, inisiasi_menyusui_dini,
      vitamin_k1, beri_ttd, salep_mata, keterangan, forkey_hamil, forkey_bidan
    } = req.body;

    // Get current pregnancy data to update GPA
    const [pregnancyData] = await connection.execute(
      'SELECT gravida, partus, abortus, forkey_ibu FROM kehamilan WHERE id = ?',
      [forkey_hamil]
    );

    if (pregnancyData.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Pregnancy data not found' });
    }

    const { gravida, partus, abortus, forkey_ibu } = pregnancyData[0];

    // Insert persalinan data
    const persalinanQuery = `
      INSERT INTO persalinan (
        tanggal_persalinan, tempat_persalinan, penolong, cara_persalinan,
        komplikasi_ibu, perdarahan, robekan_jalan_lahir, jumlah_bayi,
        jenis_kelamin_bayi, berat_badan_bayi, panjang_badan_bayi,
        kondisi_bayi, asfiksia, keterangan_bayi, inisiasi_menyusui_dini,
        vitamin_k1, beri_ttd, salep_mata, keterangan, forkey_hamil, forkey_bidan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [persalinanResult] = await connection.execute(persalinanQuery, [
      tanggal_persalinan, tempat_persalinan, penolong, cara_persalinan,
      komplikasi_ibu || null, perdarahan || 'Tidak', robekan_jalan_lahir || null,
      jumlah_bayi || 1, jenis_kelamin_bayi || null,
      berat_badan_bayi || null, panjang_badan_bayi || null,
      kondisi_bayi || 'Sehat', asfiksia || 'Tidak', keterangan_bayi || null,
      inisiasi_menyusui_dini ? 1 : 0, vitamin_k1 ? 1 : 0, beri_ttd ? 1 : 0, salep_mata ? 1 : 0,
      keterangan || null, forkey_hamil, forkey_bidan
    ]);

    // Update pregnancy status to 'Bersalin' and update GPA
    // Increment partus (successful delivery) by 1
    const newPartus = partus + 1;
    
    await connection.execute(
      'UPDATE kehamilan SET status_kehamilan = ?, partus = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['Bersalin', newPartus, forkey_hamil]
    );

    // Also update any future pregnancies for this mother to reflect the new GPA
    // This ensures the next pregnancy will have correct gravida/partus values
    await connection.execute(
      `UPDATE kehamilan SET 
        gravida = CASE WHEN id = ? THEN gravida ELSE gravida END,
        partus = ? 
       WHERE forkey_ibu = ? AND id >= ?`,
      [forkey_hamil, newPartus, forkey_ibu, forkey_hamil]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Persalinan data created successfully, pregnancy status updated, and GPA updated',
      id: persalinanResult.insertId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating persalinan:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Update persalinan
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tanggal_persalinan, tempat_persalinan, penolong, cara_persalinan,
      komplikasi_ibu, perdarahan, robekan_jalan_lahir, jumlah_bayi,
      jenis_kelamin_bayi, berat_badan_bayi, panjang_badan_bayi,
      kondisi_bayi, asfiksia, keterangan_bayi, inisiasi_menyusui_dini,
      vitamin_k1, beri_ttd, salep_mata, keterangan, forkey_hamil, forkey_bidan
    } = req.body;

    const query = `
      UPDATE persalinan SET
        tanggal_persalinan = ?, tempat_persalinan = ?, penolong = ?, cara_persalinan = ?,
        komplikasi_ibu = ?, perdarahan = ?, robekan_jalan_lahir = ?, jumlah_bayi = ?,
        jenis_kelamin_bayi = ?, berat_badan_bayi = ?, panjang_badan_bayi = ?,
        kondisi_bayi = ?, asfiksia = ?, keterangan_bayi = ?, inisiasi_menyusui_dini = ?,
        vitamin_k1 = ?, beri_ttd = ?, salep_mata = ?, keterangan = ?, forkey_hamil = ?, forkey_bidan = ?
      WHERE id = ?
    `;

    const [result] = await db.execute(query, [
      tanggal_persalinan, tempat_persalinan, penolong, cara_persalinan,
      komplikasi_ibu || null, perdarahan || 'Tidak', robekan_jalan_lahir || null,
      jumlah_bayi || 1, jenis_kelamin_bayi || null,
      berat_badan_bayi || null, panjang_badan_bayi || null,
      kondisi_bayi || 'Sehat', asfiksia || 'Tidak', keterangan_bayi || null,
      inisiasi_menyusui_dini ? 1 : 0, vitamin_k1 ? 1 : 0, beri_ttd ? 1 : 0, salep_mata ? 1 : 0,
      keterangan || null, forkey_hamil, forkey_bidan, id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Persalinan data not found' });
    }

    res.json({ message: 'Persalinan data updated successfully' });
  } catch (error) {
    console.error('Error updating persalinan:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete persalinan
router.delete('/:id', auth, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    
    // Get the pregnancy ID and current GPA before deleting
    const [persalinanData] = await connection.execute(
      `SELECT p.forkey_hamil, k.gravida, k.partus, k.abortus, k.forkey_ibu 
       FROM persalinan p 
       JOIN kehamilan k ON p.forkey_hamil = k.id 
       WHERE p.id = ?`,
      [id]
    );

    if (persalinanData.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Persalinan data not found' });
    }

    const { forkey_hamil, gravida, partus, abortus, forkey_ibu } = persalinanData[0];

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
      `UPDATE kehamilan SET 
        partus = ? 
       WHERE forkey_ibu = ? AND id >= ?`,
      [newPartus, forkey_ibu, forkey_hamil]
    );

    await connection.commit();
    
    res.json({ message: 'Persalinan data deleted successfully, pregnancy status reverted, and GPA corrected' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting persalinan:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
});

module.exports = router;