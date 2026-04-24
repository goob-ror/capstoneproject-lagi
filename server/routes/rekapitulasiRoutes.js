const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const authMiddleware = require('../middleware/auth');

// Get summary/report data
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { kelurahan, year, month } = req.query;
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

    // Helper for nifas date filter
    const dateFilterNifas = [];
    const dateParamsNifas = [];
    if (year) {
      dateFilterNifas.push('YEAR(nf.tanggal_kunjungan) = ?');
      dateParamsNifas.push(year);
    }
    if (month) {
      dateFilterNifas.push('MONTH(nf.tanggal_kunjungan) = ?');
      dateParamsNifas.push(month);
    }
    const dateWhereNifas = dateFilterNifas.length > 0 ? 'AND ' + dateFilterNifas.join(' AND ') : '';

    // Helper for komplikasi date filter (kept for preeklamsia statistics)
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

    // 1. Get total ibu who had at least one ANC visit in the selected period
    const totalIbuQuery = `
      SELECT COUNT(DISTINCT i.id) as count
      FROM ibu i
      INNER JOIN kehamilan k ON k.forkey_ibu = i.id
      INNER JOIN antenatal_care ac ON ac.forkey_hamil = k.id
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      WHERE 1=1 ${kelurahanFilter} ${dateWhereANC}`;
    const [totalIbuResult] = await pool.query(totalIbuQuery, [...kelurahanParams, ...dateParamsANC]);
    const totalIbu = totalIbuResult[0].count;

    // 2. Get total distinct pregnancies with at least one ANC visit in the selected period
    const totalHamilQuery = `
      SELECT COUNT(DISTINCT k.id) as count
      FROM kehamilan k
      INNER JOIN ibu i ON k.forkey_ibu = i.id
      INNER JOIN antenatal_care ac ON ac.forkey_hamil = k.id
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      WHERE 1=1 ${kelurahanFilter} ${dateWhereANC}`;
    const [totalHamilResult] = await pool.query(totalHamilQuery, [...kelurahanParams, ...dateParamsANC]);
    const totalHamil = totalHamilResult[0].count;

    // 3. Get total ANC visits
    const totalANCQuery = `SELECT COUNT(*) as count FROM antenatal_care ac
           INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
           INNER JOIN ibu i ON k.forkey_ibu = i.id 
           LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
           WHERE 1=1 ${kelurahanFilter} ${dateWhereANC}`;
    const [totalANCResult] = await pool.query(totalANCQuery, [...kelurahanParams, ...dateParamsANC]);
    const totalANC = totalANCResult[0].count;

    // 4. Get total nifas visits (moved up from 4.5)
    const totalNifasQuery = `SELECT COUNT(*) as count FROM kunjungan_nifas nf
           INNER JOIN kehamilan k ON nf.forkey_hamil = k.id
           INNER JOIN ibu i ON k.forkey_ibu = i.id 
           LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
           WHERE 1=1 ${kelurahanFilter} ${dateWhereNifas}`;
    const [totalNifasResult] = await pool.query(totalNifasQuery, [...kelurahanParams, ...dateParamsNifas]);
    const totalNifas = totalNifasResult[0].count;

    // 5. Get ANC by type
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

    // 6. Get nifas by type
    const nifasByTypeQuery = `
      SELECT 
        nf.jenis_kunjungan,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM kunjungan_nifas nf2
          INNER JOIN kehamilan k2 ON nf2.forkey_hamil = k2.id
          INNER JOIN ibu i2 ON k2.forkey_ibu = i2.id
          LEFT JOIN kelurahan kel2 ON i2.kelurahan_id = kel2.id
          WHERE 1=1 ${kelurahanFilter} ${dateWhereNifas}), 1) as percentage
      FROM kunjungan_nifas nf
      INNER JOIN kehamilan k ON nf.forkey_hamil = k.id
      INNER JOIN ibu i ON k.forkey_ibu = i.id
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      WHERE 1=1 ${kelurahanFilter} ${dateWhereNifas}
      GROUP BY nf.jenis_kunjungan
      ORDER BY FIELD(nf.jenis_kunjungan, 'KF1', 'KF2', 'KF3', 'KF4')`;
    const [nifasByType] = await pool.query(nifasByTypeQuery, [...kelurahanParams, ...dateParamsNifas, ...kelurahanParams, ...dateParamsNifas]);

    // 7. Get risk distribution
    const riskQuery = `
      SELECT 
        ac.status_risiko_visit,
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
      GROUP BY ac.status_risiko_visit`;
    const [riskDistribution] = await pool.query(riskQuery, [...kelurahanParams, ...dateParamsANC, ...kelurahanParams, ...dateParamsANC]);

    // 8. Get TT Immunization status
    const ttQuery = `
      SELECT
        ac.status_imunisasi_tt,
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
      GROUP BY ac.status_imunisasi_tt
      ORDER BY ac.status_imunisasi_tt`;
    const [ttImmunization] = await pool.query(ttQuery, [...kelurahanParams, ...dateParamsANC, ...kelurahanParams, ...dateParamsANC]);

    // // 9. Get Fe statistics
    // const feQuery = `
    //   SELECT
    //     SUM(ac.beri_tablet_fe) as total_fe_given,
    //     COUNT(*) as total_visits,
    //     ROUND(SUM(ac.beri_tablet_fe) * 100.0 / COUNT(*), 1) as percentage_fe
    //   FROM antenatal_care ac
    //   INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
    //   INNER JOIN ibu i ON k.forkey_ibu = i.id
    //   LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
    //   WHERE 1=1 ${kelurahanFilter} ${dateWhereANC}`;
    // const [feStats] = await pool.query(feQuery, [...kelurahanParams, ...dateParamsANC]);
    // const feStatistics = {
    //   total_fe_given: feStats[0].total_fe_given || 0,
    //   total_visits: feStats[0].total_visits || 0,
    //   percentage_fe: feStats[0].percentage_fe || 0
    // };

    // Alt 9. Get KEK statistics (LILA < 23.5 cm indicates KEK)
    const kekQuery = `
      SELECT
        COUNT(*) as total_visits,
        SUM(CASE WHEN ac.lila < 23.5 THEN 1 ELSE 0 END) as total_kek_given,
        ROUND(SUM(CASE WHEN ac.lila < 23.5 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as percentage_kek
      FROM antenatal_care ac
      INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
      INNER JOIN ibu i ON k.forkey_ibu = i.id
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      WHERE ac.lila IS NOT NULL ${kelurahanFilter} ${dateWhereANC}`;
    const [kekstats] = await pool.query(kekQuery, [...kelurahanParams, ...dateParamsANC]);
    const kekStatistics = {
      total_kek_given: kekstats[0].total_kek_given || 0,
      total_visits: kekstats[0].total_visits || 0,
      percentage_kek: kekstats[0].percentage_kek || 0
    };

    // 10. Get HB Statistics (uses lab_screening joined through ANC visit date)
    // Hb thresholds for pregnancy (WHO):
    //   Normal:        >= 11.0 g/dL
    //   Anemia Ringan: 10.0 – 10.9
    //   Anemia Sedang:  8.0 –  9.9
    //   Anemia Berat:  <  8.0
    const hbQuery = `
      SELECT
        ROUND(AVG(ls.hasil_lab_hb), 2) as avg_hb,
        COUNT(*) as total_checked,
        -- Trimester 1 (0-13 weeks)
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 THEN 1 ELSE 0 END) as trimester1_total,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 AND ls.hasil_lab_hb >= 11.0 THEN 1 ELSE 0 END) as trimester1_normal,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 AND ls.hasil_lab_hb >= 10.0 AND ls.hasil_lab_hb < 11.0 THEN 1 ELSE 0 END) as trimester1_ringan,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 AND ls.hasil_lab_hb >= 8.0 AND ls.hasil_lab_hb < 10.0 THEN 1 ELSE 0 END) as trimester1_sedang,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 AND ls.hasil_lab_hb < 8.0 THEN 1 ELSE 0 END) as trimester1_berat,
        -- Trimester 2 (14-27 weeks)
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 THEN 1 ELSE 0 END) as trimester2_total,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 AND ls.hasil_lab_hb >= 11.0 THEN 1 ELSE 0 END) as trimester2_normal,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 AND ls.hasil_lab_hb >= 10.0 AND ls.hasil_lab_hb < 11.0 THEN 1 ELSE 0 END) as trimester2_ringan,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 AND ls.hasil_lab_hb >= 8.0 AND ls.hasil_lab_hb < 10.0 THEN 1 ELSE 0 END) as trimester2_sedang,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 AND ls.hasil_lab_hb < 8.0 THEN 1 ELSE 0 END) as trimester2_berat,
        -- Trimester 3 (28+ weeks)
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 THEN 1 ELSE 0 END) as trimester3_total,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 AND ls.hasil_lab_hb >= 11.0 THEN 1 ELSE 0 END) as trimester3_normal,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 AND ls.hasil_lab_hb >= 10.0 AND ls.hasil_lab_hb < 11.0 THEN 1 ELSE 0 END) as trimester3_ringan,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 AND ls.hasil_lab_hb >= 8.0 AND ls.hasil_lab_hb < 10.0 THEN 1 ELSE 0 END) as trimester3_sedang,
        SUM(CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 AND ls.hasil_lab_hb < 8.0 THEN 1 ELSE 0 END) as trimester3_berat
      FROM antenatal_care ac
      INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
      INNER JOIN ibu i ON k.forkey_ibu = i.id
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      LEFT JOIN lab_screening ls ON ac.forkey_lab_screening = ls.id
      WHERE ls.hasil_lab_hb IS NOT NULL ${kelurahanFilter} ${dateWhereANC}`;
    const [hbStats] = await pool.query(hbQuery, [...kelurahanParams, ...dateParamsANC]);
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

    // 12. Get Preeklamsia Statistics - from komplikasi table
    const preeklamsiaQuery = `
      SELECT
        SUM(CASE WHEN ko.nama_komplikasi LIKE '%Eklamsia%' AND ko.nama_komplikasi NOT LIKE '%Pre%' THEN 1 ELSE 0 END) as eklamsia_count,
        SUM(CASE WHEN ko.nama_komplikasi LIKE '%Preeklamsia%' OR ko.nama_komplikasi LIKE '%preeklamsia%' THEN 1 ELSE 0 END) as preeklamsia_count,
        SUM(CASE WHEN ko.nama_komplikasi LIKE '%Hipertensi Gestasional%' THEN 1 ELSE 0 END) as hipertensi_gestasional_count
      FROM komplikasi ko
      INNER JOIN kehamilan k ON ko.forkey_hamil = k.id
      INNER JOIN ibu i ON k.forkey_ibu = i.id
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      WHERE 1=1 ${kelurahanFilter} ${dateWhereKomp}`;
    const [preeklamsiaStats] = await pool.query(preeklamsiaQuery, [...kelurahanParams, ...dateParamsKomp]);
    const preeklamsiaStatistics = { 
      eklamsia_count: preeklamsiaStats[0].eklamsia_count || 0,
      preeklamsia_count: preeklamsiaStats[0].preeklamsia_count || 0,
      hipertensi_gestasional_count: preeklamsiaStats[0].hipertensi_gestasional_count || 0,
      total_preeklamsia: (preeklamsiaStats[0].eklamsia_count || 0) + (preeklamsiaStats[0].preeklamsia_count || 0)
    };

    // 13a. Get HIV Statistics - joined through ANC visit date
    const hivQuery = `
      SELECT
        COUNT(*) as total_screened,
        SUM(CASE WHEN ls.skrining_hiv = 'Reaktif' THEN 1 ELSE 0 END) as hiv_positive,
        ROUND(SUM(CASE WHEN ls.skrining_hiv = 'Reaktif' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as hiv_percentage
      FROM lab_screening ls
      INNER JOIN antenatal_care ac ON ac.forkey_lab_screening = ls.id
      INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
      INNER JOIN ibu i ON k.forkey_ibu = i.id
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      WHERE ls.skrining_hiv IS NOT NULL ${kelurahanFilter} ${dateWhereANC}`;
    const [hivStats] = await pool.query(hivQuery, [...kelurahanParams, ...dateParamsANC]);
    const hivStatistics = hivStats[0] || { total_screened: 0, hiv_positive: 0, hiv_percentage: 0 };

    // 13b. Get Hepatitis B Statistics - joined through ANC visit date
    const hepatitisQuery = `
      SELECT
        COUNT(*) as total_screened,
        SUM(CASE WHEN ls.skrining_hbsag = 'Reaktif' THEN 1 ELSE 0 END) as hepatitis_b_positive,
        ROUND(SUM(CASE WHEN ls.skrining_hbsag = 'Reaktif' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as hepatitis_percentage
      FROM lab_screening ls
      INNER JOIN antenatal_care ac ON ac.forkey_lab_screening = ls.id
      INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
      INNER JOIN ibu i ON k.forkey_ibu = i.id
      LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
      WHERE ls.skrining_hbsag IS NOT NULL ${kelurahanFilter} ${dateWhereANC}`;
    const [hepatitisStats] = await pool.query(hepatitisQuery, [...kelurahanParams, ...dateParamsANC]);
    const hepatitisStatistics = hepatitisStats[0] || { total_screened: 0, hepatitis_b_positive: 0, hepatitis_percentage: 0 };

    // 14. Get K1 ANC coverage per Kelurahan
    // Counts pregnancies that had a K1 visit within the selected period per kelurahan.
    // total_hamil = all pregnancies with at least one ANC visit in the period (or all active if no date filter)
    const k1DateFilter = [];
    const k1DateParams = [];
    if (year) {
      k1DateFilter.push('YEAR(ac.tanggal_kunjungan) = ?');
      k1DateParams.push(year);
    }
    if (month) {
      k1DateFilter.push('MONTH(ac.tanggal_kunjungan) = ?');
      k1DateParams.push(month);
    }
    const k1DateWhere = k1DateFilter.length > 0 ? 'AND ' + k1DateFilter.join(' AND ') : '';

    const ibuByKelurahanQuery = `
      SELECT
        kel.nama_kelurahan AS kelurahan,
        COUNT(DISTINCT k.id) AS total_hamil,
        COUNT(DISTINCT CASE WHEN ac.jenis_kunjungan = 'K1' THEN k.id END) AS k1_count,
        ROUND(
          COUNT(DISTINCT CASE WHEN ac.jenis_kunjungan = 'K1' THEN k.id END) * 100.0
          / NULLIF(COUNT(DISTINCT k.id), 0),
          1
        ) AS k1_percentage
      FROM kelurahan kel
      LEFT JOIN ibu i ON i.kelurahan_id = kel.id
      LEFT JOIN kehamilan k ON k.forkey_ibu = i.id
        AND k.status_kehamilan IN ('Hamil', 'Bersalin', 'Nifas', 'Selesai')
      LEFT JOIN antenatal_care ac ON ac.forkey_hamil = k.id ${k1DateWhere}
      GROUP BY kel.id, kel.nama_kelurahan
      ORDER BY kel.nama_kelurahan`;
    const [ibuByKelurahan] = await pool.query(ibuByKelurahanQuery, k1DateParams);

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
      totalNifas,
      ancByType,
      nifasByType,
      ibuByKelurahan,
      kekStatistics,
      riskDistribution,
      ttImmunization,
      hbStatistics,
      obesityStatistics,
      preeklamsiaStatistics,
      hivStatistics,
      hepatitisStatistics,
      kelurahanList: kelurahanList.map(k => k.kelurahan),
      selectedKelurahan: kelurahan || null
    });
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
