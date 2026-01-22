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
        FLOOR(DATEDIFF(CURDATE(), k.haid_terakhir) / 7) as usia_kehamilan_minggu
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
        FLOOR(DATEDIFF(CURDATE(), k.haid_terakhir) / 7) as usia_kehamilan_minggu,
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

    // Update pregnancy status to 'Bersalin' (given birth)
    await connection.execute(
      'UPDATE kehamilan SET status_kehamilan = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['Bersalin', forkey_hamil]
    );

    await connection.commit();

    res.status(201).json({
      message: 'Persalinan data created successfully and pregnancy status updated',
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
    
    // Get the pregnancy ID before deleting
    const [persalinanData] = await connection.execute(
      'SELECT forkey_hamil FROM persalinan WHERE id = ?',
      [id]
    );

    if (persalinanData.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Persalinan data not found' });
    }

    const pregnancyId = persalinanData[0].forkey_hamil;

    // Delete persalinan data
    await connection.execute('DELETE FROM persalinan WHERE id = ?', [id]);

    // Update pregnancy status back to 'Hamil'
    await connection.execute(
      'UPDATE kehamilan SET status_kehamilan = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['Hamil', pregnancyId]
    );

    await connection.commit();
    
    res.json({ message: 'Persalinan data deleted successfully and pregnancy status reverted' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting persalinan:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
});

module.exports = router;