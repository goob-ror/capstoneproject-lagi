const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const authMiddleware = require('../middleware/auth');

// Get summary/report data
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { kelurahan, year, month } = req.query;
    console.log('Rekapitulasi request:', { kelurahan, year, month });
    
    // Build WHERE clause for filters
    const buildWhereClause = (includeIbu = true, includeANC = false, includeKomplikasi = false) => {
      const conditions = [];
      const params = [];
      
      if (kelurahan && includeIbu) {
        conditions.push('kel.nama_kelurahan = ?');
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
      ? `SELECT COUNT(*) as count FROM ibu i 
         LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id 
         WHERE kel.nama_kelurahan = ?`
      : 'SELECT COUNT(*) as count FROM ibu';
    console.log('Total Ibu Query:', totalIbuQuery, params);
    const [totalIbuResult] = await pool.query(totalIbuQuery, params);
    const totalIbu = totalIbuResult[0].count;

    // Get total ibu hamil (active pregnancies, filtered by kelurahan only)
    const totalHamilQuery = kelurahan
      ? `SELECT COUNT(*) as count FROM kehamilan k 
         INNER JOIN ibu i ON k.forkey_ibu = i.id 
         LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
         WHERE k.status_kehamilan = 'Hamil' AND kel.nama_kelurahan = ?`
      : "SELECT COUNT(*) as count FROM kehamilan WHERE status_kehamilan = 'Hamil'";
    console.log('Total Hamil Query:', totalHamilQuery, params);
    const [totalHamilResult] = await pool.query(totalHamilQuery, params);
    const totalHamil = totalHamilResult[0].count;

    // Get total ANC visits - simplified
    let totalANC = 0;
    try {
      const ancWhere = buildWhereClause(!!kelurahan, true, false);
      const totalANCQuery = `SELECT COUNT(*) as count FROM antenatal_care ac
           INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
           ${kelurahan ? 'INNER JOIN ibu i ON k.forkey_ibu = i.id LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id' : ''}
           ${ancWhere.clause}`;
      console.log('Total ANC Query:', totalANCQuery, ancWhere.params);
      const [totalANCResult] = await pool.query(totalANCQuery, ancWhere.params);
      totalANC = totalANCResult[0].count;
    } catch (error) {
      console.error('Error in ANC query:', error);
      totalANC = 0;
    }

    // Get total complications - simplified
    let totalKomplikasi = 0;
    try {
      const kompWhere = buildWhereClause(!!kelurahan, false, true);
      const totalKomplikasiQuery = `SELECT COUNT(*) as count FROM komplikasi ko
           INNER JOIN kehamilan k ON ko.forkey_hamil = k.id
           ${kelurahan ? 'INNER JOIN ibu i ON k.forkey_ibu = i.id LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id' : ''}
           ${kompWhere.clause}`;
      console.log('Total Komplikasi Query:', totalKomplikasiQuery, kompWhere.params);
      const [totalKomplikasiResult] = await pool.query(totalKomplikasiQuery, kompWhere.params);
      totalKomplikasi = totalKomplikasiResult[0].count;
    } catch (error) {
      console.error('Error in Komplikasi query:', error);
      totalKomplikasi = 0;
    }

    // Get list of all kelurahan for filter dropdown
    const [kelurahanList] = await pool.query(`
      SELECT DISTINCT kel.nama_kelurahan as kelurahan
      FROM kelurahan kel
      ORDER BY kel.nama_kelurahan
    `);

    // Return basic data first, complex queries can be added later
    res.json({
      totalIbu,
      totalHamil,
      totalANC,
      totalKomplikasi,
      ancByType: [],
      complicationsBySeverity: [],
      ibuByKelurahan: [],
      feStatistics: { total_fe_given: 0, total_visits: 0, percentage_fe: 0 },
      riskDistribution: [],
      ttImmunization: [],
      hbStatistics: { avg_hb: 0, total_checked: 0 },
      obesityStatistics: { total_checked: 0, obese_count: 0, obese_percentage: 0 },
      preeklamsiaStatistics: { total_preeklamsia: 0, eklamsia_count: 0, preeklamsia_count: 0, hipertensi_gestasional_count: 0 },
      hepatitisStatistics: { total_screened: 0, hepatitis_b_positive: 0, hepatitis_percentage: 0 },
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
