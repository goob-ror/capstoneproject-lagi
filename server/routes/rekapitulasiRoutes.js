const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const authMiddleware = require('../middleware/auth');

// Get summary/report data
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { kelurahan, year, month } = req.query;
    console.log('Rekapitulasi request:', { kelurahan, year, month });
    console.log('Starting rekapitulasi queries...');

    // Disable ONLY_FULL_GROUP_BY for this session to allow aggregate queries
    await pool.query("SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");

    // Helper to build params for kelurahan filter
    const kelurahanFilter = kelurahan ? 'AND kel.nama_kelurahan = ?' : '';
    const kelurahanParams = kelurahan ? [kelurahan] : [];

    // Helper to build params for date filter (ANC)
    const dateFilterANC = [];
    const dateParamsANC = [];
    if (year) {
      dateFilterANC.push('YEAR(ac.tanggal_kunjungan) = ?');
      dateParamsANC.push(year);
    }
    if (month) {
      dateFilterANC.push('MONTH(ac.tanggal_kunjungan) = ?');
      dateParamsANC.push(month);
    }
    const dateWhereANC = dateFilterANC.length > 0 ? 'AND ' + dateFilterANC.join(' AND ') : '';

    // Helper for komplikasi date filter
    const dateFilterKomp = [];
    const dateParamsKomp = [];
    if (year) {
      dateFilterKomp.push('YEAR(ko.tanggal_diagnosis) = ?');
      dateParamsKomp.push(year);
    }
    if (month) {
      dateFilterKomp.push('MONTH(ko.tanggal_diagnosis) = ?');
      dateParamsKomp.push(month);
    }
    const dateWhereKomp = dateFilterKomp.length > 0 ? 'AND ' + dateFilterKomp.join(' AND ') : '';

    // 1. Get total ibu (filtered by kelurahan only)
    const totalIbuQuery = `SELECT COUNT(*) as count FROM ibu i 
         LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id 
         WHERE 1=1 ${kelurahanFilter}`;
    const [totalIbuResult] = await pool.query(totalIbuQuery, kelurahanParams);
    const totalIbu = totalIbuResult[0].count;

    // 2. Get total ibu hamil (active pregnancies, filtered by kelurahan only)
    const totalHamilQuery = `SELECT COUNT(*) as count FROM kehamilan k 
         INNER JOIN ibu i ON k.forkey_ibu = i.id 
         LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
         WHERE k.status_kehamilan = 'Hamil' ${kelurahanFilter}`;
    const [totalHamilResult] = await pool.query(totalHamilQuery, kelurahanParams);
    const totalHamil = totalHamilResult[0].count;

    // 3. Get total ANC visits
    const totalANCQuery = `SELECT COUNT(*) as count FROM antenatal_care ac
           INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
           INNER JOIN ibu i ON k.forkey_ibu = i.id 
           LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
           WHERE 1=1 ${kelurahanFilter} ${dateWhereANC}`;
    const [totalANCResult] = await pool.query(totalANCQuery, [...kelurahanParams, ...dateParamsANC]);
    const totalANC = totalANCResult[0].count;

    // 4. Get total complications
    const totalKomplikasiQuery = `SELECT COUNT(*) as count FROM komplikasi ko
           INNER JOIN kehamilan k ON ko.forkey_hamil = k.id
           INNER JOIN ibu i ON k.forkey_ibu = i.id 
           LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
           WHERE 1=1 ${kelurahanFilter} ${dateWhereKomp}`;
    const [totalKomplikasiResult] = await pool.query(totalKomplikasiQuery, [...kelurahanParams, ...dateParamsKomp]);
    const totalKomplikasi = totalKomplikasiResult[0].count;

    // 5. Get ANC by type
    console.log('Query 5: ANC by type');
    const ancByTypeQuery = `
      SELECT 
        ac.jenis_kunjungan,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM antenatal_care ac2
          INNER JOIN kehamilan k2 ON ac2.forkey_hamil = k2.id
          INNER JOIN ibu i2 ON k2.forkey_ibu = i2.id
          LEFT JOIN kelurahan kel2 ON i2.kelurahan_id = kel2.id
          WHERE 1=1 ${kelurahanFilter} ${dateWhereANC}), 1) as percentage
      FROM antenatal_care ac
      INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
      INNER JOIN ibu i ON k.forkey_ibu = i.id
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      WHERE 1=1 ${kelurahanFilter} ${dateWhereANC}
      GROUP BY ac.jenis_kunjungan
      ORDER BY ac.jenis_kunjungan`;
    const [ancByType] = await pool.query(ancByTypeQuery, [...kelurahanParams, ...dateParamsANC, ...kelurahanParams, ...dateParamsANC]);

    // 6. Get complications by severity
    console.log('Query 6: Complications by severity');
    const compBySeverityQuery = `
      SELECT 
        ko.tingkat_keparahan,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM komplikasi ko2
          INNER JOIN kehamilan k2 ON ko2.forkey_hamil = k2.id
          INNER JOIN ibu i2 ON k2.forkey_ibu = i2.id
          LEFT JOIN kelurahan kel2 ON i2.kelurahan_id = kel2.id
          WHERE 1=1 ${kelurahanFilter} ${dateWhereKomp}), 1) as percentage
      FROM komplikasi ko
      INNER JOIN kehamilan k ON ko.forkey_hamil = k.id
      INNER JOIN ibu i ON k.forkey_ibu = i.id
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      WHERE 1=1 ${kelurahanFilter} ${dateWhereKomp}
      GROUP BY ko.tingkat_keparahan
      ORDER BY FIELD(ko.tingkat_keparahan, 'Ringan', 'Sedang', 'Berat')`;
    const [complicationsBySeverity] = await pool.query(compBySeverityQuery, [...kelurahanParams, ...dateParamsKomp, ...kelurahanParams, ...dateParamsKomp]);

    // 7. Get risk distribution (uses yearly data, ignores month filter)
    console.log('Query 7: Risk distribution');
    const yearFilterOnly = year ? 'AND YEAR(ac.tanggal_kunjungan) = ?' : '';
    const yearParamsOnly = year ? [year] : [];
    const riskQuery = `
      SELECT 
        ac.status_risiko_visit,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM antenatal_care ac2
          INNER JOIN kehamilan k2 ON ac2.forkey_hamil = k2.id
          INNER JOIN ibu i2 ON k2.forkey_ibu = i2.id
          LEFT JOIN kelurahan kel2 ON i2.kelurahan_id = kel2.id
          WHERE 1=1 ${kelurahanFilter} ${yearFilterOnly}), 1) as percentage
      FROM antenatal_care ac
      INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
      INNER JOIN ibu i ON k.forkey_ibu = i.id
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      WHERE 1=1 ${kelurahanFilter} ${yearFilterOnly}
      GROUP BY ac.status_risiko_visit`;
    const [riskDistribution] = await pool.query(riskQuery, [...kelurahanParams, ...yearParamsOnly, ...kelurahanParams, ...yearParamsOnly]);

    // 8. Get TT Immunization status (uses yearly data, ignores month filter)
    console.log('Query 8: TT Immunization');
    const ttQuery = `
      SELECT
        ac.status_imunisasi_tt,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM antenatal_care ac2
          INNER JOIN kehamilan k2 ON ac2.forkey_hamil = k2.id
          INNER JOIN ibu i2 ON k2.forkey_ibu = i2.id
          LEFT JOIN kelurahan kel2 ON i2.kelurahan_id = kel2.id
          WHERE 1=1 ${kelurahanFilter} ${yearFilterOnly}), 1) as percentage
      FROM antenatal_care ac
      INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
      INNER JOIN ibu i ON k.forkey_ibu = i.id
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      WHERE 1=1 ${kelurahanFilter} ${yearFilterOnly}
      GROUP BY ac.status_imunisasi_tt
      ORDER BY ac.status_imunisasi_tt`;
    const [ttImmunization] = await pool.query(ttQuery, [...kelurahanParams, ...yearParamsOnly, ...kelurahanParams, ...yearParamsOnly]);

    // 9. Get Fe statistics
    const feQuery = `
      SELECT
        SUM(ac.beri_tablet_fe) as total_fe_given,
        COUNT(*) as total_visits,
        ROUND(SUM(ac.beri_tablet_fe) * 100.0 / COUNT(*), 1) as percentage_fe
      FROM antenatal_care ac
      INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
      INNER JOIN ibu i ON k.forkey_ibu = i.id
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      WHERE 1=1 ${kelurahanFilter} ${dateWhereANC}`;
    const [feStats] = await pool.query(feQuery, [...kelurahanParams, ...dateParamsANC]);
    const feStatistics = {
      total_fe_given: feStats[0].total_fe_given || 0,
      total_visits: feStats[0].total_visits || 0,
      percentage_fe: feStats[0].percentage_fe || 0
    };

    // 10. Get HB Statistics (yearly data, uses lab_screening table)
    const hbQuery = `
      SELECT
        ROUND(AVG(ls.hasil_lab_hb), 2) as avg_hb,
        COUNT(*) as total_checked,
        -- Trimester 1 (0-13 weeks)
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 THEN 1 ELSE 0 END) as trimester1_total,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 AND ls.hasil_lab_hb >= 11 THEN 1 ELSE 0 END) as trimester1_normal,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 AND ls.hasil_lab_hb >= 10 AND ls.hasil_lab_hb < 11 THEN 1 ELSE 0 END) as trimester1_ringan,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 AND ls.hasil_lab_hb >= 8 AND ls.hasil_lab_hb < 10 THEN 1 ELSE 0 END) as trimester1_sedang,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 AND ls.hasil_lab_hb < 8 THEN 1 ELSE 0 END) as trimester1_berat,
        -- Trimester 2 (14-27 weeks)
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 THEN 1 ELSE 0 END) as trimester2_total,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 AND ls.hasil_lab_hb >= 11 THEN 1 ELSE 0 END) as trimester2_normal,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 AND ls.hasil_lab_hb >= 10 AND ls.hasil_lab_hb < 11 THEN 1 ELSE 0 END) as trimester2_ringan,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 AND ls.hasil_lab_hb >= 8 AND ls.hasil_lab_hb < 10 THEN 1 ELSE 0 END) as trimester2_sedang,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 AND ls.hasil_lab_hb < 8 THEN 1 ELSE 0 END) as trimester2_berat,
        -- Trimester 3 (28+ weeks)
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 THEN 1 ELSE 0 END) as trimester3_total,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 AND ls.hasil_lab_hb >= 11 THEN 1 ELSE 0 END) as trimester3_normal,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 AND ls.hasil_lab_hb >= 10 AND ls.hasil_lab_hb < 11 THEN 1 ELSE 0 END) as trimester3_ringan,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 AND ls.hasil_lab_hb >= 8 AND ls.hasil_lab_hb < 10 THEN 1 ELSE 0 END) as trimester3_sedang,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 AND ls.hasil_lab_hb < 8 THEN 1 ELSE 0 END) as trimester3_berat
      FROM antenatal_care ac
      INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
      INNER JOIN ibu i ON k.forkey_ibu = i.id
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      LEFT JOIN lab_screening ls ON ac.forkey_lab_screening = ls.id
      WHERE ls.hasil_lab_hb IS NOT NULL ${kelurahanFilter} ${yearFilterOnly}`;
    const [hbStats] = await pool.query(hbQuery, [...kelurahanParams, ...yearParamsOnly]);
    const hbStatistics = hbStats[0] || { avg_hb: 0, total_checked: 0 };

    // 11. Get Obesity Statistics (uses yearly data, requires initial weight from kehamilan)
    const obesityQuery = `
      SELECT
        COUNT(*) as total_checked,
        SUM(CASE WHEN (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 30 THEN 1 ELSE 0 END) as obese_count,
        ROUND(SUM(CASE WHEN (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 30 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as obese_percentage
      FROM ibu i
      INNER JOIN kehamilan k ON k.forkey_ibu = i.id
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      WHERE k.status_kehamilan = 'Hamil' 
        AND i.beratbadan IS NOT NULL 
        AND i.tinggi_badan IS NOT NULL
        ${kelurahanFilter}`;
    const [obesityStats] = await pool.query(obesityQuery, kelurahanParams);
    const obesityStatistics = obesityStats[0] || { total_checked: 0, obese_count: 0, obese_percentage: 0 };

    // 12. Get Preeklamsia Statistics (yearly data) - from komplikasi table
    const preeklamsiaQuery = `
      SELECT
        SUM(CASE WHEN ko.nama_komplikasi LIKE '%eklamsia%' THEN 1 ELSE 0 END) as total_preeklamsia,
        SUM(CASE WHEN ko.nama_komplikasi LIKE '%Eklamsia%' AND ko.nama_komplikasi NOT LIKE '%Preeklamsia%' THEN 1 ELSE 0 END) as eklamsia_count,
        SUM(CASE WHEN ko.nama_komplikasi LIKE '%Preeklamsia%' THEN 1 ELSE 0 END) as preeklamsia_count,
        SUM(CASE WHEN ko.nama_komplikasi LIKE '%Hipertensi Gestasional%' THEN 1 ELSE 0 END) as hipertensi_gestasional_count
      FROM komplikasi ko
      INNER JOIN kehamilan k ON ko.forkey_hamil = k.id
      INNER JOIN ibu i ON k.forkey_ibu = i.id
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      WHERE 1=1 ${kelurahanFilter} ${year ? 'AND YEAR(ko.tanggal_diagnosis) = ?' : ''}`;
    const [preeklamsiaStats] = await pool.query(preeklamsiaQuery, [...kelurahanParams, ...(year ? [year] : [])]);
    const preeklamsiaStatistics = preeklamsiaStats[0] || { total_preeklamsia: 0, eklamsia_count: 0, preeklamsia_count: 0, hipertensi_gestasional_count: 0 };

    // 13. Get Hepatitis B Statistics (yearly data) - from lab_screening table
    const hepatitisQuery = `
      SELECT
        COUNT(*) as total_screened,
        SUM(CASE WHEN ls.skrining_hbsag = 'Reaktif' THEN 1 ELSE 0 END) as hepatitis_b_positive,
        ROUND(SUM(CASE WHEN ls.skrining_hbsag = 'Reaktif' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as hepatitis_percentage
      FROM lab_screening ls
      INNER JOIN kehamilan k ON ls.forkey_hamil = k.id
      INNER JOIN ibu i ON k.forkey_ibu = i.id
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      WHERE ls.skrining_hbsag IS NOT NULL ${kelurahanFilter} ${year ? 'AND YEAR(ls.created_at) = ?' : ''}`;
    const [hepatitisStats] = await pool.query(hepatitisQuery, [...kelurahanParams, ...(year ? [year] : [])]);
    const hepatitisStatistics = hepatitisStats[0] || { total_screened: 0, hepatitis_b_positive: 0, hepatitis_percentage: 0 };

    // 14. Get Ibu by Kelurahan (ignores kelurahan filter, always shows all)
    const ibuByKelurahanQuery = `
      SELECT
        kel.nama_kelurahan as kelurahan,
        COUNT(DISTINCT i.id) as total,
        COUNT(DISTINCT CASE WHEN k.status_kehamilan = 'Hamil' THEN i.id END) as hamil,
        ROUND(COUNT(DISTINCT CASE WHEN k.status_kehamilan = 'Hamil' THEN i.id END) * 100.0 / COUNT(DISTINCT i.id), 1) as percentage
      FROM kelurahan kel
      LEFT JOIN ibu i ON i.kelurahan_id = kel.id
      LEFT JOIN kehamilan k ON k.forkey_ibu = i.id
      GROUP BY kel.id, kel.nama_kelurahan
      ORDER BY kel.nama_kelurahan`;
    const [ibuByKelurahan] = await pool.query(ibuByKelurahanQuery);

    // 15. Get list of all kelurahan for filter dropdown
    const [kelurahanList] = await pool.query(`
      SELECT DISTINCT kel.nama_kelurahan as kelurahan
      FROM kelurahan kel
      ORDER BY kel.nama_kelurahan
    `);

    // Return comprehensive data
    res.json({
      totalIbu,
      totalHamil,
      totalANC,
      totalKomplikasi,
      ancByType,
      complicationsBySeverity,
      ibuByKelurahan,
      feStatistics,
      riskDistribution,
      ttImmunization,
      hbStatistics,
      obesityStatistics,
      preeklamsiaStatistics,
      hepatitisStatistics,
      kelurahanList: kelurahanList.map(k => k.kelurahan),
      selectedKelurahan: kelurahan || null
    });
  } catch (error) {
    console.error('Error fetching summary data:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
