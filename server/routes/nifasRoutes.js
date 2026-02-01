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
      WHERE k.status_kehamilan = 'Bersalin'
      ORDER BY p.tanggal_persalinan DESC
    `;
    
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching delivered mothers:', error);
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
    console.error('Error fetching mother data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all nifas data
router.get('/', auth, async (req, res) => {
  try {
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
      ORDER BY n.tanggal_kunjungan DESC
    `;
    
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching nifas data:', error);
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
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching nifas data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new nifas visit
router.post('/', auth, async (req, res) => {
  try {
    const {
      tanggal_kunjungan, jenis_kunjungan, pemeriksa, tekanan_darah,
      suhu_badan, involusio_uteri, lochea, payudara, konseling_asi,
      berat_badan_bayi, suhu_bayi, pemberian_asi, keterangan,
      forkey_hamil, forkey_bidan
    } = req.body;

    // Convert and validate numeric/boolean fields
    const processedData = {
      tanggal_kunjungan,
      jenis_kunjungan: jenis_kunjungan || null,
      pemeriksa: pemeriksa || 'Bidan',
      tekanan_darah: tekanan_darah || null,
      suhu_badan: suhu_badan ? parseFloat(suhu_badan) : null,
      involusio_uteri: involusio_uteri || 'Baik',
      lochea: lochea || 'Rubra',
      payudara: payudara || 'Normal',
      konseling_asi: konseling_asi ? 1 : 0,
      berat_badan_bayi: berat_badan_bayi ? parseFloat(berat_badan_bayi) : null,
      suhu_bayi: suhu_bayi ? parseFloat(suhu_bayi) : null,
      pemberian_asi: pemberian_asi || 'ASI Eksklusif',
      keterangan: keterangan || null,
      forkey_hamil,
      forkey_bidan
    };

    const query = `
      INSERT INTO kunjungan_nifas (
        tanggal_kunjungan, jenis_kunjungan, pemeriksa, tekanan_darah,
        suhu_badan, involusio_uteri, lochea, payudara, konseling_asi,
        berat_badan_bayi, suhu_bayi, pemberian_asi, keterangan,
        forkey_hamil, forkey_bidan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      processedData.tanggal_kunjungan,
      processedData.jenis_kunjungan,
      processedData.pemeriksa,
      processedData.tekanan_darah,
      processedData.suhu_badan,
      processedData.involusio_uteri,
      processedData.lochea,
      processedData.payudara,
      processedData.konseling_asi,
      processedData.berat_badan_bayi,
      processedData.suhu_bayi,
      processedData.pemberian_asi,
      processedData.keterangan,
      processedData.forkey_hamil,
      processedData.forkey_bidan
    ]);

    res.status(201).json({
      message: 'Data kunjungan nifas berhasil disimpan',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating nifas visit:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update nifas visit
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tanggal_kunjungan, jenis_kunjungan, pemeriksa, tekanan_darah,
      suhu_badan, involusio_uteri, lochea, payudara, konseling_asi,
      berat_badan_bayi, suhu_bayi, pemberian_asi, keterangan,
      forkey_hamil, forkey_bidan
    } = req.body;

    // Convert and validate numeric/boolean fields
    const processedData = {
      tanggal_kunjungan,
      jenis_kunjungan: jenis_kunjungan || null,
      pemeriksa: pemeriksa || 'Bidan',
      tekanan_darah: tekanan_darah || null,
      suhu_badan: (suhu_badan && suhu_badan !== '' && suhu_badan !== 'false') ? parseFloat(suhu_badan) : null,
      involusio_uteri: involusio_uteri || 'Baik',
      lochea: lochea || 'Rubra',
      payudara: payudara || 'Normal',
      konseling_asi: (konseling_asi === true || konseling_asi === 'true' || konseling_asi === 1) ? 1 : 0,
      berat_badan_bayi: (berat_badan_bayi && berat_badan_bayi !== '' && berat_badan_bayi !== 'false') ? parseFloat(berat_badan_bayi) : null,
      suhu_bayi: (suhu_bayi && suhu_bayi !== '' && suhu_bayi !== 'false') ? parseFloat(suhu_bayi) : null,
      pemberian_asi: pemberian_asi || 'ASI Eksklusif',
      keterangan: keterangan || null,
      forkey_hamil,
      forkey_bidan
    };

    const query = `
      UPDATE kunjungan_nifas SET
        tanggal_kunjungan = ?, jenis_kunjungan = ?, pemeriksa = ?, tekanan_darah = ?,
        suhu_badan = ?, involusio_uteri = ?, lochea = ?, payudara = ?, konseling_asi = ?,
        berat_badan_bayi = ?, suhu_bayi = ?, pemberian_asi = ?, keterangan = ?,
        forkey_hamil = ?, forkey_bidan = ?
      WHERE id = ?
    `;

    const [result] = await db.execute(query, [
      processedData.tanggal_kunjungan,
      processedData.jenis_kunjungan,
      processedData.pemeriksa,
      processedData.tekanan_darah,
      processedData.suhu_badan,
      processedData.involusio_uteri,
      processedData.lochea,
      processedData.payudara,
      processedData.konseling_asi,
      processedData.berat_badan_bayi,
      processedData.suhu_bayi,
      processedData.pemberian_asi,
      processedData.keterangan,
      processedData.forkey_hamil,
      processedData.forkey_bidan,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Nifas data not found' });
    }

    res.json({ message: 'Data kunjungan nifas berhasil diupdate' });
  } catch (error) {
    console.error('Error updating nifas visit:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete nifas visit
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await db.execute('DELETE FROM kunjungan_nifas WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Nifas data not found' });
    }
    
    res.json({ message: 'Data kunjungan nifas berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting nifas visit:', error);
    res.status(500).json({ message: 'Internal server error' });
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
        suhu_badan, involusio_uteri, lochea, payudara, konseling_asi,
        berat_badan_bayi, suhu_bayi, pemberian_asi, keterangan,
        forkey_hamil, forkey_bidan
      } = nifasData;

      // Convert and validate numeric/boolean fields
      const processedData = {
        tanggal_kunjungan,
        jenis_kunjungan: jenis_kunjungan || null,
        pemeriksa: pemeriksa || 'Bidan',
        tekanan_darah: tekanan_darah || null,
        suhu_badan: (suhu_badan && suhu_badan !== '' && suhu_badan !== 'false') ? parseFloat(suhu_badan) : null,
        involusio_uteri: involusio_uteri || 'Baik',
        lochea: lochea || 'Rubra',
        payudara: payudara || 'Normal',
        konseling_asi: (konseling_asi === true || konseling_asi === 'true' || konseling_asi === 1) ? 1 : 0,
        berat_badan_bayi: (berat_badan_bayi && berat_badan_bayi !== '' && berat_badan_bayi !== 'false') ? parseFloat(berat_badan_bayi) : null,
        suhu_bayi: (suhu_bayi && suhu_bayi !== '' && suhu_bayi !== 'false') ? parseFloat(suhu_bayi) : null,
        pemberian_asi: pemberian_asi || 'ASI Eksklusif',
        keterangan: keterangan || null,
        forkey_hamil,
        forkey_bidan
      };

      const nifasQuery = `
        INSERT INTO kunjungan_nifas (
          tanggal_kunjungan, jenis_kunjungan, pemeriksa, tekanan_darah,
          suhu_badan, involusio_uteri, lochea, payudara, konseling_asi,
          berat_badan_bayi, suhu_bayi, pemberian_asi, keterangan,
          forkey_hamil, forkey_bidan
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const [nifasResult] = await connection.execute(nifasQuery, [
        processedData.tanggal_kunjungan,
        processedData.jenis_kunjungan,
        processedData.pemeriksa,
        processedData.tekanan_darah,
        processedData.suhu_badan,
        processedData.involusio_uteri,
        processedData.lochea,
        processedData.payudara,
        processedData.konseling_asi,
        processedData.berat_badan_bayi,
        processedData.suhu_bayi,
        processedData.pemberian_asi,
        processedData.keterangan,
        processedData.forkey_hamil,
        processedData.forkey_bidan
      ]);

      nifasId = nifasResult.insertId;
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
    console.error('Error creating nifas with complications:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
});

module.exports = router;