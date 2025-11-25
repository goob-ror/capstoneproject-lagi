const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const authMiddleware = require('../middleware/auth');

// Get summary/report data
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { kelurahan } = req.query;
    
    // Build WHERE clause for kelurahan filter
    const kelurahanFilter = kelurahan ? `WHERE i.kelurahan = ?` : '';
    const kelurahanFilterANC = kelurahan ? `WHERE i.kelurahan = ?` : '';
    const kelurahanFilterKomplikasi = kelurahan ? `WHERE i.kelurahan = ?` : '';
    const params = kelurahan ? [kelurahan] : [];

    // Get total ibu
    const totalIbuQuery = kelurahan 
      ? 'SELECT COUNT(*) as count FROM ibu WHERE kelurahan = ?'
      : 'SELECT COUNT(*) as count FROM ibu';
    const [totalIbuResult] = await pool.query(totalIbuQuery, params);
    const totalIbu = totalIbuResult[0].count;

    // Get total ibu hamil (active pregnancies)
    const totalHamilQuery = kelurahan
      ? `SELECT COUNT(*) as count FROM kehamilan k 
         INNER JOIN ibu i ON k.forkey_ibu = i.id 
         WHERE k.status_kehamilan = 'Hamil' AND i.kelurahan = ?`
      : "SELECT COUNT(*) as count FROM kehamilan WHERE status_kehamilan = 'Hamil'";
    const [totalHamilResult] = await pool.query(totalHamilQuery, params);
    const totalHamil = totalHamilResult[0].count;

    // Get total ANC visits
    const totalANCQuery = kelurahan
      ? `SELECT COUNT(*) as count FROM antenatal_care ac
         INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
         INNER JOIN ibu i ON k.forkey_ibu = i.id
         WHERE i.kelurahan = ?`
      : 'SELECT COUNT(*) as count FROM antenatal_care';
    const [totalANCResult] = await pool.query(totalANCQuery, params);
    const totalANC = totalANCResult[0].count;

    // Get total complications
    const totalKomplikasiQuery = kelurahan
      ? `SELECT COUNT(*) as count FROM komplikasi ko
         INNER JOIN kehamilan k ON ko.forkey_hamil = k.id
         INNER JOIN ibu i ON k.forkey_ibu = i.id
         WHERE i.kelurahan = ?`
      : 'SELECT COUNT(*) as count FROM komplikasi';
    const [totalKomplikasiResult] = await pool.query(totalKomplikasiQuery, params);
    const totalKomplikasi = totalKomplikasiResult[0].count;

    // Get ANC visits by type
    const ancByTypeQuery = kelurahan
      ? `SELECT 
          ac.jenis_kunjungan,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / (
            SELECT COUNT(*) FROM antenatal_care ac2
            INNER JOIN kehamilan k2 ON ac2.forkey_hamil = k2.id
            INNER JOIN ibu i2 ON k2.forkey_ibu = i2.id
            WHERE i2.kelurahan = ?
          )), 1) as percentage
        FROM antenatal_care ac
        INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
        INNER JOIN ibu i ON k.forkey_ibu = i.id
        WHERE i.kelurahan = ?
        GROUP BY ac.jenis_kunjungan 
        ORDER BY ac.jenis_kunjungan`
      : `SELECT 
          jenis_kunjungan,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM antenatal_care)), 1) as percentage
        FROM antenatal_care 
        GROUP BY jenis_kunjungan 
        ORDER BY jenis_kunjungan`;
    const ancParams = kelurahan ? [kelurahan, kelurahan] : [];
    const [ancByTypeResult] = await pool.query(ancByTypeQuery, ancParams);

    // Get complications by severity
    const complicationsBySeverityQuery = kelurahan
      ? `SELECT 
          ko.tingkat_keparahan,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / (
            SELECT COUNT(*) FROM komplikasi ko2
            INNER JOIN kehamilan k2 ON ko2.forkey_hamil = k2.id
            INNER JOIN ibu i2 ON k2.forkey_ibu = i2.id
            WHERE ko2.tingkat_keparahan IS NOT NULL AND i2.kelurahan = ?
          )), 1) as percentage
        FROM komplikasi ko
        INNER JOIN kehamilan k ON ko.forkey_hamil = k.id
        INNER JOIN ibu i ON k.forkey_ibu = i.id
        WHERE ko.tingkat_keparahan IS NOT NULL AND i.kelurahan = ?
        GROUP BY ko.tingkat_keparahan 
        ORDER BY 
          CASE ko.tingkat_keparahan 
            WHEN 'Ringan' THEN 1 
            WHEN 'Sedang' THEN 2 
            WHEN 'Berat' THEN 3 
          END`
      : `SELECT 
          tingkat_keparahan,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM komplikasi WHERE tingkat_keparahan IS NOT NULL)), 1) as percentage
        FROM komplikasi 
        WHERE tingkat_keparahan IS NOT NULL
        GROUP BY tingkat_keparahan 
        ORDER BY 
          CASE tingkat_keparahan 
            WHEN 'Ringan' THEN 1 
            WHEN 'Sedang' THEN 2 
            WHEN 'Berat' THEN 3 
          END`;
    const compParams = kelurahan ? [kelurahan, kelurahan] : [];
    const [complicationsBySeverityResult] = await pool.query(complicationsBySeverityQuery, compParams);

    // Get ibu distribution by kelurahan (always show all kelurahan)
    const [ibuByKelurahanResult] = await pool.query(`
      SELECT 
        i.kelurahan,
        COUNT(*) as total,
        COUNT(CASE WHEN k.status_kehamilan = 'Hamil' THEN 1 END) as hamil,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ibu)), 1) as percentage
      FROM ibu i
      LEFT JOIN kehamilan k ON i.id = k.forkey_ibu AND k.status_kehamilan = 'Hamil'
      WHERE i.kelurahan IS NOT NULL
      GROUP BY i.kelurahan 
      ORDER BY total DESC
    `);

    // Get Fe (Iron supplement) statistics
    const feQuery = kelurahan
      ? `SELECT 
          COUNT(CASE WHEN ac.beri_tablet_fe = 1 THEN 1 END) as total_fe_given,
          COUNT(*) as total_visits,
          ROUND((COUNT(CASE WHEN ac.beri_tablet_fe = 1 THEN 1 END) * 100.0 / COUNT(*)), 1) as percentage_fe
        FROM antenatal_care ac
        INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
        INNER JOIN ibu i ON k.forkey_ibu = i.id
        WHERE i.kelurahan = ?`
      : `SELECT 
          COUNT(CASE WHEN beri_tablet_fe = 1 THEN 1 END) as total_fe_given,
          COUNT(*) as total_visits,
          ROUND((COUNT(CASE WHEN beri_tablet_fe = 1 THEN 1 END) * 100.0 / COUNT(*)), 1) as percentage_fe
        FROM antenatal_care`;
    const [feResult] = await pool.query(feQuery, params);

    // Get risk status distribution
    const riskQuery = kelurahan
      ? `SELECT 
          ac.status_risiko_visit,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / (
            SELECT COUNT(*) FROM antenatal_care ac2
            INNER JOIN kehamilan k2 ON ac2.forkey_hamil = k2.id
            INNER JOIN ibu i2 ON k2.forkey_ibu = i2.id
            WHERE i2.kelurahan = ?
          )), 1) as percentage
        FROM antenatal_care ac
        INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
        INNER JOIN ibu i ON k.forkey_ibu = i.id
        WHERE i.kelurahan = ?
        GROUP BY ac.status_risiko_visit`
      : `SELECT 
          status_risiko_visit,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM antenatal_care)), 1) as percentage
        FROM antenatal_care
        GROUP BY status_risiko_visit`;
    const riskParams = kelurahan ? [kelurahan, kelurahan] : [];
    const [riskResult] = await pool.query(riskQuery, riskParams);

    // Get immunization TT statistics
    const ttQuery = kelurahan
      ? `SELECT 
          ac.status_imunisasi_tt,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / (
            SELECT COUNT(*) FROM antenatal_care ac2
            INNER JOIN kehamilan k2 ON ac2.forkey_hamil = k2.id
            INNER JOIN ibu i2 ON k2.forkey_ibu = i2.id
            WHERE i2.kelurahan = ? AND ac2.status_imunisasi_tt IS NOT NULL
          )), 1) as percentage
        FROM antenatal_care ac
        INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
        INNER JOIN ibu i ON k.forkey_ibu = i.id
        WHERE i.kelurahan = ? AND ac.status_imunisasi_tt IS NOT NULL
        GROUP BY ac.status_imunisasi_tt
        ORDER BY ac.status_imunisasi_tt`
      : `SELECT 
          status_imunisasi_tt,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM antenatal_care WHERE status_imunisasi_tt IS NOT NULL)), 1) as percentage
        FROM antenatal_care
        WHERE status_imunisasi_tt IS NOT NULL
        GROUP BY status_imunisasi_tt
        ORDER BY status_imunisasi_tt`;
    const ttParams = kelurahan ? [kelurahan, kelurahan] : [];
    const [ttResult] = await pool.query(ttQuery, ttParams);

    // Get average Hemoglobin (Hb) level
    const hbQuery = kelurahan
      ? `SELECT 
          ROUND(AVG(ac.hasil_lab_hb), 2) as avg_hb,
          ROUND(MIN(ac.hasil_lab_hb), 2) as min_hb,
          ROUND(MAX(ac.hasil_lab_hb), 2) as max_hb,
          COUNT(CASE WHEN ac.hasil_lab_hb < 11 THEN 1 END) as anemia_count,
          ROUND((COUNT(CASE WHEN ac.hasil_lab_hb < 11 THEN 1 END) * 100.0 / COUNT(*)), 1) as anemia_percentage
        FROM antenatal_care ac
        INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
        INNER JOIN ibu i ON k.forkey_ibu = i.id
        WHERE i.kelurahan = ? AND ac.hasil_lab_hb IS NOT NULL`
      : `SELECT 
          ROUND(AVG(hasil_lab_hb), 2) as avg_hb,
          ROUND(MIN(hasil_lab_hb), 2) as min_hb,
          ROUND(MAX(hasil_lab_hb), 2) as max_hb,
          COUNT(CASE WHEN hasil_lab_hb < 11 THEN 1 END) as anemia_count,
          ROUND((COUNT(CASE WHEN hasil_lab_hb < 11 THEN 1 END) * 100.0 / COUNT(*)), 1) as anemia_percentage
        FROM antenatal_care
        WHERE hasil_lab_hb IS NOT NULL`;
    const [hbResult] = await pool.query(hbQuery, params);

    // Get list of all kelurahan for filter dropdown
    const [kelurahanList] = await pool.query(`
      SELECT DISTINCT kelurahan 
      FROM ibu 
      WHERE kelurahan IS NOT NULL 
      ORDER BY kelurahan
    `);

    // Get Obesity statistics (BMI >= 30)
    const obesityQuery = kelurahan
      ? `SELECT 
          COUNT(DISTINCT i.id) as total_obese,
          COUNT(DISTINCT CASE 
            WHEN ac.berat_badan / POWER(i.tinggi_badan / 100, 2) >= 30 THEN i.id 
          END) as obese_count,
          ROUND((COUNT(DISTINCT CASE 
            WHEN ac.berat_badan / POWER(i.tinggi_badan / 100, 2) >= 30 THEN i.id 
          END) * 100.0 / COUNT(DISTINCT i.id)), 1) as obese_percentage
        FROM ibu i
        JOIN kehamilan k ON i.id = k.forkey_ibu
        LEFT JOIN antenatal_care ac ON k.id = ac.forkey_hamil
        WHERE k.status_kehamilan = 'Hamil' 
        AND i.tinggi_badan IS NOT NULL 
        AND ac.berat_badan IS NOT NULL
        AND i.kelurahan = ?`
      : `SELECT 
          COUNT(DISTINCT i.id) as total_checked,
          COUNT(DISTINCT CASE 
            WHEN ac.berat_badan / POWER(i.tinggi_badan / 100, 2) >= 30 THEN i.id 
          END) as obese_count,
          ROUND((COUNT(DISTINCT CASE 
            WHEN ac.berat_badan / POWER(i.tinggi_badan / 100, 2) >= 30 THEN i.id 
          END) * 100.0 / COUNT(DISTINCT i.id)), 1) as obese_percentage
        FROM ibu i
        JOIN kehamilan k ON i.id = k.forkey_ibu
        LEFT JOIN antenatal_care ac ON k.id = ac.forkey_hamil
        WHERE k.status_kehamilan = 'Hamil' 
        AND i.tinggi_badan IS NOT NULL 
        AND ac.berat_badan IS NOT NULL`;
    const [obesityResult] = await pool.query(obesityQuery, params);

    // Get Preeklamsia/Eklamsia statistics
    const preeklamsiaQuery = kelurahan
      ? `SELECT 
          COUNT(DISTINCT k.id) as total_preeklamsia,
          COUNT(DISTINCT CASE 
            WHEN ko.kode_diagnosis = 'O15' THEN k.id 
          END) as eklamsia_count,
          COUNT(DISTINCT CASE 
            WHEN ko.kode_diagnosis LIKE 'O14%' THEN k.id 
          END) as preeklamsia_count,
          COUNT(DISTINCT CASE 
            WHEN ko.kode_diagnosis = 'O13' THEN k.id 
          END) as hipertensi_gestasional_count
        FROM kehamilan k
        JOIN ibu i ON k.forkey_ibu = i.id
        LEFT JOIN komplikasi ko ON k.id = ko.forkey_hamil
        WHERE k.status_kehamilan = 'Hamil'
        AND ko.kode_diagnosis IN ('O13', 'O14', 'O14.1', 'O15', 'O16')
        AND i.kelurahan = ?`
      : `SELECT 
          COUNT(DISTINCT k.id) as total_preeklamsia,
          COUNT(DISTINCT CASE 
            WHEN ko.kode_diagnosis = 'O15' THEN k.id 
          END) as eklamsia_count,
          COUNT(DISTINCT CASE 
            WHEN ko.kode_diagnosis LIKE 'O14%' THEN k.id 
          END) as preeklamsia_count,
          COUNT(DISTINCT CASE 
            WHEN ko.kode_diagnosis = 'O13' THEN k.id 
          END) as hipertensi_gestasional_count
        FROM kehamilan k
        LEFT JOIN komplikasi ko ON k.id = ko.forkey_hamil
        WHERE k.status_kehamilan = 'Hamil'
        AND ko.kode_diagnosis IN ('O13', 'O14', 'O14.1', 'O15', 'O16')`;
    const [preeklamsiaResult] = await pool.query(preeklamsiaQuery, params);

    // Get Hepatitis statistics
    const hepatitisQuery = kelurahan
      ? `SELECT 
          COUNT(DISTINCT k.id) as total_screened,
          COUNT(DISTINCT CASE 
            WHEN ac.skrining_hbsag = 'Reaktif' THEN k.id 
          END) as hepatitis_b_positive,
          ROUND((COUNT(DISTINCT CASE 
            WHEN ac.skrining_hbsag = 'Reaktif' THEN k.id 
          END) * 100.0 / COUNT(DISTINCT k.id)), 1) as hepatitis_percentage
        FROM kehamilan k
        JOIN ibu i ON k.forkey_ibu = i.id
        LEFT JOIN antenatal_care ac ON k.id = ac.forkey_hamil
        WHERE k.status_kehamilan = 'Hamil'
        AND ac.skrining_hbsag IS NOT NULL
        AND i.kelurahan = ?`
      : `SELECT 
          COUNT(DISTINCT k.id) as total_screened,
          COUNT(DISTINCT CASE 
            WHEN ac.skrining_hbsag = 'Reaktif' THEN k.id 
          END) as hepatitis_b_positive,
          ROUND((COUNT(DISTINCT CASE 
            WHEN ac.skrining_hbsag = 'Reaktif' THEN k.id 
          END) * 100.0 / COUNT(DISTINCT k.id)), 1) as hepatitis_percentage
        FROM kehamilan k
        LEFT JOIN antenatal_care ac ON k.id = ac.forkey_hamil
        WHERE k.status_kehamilan = 'Hamil'
        AND ac.skrining_hbsag IS NOT NULL`;
    const [hepatitisResult] = await pool.query(hepatitisQuery, params);

    res.json({
      totalIbu,
      totalHamil,
      totalANC,
      totalKomplikasi,
      ancByType: ancByTypeResult,
      complicationsBySeverity: complicationsBySeverityResult,
      ibuByKelurahan: ibuByKelurahanResult,
      feStatistics: feResult[0],
      riskDistribution: riskResult,
      ttImmunization: ttResult,
      hbStatistics: hbResult[0],
      obesityStatistics: obesityResult[0],
      preeklamsiaStatistics: preeklamsiaResult[0],
      hepatitisStatistics: hepatitisResult[0],
      kelurahanList: kelurahanList.map(k => k.kelurahan),
      selectedKelurahan: kelurahan || null
    });
  } catch (error) {
    console.error('Error fetching summary data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
