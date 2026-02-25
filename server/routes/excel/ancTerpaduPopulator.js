const { getCellText } = require('./helpers');

async function populateANCTerpadu(workbook, pool, filters) {
  const worksheet = workbook.getWorksheet('ANC Terpadu');
  if (!worksheet) {
    console.log('ANC Terpadu worksheet not found');
    return;
  }

  // Fetch statistics for each kelurahan
  const stats = await fetchANCTerpaduStats(pool, filters);
  
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
    populateANCTerpaduRow(row, stat);
  });

  // Populate total row (row 10)
  const totalRow = worksheet.getRow(10);
  populateANCTerpaduRow(totalRow, stats.totals);
  
  console.log('ANC Terpadu sheet populated');
}

async function fetchANCTerpaduStats(pool, filters) {
  const kelurahanFilter = filters.kelurahan ? 'AND kel.nama_kelurahan = ?' : '';
  const kelurahanParams = filters.kelurahan ? [filters.kelurahan] : [];

  // Build date filters for year only (ignore month for this sheet)
  const yearFilter = filters.year ? 'AND YEAR(ac.tanggal_kunjungan) = ?' : '';
  const yearParams = filters.year ? [filters.year] : [];

  const query = `
    SELECT 
      kel.nama_kelurahan as kelurahan,
      
      -- Basic counts
      COUNT(DISTINCT k.forkey_ibu) as jumlahbumil,
      COUNT(DISTINCT CASE WHEN ps.id IS NOT NULL THEN k.forkey_ibu END) as jumlahbersalin,
      
      -- Trimester counts
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 
        THEN k.forkey_ibu 
      END) as bumil_tm1_jumlah,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 
        THEN k.forkey_ibu 
      END) as bumil_tm2_jumlah,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 
        THEN k.forkey_ibu 
      END) as bumil_tm3_jumlah,
      
      -- Anemia by trimester (Hb levels)
      -- TM1 Anemia
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 
        AND ls.hasil_lab_hb IS NOT NULL
        THEN ac.id 
      END) as tm1_diperiksa_jumlah,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 
        AND ls.hasil_lab_hb < 8 
        THEN ac.id 
      END) as tm1_anemia_berat_jumlah,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 
        AND ls.hasil_lab_hb >= 8 AND ls.hasil_lab_hb < 10 
        THEN ac.id 
      END) as tm1_anemia_sedang_jumlah,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 
        AND ls.hasil_lab_hb >= 10 AND ls.hasil_lab_hb < 11 
        THEN ac.id 
      END) as tm1_anemia_ringan_jumlah,
      
      -- TM2 Anemia
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 
        AND ls.hasil_lab_hb IS NOT NULL
        THEN ac.id 
      END) as tm2_diperiksa_jumlah,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 
        AND ls.hasil_lab_hb < 8 
        THEN ac.id 
      END) as tm2_anemia_berat_jumlah,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 
        AND ls.hasil_lab_hb >= 8 AND ls.hasil_lab_hb < 10 
        THEN ac.id 
      END) as tm2_anemia_sedang_jumlah,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 
        AND ls.hasil_lab_hb >= 10 AND ls.hasil_lab_hb < 11 
        THEN ac.id 
      END) as tm2_anemia_ringan_jumlah,
      
      -- TM3 Anemia
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 
        AND ls.hasil_lab_hb IS NOT NULL
        THEN ac.id 
      END) as tm3_diperiksa_jumlah,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 
        AND ls.hasil_lab_hb < 8 
        THEN ac.id 
      END) as tm3_anemia_berat_jumlah,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 
        AND ls.hasil_lab_hb >= 8 AND ls.hasil_lab_hb < 10 
        THEN ac.id 
      END) as tm3_anemia_sedang_jumlah,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 
        AND ls.hasil_lab_hb >= 10 AND ls.hasil_lab_hb < 11 
        THEN ac.id 
      END) as tm3_anemia_ringan_jumlah,
      
      -- KEK/LILA (<23.5 cm)
      COUNT(DISTINCT CASE WHEN ac.lila IS NOT NULL THEN ac.id END) as lila_diperiksa_jumlah,
      COUNT(DISTINCT CASE WHEN ac.lila < 23.5 THEN ac.id END) as kek_jumlah,
      
      -- BMI categories
      COUNT(DISTINCT CASE 
        WHEN i.beratbadan IS NOT NULL AND i.tinggi_badan IS NOT NULL 
        THEN k.forkey_ibu 
      END) as bmi_diperiksa_jumlah,
      COUNT(DISTINCT CASE 
        WHEN (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) < 18.5 
        THEN k.forkey_ibu 
      END) as bmi_kurus_jumlah,
      COUNT(DISTINCT CASE 
        WHEN (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 18.5 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) < 25 
        THEN k.forkey_ibu 
      END) as bmi_normal_jumlah,
      COUNT(DISTINCT CASE 
        WHEN (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 25 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) < 30 
        THEN k.forkey_ibu 
      END) as bmi_gemuk_jumlah,
      COUNT(DISTINCT CASE 
        WHEN (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 30 
        THEN k.forkey_ibu 
      END) as bmi_obesitas_jumlah,
      
      -- Lab screening
      COUNT(DISTINCT CASE WHEN ls.lab_protein_urine IS NOT NULL THEN ac.id END) as proteinurine_diperiksa_jumlah,
      COUNT(DISTINCT CASE WHEN ls.lab_protein_urine = 'Positif' THEN ac.id END) as proteinurine_positif_jumlah,
      
      COUNT(DISTINCT CASE WHEN ls.lab_gula_darah IS NOT NULL THEN ac.id END) as guladarah_diperiksa_jumlah,
      COUNT(DISTINCT CASE WHEN ls.lab_gula_darah > 200 THEN ac.id END) as guladarah_tinggi_jumlah,
      
      COUNT(DISTINCT CASE WHEN ls.skrining_hiv != 'Belum Diperiksa' THEN ac.id END) as hiv_diperiksa_jumlah,
      COUNT(DISTINCT CASE WHEN ls.skrining_hiv = 'Reaktif' THEN ac.id END) as hiv_reaktif_jumlah,
      
      COUNT(DISTINCT CASE WHEN ls.status_malaria != 'Belum Diperiksa' THEN ac.id END) as malaria_diperiksa_jumlah,
      COUNT(DISTINCT CASE WHEN ls.status_malaria = 'Positif' THEN ac.id END) as malaria_positif_jumlah,
      
      COUNT(DISTINCT CASE WHEN ls.status_kecacingan != 'Belum Diperiksa' THEN ac.id END) as kecacingan_diperiksa_jumlah,
      COUNT(DISTINCT CASE WHEN ls.status_kecacingan = 'Positif' THEN ac.id END) as kecacingan_positif_jumlah,
      
      COUNT(DISTINCT CASE WHEN ls.skrining_sifilis != 'Belum Diperiksa' OR ls.skrining_gonorea != 'Belum Diperiksa' OR ls.skrining_klamidia != 'Belum Diperiksa' THEN ac.id END) as ims_diperiksa_jumlah,
      COUNT(DISTINCT CASE WHEN ls.skrining_sifilis = 'Reaktif' OR ls.skrining_gonorea = 'Reaktif' OR ls.skrining_klamidia = 'Reaktif' THEN ac.id END) as ims_positif_jumlah,
      
      COUNT(DISTINCT CASE WHEN ls.skrining_hbsag != 'Belum Diperiksa' THEN ac.id END) as hbsag_diperiksa_jumlah,
      COUNT(DISTINCT CASE WHEN ls.skrining_hbsag = 'Reaktif' THEN ac.id END) as hbsag_reaktif_jumlah,
      
      -- Komplikasi during pregnancy
      COUNT(DISTINCT CASE WHEN ko.id IS NOT NULL AND ko.kejadian IN ('Saat Hamil', 'Saat ANC') THEN k.forkey_ibu END) as komplikasi_hamil_jumlah,
      
      -- HIV during delivery (from persalinan or lab screening)
      COUNT(DISTINCT CASE WHEN ps.id IS NOT NULL AND ls.skrining_hiv = 'Reaktif' THEN k.forkey_ibu END) as hiv_persalinan_jumlah
      
    FROM kelurahan kel
    LEFT JOIN ibu i ON i.kelurahan_id = kel.id
    LEFT JOIN kehamilan k ON k.forkey_ibu = i.id
    LEFT JOIN antenatal_care ac ON ac.forkey_hamil = k.id ${yearFilter}
    LEFT JOIN lab_screening ls ON ac.forkey_lab_screening = ls.id
    LEFT JOIN persalinan ps ON ps.forkey_hamil = k.id
    LEFT JOIN komplikasi ko ON ko.forkey_hamil = k.id
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

function populateANCTerpaduRow(row, stat) {
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
      // Calculate percentage based on metric type
      let denominator = stat.jumlahbumil || 1;
      let countKey = baseMetric + '_jumlah';
      
      // Special denominators for specific metrics
      if (baseMetric.includes('anemia')) {
        // Anemia percentages use diperiksa as denominator
        const trimester = baseMetric.match(/tm(\d)/)?.[1];
        if (trimester) {
          denominator = stat[`tm${trimester}_diperiksa_jumlah`] || 1;
        }
      } else if (baseMetric.includes('proteinurine') || baseMetric.includes('guladarah') || 
                 baseMetric.includes('hiv') || baseMetric.includes('malaria') || 
                 baseMetric.includes('kecacingan') || baseMetric.includes('ims') || 
                 baseMetric.includes('hbsag')) {
        // Lab screening percentages use their specific diperiksa count
        const screeningType = baseMetric.replace('_positif', '').replace('_reaktif', '').replace('_tinggi', '');
        denominator = stat[`${screeningType}_diperiksa_jumlah`] || 1;
      } else if (baseMetric.includes('kek')) {
        denominator = stat.lila_diperiksa_jumlah || 1;
      } else if (baseMetric.includes('bmi')) {
        denominator = stat.bmi_diperiksa_jumlah || 1;
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

module.exports = { populateANCTerpadu };
