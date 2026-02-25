const { getCellText, populateStatsRow } = require('./helpers');

async function populateANC(workbook, pool, filters) {
  const worksheet = workbook.getWorksheet('ANC');
  if (!worksheet) {
    console.log('ANC worksheet not found');
    return;
  }

  // Fetch statistics for each kelurahan
  const stats = await fetchANCStats(pool, filters);
  
  // Kelurahan mapping to row numbers
  const kelurahanRowMap = {
    'Simpang Pasir': 7,
    'Rawa Makmur': 8,
    'Handil Bakti': 9
  };

  // Populate each kelurahan row
  stats.kelurahanData.forEach((stat) => {
    const rowNumber = kelurahanRowMap[stat.kelurahan];
    if (!rowNumber) return;

    const row = worksheet.getRow(rowNumber);
    populateANCRow(row, stat);
  });

  // Populate total row (row 10)
  const totalRow = worksheet.getRow(10);
  populateANCRow(totalRow, stats.totals);
  
  console.log('ANC sheet populated');
}

async function fetchANCStats(pool, filters) {
  const kelurahanFilter = filters.kelurahan ? 'AND kel.nama_kelurahan = ?' : '';
  const kelurahanParams = filters.kelurahan ? [filters.kelurahan] : [];

  // Build date filters
  const dateFilterANC = [];
  const dateParamsANC = [];
  if (filters.year) {
    dateFilterANC.push('YEAR(ac.tanggal_kunjungan) = ?');
    dateParamsANC.push(filters.year);
  }
  if (filters.month) {
    dateFilterANC.push('MONTH(ac.tanggal_kunjungan) = ?');
    dateParamsANC.push(filters.month);
  }
  const dateWhereANC = dateFilterANC.length > 0 ? 'AND ' + dateFilterANC.join(' AND ') : '';

  const query = `
    SELECT 
      kel.nama_kelurahan as kelurahan,
      
      -- Basic counts - count mothers directly from ibu table
      COUNT(DISTINCT i.id) as jumlahbumil,
      COUNT(DISTINCT CASE WHEN ps.id IS NOT NULL THEN k.forkey_ibu END) as jumlahbersalin,
      COUNT(DISTINCT CASE 
        WHEN ac.status_risiko_visit IN ('Ringan', 'Sedang', 'Tinggi')
        THEN i.id 
      END) as jumlahresti,
      
      -- Buku KIA - count from ibu table directly
      COUNT(DISTINCT CASE WHEN i.buku_kia = 'Ada' THEN i.id END) as milikibukukia_jumlah,
      
      -- Standar 12T - count K1 visits
      COUNT(DISTINCT CASE WHEN ac.jenis_kunjungan = 'K1' THEN ac.id END) as standar12t_jumlah,
      
      -- 4 Terlalu (age <20 or >35, parity >4, etc) - count from ibu table
      COUNT(DISTINCT CASE 
        WHEN TIMESTAMPDIFF(YEAR, i.tanggal_lahir, CURDATE()) < 20 
        OR TIMESTAMPDIFF(YEAR, i.tanggal_lahir, CURDATE()) > 35 
        OR k.gravida > 4
        THEN i.id 
      END) as 4terlalu_jumlah,
      
      -- K1 Murni
      COUNT(DISTINCT CASE 
        WHEN ac.jenis_kunjungan = 'K1' AND ac.jenis_akses = 'Murni'
        THEN ac.id 
      END) as k1murni_jumlah,
      
      -- K1 Akses
      COUNT(DISTINCT CASE 
        WHEN ac.jenis_kunjungan = 'K1' AND ac.jenis_akses = 'Akses'
        THEN ac.id 
      END) as k1akses_jumlah,
      
      -- K1 Dokter
      COUNT(DISTINCT CASE 
        WHEN ac.jenis_kunjungan = 'K1' AND ac.pemeriksa = 'Dokter'
        THEN ac.id 
      END) as k1dokter_jumlah,
      
      -- K1 USG
      COUNT(DISTINCT CASE 
        WHEN ac.jenis_kunjungan = 'K1' AND ac.confirm_usg = 1
        THEN ac.id 
      END) as k1usg_jumlah,
      
      -- K4, K5, K6, K8
      COUNT(DISTINCT CASE WHEN ac.jenis_kunjungan = 'K4' THEN ac.id END) as k4_jumlah,
      COUNT(DISTINCT CASE WHEN ac.jenis_kunjungan = 'K5' THEN ac.id END) as k5_jumlah,
      COUNT(DISTINCT CASE 
        WHEN ac.jenis_kunjungan = 'K5' AND ac.pemeriksa = 'Dokter'
        THEN ac.id 
      END) as k5dokter_jumlah,
      COUNT(DISTINCT CASE 
        WHEN ac.jenis_kunjungan = 'K5' AND ac.confirm_usg = 1
        THEN ac.id 
      END) as k5usg_jumlah,
      COUNT(DISTINCT CASE WHEN ac.jenis_kunjungan = 'K6' THEN ac.id END) as k6_jumlah,
      COUNT(DISTINCT CASE WHEN ac.jenis_kunjungan = 'K8' THEN ac.id END) as k8_jumlah,
      
      -- TT Immunization
      COUNT(DISTINCT CASE WHEN ac.status_imunisasi_tt = 'T1' THEN ac.id END) as t1_jumlah,
      COUNT(DISTINCT CASE WHEN ac.status_imunisasi_tt = 'T2' THEN ac.id END) as t2_jumlah,
      COUNT(DISTINCT CASE WHEN ac.status_imunisasi_tt = 'T3' THEN ac.id END) as t3_jumlah,
      COUNT(DISTINCT CASE WHEN ac.status_imunisasi_tt = 'T4' THEN ac.id END) as t4_jumlah,
      COUNT(DISTINCT CASE WHEN ac.status_imunisasi_tt = 'T5' THEN ac.id END) as t5_jumlah,
      COUNT(DISTINCT CASE 
        WHEN ac.status_imunisasi_tt IN ('T2','T3','T4','T5') 
        THEN ac.id 
      END) as t2plus_jumlah,
      
      -- Fe tablets (assuming 1 visit = 30 tablets, 3 visits = 90 tablets)
      COUNT(DISTINCT CASE WHEN ac.beri_tablet_fe = 1 THEN ac.id END) as fe30_jumlah,
      COUNT(DISTINCT CASE 
        WHEN (SELECT COUNT(*) FROM antenatal_care ac2 
              WHERE ac2.forkey_hamil = k.id 
              AND ac2.beri_tablet_fe = 1) >= 3 
        THEN i.id 
      END) as fe90_jumlah,
      
      -- Maternal rujukan resiko tinggi (based on status_risiko_visit from ANC)
      COUNT(DISTINCT CASE 
        WHEN ac.status_risiko_visit IN ('Ringan', 'Sedang', 'Tinggi')
        THEN k.forkey_ibu 
      END) as maternal_jumlah,
      
      -- Neonatal rujukan resiko tinggi (based on status_risiko from bayi table)
      COUNT(DISTINCT CASE 
        WHEN b.status_risiko IN ('Ringan', 'Sedang', 'Berat')
        THEN b.id 
      END) as neoatal_jumlah
      
    FROM kelurahan kel
    LEFT JOIN ibu i ON i.kelurahan_id = kel.id
    LEFT JOIN kehamilan k ON k.forkey_ibu = i.id
    LEFT JOIN antenatal_care ac ON ac.forkey_hamil = k.id 
      ${dateWhereANC ? dateWhereANC : ''}
    LEFT JOIN persalinan ps ON ps.forkey_hamil = k.id
    LEFT JOIN komplikasi ko ON ko.forkey_hamil = k.id
    LEFT JOIN bayi b ON b.forkey_persalinan = ps.id
    WHERE 1=1 ${kelurahanFilter}
    GROUP BY kel.id, kel.nama_kelurahan
    ORDER BY kel.nama_kelurahan
  `;

  const [kelurahanData] = await pool.query(query, [...kelurahanParams, ...dateParamsANC]);

  // Calculate totals
  const totals = {
    kelurahan: 'Total',
    jumlahbumil: 0,
    jumlahbersalin: 0,
    jumlahresti: 0
  };

  kelurahanData.forEach(stat => {
    Object.keys(stat).forEach(key => {
      if (key !== 'kelurahan' && typeof stat[key] === 'number') {
        totals[key] = (totals[key] || 0) + stat[key];
      }
    });
  });

  return { kelurahanData, totals };
}

function populateANCRow(row, stat) {
  row.eachCell({ includeEmpty: false }, (cell) => {
    const cellValue = cell.value;
    if (typeof cellValue !== 'string' || !cellValue.includes('{')) return;
    
    const match = cellValue.match(/\{([^}]+)\}/);
    if (!match) return;
    
    const placeholder = match[1];
    
    // Check if it's a percentage or count by looking at the placeholder structure
    // Pattern: {kelurahan_persen_metric} or {kelurahan_jumlah_metric}
    const isPercentage = placeholder.includes('_persen_');
    const isCount = placeholder.includes('_jumlah_');
    
    if (isPercentage) {
      // Extract the metric name after persen_
      // e.g., simpangpasir_persen_k1murni -> k1murni
      const parts = placeholder.split('_persen_');
      const metric = parts[1];
      
      // Get the count value
      const countKey = metric + '_jumlah';
      const count = stat[countKey] || 0;
      
      // Determine correct denominator based on metric type
      let denominator = stat.jumlahbumil || 1;
      
      // Special cases for denominators
      if (metric === 'fe30' || metric === 'fe90') {
        // Fe tablets percentage uses total pregnant mothers
        denominator = stat.jumlahbumil || 1;
      } else if (metric === 'maternal') {
        // Maternal rujukan resiko tinggi percentage uses total pregnant mothers
        denominator = stat.jumlahbumil || 1;
      } else if (metric === 'neoatal') {
        // Neonatal rujukan resiko tinggi percentage uses total deliveries
        denominator = stat.jumlahbersalin || 1;
      }
      
      const percentage = denominator > 0 ? Math.round((count / denominator) * 100) : 0;
      cell.value = percentage + '%';
      
    } else if (isCount) {
      // Extract the metric name after jumlah_
      // e.g., simpangpasir_jumlah_k1murni -> k1murni
      const parts = placeholder.split('_jumlah_');
      const metric = parts[1];
      
      // Handle special case for t2+ (contains +)
      const countKey = metric.replace('+', 'plus') + '_jumlah';
      const value = stat[countKey] || 0;
      
      cell.value = value;
      
    } else {
      // Handle basic fields without jumlah/persen prefix
      // e.g., simpangpasir_jumlahbumil, simpangpasir_jumlahbersalin
      const parts = placeholder.split('_');
      if (parts[0] === 'simpangpasir' || parts[0] === 'rawamakmur' || parts[0] === 'handilbakti' || parts[0] === 'total') {
        const metric = parts.slice(1).join('_');
        const value = stat[metric] || 0;
        cell.value = value;
      }
    }
  });
}

module.exports = { populateANC };
