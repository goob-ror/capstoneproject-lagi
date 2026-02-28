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

  // Build date filters for persalinan
  const dateFilterPersalinan = [];
  const dateParamsPersalinan = [];
  if (filters.year) {
    dateFilterPersalinan.push('YEAR(ps.tanggal_persalinan) = ?');
    dateParamsPersalinan.push(filters.year);
  }
  if (filters.month) {
    dateFilterPersalinan.push('MONTH(ps.tanggal_persalinan) = ?');
    dateParamsPersalinan.push(filters.month);
  }
  const dateWherePersalinan = dateFilterPersalinan.length > 0 ? 'AND ' + dateFilterPersalinan.join(' AND ') : '';

  // Build date filters for nifas
  const dateFilterNifas = [];
  const dateParamsNifas = [];
  if (filters.year) {
    dateFilterNifas.push('YEAR(kn.tanggal_kunjungan) = ?');
    dateParamsNifas.push(filters.year);
  }
  if (filters.month) {
    dateFilterNifas.push('MONTH(kn.tanggal_kunjungan) = ?');
    dateParamsNifas.push(filters.month);
  }
  const dateWhereNifas = dateFilterNifas.length > 0 ? 'AND ' + dateFilterNifas.join(' AND ') : '';

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
      
      -- Persalinan - Penolong (helper)
      COUNT(DISTINCT CASE 
        WHEN ps.penolong IN ('Bidan', 'Dokter') 
        THEN ps.id 
      END) as persalinan_ditolongnakes,
      COUNT(DISTINCT CASE 
        WHEN ps.penolong IN ('Keluarga', 'Lainnya') 
        THEN ps.id 
      END) as persalinan_ditolongnonnakes,
      
      -- Persalinan - Tempat (location)
      COUNT(DISTINCT CASE 
        WHEN ps.tempat_persalinan IN ('RS', 'Puskesmas', 'Klinik') 
        THEN ps.id 
      END) as persalinan_di_faskes,
      COUNT(DISTINCT CASE 
        WHEN ps.tempat_persalinan = 'Rumah' 
        THEN ps.id 
      END) as persalinan_di_nonfaskes,
      
      -- Pelayanan Nifas - KF visits
      COUNT(DISTINCT CASE WHEN kn.jenis_kunjungan = 'KF1' THEN kn.id END) as pelayanan_nifas_kf1,
      COUNT(DISTINCT CASE WHEN kn.jenis_kunjungan = 'KF2' THEN kn.id END) as pelayanan_nifas_kf2,
      COUNT(DISTINCT CASE WHEN kn.jenis_kunjungan = 'KF3' THEN kn.id END) as pelayanan_nifas_kf3,
      COUNT(DISTINCT CASE WHEN kn.jenis_kunjungan = 'KF4' THEN kn.id END) as pelayanan_nifas_kf4,
      
      -- Pelayanan Nifas - Vitamin A (assuming tracked in a separate field or komplikasi notes)
      -- Since there's no direct vitamin A field, we'll count mothers who had nifas visits
      COUNT(DISTINCT CASE 
        WHEN kn.id IS NOT NULL 
        THEN k.forkey_ibu 
      END) as pelayanan_nifas_mendapat_vitaminA,
      
      -- Pelayanan Nifas - TTD (from persalinan table)
      COUNT(DISTINCT CASE 
        WHEN ps.beri_ttd = 1 
        THEN k.forkey_ibu 
      END) as pelayanan_nifas_mendapat_ttd,
      
      -- Komplikasi during persalinan and nifas (from komplikasi table)
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%Anemia%' 
        AND ko.kejadian IN ('Saat Bersalin', 'Saat Nifas')
        THEN k.forkey_ibu 
      END) as komplikasi_persalinannifas_anemia,
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%KEK%' 
        AND ko.kejadian IN ('Saat Bersalin', 'Saat Nifas')
        THEN k.forkey_ibu 
      END) as komplikasi_persalinannifas_kek,
      COUNT(DISTINCT CASE 
        WHEN (ko.nama_komplikasi LIKE '%Preeklamsia%' OR ko.nama_komplikasi LIKE '%eklamsia%')
        AND ko.kejadian IN ('Saat Bersalin', 'Saat Nifas')
        THEN k.forkey_ibu 
      END) as komplikasi_persalinannifas_preeklamsiaeklamsia,
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%Infeksi%' 
        AND ko.kejadian IN ('Saat Bersalin', 'Saat Nifas')
        THEN k.forkey_ibu 
      END) as komplikasi_persalinannifas_infeksi,
      COUNT(DISTINCT CASE 
        WHEN (ko.nama_komplikasi LIKE '%TB%' OR ko.nama_komplikasi LIKE '%Tuberculosis%')
        AND ko.kejadian IN ('Saat Bersalin', 'Saat Nifas')
        THEN k.forkey_ibu 
      END) as komplikasi_persalinannifas_tuberculosis,
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%Malaria%' 
        AND ko.kejadian IN ('Saat Bersalin', 'Saat Nifas')
        THEN k.forkey_ibu 
      END) as komplikasi_persalinannifas_malaria,
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%HIV%' 
        AND ko.kejadian IN ('Saat Bersalin', 'Saat Nifas')
        THEN k.forkey_ibu 
      END) as komplikasi_persalinannifas_hiv,
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%Jantung%' 
        AND ko.kejadian IN ('Saat Bersalin', 'Saat Nifas')
        THEN k.forkey_ibu 
      END) as komplikasi_persalinannifas_jantung,
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%Diabetes%' 
        AND ko.kejadian IN ('Saat Bersalin', 'Saat Nifas')
        THEN k.forkey_ibu 
      END) as komplikasi_persalinannifas_diabetes_melitus,
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%Obesitas%' 
        AND ko.kejadian IN ('Saat Bersalin', 'Saat Nifas')
        THEN k.forkey_ibu 
      END) as komplikasi_persalinannifas_obesitas,
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%Keguguran%' 
        AND ko.kejadian IN ('Saat Bersalin', 'Saat Nifas')
        THEN k.forkey_ibu 
      END) as komplikasi_persalinannifas_keguguran,
      COUNT(DISTINCT CASE 
        WHEN ko.kejadian IN ('Saat Bersalin', 'Saat Nifas')
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
      END) as komplikasi_persalinannifas_lainlain,
      COUNT(DISTINCT CASE 
        WHEN ko.kejadian IN ('Saat Bersalin', 'Saat Nifas')
        THEN k.forkey_ibu 
      END) as komplikasi_persalinannifas_bumil,
      COUNT(DISTINCT CASE 
        WHEN ko.kejadian IN ('Saat Bersalin', 'Saat Nifas')
        AND ko.rujuk_rs = 1
        THEN k.forkey_ibu 
      END) as komplikasi_persalinannifas_bumil_rujukrs
      
    FROM kelurahan kel
    LEFT JOIN ibu i ON i.kelurahan_id = kel.id
    LEFT JOIN kehamilan k ON k.forkey_ibu = i.id
    LEFT JOIN antenatal_care ac ON ac.forkey_hamil = k.id
    LEFT JOIN persalinan ps ON ps.forkey_hamil = k.id
    LEFT JOIN kunjungan_nifas kn ON kn.forkey_hamil = k.id
    LEFT JOIN komplikasi ko ON ko.forkey_hamil = k.id
    WHERE 1=1 ${kelurahanFilter} ${dateWherePersalinan} ${dateWhereNifas}
    GROUP BY kel.id, kel.nama_kelurahan
    ORDER BY kel.nama_kelurahan
  `;

  const [kelurahanData] = await pool.query(query, [...kelurahanParams, ...dateParamsPersalinan, ...dateParamsNifas]);

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


function populatePersalinanNifasRow(row, stat) {
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
    
    // Handle komplikasi_persalinannifas with nested names (e.g., preeklamsia/eklamsia)
    if (metric.includes('komplikasi_persalinannifas_')) {
      const komplikasiMatch = metric.match(/komplikasi_persalinannifas_([^_]+(?:\/[^_]+)?)_(jumlah|persen)/);
      if (komplikasiMatch) {
        const komplikasiType = komplikasiMatch[1].replace('/', '');
        const valueType = komplikasiMatch[2];
        const baseMetric = `komplikasi_persalinannifas_${komplikasiType}`;
        
        if (valueType === 'persen') {
          const count = stat[baseMetric] || 0;
          const denominator = stat.jumlahbersalin || 1;
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
      let denominator = stat.jumlahbersalin || 1;
      let count = stat[baseMetric] || 0;
      
      // Special denominators for specific metrics
      if (baseMetric.includes('persalinan_ditolongnakes') || baseMetric.includes('persalinan_ditolongnonnakes')) {
        denominator = stat.jumlahbersalin || 1;
      } else if (baseMetric.includes('persalinan_di_faskes') || baseMetric.includes('persalinan_di_nonfaskes')) {
        denominator = stat.jumlahbersalin || 1;
      } else if (baseMetric.includes('pelayanan_nifas_kf')) {
        denominator = stat.jumlahbersalin || 1;
      } else if (baseMetric.includes('pelayanan_nifas_mendapat')) {
        denominator = stat.jumlahbersalin || 1;
      } else if (baseMetric.includes('komplikasi_persalinannifas')) {
        denominator = stat.jumlahbersalin || 1;
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
      } else if (metric.startsWith('persalinan_')) {
        cell.value = stat[metric] || 0;
      } else if (metric.startsWith('pelayanan_nifas_')) {
        cell.value = stat[metric] || 0;
      } else if (metric.startsWith('komplikasi_persalinannifas_')) {
        cell.value = stat[metric] || 0;
      } else {
        cell.value = stat[metric] || 0;
      }
    }
  });
}

module.exports = { populatePersalinanNifas };
