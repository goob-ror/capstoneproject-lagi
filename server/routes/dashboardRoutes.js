const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Total Ibu Hamil (Active Pregnancies - excluding completed/miscarriage)
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

// Get Jumlah Kunjungan ANC per Bulan (Stacked Bar) - Last 6 months including current
router.get('/anc-per-month', async (req, res) => {
  try {
    const [results] = await db.query(`
      WITH RECURSIVE months AS (
        SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 5 MONTH), '%Y-%m') as month
        UNION ALL
        SELECT DATE_FORMAT(DATE_ADD(STR_TO_DATE(CONCAT(month, '-01'), '%Y-%m-%d'), INTERVAL 1 MONTH), '%Y-%m')
        FROM months
        WHERE month < DATE_FORMAT(CURDATE(), '%Y-%m')
      ),
      visit_types AS (
        SELECT 'K1' as jenis_kunjungan
        UNION SELECT 'K2'
        UNION SELECT 'K3'
        UNION SELECT 'K4'
        UNION SELECT 'K5'
        UNION SELECT 'K6'
      )
      SELECT 
        m.month,
        vt.jenis_kunjungan,
        COALESCE(COUNT(anc.id), 0) as count
      FROM months m
      CROSS JOIN visit_types vt
      LEFT JOIN antenatal_care anc 
        ON DATE_FORMAT(anc.tanggal_kunjungan, '%Y-%m') = m.month
        AND anc.jenis_kunjungan = vt.jenis_kunjungan
      GROUP BY m.month, vt.jenis_kunjungan
      ORDER BY m.month, vt.jenis_kunjungan
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
        COALESCE(i.kelurahan, 'Lainnya') as kelurahan,
        
        -- 1. Total Ibu Hamil per Kelurahan
        COUNT(DISTINCT i.id) as total_ibu,

        -- 2. Hitung Ibu yang Lulus Fe 90 (Minimal 3x kunjungan dapat Fe)
        SUM(CASE WHEN stats.jumlah_visit_fe >= 3 THEN 1 ELSE 0 END) as fe90_count,

        -- 3. Hitung Ibu yang sudah Skrining TT (Minimal 1x ada data TT)
        SUM(CASE WHEN stats.jumlah_visit_tt >= 1 THEN 1 ELSE 0 END) as tt_covered_count

      FROM ibu i
      JOIN kehamilan k ON i.id = k.forkey_ibu
      
      -- SUBQUERY: Hitung statistik per kehamilan dulu
      LEFT JOIN (
        SELECT 
          forkey_hamil,
          -- Hitung berapa kali dapat Fe (Asumsi 1x = 30 butir, butuh 3x untuk 90)
          SUM(CASE WHEN beri_tablet_fe = 1 THEN 1 ELSE 0 END) as jumlah_visit_fe,
          -- Hitung berapa kali ada status TT
          SUM(CASE WHEN status_imunisasi_tt IS NOT NULL THEN 1 ELSE 0 END) as jumlah_visit_tt
        FROM antenatal_care
        GROUP BY forkey_hamil
      ) stats ON k.id = stats.forkey_hamil

      WHERE k.status_kehamilan = 'Hamil'
      GROUP BY i.kelurahan
      ORDER BY i.kelurahan ASC
    `);
    
    // Kalkulasi Persentase
    const formatted = results.map(row => {
      const total = Number(row.total_ibu);
      const fe90 = Number(row.fe90_count);
      const tt = Number(row.tt_covered_count);

      return {
        kelurahan: row.kelurahan,
        total_ibu: total,
        
        // Persentase Fe 90
        fe_percentage: total > 0 ? Math.round((fe90 / total) * 100) : 0,
        fe_count_real: fe90, // Data mentah untuk tooltip (opsional)

        // Persentase TT
        tt_percentage: total > 0 ? Math.round((tt / total) * 100) : 0,
        tt_count_real: tt    // Data mentah untuk tooltip (opsional)
      };
    });
    
    res.json(formatted);

  } catch (error) {
    console.error('Error fetching coverage:', error);
    res.status(500).json({ message: 'Internal Server Error' });
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

// Get Nearing Due Dates (Table) - Sorted by nearest due date (soonest first)
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
      ORDER BY k.taksiran_persalinan ASC
    `);
    res.json(results);
  } catch (error) {
    console.error('Error fetching nearing due dates:', error);
    res.status(500).json({ message: 'Failed to fetch nearing due dates' });
  }
});

// Get ANC Schedule - Next visit recommendations based on gestational age
router.get('/anc-schedule', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        i.nama_lengkap,
        i.kelurahan,
        i.no_hp,
        k.haid_terakhir,
        k.taksiran_persalinan,
        
        -- Calculate gestational age in weeks
        FLOOR(DATEDIFF(CURDATE(), k.haid_terakhir) / 7) as gestational_weeks,
        
        -- Get last ANC visit type
        (SELECT jenis_kunjungan 
         FROM antenatal_care 
         WHERE forkey_hamil = k.id 
         ORDER BY tanggal_kunjungan DESC 
         LIMIT 1) as last_visit_type,
        
        -- Get last ANC visit date
        (SELECT tanggal_kunjungan 
         FROM antenatal_care 
         WHERE forkey_hamil = k.id 
         ORDER BY tanggal_kunjungan DESC 
         LIMIT 1) as last_visit_date,
        
        -- Determine next recommended visit type based on last visit
        CASE 
          WHEN (SELECT jenis_kunjungan FROM antenatal_care WHERE forkey_hamil = k.id ORDER BY tanggal_kunjungan DESC LIMIT 1) IS NULL THEN 'K1'
          WHEN (SELECT jenis_kunjungan FROM antenatal_care WHERE forkey_hamil = k.id ORDER BY tanggal_kunjungan DESC LIMIT 1) = 'K1' THEN 'K2'
          WHEN (SELECT jenis_kunjungan FROM antenatal_care WHERE forkey_hamil = k.id ORDER BY tanggal_kunjungan DESC LIMIT 1) = 'K2' THEN 'K3'
          WHEN (SELECT jenis_kunjungan FROM antenatal_care WHERE forkey_hamil = k.id ORDER BY tanggal_kunjungan DESC LIMIT 1) = 'K3' THEN 'K4'
          WHEN (SELECT jenis_kunjungan FROM antenatal_care WHERE forkey_hamil = k.id ORDER BY tanggal_kunjungan DESC LIMIT 1) = 'K4' THEN 'K5'
          WHEN (SELECT jenis_kunjungan FROM antenatal_care WHERE forkey_hamil = k.id ORDER BY tanggal_kunjungan DESC LIMIT 1) = 'K5' THEN 'K6'
          ELSE 'Selesai'
        END as next_visit_type,
        
        -- Calculate recommended date for next visit based on gestational age
        CASE 
          -- K1: Should be done before 14 weeks
          WHEN (SELECT jenis_kunjungan FROM antenatal_care WHERE forkey_hamil = k.id ORDER BY tanggal_kunjungan DESC LIMIT 1) IS NULL 
            THEN DATE_ADD(k.haid_terakhir, INTERVAL 14 WEEK)
          
          -- K2: Should be done before 14 weeks (end of trimester 1)
          WHEN (SELECT jenis_kunjungan FROM antenatal_care WHERE forkey_hamil = k.id ORDER BY tanggal_kunjungan DESC LIMIT 1) = 'K1' 
            THEN DATE_ADD(k.haid_terakhir, INTERVAL 14 WEEK)
          
          -- K3: Should be done at 14-28 weeks (trimester 2)
          WHEN (SELECT jenis_kunjungan FROM antenatal_care WHERE forkey_hamil = k.id ORDER BY tanggal_kunjungan DESC LIMIT 1) = 'K2' 
            THEN DATE_ADD(k.haid_terakhir, INTERVAL 24 WEEK)
          
          -- K4: Should be done at 28-36 weeks (start of trimester 3)
          WHEN (SELECT jenis_kunjungan FROM antenatal_care WHERE forkey_hamil = k.id ORDER BY tanggal_kunjungan DESC LIMIT 1) = 'K3' 
            THEN DATE_ADD(k.haid_terakhir, INTERVAL 30 WEEK)
          
          -- K5: Should be done at 28-36 weeks
          WHEN (SELECT jenis_kunjungan FROM antenatal_care WHERE forkey_hamil = k.id ORDER BY tanggal_kunjungan DESC LIMIT 1) = 'K4' 
            THEN DATE_ADD(k.haid_terakhir, INTERVAL 34 WEEK)
          
          -- K6: Should be done at 36-40 weeks (end of trimester 3)
          WHEN (SELECT jenis_kunjungan FROM antenatal_care WHERE forkey_hamil = k.id ORDER BY tanggal_kunjungan DESC LIMIT 1) = 'K5' 
            THEN DATE_ADD(k.haid_terakhir, INTERVAL 38 WEEK)
          
          ELSE NULL
        END as recommended_visit_date,
        
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
      AND k.haid_terakhir IS NOT NULL
      HAVING next_visit_type != 'Selesai'
      ORDER BY 
        CASE 
          WHEN recommended_visit_date < CURDATE() THEN 0
          ELSE 1
        END,
        recommended_visit_date ASC
    `);
    
    // Calculate days until next visit
    const formattedResults = results.map(row => ({
      ...row,
      days_until_next_visit: row.recommended_visit_date 
        ? Math.floor((new Date(row.recommended_visit_date) - new Date()) / (1000 * 60 * 60 * 24))
        : null
    }));
    
    res.json(formattedResults);
  } catch (error) {
    console.error('Error fetching ANC schedule:', error);
    res.status(500).json({ message: 'Failed to fetch ANC schedule' });
  }
});

module.exports = router;
