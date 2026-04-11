const express = require('express');
const router = express.Router();
const db = require('../database/db');
const auth = require('../middleware/auth');

// Get delivered mothers (mothers who have given birth)
router.get('/delivered-mothers', auth, async (req, res) => {
  try {
    const query = `
      SELECT 
        k.id,
        k.status_kehamilan,
        ibu.nama_lengkap as nama_ibu,
        ibu.nik_ibu,
        p.tanggal_persalinan,
        p.tempat_persalinan,
        p.penolong
      FROM kehamilan k
      JOIN ibu ON k.forkey_ibu = ibu.id
      JOIN persalinan p ON k.id = p.forkey_hamil
      WHERE k.status_kehamilan IN ('Bersalin', 'Nifas')
      ORDER BY p.tanggal_persalinan DESC
    `;
    
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
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
        k.gravida,
        k.partus,
        k.abortus,
        p.tanggal_persalinan,
        p.tempat_persalinan,
        p.penolong,
        YEAR(CURDATE()) - YEAR(ibu.tanggal_lahir) - 
        (DATE_FORMAT(CURDATE(), '%m%d') < DATE_FORMAT(ibu.tanggal_lahir, '%m%d')) as usia
      FROM kehamilan k
      JOIN ibu ON k.forkey_ibu = ibu.id
      JOIN persalinan p ON k.id = p.forkey_hamil
      WHERE k.id = ?
    `;
    
    const [rows] = await db.execute(query, [pregnancyId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Mother data not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get persalinan data by pregnancy ID for pre-filling nifas form
router.get('/persalinan/by-pregnancy/:pregnancyId', auth, async (req, res) => {
  try {
    const { pregnancyId } = req.params;
    
    // Get persalinan data
    const persalinanQuery = `
      SELECT 
        p.*,
        ibu.nama_lengkap as nama_ibu,
        ibu.nik_ibu
      FROM persalinan p
      JOIN kehamilan k ON p.forkey_hamil = k.id
      JOIN ibu ON k.forkey_ibu = ibu.id
      WHERE p.forkey_hamil = ?
      ORDER BY p.tanggal_persalinan DESC
      LIMIT 1
    `;
    
    const [persalinanRows] = await db.execute(persalinanQuery, [pregnancyId]);
    
    if (persalinanRows.length === 0) {
      return res.status(404).json({ message: 'Persalinan data not found for this pregnancy' });
    }
    
    const persalinan = persalinanRows[0];
    
    // Get baby data
    const bayiQuery = `
      SELECT * FROM bayi WHERE forkey_persalinan = ? ORDER BY urutan_bayi
    `;
    const [bayiRows] = await db.execute(bayiQuery, [persalinan.id]);
    
    res.json({
      persalinan,
      babies: bayiRows
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all nifas data
router.get('/', auth, async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = new Date().getFullYear();
    const filterYear = year || currentYear;

    const query = `
      SELECT 
        n.*,
        ibu.nama_lengkap as nama_ibu,
        ibu.nik_ibu,
        bidan.nama_lengkap as nama_bidan,
        GROUP_CONCAT(
          CONCAT_WS('|', 
            nb.id,
            nb.urutan_bayi, 
            nb.berat_badan, 
            nb.panjang_badan, 
            nb.pemberian_asi,
            nb.kondisi_bayi,
            COALESCE(nb.keterangan, '')
          ) 
          ORDER BY nb.urutan_bayi 
          SEPARATOR ';;'
        ) as babies_data
      FROM kunjungan_nifas n
      JOIN kehamilan k ON n.forkey_hamil = k.id
      JOIN ibu ON k.forkey_ibu = ibu.id
      LEFT JOIN bidan ON n.forkey_bidan = bidan.id
      LEFT JOIN kunjungan_nifas_bayi nb ON n.id = nb.forkey_kunjungan_nifas
      WHERE YEAR(n.tanggal_kunjungan) = ?
      GROUP BY n.id
      ORDER BY n.tanggal_kunjungan DESC
    `;
    
    const [rows] = await db.execute(query, [filterYear]);
    
    // Parse babies data for each row
    const parsedRows = rows.map(row => {
      const babies = [];
      if (row.babies_data) {
        const babiesArray = row.babies_data.split(';;');
        babiesArray.forEach(babyStr => {
          const [id, urutan_bayi, berat_badan, panjang_badan, pemberian_asi, kondisi_bayi, keterangan] = babyStr.split('|');
          babies.push({
            id: parseInt(id),
            urutan_bayi: parseInt(urutan_bayi),
            berat_badan: berat_badan ? parseFloat(berat_badan) : null,
            panjang_badan: panjang_badan ? parseFloat(panjang_badan) : null,
            pemberian_asi,
            kondisi_bayi,
            keterangan: keterangan || null
          });
        });
      }
      delete row.babies_data;
      return { ...row, babies };
    });
    
    res.json(parsedRows);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get nifas by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        n.*,
        ibu.nama_lengkap as nama_ibu,
        ibu.nik_ibu,
        bidan.nama_lengkap as nama_bidan
      FROM kunjungan_nifas n
      JOIN kehamilan k ON n.forkey_hamil = k.id
      JOIN ibu ON k.forkey_ibu = ibu.id
      JOIN bidan ON n.forkey_bidan = bidan.id
      WHERE n.id = ?
    `;
    
    const [rows] = await db.execute(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Nifas data not found' });
    }
    
    // Get babies data
    const [babies] = await db.execute(
      `SELECT * FROM kunjungan_nifas_bayi WHERE forkey_kunjungan_nifas = ? ORDER BY urutan_bayi`,
      [id]
    );
    
    res.json({ ...rows[0], babies });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new nifas visit
router.post('/', auth, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const {
      tanggal_kunjungan, jenis_kunjungan, pemeriksa, tekanan_darah,
      berat_badan, suhu_badan, involusio_uteri, lochea, payudara, konseling_asi,
      forkey_hamil, forkey_bidan, mark_as_selesai, babies
    } = req.body;

    // Convert and validate numeric/boolean fields
    const processedData = {
      tanggal_kunjungan,
      jenis_kunjungan: jenis_kunjungan || null,
      pemeriksa: pemeriksa || 'Bidan',
      tekanan_darah: tekanan_darah || null,
      berat_badan: berat_badan ? parseFloat(berat_badan) : null,
      suhu_badan: suhu_badan ? parseFloat(suhu_badan) : null,
      involusio_uteri: involusio_uteri || 'Baik',
      lochea: lochea || 'Rubra',
      payudara: payudara || 'Normal',
      konseling_asi: konseling_asi ? 1 : 0,
      forkey_hamil,
      forkey_bidan
    };

    const query = `
      INSERT INTO kunjungan_nifas (
        tanggal_kunjungan, jenis_kunjungan, pemeriksa, tekanan_darah,
        berat_badan, suhu_badan, involusio_uteri, lochea, payudara, konseling_asi,
        forkey_hamil, forkey_bidan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(query, [
      processedData.tanggal_kunjungan,
      processedData.jenis_kunjungan,
      processedData.pemeriksa,
      processedData.tekanan_darah,
      processedData.berat_badan,
      processedData.suhu_badan,
      processedData.involusio_uteri,
      processedData.lochea,
      processedData.payudara,
      processedData.konseling_asi,
      processedData.forkey_hamil,
      processedData.forkey_bidan
    ]);

    const nifasId = result.insertId;

    // Insert baby data
    if (babies && babies.length > 0) {
      for (const baby of babies) {
        const babyQuery = `
          INSERT INTO kunjungan_nifas_bayi (
            forkey_kunjungan_nifas, urutan_bayi, berat_badan, panjang_badan,
            pemberian_asi, kondisi_bayi, keterangan
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        await connection.execute(babyQuery, [
          nifasId,
          baby.urutan_bayi || 1,
          baby.berat_badan ? parseFloat(baby.berat_badan) : null,
          baby.panjang_badan ? parseFloat(baby.panjang_badan) : null,
          baby.pemberian_asi || 'ASI Eksklusif',
          baby.kondisi_bayi || 'Sehat',
          baby.keterangan || null
        ]);
      }
    }

    // Update pregnancy status to Nifas if currently Bersalin
    await connection.execute(
      `UPDATE kehamilan 
       SET status_kehamilan = 'Nifas', updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND status_kehamilan = 'Bersalin'`,
      [processedData.forkey_hamil]
    );

    // If mark_as_selesai is true, update status to Selesai
    if (mark_as_selesai) {
      await connection.execute(
        `UPDATE kehamilan 
         SET status_kehamilan = 'Selesai', updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [processedData.forkey_hamil]
      );
    }

    await connection.commit();

    res.status(201).json({
      message: 'Data kunjungan nifas berhasil disimpan',
      id: nifasId
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Update nifas visit
router.put('/:id', auth, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      tanggal_kunjungan, jenis_kunjungan, pemeriksa, tekanan_darah,
      berat_badan, suhu_badan, involusio_uteri, lochea, payudara, konseling_asi,
      forkey_hamil, forkey_bidan, mark_as_selesai, babies
    } = req.body;

    // Convert and validate numeric/boolean fields
    const processedData = {
      tanggal_kunjungan,
      jenis_kunjungan: jenis_kunjungan || null,
      pemeriksa: pemeriksa || 'Bidan',
      tekanan_darah: tekanan_darah || null,
      berat_badan: (berat_badan && berat_badan !== '' && berat_badan !== 'false') ? parseFloat(berat_badan) : null,
      suhu_badan: (suhu_badan && suhu_badan !== '' && suhu_badan !== 'false') ? parseFloat(suhu_badan) : null,
      involusio_uteri: involusio_uteri || 'Baik',
      lochea: lochea || 'Rubra',
      payudara: payudara || 'Normal',
      konseling_asi: (konseling_asi === true || konseling_asi === 'true' || konseling_asi === 1) ? 1 : 0,
      forkey_hamil,
      forkey_bidan
    };

    const query = `
      UPDATE kunjungan_nifas SET
        tanggal_kunjungan = ?, jenis_kunjungan = ?, pemeriksa = ?, tekanan_darah = ?,
        berat_badan = ?, suhu_badan = ?, involusio_uteri = ?, lochea = ?, payudara = ?, konseling_asi = ?,
        forkey_hamil = ?, forkey_bidan = ?
      WHERE id = ?
    `;

    const [result] = await connection.execute(query, [
      processedData.tanggal_kunjungan,
      processedData.jenis_kunjungan,
      processedData.pemeriksa,
      processedData.tekanan_darah,
      processedData.berat_badan,
      processedData.suhu_badan,
      processedData.involusio_uteri,
      processedData.lochea,
      processedData.payudara,
      processedData.konseling_asi,
      processedData.forkey_hamil,
      processedData.forkey_bidan,
      id
    ]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Nifas data not found' });
    }

    // Update baby data - delete existing and insert new
    await connection.execute('DELETE FROM kunjungan_nifas_bayi WHERE forkey_kunjungan_nifas = ?', [id]);
    
    if (babies && babies.length > 0) {
      for (const baby of babies) {
        const babyQuery = `
          INSERT INTO kunjungan_nifas_bayi (
            forkey_kunjungan_nifas, urutan_bayi, berat_badan, panjang_badan,
            pemberian_asi, kondisi_bayi, keterangan
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        await connection.execute(babyQuery, [
          id,
          baby.urutan_bayi || 1,
          baby.berat_badan ? parseFloat(baby.berat_badan) : null,
          baby.panjang_badan ? parseFloat(baby.panjang_badan) : null,
          baby.pemberian_asi || 'ASI Eksklusif',
          baby.kondisi_bayi || 'Sehat',
          baby.keterangan || null
        ]);
      }
    }

    // If mark_as_selesai is true, update status to Selesai
    if (mark_as_selesai) {
      await connection.execute(
        `UPDATE kehamilan 
         SET status_kehamilan = 'Selesai', updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [processedData.forkey_hamil]
      );
    }

    await connection.commit();

    res.json({ message: 'Data kunjungan nifas berhasil diupdate' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Delete nifas visit
router.delete('/:id', auth, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    
    // Delete baby records first (foreign key constraint)
    await connection.execute('DELETE FROM kunjungan_nifas_bayi WHERE forkey_kunjungan_nifas = ?', [id]);
    
    // Delete nifas record
    const [result] = await connection.execute('DELETE FROM kunjungan_nifas WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Nifas data not found' });
    }
    
    await connection.commit();
    
    res.json({ message: 'Data kunjungan nifas berhasil dihapus' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Auto-update pregnancies to Selesai after 42 days from delivery
router.post('/auto-update-status', auth, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Find pregnancies in Nifas status where delivery was more than 42 days ago
    const query = `
      UPDATE kehamilan k
      JOIN persalinan p ON k.id = p.forkey_hamil
      SET k.status_kehamilan = 'Selesai', k.updated_at = CURRENT_TIMESTAMP
      WHERE k.status_kehamilan = 'Nifas'
        AND DATEDIFF(CURDATE(), p.tanggal_persalinan) > 42
    `;

    const [result] = await connection.execute(query);

    await connection.commit();

    res.json({
      message: 'Status kehamilan berhasil diupdate otomatis',
      updated_count: result.affectedRows
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Create nifas with complications in transaction
router.post('/with-complications', auth, async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const {
      // Nifas data
      nifasData,
      // Complications data
      complications
    } = req.body;

    let nifasId = null;

    // Create nifas record
    if (nifasData) {
      const {
        tanggal_kunjungan, jenis_kunjungan, pemeriksa, tekanan_darah,
        berat_badan, suhu_badan, involusio_uteri, lochea, payudara, konseling_asi,
        forkey_hamil, forkey_bidan, babies
      } = nifasData;

      // Convert and validate numeric/boolean fields
      const processedData = {
        tanggal_kunjungan,
        jenis_kunjungan: jenis_kunjungan || null,
        pemeriksa: pemeriksa || 'Bidan',
        tekanan_darah: tekanan_darah || null,
        berat_badan: (berat_badan && berat_badan !== '' && berat_badan !== 'false') ? parseFloat(berat_badan) : null,
        suhu_badan: (suhu_badan && suhu_badan !== '' && suhu_badan !== 'false') ? parseFloat(suhu_badan) : null,
        involusio_uteri: involusio_uteri || 'Baik',
        lochea: lochea || 'Rubra',
        payudara: payudara || 'Normal',
        konseling_asi: (konseling_asi === true || konseling_asi === 'true' || konseling_asi === 1) ? 1 : 0,
        forkey_hamil,
        forkey_bidan
      };

      const nifasQuery = `
        INSERT INTO kunjungan_nifas (
          tanggal_kunjungan, jenis_kunjungan, pemeriksa, tekanan_darah,
          berat_badan, suhu_badan, involusio_uteri, lochea, payudara, konseling_asi,
          forkey_hamil, forkey_bidan
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [nifasResult] = await connection.execute(nifasQuery, [
        processedData.tanggal_kunjungan,
        processedData.jenis_kunjungan,
        processedData.pemeriksa,
        processedData.tekanan_darah,
        processedData.berat_badan,
        processedData.suhu_badan,
        processedData.involusio_uteri,
        processedData.lochea,
        processedData.payudara,
        processedData.konseling_asi,
        processedData.forkey_hamil,
        processedData.forkey_bidan
      ]);

      nifasId = nifasResult.insertId;

      // Insert baby data
      if (babies && babies.length > 0) {
        for (const baby of babies) {
          const babyQuery = `
            INSERT INTO kunjungan_nifas_bayi (
              forkey_kunjungan_nifas, urutan_bayi, berat_badan, panjang_badan,
              pemberian_asi, kondisi_bayi, keterangan
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `;
          
          await connection.execute(babyQuery, [
            nifasId,
            baby.urutan_bayi || 1,
            baby.berat_badan ? parseFloat(baby.berat_badan) : null,
            baby.panjang_badan ? parseFloat(baby.panjang_badan) : null,
            baby.pemberian_asi || 'ASI Eksklusif',
            baby.kondisi_bayi || 'Sehat',
            baby.keterangan || null
          ]);
        }
      }
    }

    // Create complications if provided
    const komplikasiIds = [];
    if (complications && complications.length > 0) {
      for (const comp of complications) {
        const {
          nama_komplikasi, kejadian, tanggal_diagnosis,
          rujuk_rs, nama_rs, tanggal_rujukan, tekanan_darah, protein_urine,
          gejala_penyerta, terapi_diberikan, tingkat_keparahan,
          status_penanganan, keterangan, forkey_hamil
        } = comp;

        const kompQuery = `
          INSERT INTO komplikasi (
            nama_komplikasi, kejadian, tanggal_diagnosis,
            rujuk_rs, nama_rs, tanggal_rujukan, tekanan_darah, protein_urine,
            gejala_penyerta, terapi_diberikan, tingkat_keparahan,
            status_penanganan, keterangan, forkey_hamil, forkey_anc
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [kompResult] = await connection.execute(kompQuery, [
          nama_komplikasi, 
          kejadian || 'Saat Nifas', // Default to 'Saat Nifas' for nifas complications
          tanggal_diagnosis,
          rujuk_rs ? 1 : 0, 
          nama_rs || null, 
          tanggal_rujukan || null,
          tekanan_darah || null, 
          protein_urine || null, 
          gejala_penyerta || null,
          terapi_diberikan || null, 
          tingkat_keparahan || null, 
          status_penanganan,
          keterangan || null, 
          forkey_hamil, 
          null // forkey_anc is null for nifas complications
        ]);

        komplikasiIds.push(kompResult.insertId);
      }
    }

    await connection.commit();
    
    res.status(201).json({
      message: 'Data kunjungan nifas dan komplikasi berhasil disimpan',
      nifasId: nifasId,
      komplikasiIds: komplikasiIds
    });

  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Get persalinan data with babies for KF1 creation
router.get('/persalinan/:persalinanId/for-kf1', auth, async (req, res) => {
  try {
    const { persalinanId } = req.params;
    
    // Get persalinan data
    const [persalinanRows] = await db.execute(
      `SELECT p.*, k.forkey_ibu, k.gravida, k.partus, k.abortus,
              ibu.nama_lengkap, ibu.nik_ibu
       FROM persalinan p
       JOIN kehamilan k ON p.forkey_hamil = k.id
       JOIN ibu ON k.forkey_ibu = ibu.id
       WHERE p.id = ?`,
      [persalinanId]
    );
    
    if (persalinanRows.length === 0) {
      return res.status(404).json({ message: 'Persalinan data not found' });
    }
    
    const persalinan = persalinanRows[0];
    
    // Get baby data
    const [bayiRows] = await db.execute(
      `SELECT * FROM bayi WHERE forkey_persalinan = ? ORDER BY urutan_bayi ASC`,
      [persalinanId]
    );
    
    res.json({
      persalinan,
      babies: bayiRows
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;