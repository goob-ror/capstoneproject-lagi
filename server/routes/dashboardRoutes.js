const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Total Ibu Hamil (Active Pregnancies)
    const [totalIbuHamilResult] = await db.query(
      "SELECT COUNT(*) as count FROM kehamilan WHERE status_kehamilan = 'Hamil'"
    );
    const totalIbuHamil = totalIbuHamilResult[0].count;

    // Ibu Hamil Dengan Risiko Tinggi
    const [highRiskResult] = await db.query(
      `SELECT COUNT(DISTINCT k.id) as count 
       FROM kehamilan k
       JOIN antenatal_care anc ON k.id = anc.forkey_hamil
       WHERE k.status_kehamilan = 'Hamil' 
       AND anc.status_risiko_visit = 'Risiko Tinggi'`
    );
    const ibuHamilRisikoTinggi = highRiskResult[0].count;

    // Cakupan Kunjungan Trimester 1 (K1 visits)
    const [k1CoverageResult] = await db.query(
      `SELECT 
        COUNT(DISTINCT anc.forkey_hamil) as k1_count,
        (SELECT COUNT(*) FROM kehamilan WHERE status_kehamilan = 'Hamil') as total_hamil
       FROM antenatal_care anc
       JOIN kehamilan k ON anc.forkey_hamil = k.id
       WHERE anc.jenis_kunjungan = 'K1' 
       AND k.status_kehamilan = 'Hamil'`
    );
    const k1Count = k1CoverageResult[0].k1_count;
    const totalHamil = k1CoverageResult[0].total_hamil;
    const cakupanK1 = totalHamil > 0 ? Math.round((k1Count / totalHamil) * 100) : 0;

    // Komplikasi Dirujuk RS
    const [rujukanResult] = await db.query(
      "SELECT COUNT(*) as count FROM komplikasi WHERE rujuk_rs = 1"
    );
    const komplikasiDirujuk = rujukanResult[0].count;

    res.json({
      totalIbuHamil,
      ibuHamilRisikoTinggi,
      cakupanK1,
      komplikasiDirujuk
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

// Get Jumlah Ibu Hamil berdasarkan Kelurahan
router.get('/ibu-by-kelurahan', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        COALESCE(i.kelurahan, 'Tidak Diketahui') as kelurahan,
        COUNT(DISTINCT k.id) as count
      FROM ibu i
      JOIN kehamilan k ON i.id = k.forkey_ibu
      WHERE k.status_kehamilan = 'Hamil'
      GROUP BY i.kelurahan
      ORDER BY count DESC
    `);
    res.json(results);
  } catch (error) {
    console.error('Error fetching ibu by kelurahan:', error);
    res.status(500).json({ message: 'Failed to fetch data' });
  }
});

// Get Distribusi Umur Ibu Hamil
router.get('/age-distribution', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        CASE 
          WHEN TIMESTAMPDIFF(YEAR, i.tanggal_lahir, CURDATE()) < 20 THEN '< 20 tahun'
          WHEN TIMESTAMPDIFF(YEAR, i.tanggal_lahir, CURDATE()) BETWEEN 20 AND 24 THEN '20-24 tahun'
          WHEN TIMESTAMPDIFF(YEAR, i.tanggal_lahir, CURDATE()) BETWEEN 25 AND 29 THEN '25-29 tahun'
          WHEN TIMESTAMPDIFF(YEAR, i.tanggal_lahir, CURDATE()) BETWEEN 30 AND 34 THEN '30-34 tahun'
          WHEN TIMESTAMPDIFF(YEAR, i.tanggal_lahir, CURDATE()) BETWEEN 35 AND 39 THEN '35-39 tahun'
          ELSE '>= 40 tahun'
        END as age_group,
        COUNT(*) as count
      FROM ibu i
      JOIN kehamilan k ON i.id = k.forkey_ibu
      WHERE k.status_kehamilan = 'Hamil'
      GROUP BY age_group
      ORDER BY 
        CASE age_group
          WHEN '< 20 tahun' THEN 1
          WHEN '20-24 tahun' THEN 2
          WHEN '25-29 tahun' THEN 3
          WHEN '30-34 tahun' THEN 4
          WHEN '35-39 tahun' THEN 5
          ELSE 6
        END
    `);
    res.json(results);
  } catch (error) {
    console.error('Error fetching age distribution:', error);
    res.status(500).json({ message: 'Failed to fetch age distribution' });
  }
});

// Get Jumlah Kunjungan ANC per Bulan (Stacked Bar)
router.get('/anc-per-month', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        DATE_FORMAT(tanggal_kunjungan, '%Y-%m') as month,
        jenis_kunjungan,
        COUNT(*) as count
      FROM antenatal_care
      WHERE tanggal_kunjungan >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month, jenis_kunjungan
      ORDER BY month, jenis_kunjungan
    `);
    res.json(results);
  } catch (error) {
    console.error('Error fetching ANC per month:', error);
    res.status(500).json({ message: 'Failed to fetch ANC per month' });
  }
});

// Get Cakupan Imunisasi TT/Fe 90 per Kelurahan
router.get('/immunization-coverage', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        COALESCE(i.kelurahan, 'Tidak Diketahui') as kelurahan,
        COUNT(DISTINCT CASE WHEN anc.status_imunisasi_tt IS NOT NULL THEN k.id END) as tt_count,
        COUNT(DISTINCT CASE WHEN anc.beri_tablet_fe = 1 THEN k.id END) as fe_count,
        COUNT(DISTINCT k.id) as total_ibu
      FROM ibu i
      JOIN kehamilan k ON i.id = k.forkey_ibu
      LEFT JOIN antenatal_care anc ON k.id = anc.forkey_hamil
      WHERE k.status_kehamilan = 'Hamil'
      GROUP BY i.kelurahan
      ORDER BY kelurahan
    `);
    
    // Calculate percentages
    const formatted = results.map(row => ({
      kelurahan: row.kelurahan,
      tt_percentage: row.total_ibu > 0 ? Math.round((row.tt_count / row.total_ibu) * 100) : 0,
      fe_percentage: row.total_ibu > 0 ? Math.round((row.fe_count / row.total_ibu) * 100) : 0
    }));
    
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching immunization coverage:', error);
    res.status(500).json({ message: 'Failed to fetch immunization coverage' });
  }
});

// Get Distribusi Risiko Kehamilan (Pie Chart)
router.get('/risk-distribution', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        CASE 
          WHEN anc.status_risiko_visit = 'Risiko Tinggi' THEN 'Risiko Tinggi'
          ELSE 'Normal'
        END as risk_category,
        COUNT(DISTINCT k.id) as count
      FROM kehamilan k
      LEFT JOIN antenatal_care anc ON k.id = anc.forkey_hamil
      WHERE k.status_kehamilan = 'Hamil'
      GROUP BY risk_category
    `);
    res.json(results);
  } catch (error) {
    console.error('Error fetching risk distribution:', error);
    res.status(500).json({ message: 'Failed to fetch risk distribution' });
  }
});

// Get Nearing Due Dates (Table) - Sorted by nearest, includes overdue
router.get('/nearing-due-dates', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        i.nama_lengkap,
        i.kelurahan,
        i.no_hp,
        k.taksiran_persalinan,
        DATEDIFF(k.taksiran_persalinan, CURDATE()) as days_until_due,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM antenatal_care anc 
            WHERE anc.forkey_hamil = k.id 
            AND anc.status_risiko_visit = 'Risiko Tinggi'
          ) THEN 'Risiko Tinggi'
          ELSE 'Normal'
        END as status_risiko
      FROM kehamilan k
      JOIN ibu i ON k.forkey_ibu = i.id
      WHERE k.status_kehamilan = 'Hamil'
      AND k.taksiran_persalinan IS NOT NULL
      ORDER BY ABS(DATEDIFF(k.taksiran_persalinan, CURDATE())) ASC, k.taksiran_persalinan ASC
    `);
    res.json(results);
  } catch (error) {
    console.error('Error fetching nearing due dates:', error);
    res.status(500).json({ message: 'Failed to fetch nearing due dates' });
  }
});

module.exports = router;
