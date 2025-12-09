const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const authMiddleware = require('../middleware/auth');

// Get summary/report data
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { kelurahan, year, month } = req.query;
    
    // Build WHERE clause for filters
    const buildWhereClause = (includeIbu = true, includeANC = false, includeKomplikasi = false) => {
      const conditions = [];
      const params = [];
      
      if (kelurahan && includeIbu) {
        conditions.push('i.kelurahan = ?');
        params.push(kelurahan);
      }
      
      if (year && includeANC) {
        conditions.push('YEAR(ac.tanggal_kunjungan) = ?');
        params.push(year);
      }
      
      if (month && includeANC) {
        conditions.push('MONTH(ac.tanggal_kunjungan) = ?');
        params.push(month);
      }
      
      if (year && includeKomplikasi) {
        conditions.push('YEAR(ko.tanggal_diagnosis) = ?');
        params.push(year);
      }
      
      if (month && includeKomplikasi) {
        conditions.push('MONTH(ko.tanggal_diagnosis) = ?');
        params.push(month);
      }
      
      return {
        clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
        params
      };
    };
    
    const params = kelurahan ? [kelurahan] : [];

    // Get total ibu (filtered by kelurahan only, not by date)
    const totalIbuQuery = kelurahan 
      ? 'SELECT COUNT(*) as count FROM ibu WHERE kelurahan = ?'
      : 'SELECT COUNT(*) as count FROM ibu';
    const [totalIbuResult] = await pool.query(totalIbuQuery, params);
    const totalIbu = totalIbuResult[0].count;

    // Get total ibu hamil (active pregnancies, filtered by kelurahan only)
    const totalHamilQuery = kelurahan
      ? `SELECT COUNT(*) as count FROM kehamilan k 
         INNER JOIN ibu i ON k.forkey_ibu = i.id 
         WHERE k.status_kehamilan = 'Hamil' AND i.kelurahan = ?`
      : "SELECT COUNT(*) as count FROM kehamilan WHERE status_kehamilan = 'Hamil'";
    const [totalHamilResult] = await pool.query(totalHamilQuery, params);
    const totalHamil = totalHamilResult[0].count;

    // Get total ANC visits
    const ancWhere = buildWhereClause(!!kelurahan, true, false);
    const totalANCQuery = `SELECT COUNT(*) as count FROM antenatal_care ac
         INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
         ${kelurahan ? 'INNER JOIN ibu i ON k.forkey_ibu = i.id' : ''}
         ${ancWhere.clause}`;
    const [totalANCResult] = await pool.query(totalANCQuery, ancWhere.params);
    const totalANC = totalANCResult[0].count;

    // Get total complications
    const kompWhere = buildWhereClause(!!kelurahan, false, true);
    const totalKomplikasiQuery = `SELECT COUNT(*) as count FROM komplikasi ko
         INNER JOIN kehamilan k ON ko.forkey_hamil = k.id
         ${kelurahan ? 'INNER JOIN ibu i ON k.forkey_ibu = i.id' : ''}
         ${kompWhere.clause}`;
    const [totalKomplikasiResult] = await pool.query(totalKomplikasiQuery, kompWhere.params);
    const totalKomplikasi = totalKomplikasiResult[0].count;

    // Get ANC visits by type
    const ancTypeWhere = buildWhereClause(!!kelurahan, true, false);
    // Build subquery WHERE clause with different aliases (i2, ac2)
    const ancTypeSubWhere = [];
    if (kelurahan) ancTypeSubWhere.push('i2.kelurahan = ?');
    if (year) ancTypeSubWhere.push('YEAR(ac2.tanggal_kunjungan) = ?');
    if (month) ancTypeSubWhere.push('MONTH(ac2.tanggal_kunjungan) = ?');
    const ancTypeSubWhereClause = ancTypeSubWhere.length > 0 ? `WHERE ${ancTypeSubWhere.join(' AND ')}` : '';
    
    const ancByTypeQuery = `SELECT 
          ac.jenis_kunjungan,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / (
            SELECT COUNT(*) FROM antenatal_care ac2
            INNER JOIN kehamilan k2 ON ac2.forkey_hamil = k2.id
            ${kelurahan ? 'INNER JOIN ibu i2 ON k2.forkey_ibu = i2.id' : ''}
            ${ancTypeSubWhereClause}
          )), 1) as percentage
        FROM antenatal_care ac
        INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
        ${kelurahan ? 'INNER JOIN ibu i ON k.forkey_ibu = i.id' : ''}
        ${ancTypeWhere.clause}
        GROUP BY ac.jenis_kunjungan 
        ORDER BY ac.jenis_kunjungan`;
    const [ancByTypeResult] = await pool.query(ancByTypeQuery, [...ancTypeWhere.params, ...ancTypeWhere.params]);

    // Get complications by severity
    const compSevWhere = buildWhereClause(!!kelurahan, false, true);
    const compSevWhereWithNull = compSevWhere.clause 
      ? `${compSevWhere.clause} AND ko.tingkat_keparahan IS NOT NULL`
      : 'WHERE ko.tingkat_keparahan IS NOT NULL';
    
    // Build subquery WHERE clause with different aliases (i2, ko2)
    const compSevSubWhere = [];
    if (kelurahan) compSevSubWhere.push('i2.kelurahan = ?');
    if (year) compSevSubWhere.push('YEAR(ko2.tanggal_diagnosis) = ?');
    if (month) compSevSubWhere.push('MONTH(ko2.tanggal_diagnosis) = ?');
    const compSevSubWhereClause = compSevSubWhere.length > 0 
      ? `WHERE ${compSevSubWhere.join(' AND ')} AND ko2.tingkat_keparahan IS NOT NULL`
      : 'WHERE ko2.tingkat_keparahan IS NOT NULL';
    
    const complicationsBySeverityQuery = `SELECT 
          ko.tingkat_keparahan,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / (
            SELECT COUNT(*) FROM komplikasi ko2
            INNER JOIN kehamilan k2 ON ko2.forkey_hamil = k2.id
            ${kelurahan ? 'INNER JOIN ibu i2 ON k2.forkey_ibu = i2.id' : ''}
            ${compSevSubWhereClause}
          )), 1) as percentage
        FROM komplikasi ko
        INNER JOIN kehamilan k ON ko.forkey_hamil = k.id
        ${kelurahan ? 'INNER JOIN ibu i ON k.forkey_ibu = i.id' : ''}
        ${compSevWhereWithNull}
        GROUP BY ko.tingkat_keparahan 
        ORDER BY 
          CASE ko.tingkat_keparahan 
            WHEN 'Ringan' THEN 1 
            WHEN 'Sedang' THEN 2 
            WHEN 'Berat' THEN 3 
          END`;
    const [complicationsBySeverityResult] = await pool.query(complicationsBySeverityQuery, [...compSevWhere.params, ...compSevWhere.params]);

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
    const feWhere = buildWhereClause(!!kelurahan, true, false);
    const feQuery = `SELECT 
          COUNT(CASE WHEN ac.beri_tablet_fe = 1 THEN 1 END) as total_fe_given,
          COUNT(*) as total_visits,
          ROUND((COUNT(CASE WHEN ac.beri_tablet_fe = 1 THEN 1 END) * 100.0 / COUNT(*)), 1) as percentage_fe
        FROM antenatal_care ac
        INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
        ${kelurahan ? 'INNER JOIN ibu i ON k.forkey_ibu = i.id' : ''}
        ${feWhere.clause}`;
    const [feResult] = await pool.query(feQuery, feWhere.params);

    // Get risk status distribution
    const riskWhere = buildWhereClause(!!kelurahan, true, false);
    // Build subquery WHERE clause with different aliases (i2, ac2)
    const riskSubWhere = [];
    if (kelurahan) riskSubWhere.push('i2.kelurahan = ?');
    if (year) riskSubWhere.push('YEAR(ac2.tanggal_kunjungan) = ?');
    if (month) riskSubWhere.push('MONTH(ac2.tanggal_kunjungan) = ?');
    const riskSubWhereClause = riskSubWhere.length > 0 ? `WHERE ${riskSubWhere.join(' AND ')}` : '';
    
    const riskQuery = `SELECT 
          ac.status_risiko_visit,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / (
            SELECT COUNT(*) FROM antenatal_care ac2
            INNER JOIN kehamilan k2 ON ac2.forkey_hamil = k2.id
            ${kelurahan ? 'INNER JOIN ibu i2 ON k2.forkey_ibu = i2.id' : ''}
            ${riskSubWhereClause}
          )), 1) as percentage
        FROM antenatal_care ac
        INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
        ${kelurahan ? 'INNER JOIN ibu i ON k.forkey_ibu = i.id' : ''}
        ${riskWhere.clause}
        GROUP BY ac.status_risiko_visit`;
    const [riskResult] = await pool.query(riskQuery, [...riskWhere.params, ...riskWhere.params]);

    // Get immunization TT statistics
    const ttWhere = buildWhereClause(!!kelurahan, true, false);
    const ttWhereWithNull = ttWhere.clause 
      ? `${ttWhere.clause} AND ac.status_imunisasi_tt IS NOT NULL`
      : 'WHERE ac.status_imunisasi_tt IS NOT NULL';
    
    // Build subquery WHERE clause with different aliases (i2, ac2)
    const ttSubWhere = [];
    if (kelurahan) ttSubWhere.push('i2.kelurahan = ?');
    if (year) ttSubWhere.push('YEAR(ac2.tanggal_kunjungan) = ?');
    if (month) ttSubWhere.push('MONTH(ac2.tanggal_kunjungan) = ?');
    const ttSubWhereClause = ttSubWhere.length > 0 
      ? `WHERE ${ttSubWhere.join(' AND ')} AND ac2.status_imunisasi_tt IS NOT NULL`
      : 'WHERE ac2.status_imunisasi_tt IS NOT NULL';
    
    const ttQuery = `SELECT 
          ac.status_imunisasi_tt,
          COUNT(*) as count,
          ROUND((COUNT(*) * 100.0 / (
            SELECT COUNT(*) FROM antenatal_care ac2
            INNER JOIN kehamilan k2 ON ac2.forkey_hamil = k2.id
            ${kelurahan ? 'INNER JOIN ibu i2 ON k2.forkey_ibu = i2.id' : ''}
            ${ttSubWhereClause}
          )), 1) as percentage
        FROM antenatal_care ac
        INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
        ${kelurahan ? 'INNER JOIN ibu i ON k.forkey_ibu = i.id' : ''}
        ${ttWhereWithNull}
        GROUP BY ac.status_imunisasi_tt
        ORDER BY ac.status_imunisasi_tt`;
    const [ttResult] = await pool.query(ttQuery, [...ttWhere.params, ...ttWhere.params]);

    // Get average Hemoglobin (Hb) level
    const hbWhere = buildWhereClause(!!kelurahan, true, false);
    const hbWhereWithNull = hbWhere.clause 
      ? `${hbWhere.clause} AND ac.hasil_lab_hb IS NOT NULL`
      : 'WHERE ac.hasil_lab_hb IS NOT NULL';
    
    const hbQuery = `SELECT 
          ROUND(AVG(ac.hasil_lab_hb), 2) as avg_hb,
          ROUND(MIN(ac.hasil_lab_hb), 2) as min_hb,
          ROUND(MAX(ac.hasil_lab_hb), 2) as max_hb,
          COUNT(CASE WHEN ac.hasil_lab_hb < 11 THEN 1 END) as anemia_count,
          ROUND((COUNT(CASE WHEN ac.hasil_lab_hb < 11 THEN 1 END) * 100.0 / COUNT(*)), 1) as anemia_percentage
        FROM antenatal_care ac
        INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
        ${kelurahan ? 'INNER JOIN ibu i ON k.forkey_ibu = i.id' : ''}
        ${hbWhereWithNull}`;
    const [hbResult] = await pool.query(hbQuery, hbWhere.params);

    // Get list of all kelurahan for filter dropdown
    const [kelurahanList] = await pool.query(`
      SELECT DISTINCT kelurahan 
      FROM ibu 
      WHERE kelurahan IS NOT NULL 
      ORDER BY kelurahan
    `);

    // Get Obesity statistics (BMI >= 30)
    const obesityWhere = buildWhereClause(!!kelurahan, true, false);
    const baseConditions = `k.status_kehamilan = 'Hamil' AND i.tinggi_badan IS NOT NULL AND ac.berat_badan IS NOT NULL`;
    const obesityWhereWithConditions = obesityWhere.clause 
      ? `${obesityWhere.clause} AND ${baseConditions}`
      : `WHERE ${baseConditions}`;
    
    const obesityQuery = `SELECT 
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
        ${obesityWhereWithConditions}`;
    const [obesityResult] = await pool.query(obesityQuery, obesityWhere.params);

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
    const hepatitisWhere = buildWhereClause(!!kelurahan, true, false);
    const hepatitisBaseConditions = `k.status_kehamilan = 'Hamil' AND ac.skrining_hbsag IS NOT NULL`;
    const hepatitisWhereWithConditions = hepatitisWhere.clause 
      ? `${hepatitisWhere.clause} AND ${hepatitisBaseConditions}`
      : `WHERE ${hepatitisBaseConditions}`;
    
    const hepatitisQuery = `SELECT 
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
        ${hepatitisWhereWithConditions}`;
    const [hepatitisResult] = await pool.query(hepatitisQuery, hepatitisWhere.params);

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
