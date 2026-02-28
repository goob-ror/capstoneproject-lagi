async function populateKomplikasiKebidanan(workbook, pool, filters) {
  const worksheet = workbook.getWorksheet('Komplikasi Kebidanan');
  if (!worksheet) {
    console.log('Komplikasi Kebidanan worksheet not found');
    return;
  }

  // Fetch statistics for each kelurahan
  const stats = await fetchKomplikasiKebidananStats(pool, filters);
  
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
    populateKomplikasiKebidananRow(row, stat);
  });

  // Populate total row (row 10)
  const totalRow = worksheet.getRow(10);
  populateKomplikasiKebidananRow(totalRow, stats.totals);
  
  console.log('Komplikasi Kebidanan sheet populated');
}

async function fetchKomplikasiKebidananStats(pool, filters) {
  const kelurahanFilter = filters.kelurahan ? 'AND kel.nama_kelurahan = ?' : '';
  const kelurahanParams = filters.kelurahan ? [filters.kelurahan] : [];

  // Build date filters for komplikasi
  const dateFilterKomplikasi = [];
  const dateParamsKomplikasi = [];
  if (filters.year) {
    dateFilterKomplikasi.push('YEAR(ko.tanggal_diagnosis) = ?');
    dateParamsKomplikasi.push(filters.year);
  }
  if (filters.month) {
    dateFilterKomplikasi.push('MONTH(ko.tanggal_diagnosis) = ?');
    dateParamsKomplikasi.push(filters.month);
  }
  const dateWhereKomplikasi = dateFilterKomplikasi.length > 0 ? 'AND ' + dateFilterKomplikasi.join(' AND ') : '';

  const query = `
    SELECT 
      kel.nama_kelurahan as kelurahan,
      
      -- Basic counts
      COUNT(DISTINCT k.forkey_ibu) as jumlahbumil,
      COUNT(DISTINCT CASE WHEN ps.id IS NOT NULL THEN k.forkey_ibu END) as jumlahbersalin,
      
      -- Trimester counts (based on weeks from HPHT at time of ANC visit)
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 
        THEN k.forkey_ibu 
      END) as bumil_tm1,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 
        THEN k.forkey_ibu 
      END) as bumil_tm2,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 
        THEN k.forkey_ibu 
      END) as bumil_tm3,
      
      -- Total complications across all stages (ANC, Persalinan, Nifas)
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%Anemia%' 
        THEN k.forkey_ibu 
      END) as komplikasi_total_anemia,
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%KEK%' 
        THEN k.forkey_ibu 
      END) as komplikasi_total_kek,
      COUNT(DISTINCT CASE 
        WHEN (ko.nama_komplikasi LIKE '%Preeklamsia%' OR ko.nama_komplikasi LIKE '%eklamsia%')
        THEN k.forkey_ibu 
      END) as komplikasi_total_preeklamsiaeklamsia,
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%Infeksi%' 
        THEN k.forkey_ibu 
      END) as komplikasi_total_infeksi,
      COUNT(DISTINCT CASE 
        WHEN (ko.nama_komplikasi LIKE '%TB%' OR ko.nama_komplikasi LIKE '%Tuberculosis%')
        THEN k.forkey_ibu 
      END) as komplikasi_total_tuberculosis,
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%Malaria%' 
        THEN k.forkey_ibu 
      END) as komplikasi_total_malaria,
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%HIV%' 
        THEN k.forkey_ibu 
      END) as komplikasi_total_hiv,
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%Jantung%' 
        THEN k.forkey_ibu 
      END) as komplikasi_total_jantung,
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%Diabetes%' 
        THEN k.forkey_ibu 
      END) as komplikasi_total_diabetes_melitus,
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%Obesitas%' 
        THEN k.forkey_ibu 
      END) as komplikasi_total_obesitas,
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%Keguguran%' 
        THEN k.forkey_ibu 
      END) as komplikasi_total_keguguran,
      COUNT(DISTINCT CASE 
        WHEN ko.id IS NOT NULL
        AND ko.nama_komplikasi NOT LIKE '%Anemia%'
        AND ko.nama_komplikasi NOT LIKE '%KEK%'
        AND ko.nama_komplikasi NOT LIKE '%Preeklamsia%'
        AND ko.nama_komplikasi NOT LIKE '%eklamsia%'
        AND ko.nama_komplikasi NOT LIKE '%Infeksi%'
        AND ko.nama_komplikasi NOT LIKE '%TB%'
        AND ko.nama_komplikasi NOT LIKE '%Tuberculosis%'
        AND ko.nama_komplikasi NOT LIKE '%Malaria%'
        AND ko.nama_komplikasi NOT LIKE '%HIV%'
        AND ko.nama_komplikasi NOT LIKE '%Jantung%'
        AND ko.nama_komplikasi NOT LIKE '%Diabetes%'
        AND ko.nama_komplikasi NOT LIKE '%Obesitas%'
        AND ko.nama_komplikasi NOT LIKE '%Keguguran%'
        THEN k.forkey_ibu 
      END) as komplikasi_total_lainlain,
      COUNT(DISTINCT CASE 
        WHEN ko.id IS NOT NULL
        THEN k.forkey_ibu 
      END) as komplikasi_total_bumil,
      COUNT(DISTINCT CASE 
        WHEN ko.id IS NOT NULL
        AND ko.rujuk_rs = 1
        THEN k.forkey_ibu 
      END) as komplikasi_total_bumil_rujukrs
      
    FROM kelurahan kel
    LEFT JOIN ibu i ON i.kelurahan_id = kel.id
    LEFT JOIN kehamilan k ON k.forkey_ibu = i.id
    LEFT JOIN antenatal_care ac ON ac.forkey_hamil = k.id
    LEFT JOIN persalinan ps ON ps.forkey_hamil = k.id
    LEFT JOIN komplikasi ko ON ko.forkey_hamil = k.id ${dateWhereKomplikasi}
    WHERE 1=1 ${kelurahanFilter}
    GROUP BY kel.id, kel.nama_kelurahan
    ORDER BY kel.nama_kelurahan
  `;

  const [kelurahanData] = await pool.query(query, [...kelurahanParams, ...dateParamsKomplikasi]);

  // Calculate totals
  const totals = {
    kelurahan: 'Total'
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

function populateKomplikasiKebidananRow(row, stat) {
  row.eachCell({ includeEmpty: false }, (cell) => {
    const cellValue = cell.value;
    if (typeof cellValue !== 'string' || !cellValue.includes('{')) return;
    
    const match = cellValue.match(/\{([^}]+)\}/);
    if (!match) return;
    
    const placeholder = match[1];
    const parts = placeholder.split('_');
    
    // Extract kelurahan prefix and metric
    let metric = '';
    if (parts[0] === 'simpangpasir' || parts[0] === 'rawamakmur' || parts[0] === 'handilbakti' || parts[0] === 'total') {
      metric = parts.slice(1).join('_');
    } else {
      metric = placeholder;
    }
    
    // Determine if it's a count or percentage
    const isPercentage = metric.includes('persen');
    const isJumlah = metric.includes('jumlah');
    
    // Handle komplikasi_total with nested names (e.g., preeklamsia/eklamsia)
    if (metric.includes('komplikasi_total_')) {
      const komplikasiMatch = metric.match(/komplikasi_total_([^_]+(?:\/[^_]+)?)_(jumlah|persen)/);
      if (komplikasiMatch) {
        const komplikasiType = komplikasiMatch[1].replace('/', '');
        const valueType = komplikasiMatch[2];
        const baseMetric = `komplikasi_total_${komplikasiType}`;
        
        if (valueType === 'persen') {
          const count = stat[baseMetric] || 0;
          const denominator = stat.jumlahbumil || 1;
          cell.value = denominator > 0 ? Math.round((count / denominator) * 100) : 0;
        } else {
          cell.value = stat[baseMetric] || 0;
        }
        return;
      }
    }
    
    if (isPercentage) {
      // Extract the base metric name (remove persen_ or _persen)
      const baseMetric = metric.replace('persen_', '').replace('_persen', '');
      
      // Determine correct denominator based on metric type
      let denominator = stat.jumlahbumil || 1;
      let count = stat[baseMetric] || 0;
      
      // All komplikasi percentages use jumlahbumil as denominator
      if (baseMetric.includes('komplikasi_total')) {
        denominator = stat.jumlahbumil || 1;
      }
      
      cell.value = denominator > 0 ? Math.round((count / denominator) * 100) : 0;
      
    } else if (isJumlah) {
      // Extract the base metric name (remove jumlah_)
      const baseMetric = metric.replace('jumlah_', '');
      cell.value = stat[baseMetric] || 0;
      
    } else {
      // Direct field mapping (no jumlah/persen prefix)
      if (metric === 'jumlahbumil' || metric === 'jumlahbersalin') {
        cell.value = stat[metric] || 0;
      } else if (metric.startsWith('bumil_tm')) {
        cell.value = stat[metric] || 0;
      } else if (metric.startsWith('komplikasi_total_')) {
        cell.value = stat[metric] || 0;
      } else {
        cell.value = stat[metric] || 0;
      }
    }
  });
}

module.exports = { populateKomplikasiKebidanan };
