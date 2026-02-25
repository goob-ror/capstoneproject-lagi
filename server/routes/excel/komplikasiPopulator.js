const { getCellText } = require('./helpers');

async function populateKomplikasi(workbook, pool, filters) {
  const worksheet = workbook.getWorksheet('Komplikasi Kebidanan');
  if (!worksheet) {
    console.log('Komplikasi Kebidanan worksheet not found');
    return;
  }

  // Fetch statistics for each kelurahan
  const stats = await fetchKomplikasiStats(pool, filters);
  
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
    populateKomplikasiRow(row, stat);
  });

  // Populate total row (row 10)
  const totalRow = worksheet.getRow(10);
  populateKomplikasiRow(totalRow, stats.totals);
  
  console.log('Komplikasi Kebidanan sheet populated');
}

async function fetchKomplikasiStats(pool, filters) {
  const kelurahanFilter = filters.kelurahan ? 'AND kel.nama_kelurahan = ?' : '';
  const kelurahanParams = filters.kelurahan ? [filters.kelurahan] : [];

  // Build date filters for year only
  const yearFilter = filters.year ? 'AND YEAR(ko.tanggal_diagnosis) = ?' : '';
  const yearParams = filters.year ? [filters.year] : [];

  const query = `
    SELECT 
      kel.nama_kelurahan as kelurahan,
      
      -- Basic counts
      COUNT(DISTINCT k.forkey_ibu) as jumlahbumil,
      COUNT(DISTINCT CASE WHEN ps.id IS NOT NULL THEN k.forkey_ibu END) as jumlahbersalin,
      
      -- Total complications
      COUNT(DISTINCT CASE WHEN ko.id IS NOT NULL THEN ko.id END) as total_komplikasi_jumlah,
      
      -- Complications by stage
      COUNT(DISTINCT CASE WHEN ko.kejadian IN ('Saat Hamil', 'Saat ANC') THEN ko.id END) as komplikasi_hamil_jumlah,
      COUNT(DISTINCT CASE WHEN ko.kejadian = 'Saat Persalinan' THEN ko.id END) as komplikasi_persalinan_jumlah,
      COUNT(DISTINCT CASE WHEN ko.kejadian = 'Saat Nifas' THEN ko.id END) as komplikasi_nifas_jumlah,
      
      -- Specific complications - Hypertensive disorders
      COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Preeklamsia%' OR ko.nama_komplikasi LIKE '%preeklamsia%' THEN ko.id END) as preeklamsia_jumlah,
      COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Eklamsia%' AND ko.nama_komplikasi NOT LIKE '%Pre%' THEN ko.id END) as eklamsia_jumlah,
      COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Hipertensi%' THEN ko.id END) as hipertensi_jumlah,
      
      -- Hemorrhage
      COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Perdarahan%' OR ko.nama_komplikasi LIKE '%perdarahan%' OR ps.perdarahan = 'Ya' THEN ko.id END) as perdarahan_jumlah,
      COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Perdarahan Antepartum%' THEN ko.id END) as perdarahan_antepartum_jumlah,
      COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Perdarahan Postpartum%' THEN ko.id END) as perdarahan_postpartum_jumlah,
      
      -- Infection
      COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Infeksi%' OR ko.nama_komplikasi LIKE '%Sepsis%' THEN ko.id END) as infeksi_jumlah,
      
      -- Anemia
      COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Anemia%' THEN ko.id END) as anemia_komplikasi_jumlah,
      
      -- Abortion/Miscarriage
      COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Abortus%' OR ko.nama_komplikasi LIKE '%Keguguran%' THEN ko.id END) as abortus_jumlah,
      
      -- Premature labor
      COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Persalinan Prematur%' OR ko.nama_komplikasi LIKE '%Prematur%' THEN ko.id END) as prematur_jumlah,
      
      -- Prolonged labor
      COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Partus Lama%' OR ko.nama_komplikasi LIKE '%Persalinan Lama%' THEN ko.id END) as partus_lama_jumlah,
      
      -- Placental complications
      COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Plasenta%' THEN ko.id END) as komplikasi_plasenta_jumlah,
      
      -- Fetal complications
      COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Gawat Janin%' OR ko.nama_komplikasi LIKE '%Fetal Distress%' THEN ko.id END) as gawat_janin_jumlah,
      COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%IUGR%' OR ko.nama_komplikasi LIKE '%Pertumbuhan Janin Terhambat%' THEN ko.id END) as iugr_jumlah,
      
      -- Referrals
      COUNT(DISTINCT CASE WHEN ko.rujuk_rs = 1 THEN ko.id END) as rujuk_rs_jumlah,
      
      -- Severity levels
      COUNT(DISTINCT CASE WHEN ko.tingkat_keparahan = 'Ringan' THEN ko.id END) as keparahan_ringan_jumlah,
      COUNT(DISTINCT CASE WHEN ko.tingkat_keparahan = 'Sedang' THEN ko.id END) as keparahan_sedang_jumlah,
      COUNT(DISTINCT CASE WHEN ko.tingkat_keparahan = 'Berat' THEN ko.id END) as keparahan_berat_jumlah,
      
      -- Maternal mortality
      COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Kematian Ibu%' OR ko.nama_komplikasi LIKE '%Maternal Death%' THEN k.forkey_ibu END) as kematian_ibu_jumlah,
      
      -- Neonatal mortality (now from bayi table)
      COUNT(DISTINCT CASE WHEN b.kondisi = 'Meninggal' OR ko.nama_komplikasi LIKE '%Kematian Bayi%' OR ko.nama_komplikasi LIKE '%Neonatal Death%' THEN b.id END) as kematian_bayi_jumlah
      
    FROM kelurahan kel
    LEFT JOIN ibu i ON i.kelurahan_id = kel.id
    LEFT JOIN kehamilan k ON k.forkey_ibu = i.id
    LEFT JOIN komplikasi ko ON ko.forkey_hamil = k.id ${yearFilter}
    LEFT JOIN persalinan ps ON ps.forkey_hamil = k.id
    LEFT JOIN bayi b ON b.forkey_persalinan = ps.id
    WHERE 1=1 ${kelurahanFilter}
    GROUP BY kel.id, kel.nama_kelurahan
    ORDER BY kel.nama_kelurahan
  `;

  const [kelurahanData] = await pool.query(query, [...kelurahanParams, ...yearParams]);

  // Calculate totals
  const totals = {
    kelurahan: 'Total',
    jumlahbumil: 0,
    jumlahbersalin: 0
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

function populateKomplikasiRow(row, stat) {
  row.eachCell({ includeEmpty: false }, (cell) => {
    const cellValue = cell.value;
    if (typeof cellValue !== 'string' || !cellValue.includes('{')) return;
    
    const match = cellValue.match(/\{([^}]+)\}/);
    if (!match) return;
    
    const placeholder = match[1];
    const parts = placeholder.split('_');
    
    // Extract metric
    let metric = '';
    if (parts[0] === 'simpangpasir' || parts[0] === 'rawamakmur' || parts[0] === 'handilbakti' || parts[0] === 'total') {
      metric = parts.slice(1).join('_');
    } else {
      metric = placeholder;
    }
    
    // Determine if it's a count or percentage
    const isPercentage = metric.includes('persen');
    const baseMetric = metric.replace('_persen', '').replace('persen_', '');
    
    if (isPercentage) {
      // Calculate percentage
      let denominator = stat.jumlahbumil || 1;
      const countKey = baseMetric + '_jumlah';
      
      // Most komplikasi percentages use jumlahbumil as denominator
      // Some might use jumlahbersalin for delivery-specific complications
      if (baseMetric.includes('persalinan') || baseMetric.includes('postpartum')) {
        denominator = stat.jumlahbersalin || 1;
      }
      
      const count = stat[countKey] || stat[baseMetric] || 0;
      cell.value = denominator > 0 ? Math.round((count / denominator) * 100) : 0;
    } else {
      // It's a count
      const countKey = baseMetric + '_jumlah';
      cell.value = stat[countKey] || stat[baseMetric] || 0;
    }
  });
}

module.exports = { populateKomplikasi };
