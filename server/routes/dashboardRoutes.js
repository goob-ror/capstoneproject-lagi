const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Auto-update pregnancy statuses (called on dashboard load)
router.post('/auto-update-statuses', async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Auto-update Nifas to Selesai after 42 days from delivery
    const updateQuery = `
      UPDATE kehamilan k
      JOIN persalinan p ON k.id = p.forkey_hamil
      SET k.status_kehamilan = 'Selesai', k.updated_at = CURRENT_TIMESTAMP
      WHERE k.status_kehamilan = 'Nifas'
        AND DATEDIFF(CURDATE(), p.tanggal_persalinan) > 42
    `;

    const [result] = await connection.execute(updateQuery);

    await connection.commit();

    res.json({
      success: true,
      updated_count: result.affectedRows
    });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
});

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    // Total Ibu Hamil: distinct pregnancies with at least one ANC visit this year
    const [totalIbuHamilResult] = await db.query(
      `SELECT COUNT(DISTINCT k.id) as count
       FROM kehamilan k
       INNER JOIN antenatal_care anc ON anc.forkey_hamil = k.id
       WHERE YEAR(anc.tanggal_kunjungan) = ?`,
      [currentYear]
    );
    const totalIbuHamil = totalIbuHamilResult[0].count;

    // Ibu Hamil Dengan Risiko Tinggi: distinct pregnancies with a risk visit this year
    const [highRiskResult] = await db.query(
      `SELECT COUNT(DISTINCT k.id) as count 
       FROM kehamilan k
       JOIN antenatal_care anc ON k.id = anc.forkey_hamil
       WHERE YEAR(anc.tanggal_kunjungan) = ?
       AND anc.status_risiko_visit IN ('Ringan', 'Sedang', 'Tinggi')`,
      [currentYear]
    );
    const ibuHamilRisikoTinggi = highRiskResult[0].count;

    // Cakupan K1: pregnancies with a K1 visit this year / total pregnancies with any ANC visit this year
    const [k1CoverageResult] = await db.query(
      `SELECT
        COUNT(DISTINCT CASE WHEN anc.jenis_kunjungan = 'K1' THEN k.id END) as k1_count,
        COUNT(DISTINCT k.id) as total_hamil
       FROM kehamilan k
       INNER JOIN antenatal_care anc ON anc.forkey_hamil = k.id
       WHERE YEAR(anc.tanggal_kunjungan) = ?`,
      [currentYear]
    );
    const k1Count = k1CoverageResult[0].k1_count;
    const totalHamil = k1CoverageResult[0].total_hamil;
    const cakupanK1 = totalHamil > 0 ? Math.round((k1Count / totalHamil) * 100) : 0;

    // Komplikasi Dirujuk RS
    const [rujukanResult] = await db.query(
      `SELECT COUNT(*) as count FROM komplikasi 
       WHERE rujuk_rs = 1 
       AND YEAR(tanggal_diagnosis) = ?`,
      [currentYear]
    );
    const komplikasiDirujuk = rujukanResult[0].count;

    res.json({
      totalIbuHamil,
      ibuHamilRisikoTinggi,
      cakupanK1,
      komplikasiDirujuk
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
});

// Get Jumlah Ibu Hamil berdasarkan Kelurahan
router.get('/ibu-by-kelurahan', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    const [results] = await db.query(`
      SELECT 
        COALESCE(kel.nama_kelurahan, 'Tidak Diketahui') as kelurahan,
        COUNT(DISTINCT k.id) as count
      FROM ibu i
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      JOIN kehamilan k ON i.id = k.forkey_ibu
      WHERE k.status_kehamilan = 'Hamil'
        AND (YEAR(k.created_at) = ? OR YEAR(k.updated_at) = ?)
      GROUP BY kel.nama_kelurahan
      ORDER BY count DESC
    `, [currentYear, currentYear]);
    res.json(results);
  } catch (error) {
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
    res.status(500).json({ message: 'Failed to fetch ANC per month' });
  }
});

// Get Cakupan Imunisasi TT/Fe 90 per Kelurahan
router.get('/immunization-coverage', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        COALESCE(kel.nama_kelurahan, 'Lainnya') as kelurahan,
        
        -- 1. Total Ibu Hamil per Kelurahan
        COUNT(DISTINCT i.id) as total_ibu,

        -- 2. Hitung Ibu yang Lulus Fe 90 (Minimal 3x kunjungan dapat Fe)
        SUM(CASE WHEN stats.jumlah_visit_fe >= 3 THEN 1 ELSE 0 END) as fe90_count,

        -- 3. Hitung Ibu yang sudah Skrining TT (Minimal 1x ada data TT)
        SUM(CASE WHEN stats.jumlah_visit_tt >= 1 THEN 1 ELSE 0 END) as tt_covered_count

      FROM ibu i
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
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
      GROUP BY kel.nama_kelurahan
      ORDER BY kel.nama_kelurahan ASC
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
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Get Distribusi Risiko Kehamilan (Pie Chart)
router.get('/risk-distribution', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    const [results] = await db.query(`
      SELECT 
        CASE 
          WHEN anc.status_risiko_visit IN ('Ringan', 'Sedang', 'Tinggi') THEN 'Risiko Tinggi'
          ELSE 'Normal'
        END as risk_category,
        COUNT(DISTINCT k.id) as count
      FROM kehamilan k
      LEFT JOIN antenatal_care anc ON k.id = anc.forkey_hamil
      WHERE k.status_kehamilan = 'Hamil'
        AND (YEAR(k.created_at) = ? OR YEAR(k.updated_at) = ?)
      GROUP BY risk_category
    `, [currentYear, currentYear]);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch risk distribution' });
  }
});

// Get Nearing Due Dates (Table) - Sorted by nearest due date (soonest first)
router.get('/nearing-due-dates', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        i.nama_lengkap,
        COALESCE(kel.nama_kelurahan, 'Tidak Diketahui') as kelurahan,
        i.no_hp,
        k.taksiran_persalinan,
        DATEDIFF(k.taksiran_persalinan, CURDATE()) as days_until_due,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM antenatal_care anc 
            WHERE anc.forkey_hamil = k.id 
            AND anc.status_risiko_visit IN ('Ringan', 'Sedang', 'Tinggi')
          ) THEN 'Risiko Tinggi'
          ELSE 'Normal'
        END as status_risiko
      FROM kehamilan k
      JOIN ibu i ON k.forkey_ibu = i.id
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      WHERE k.status_kehamilan = 'Hamil'
      AND k.taksiran_persalinan IS NOT NULL
      ORDER BY k.taksiran_persalinan ASC
    `);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch nearing due dates' });
  }
});

// Get ANC Schedule - Next visit recommendations based on gestational age
router.get('/anc-schedule', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        i.nama_lengkap,
        COALESCE(kel.nama_kelurahan, 'Tidak Diketahui') as kelurahan,
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
            AND anc.status_risiko_visit IN ('Ringan', 'Sedang', 'Tinggi')
          ) THEN 'Risiko Tinggi'
          ELSE 'Normal'
        END as status_risiko
        
      FROM kehamilan k
      JOIN ibu i ON k.forkey_ibu = i.id
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
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
    res.status(500).json({ message: 'Failed to fetch ANC schedule' });
  }
});

// Get Suami Perokok per Kelurahan
router.get('/suami-perokok-kelurahan', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        COALESCE(kel.nama_kelurahan, 'Tidak Diketahui') as kelurahan,
        COUNT(s.id) as total_suami,
        SUM(CASE WHEN s.isPerokok = 1 THEN 1 ELSE 0 END) as perokok_count,
        SUM(CASE WHEN s.isPerokok = 0 THEN 1 ELSE 0 END) as non_perokok_count,
        CASE 
          WHEN COUNT(s.id) > 0 THEN ROUND((SUM(CASE WHEN s.isPerokok = 1 THEN 1 ELSE 0 END) / COUNT(s.id)) * 100, 1)
          ELSE 0 
        END as perokok_percentage
      FROM ibu i
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      LEFT JOIN suami s ON i.id = s.forkey_ibu
      WHERE s.id IS NOT NULL
      GROUP BY kel.nama_kelurahan
      ORDER BY kel.nama_kelurahan ASC
    `);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch suami perokok data' });
  }
});

// Get Distribusi IMT per Kelurahan
router.get('/imt-distribution-kelurahan', async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        COALESCE(kel.nama_kelurahan, 'Tidak Diketahui') as kelurahan,
        COUNT(i.id) as total_ibu,
        
        -- Underweight (IMT < 18.5)
        SUM(CASE 
          WHEN i.tinggi_badan IS NOT NULL AND i.beratbadan IS NOT NULL 
          AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) < 18.5 
          THEN 1 ELSE 0 
        END) as underweight_count,
        
        -- Normal (IMT 18.5-24.9)
        SUM(CASE 
          WHEN i.tinggi_badan IS NOT NULL AND i.beratbadan IS NOT NULL 
          AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 18.5 
          AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) < 25.0 
          THEN 1 ELSE 0 
        END) as normal_count,
        
        -- Overweight (IMT 25.0-29.9)
        SUM(CASE 
          WHEN i.tinggi_badan IS NOT NULL AND i.beratbadan IS NOT NULL 
          AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 25.0 
          AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) < 30.0 
          THEN 1 ELSE 0 
        END) as overweight_count,
        
        -- Obesitas (IMT >= 30.0)
        SUM(CASE 
          WHEN i.tinggi_badan IS NOT NULL AND i.beratbadan IS NOT NULL 
          AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 30.0 
          THEN 1 ELSE 0 
        END) as obesitas_count,
        
        -- Data tidak lengkap
        SUM(CASE 
          WHEN i.tinggi_badan IS NULL OR i.beratbadan IS NULL 
          THEN 1 ELSE 0 
        END) as no_data_count
        
      FROM ibu i
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      GROUP BY kel.nama_kelurahan
      HAVING total_ibu > 0
      ORDER BY kel.nama_kelurahan ASC
    `);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch IMT distribution data' });
  }
});

// Get At-Risk Mothers (Low Anemia and/or KEK)
router.get('/at-risk-mothers', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    const [results] = await db.query(`
      SELECT
        i.id,
        i.nama_lengkap,
        i.nik_ibu,
        i.no_hp,
        kel.nama_kelurahan,
        k.id as kehamilan_id,
        CASE 
          WHEN latest_lab.hasil_lab_hb < 8.0 THEN 'Anemia Berat'
          WHEN latest_lab.hasil_lab_hb >= 8.0 AND latest_lab.hasil_lab_hb < 10.0 THEN 'Anemia Sedang'
          WHEN latest_lab.hasil_lab_hb >= 10.0 AND latest_lab.hasil_lab_hb < 11.0 THEN 'Anemia Ringan'
          ELSE 'Normal'
        END as status_anemia,
        latest_lab.hasil_lab_hb as hemoglobin,
        CASE 
          WHEN latest_anc.lila < 23.5 THEN 'KEK'
          ELSE 'Normal'
        END as status_kek,
        latest_anc.lila,
        latest_anc.tanggal_kunjungan as last_visit_date,
        DATEDIFF(CURDATE(), k.haid_terakhir) DIV 7 as usia_kehamilan_minggu
      FROM ibu i
      -- Only the single most recent active pregnancy per mother
      JOIN (
        SELECT
          forkey_ibu,
          id,
          haid_terakhir,
          created_at,
          updated_at,
          ROW_NUMBER() OVER (PARTITION BY forkey_ibu ORDER BY created_at DESC) as rn_preg
        FROM kehamilan
        WHERE status_kehamilan = 'Hamil'
          AND (YEAR(created_at) = ? OR YEAR(updated_at) = ?)
      ) k ON i.id = k.forkey_ibu AND k.rn_preg = 1
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      LEFT JOIN (
        SELECT 
          anc.forkey_hamil,
          anc.lila,
          anc.tanggal_kunjungan,
          anc.forkey_lab_screening,
          ROW_NUMBER() OVER (PARTITION BY anc.forkey_hamil ORDER BY anc.tanggal_kunjungan DESC) as rn
        FROM antenatal_care anc
        WHERE anc.lila IS NOT NULL OR anc.forkey_lab_screening IS NOT NULL
      ) latest_anc ON k.id = latest_anc.forkey_hamil AND latest_anc.rn = 1
      LEFT JOIN lab_screening latest_lab ON latest_anc.forkey_lab_screening = latest_lab.id
      WHERE (
          (latest_lab.hasil_lab_hb IS NOT NULL AND latest_lab.hasil_lab_hb < 11.0) OR
          (latest_anc.lila IS NOT NULL AND latest_anc.lila < 23.5)
        )
      ORDER BY 
        CASE 
          WHEN latest_lab.hasil_lab_hb < 8.0 THEN 1
          WHEN latest_anc.lila < 23.5 AND latest_lab.hasil_lab_hb < 10.0 THEN 2
          WHEN latest_anc.lila < 23.5 THEN 3
          WHEN latest_lab.hasil_lab_hb < 10.0 THEN 4
          ELSE 5
        END,
        latest_anc.tanggal_kunjungan DESC
    `, [currentYear, currentYear]);
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch at-risk mothers data' });
  }
});

// Get Action Recommendation for an at-risk mother
// Analyzes ANC visit history to determine if condition is improving,
// and flags stale/irrelevant data for auto-archiving.
router.get('/at-risk-mothers/:kehamilanId/action-recommendation', async (req, res) => {
  try {
    const { kehamilanId } = req.params;

    // Fetch all ANC visits with lab data for this pregnancy, ordered oldest→newest
    const [visits] = await db.query(`
      SELECT
        anc.id,
        anc.tanggal_kunjungan,
        anc.jenis_kunjungan,
        anc.lila,
        anc.tekanan_darah,
        anc.berat_badan,
        anc.selisih_beratbadan,
        anc.status_risiko_visit,
        ls.hasil_lab_hb as hemoglobin,
        ls.lab_protein_urine
      FROM antenatal_care anc
      LEFT JOIN lab_screening ls ON anc.forkey_lab_screening = ls.id
      WHERE anc.forkey_hamil = ?
      ORDER BY anc.tanggal_kunjungan ASC
    `, [kehamilanId]);

    // Fetch pregnancy info for gestational age and due date
    const [[pregnancy]] = await db.query(`
      SELECT
        k.haid_terakhir,
        k.taksiran_persalinan,
        k.status_kehamilan,
        DATEDIFF(CURDATE(), k.haid_terakhir) DIV 7 as usia_kehamilan_minggu
      FROM kehamilan k
      WHERE k.id = ?
    `, [kehamilanId]);

    if (!pregnancy) {
      return res.status(404).json({ message: 'Pregnancy not found' });
    }

    const usiaKehamilanMinggu = pregnancy.usia_kehamilan_minggu || 0;
    const today = new Date();

    // --- Staleness check ---
    // Data is considered stale if the last visit was more than:
    //   - 4 weeks ago for trimester 1 (< 14 weeks)
    //   - 4 weeks ago for trimester 2 (14–28 weeks)
    //   - 2 weeks ago for trimester 3 (> 28 weeks)
    // AND the pregnancy is still active
    let staleThresholdDays = usiaKehamilanMinggu > 28 ? 14 : 28;
    const lastVisit = visits.length > 0 ? new Date(visits[visits.length - 1].tanggal_kunjungan) : null;
    const daysSinceLastVisit = lastVisit
      ? Math.floor((today - lastVisit) / (1000 * 60 * 60 * 24))
      : null;
    const isStale = daysSinceLastVisit !== null && daysSinceLastVisit > staleThresholdDays;

    // --- Trend analysis ---
    // Look at the last 3 visits with Hb data and last 3 with LILA data
    const hbReadings = visits
      .filter(v => v.hemoglobin !== null && v.hemoglobin !== undefined)
      .map(v => ({ date: v.tanggal_kunjungan, value: parseFloat(v.hemoglobin) }));

    const lilaReadings = visits
      .filter(v => v.lila !== null && v.lila !== undefined)
      .map(v => ({ date: v.tanggal_kunjungan, value: parseFloat(v.lila) }));

    // Determine trend: 'improving', 'worsening', 'stable', or 'unknown'
    const getTrend = (readings) => {
      if (readings.length < 2) return 'unknown';
      const recent = readings.slice(-3);
      const first = recent[0].value;
      const last = recent[recent.length - 1].value;
      const diff = last - first;
      if (diff > 0.3) return 'improving';
      if (diff < -0.3) return 'worsening';
      return 'stable';
    };

    const hbTrend = getTrend(hbReadings);
    const lilaTrend = getTrend(lilaReadings);

    const latestHb = hbReadings.length > 0 ? hbReadings[hbReadings.length - 1].value : null;
    const latestLila = lilaReadings.length > 0 ? lilaReadings[lilaReadings.length - 1].value : null;

    // Is the condition now resolved (no longer at-risk)?
    const hbResolved = latestHb !== null && latestHb >= 11.0;
    const lilaResolved = latestLila !== null && latestLila >= 23.5;
    const conditionResolved = (latestHb === null || hbResolved) && (latestLila === null || lilaResolved);

    // --- Auto-archive logic ---
    // Archive if: condition is resolved AND data is stale (no longer relevant)
    // OR if: pregnancy is past due date by more than 14 days (likely delivered, status not updated)
    const dueDate = pregnancy.taksiran_persalinan ? new Date(pregnancy.taksiran_persalinan) : null;
    const daysPastDue = dueDate ? Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)) : null;
    const isPastDue = daysPastDue !== null && daysPastDue > 14;

    const shouldAutoArchive = (conditionResolved && isStale) || isPastDue;

    // --- Build recommendations ---
    const recommendations = [];

    if (isPastDue) {
      recommendations.push({
        type: 'archive',
        priority: 'high',
        message: `Taksiran persalinan telah lewat ${daysPastDue} hari. Data kemungkinan sudah tidak relevan — periksa status kehamilan dan arsipkan jika sudah bersalin.`
      });
    }

    if (latestHb !== null && latestHb < 11.0) {
      if (hbTrend === 'worsening') {
        recommendations.push({
          type: 'urgent',
          priority: 'high',
          message: `Kadar Hb menurun (${latestHb} g/dL). Segera rujuk ke dokter dan evaluasi pemberian suplemen zat besi.`
        });
      } else if (hbTrend === 'improving') {
        recommendations.push({
          type: 'monitor',
          priority: 'medium',
          message: `Kadar Hb membaik namun masih di bawah normal (${latestHb} g/dL). Lanjutkan pemberian tablet Fe dan jadwalkan kunjungan ulang dalam 2 minggu.`
        });
      } else if (hbTrend === 'stable') {
        recommendations.push({
          type: 'action',
          priority: 'medium',
          message: `Kadar Hb stabil namun tetap rendah (${latestHb} g/dL). Evaluasi kepatuhan konsumsi tablet Fe dan pertimbangkan konsultasi gizi.`
        });
      } else {
        recommendations.push({
          type: 'action',
          priority: 'medium',
          message: `Kadar Hb rendah (${latestHb} g/dL). Berikan tablet Fe dan jadwalkan pemeriksaan laboratorium ulang.`
        });
      }
    } else if (hbResolved && hbReadings.length > 0) {
      recommendations.push({
        type: 'resolved',
        priority: 'low',
        message: `Kadar Hb sudah normal (${latestHb} g/dL). Pertahankan konsumsi tablet Fe.`
      });
    }

    if (latestLila !== null && latestLila < 23.5) {
      if (lilaTrend === 'worsening') {
        recommendations.push({
          type: 'urgent',
          priority: 'high',
          message: `LILA menurun (${latestLila} cm). Segera konsultasikan ke ahli gizi dan pertimbangkan pemberian PMT (Pemberian Makanan Tambahan).`
        });
      } else if (lilaTrend === 'improving') {
        recommendations.push({
          type: 'monitor',
          priority: 'medium',
          message: `LILA membaik namun masih KEK (${latestLila} cm). Lanjutkan program PMT dan pantau setiap kunjungan.`
        });
      } else {
        recommendations.push({
          type: 'action',
          priority: 'medium',
          message: `LILA masih di bawah normal (${latestLila} cm). Rujuk ke ahli gizi dan berikan PMT.`
        });
      }
    } else if (lilaResolved && lilaReadings.length > 0) {
      recommendations.push({
        type: 'resolved',
        priority: 'low',
        message: `LILA sudah normal (${latestLila} cm). Pertahankan asupan gizi yang baik.`
      });
    }

    if (isStale && !isPastDue) {
      recommendations.push({
        type: 'overdue_visit',
        priority: 'high',
        message: `Kunjungan terakhir ${daysSinceLastVisit} hari yang lalu. Segera jadwalkan kunjungan ANC berikutnya.`
      });
    }

    if (conditionResolved && isStale && !isPastDue) {
      recommendations.push({
        type: 'archive',
        priority: 'low',
        message: `Kondisi sudah membaik dan data sudah lama tidak diperbarui. Data ini dapat diarsipkan jika ibu sudah tidak aktif dalam pemantauan.`
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'monitor',
        priority: 'low',
        message: 'Pantau kondisi pada kunjungan ANC berikutnya.'
      });
    }

    res.json({
      kehamilanId,
      usiaKehamilanMinggu,
      totalVisits: visits.length,
      daysSinceLastVisit,
      isStale,
      isPastDue,
      daysPastDue,
      conditionResolved,
      hbTrend,
      lilaTrend,
      latestHb,
      latestLila,
      shouldAutoArchive,
      recommendations
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate action recommendation' });
  }
});

module.exports = router;
