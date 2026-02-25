const { getCellText } = require('./helpers');

async function populatePersalinanNifas(workbook, pool, filters) {
  const worksheet = workbook.getWorksheet('Persalinan Nifas');
  if (!worksheet) {
    console.log('Persalinan Nifas worksheet not found');
    return;
  }

  // Fetch statistics for each kelurahan
  const stats = await fetchPersalinanNifasStats(pool, filters);
  
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
    populatePersalinanNifasRow(row, stat);
  });

  // Populate total row (row 10)
  const totalRow = worksheet.getRow(10);
  populatePersalinanNifasRow(totalRow, stats.totals);
  
  console.log('Persalinan Nifas sheet populated');
}

async function fetchPersalinanNifasStats(pool, filters) {
  const kelurahanFilter = filters.kelurahan ? 'AND kel.nama_kelurahan = ?' : '';
  const kelurahanParams = filters.kelurahan ? [filters.kelurahan] : [];

  // Build date filters for year only
  const yearFilter = filters.year ? 'AND YEAR(ps.tanggal_persalinan) = ?' : '';
  const yearParams = filters.year ? [filters.year] : [];

  const query = `
    SELECT 
      kel.nama_kelurahan as kelurahan,
      
      -- Basic counts
      COUNT(DISTINCT k.forkey_ibu) as jumlahbumil,
      COUNT(DISTINCT CASE WHEN ps.id IS NOT NULL THEN k.forkey_ibu END) as jumlahbersalin,
      
      -- Persalinan by helper type
      COUNT(DISTINCT CASE WHEN ps.penolong IN ('Dokter', 'Bidan') THEN ps.id END) as ditolong_nakes_jumlah,
      COUNT(DISTINCT CASE WHEN ps.penolong NOT IN ('Dokter', 'Bidan') THEN ps.id END) as ditolong_nonnakes_jumlah,
      
      -- Persalinan by location
      COUNT(DISTINCT CASE WHEN ps.tempat_persalinan IN ('Rumah Sakit', 'Puskesmas', 'Klinik') THEN ps.id END) as difaskes_jumlah,
      COUNT(DISTINCT CASE WHEN ps.tempat_persalinan NOT IN ('Rumah Sakit', 'Puskesmas', 'Klinik') THEN ps.id END) as dinonfaskes_jumlah,
      
      -- Delivery method
      COUNT(DISTINCT CASE WHEN ps.cara_persalinan = 'Normal' THEN ps.id END) as persalinan_normal_jumlah,
      COUNT(DISTINCT CASE WHEN ps.cara_persalinan = 'Caesar' THEN ps.id END) as persalinan_caesar_jumlah,
      
      -- Neonatal care (now from bayi table)
      COUNT(DISTINCT CASE WHEN b.inisiasi_menyusui_dini = 1 THEN b.id END) as imd_jumlah,
      COUNT(DISTINCT CASE WHEN b.vitamin_k1 = 1 THEN b.id END) as vitk1_jumlah,
      COUNT(DISTINCT CASE WHEN b.salep_mata = 1 THEN b.id END) as salepmata_jumlah,
      
      -- Baby condition (now from bayi table)
      COUNT(DISTINCT CASE WHEN b.kondisi = 'Sehat' THEN b.id END) as bayi_sehat_jumlah,
      COUNT(DISTINCT CASE WHEN b.asfiksia IN ('Ringan', 'Berat') THEN b.id END) as bayi_asfiksia_jumlah,
      
      -- Nifas visits (KF1, KF2, KF3, KF4)
      COUNT(DISTINCT CASE WHEN nf.jenis_kunjungan = 'KF1' THEN nf.id END) as kf1_jumlah,
      COUNT(DISTINCT CASE WHEN nf.jenis_kunjungan = 'KF2' THEN nf.id END) as kf2_jumlah,
      COUNT(DISTINCT CASE WHEN nf.jenis_kunjungan = 'KF3' THEN nf.id END) as kf3_jumlah,
      COUNT(DISTINCT CASE WHEN nf.jenis_kunjungan = 'KF4' THEN nf.id END) as kf4_jumlah,
      
      -- Vitamin A distribution
      COUNT(DISTINCT CASE WHEN ps.beri_ttd = 1 THEN ps.id END) as vita_jumlah,
      
      -- TTD (Tablet Tambah Darah) distribution during nifas
      COUNT(DISTINCT CASE WHEN ps.beri_ttd = 1 THEN ps.id END) as ttd_nifas_jumlah,
      
      -- Komplikasi during delivery
      COUNT(DISTINCT CASE WHEN ps.komplikasi_ibu IS NOT NULL AND ps.komplikasi_ibu != '' THEN ps.id END) as komplikasi_persalinan_jumlah,
      COUNT(DISTINCT CASE WHEN ps.perdarahan = 'Ya' THEN ps.id END) as perdarahan_jumlah,
      
      -- Komplikasi during nifas
      COUNT(DISTINCT CASE WHEN ko.id IS NOT NULL AND ko.kejadian = 'Saat Nifas' THEN k.forkey_ibu END) as komplikasi_nifas_jumlah,
      
      -- Maternal deaths
      COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Kematian Ibu%' OR ko.nama_komplikasi LIKE '%Maternal Death%' THEN k.forkey_ibu END) as kematian_ibu_jumlah,
      
      -- Neonatal deaths (now from bayi table)
      COUNT(DISTINCT CASE WHEN b.kondisi = 'Meninggal' OR ko.nama_komplikasi LIKE '%Kematian Bayi%' OR ko.nama_komplikasi LIKE '%Neonatal Death%' THEN b.id END) as kematian_bayi_jumlah
      
    FROM kelurahan kel
    LEFT JOIN ibu i ON i.kelurahan_id = kel.id
    LEFT JOIN kehamilan k ON k.forkey_ibu = i.id
    LEFT JOIN persalinan ps ON ps.forkey_hamil = k.id ${yearFilter}
    LEFT JOIN kunjungan_nifas nf ON nf.forkey_hamil = k.id
    LEFT JOIN komplikasi ko ON ko.forkey_hamil = k.id
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

function populatePersalinanNifasRow(row, stat) {
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
      let denominator = stat.jumlahbersalin || 1;
      const countKey = baseMetric + '_jumlah';
      
      // Special denominators for specific metrics
      if (baseMetric.includes('kf')) {
        // KF percentages use jumlahbersalin as denominator
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

module.exports = { populatePersalinanNifas };
