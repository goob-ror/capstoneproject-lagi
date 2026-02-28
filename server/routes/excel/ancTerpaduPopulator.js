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

  console.log('ANC Terpadu Query Params:', { kelurahanParams, dateParamsANC, dateWhereANC });

  const query = `
    SELECT 
      kel.nama_kelurahan as kelurahan,
      
      -- Basic counts - count mothers directly from ibu table (consistent with ancPopulator)
      COUNT(DISTINCT i.id) as jumlahbumil,
      COUNT(DISTINCT CASE WHEN ps.id IS NOT NULL THEN k.forkey_ibu END) as jumlahbersalin,
      
      -- Trimester counts (based on weeks from HPHT)
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
      
      -- TM1 Anemia screening
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 
        AND ls.hasil_lab_hb IS NOT NULL
        THEN ac.id 
      END) as tm1_diperiksa,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 
        AND ls.hasil_lab_hb < 8 
        THEN ac.id 
      END) as tm1_anemia_berat,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 
        AND ls.hasil_lab_hb >= 8 AND ls.hasil_lab_hb < 10 
        THEN ac.id 
      END) as tm1_anemia_sedang,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 
        AND ls.hasil_lab_hb >= 10 AND ls.hasil_lab_hb < 11 
        THEN ac.id 
      END) as tm1_anemia_ringan,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 
        AND ls.hasil_lab_hb < 11 
        THEN ac.id 
      END) as tm1_jumlah_anemia,
      
      -- TM2 Anemia screening
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 
        AND ls.hasil_lab_hb IS NOT NULL
        THEN ac.id 
      END) as tm2_diperiksa,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 
        AND ls.hasil_lab_hb < 8 
        THEN ac.id 
      END) as tm2_anemia_berat,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 
        AND ls.hasil_lab_hb >= 8 AND ls.hasil_lab_hb < 10 
        THEN ac.id 
      END) as tm2_anemia_sedang,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 
        AND ls.hasil_lab_hb >= 10 AND ls.hasil_lab_hb < 11 
        THEN ac.id 
      END) as tm2_anemia_ringan,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 
        AND ls.hasil_lab_hb < 11 
        THEN ac.id 
      END) as tm2_jumlah_anemia,
      
      -- TM3 Anemia screening
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 
        AND ls.hasil_lab_hb IS NOT NULL
        THEN ac.id 
      END) as tm3_diperiksa,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 
        AND ls.hasil_lab_hb < 8 
        THEN ac.id 
      END) as tm3_anemia_berat,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 
        AND ls.hasil_lab_hb >= 8 AND ls.hasil_lab_hb < 10 
        THEN ac.id 
      END) as tm3_anemia_sedang,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 
        AND ls.hasil_lab_hb >= 10 AND ls.hasil_lab_hb < 11 
        THEN ac.id 
      END) as tm3_anemia_ringan,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 
        AND ls.hasil_lab_hb < 11 
        THEN ac.id 
      END) as tm3_jumlah_anemia,
      
      -- Total anemia statistics (pregnant mothers with anemia)
      COUNT(DISTINCT CASE 
        WHEN ls.hasil_lab_hb < 11 
        THEN k.forkey_ibu 
      END) as bumilanemia,
      COUNT(DISTINCT CASE 
        WHEN ls.hasil_lab_hb < 8 
        THEN k.forkey_ibu 
      END) as anemiaberat,
      COUNT(DISTINCT CASE 
        WHEN ls.hasil_lab_hb >= 8 AND ls.hasil_lab_hb < 10 
        THEN k.forkey_ibu 
      END) as anemiasedang,
      COUNT(DISTINCT CASE 
        WHEN ls.hasil_lab_hb >= 10 AND ls.hasil_lab_hb < 11 
        THEN k.forkey_ibu 
      END) as anemiaringan,
      COUNT(DISTINCT CASE 
        WHEN ls.hasil_lab_hb < 10 
        THEN k.forkey_ibu 
      END) as anemiasedangberat,
      
      -- Anemia management (tatalaksana) - based on komplikasi table
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%Anemia%' 
        AND ko.kejadian = 'Saat Hamil'
        AND ls.hasil_lab_hb < 10
        AND ko.terapi_diberikan IS NOT NULL
        THEN k.forkey_ibu 
      END) as sedangberat_tatalaksana,
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%Anemia%' 
        AND ko.kejadian = 'Saat Hamil'
        AND ls.hasil_lab_hb >= 10 AND ls.hasil_lab_hb < 11
        AND ko.terapi_diberikan IS NOT NULL
        THEN k.forkey_ibu 
      END) as anemiaringan_naikhb,
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%Anemia%' 
        AND ko.kejadian = 'Saat Hamil'
        AND ls.hasil_lab_hb < 8
        AND ko.rujuk_rs = 1
        THEN k.forkey_ibu 
      END) as anemiaberat_rujukrs,
      
      -- LILA/KEK screening (<23.5 cm)
      COUNT(DISTINCT CASE WHEN ac.lila IS NOT NULL THEN ac.id END) as diperiksalila,
      COUNT(DISTINCT CASE WHEN ac.lila < 23.5 THEN ac.id END) as kek,
      COUNT(DISTINCT CASE 
        WHEN ac.lila < 23.5 
        AND ko.nama_komplikasi LIKE '%KEK%'
        AND ko.terapi_diberikan IS NOT NULL
        THEN k.forkey_ibu 
      END) as kek_gizi,
      COUNT(DISTINCT CASE 
        WHEN ac.lila < 23.5 
        AND ko.nama_komplikasi LIKE '%KEK%'
        AND ko.terapi_diberikan IS NOT NULL
        THEN k.forkey_ibu 
      END) as kek_tatalaksana,
      
      -- BMI categories (calculated from ibu table)
      COUNT(DISTINCT CASE 
        WHEN i.beratbadan IS NOT NULL AND i.tinggi_badan IS NOT NULL 
        THEN k.forkey_ibu 
      END) as diperiksa_bmitm1,
      COUNT(DISTINCT CASE 
        WHEN (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) < 18.5 
        THEN k.forkey_ibu 
      END) as bmikurus,
      COUNT(DISTINCT CASE 
        WHEN (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 18.5 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) < 25 
        THEN k.forkey_ibu 
      END) as bminormal,
      COUNT(DISTINCT CASE 
        WHEN (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 25 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) < 30 
        THEN k.forkey_ibu 
      END) as bmigemuk,
      COUNT(DISTINCT CASE 
        WHEN (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 30 
        THEN k.forkey_ibu 
      END) as bmiobesitas,
      
      -- BMI tracking (weight changes - simplified as we don't have historical weight data)
      COUNT(DISTINCT CASE 
        WHEN (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) < 18.5 
        AND ac.berat_badan > i.beratbadan
        THEN k.forkey_ibu 
      END) as bmikurus_naik,
      COUNT(DISTINCT CASE 
        WHEN (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 18.5 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) < 25 
        AND ac.berat_badan > i.beratbadan
        THEN k.forkey_ibu 
      END) as bminormal_naik,
      COUNT(DISTINCT CASE 
        WHEN (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 18.5 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) < 25 
        AND ac.berat_badan < i.beratbadan
        THEN k.forkey_ibu 
      END) as bminormal_turun,
      
      -- BMI by trimester with LILA
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 
        AND ac.lila IS NOT NULL
        THEN ac.id 
      END) as tm1_liladiperiksa,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) < 18.5 
        THEN ac.id 
      END) as tm1_bmikurus,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 18.5 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) < 25 
        THEN ac.id 
      END) as tm1_bminormal,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 25 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) < 30 
        THEN ac.id 
      END) as tm1_bmigemuk,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 <= 13 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 30 
        THEN ac.id 
      END) as tm1_bmiobesitas,
      
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 
        AND ac.lila IS NOT NULL
        THEN ac.id 
      END) as tm2_liladiperiksa,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) < 18.5 
        THEN ac.id 
      END) as tm2_bmikurus,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 18.5 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) < 25 
        THEN ac.id 
      END) as tm2_bminormal,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 25 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) < 30 
        THEN ac.id 
      END) as tm2_bmigemuk,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 BETWEEN 14 AND 27 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 30 
        THEN ac.id 
      END) as tm2_bmiobesitas,
      
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 
        AND ac.lila IS NOT NULL
        THEN ac.id 
      END) as tm3_liladiperiksa,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) < 18.5 
        THEN ac.id 
      END) as tm3_bmikurus,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 18.5 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) < 25 
        THEN ac.id 
      END) as tm3_bminormal,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 25 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) < 30 
        THEN ac.id 
      END) as tm3_bmigemuk,
      COUNT(DISTINCT CASE 
        WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) / 7 >= 28 
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 30 
        THEN ac.id 
      END) as tm3_bmiobesitas,
      
      -- Protein urine screening
      COUNT(DISTINCT CASE WHEN ls.lab_protein_urine IS NOT NULL THEN ac.id END) as skriningproteinurin,
      COUNT(DISTINCT CASE WHEN ls.lab_protein_urine = '+1' THEN ac.id END) as positif1,
      COUNT(DISTINCT CASE WHEN ls.lab_protein_urine = '+2' THEN ac.id END) as positif2,
      COUNT(DISTINCT CASE WHEN ls.lab_protein_urine = '+3' THEN ac.id END) as positif3,
      COUNT(DISTINCT CASE WHEN ls.lab_protein_urine = '+4' THEN ac.id END) as positif4,
      
      -- Blood sugar screening (assuming values: <140 ringan, 140-200 sedang, >200 berat)
      COUNT(DISTINCT CASE WHEN ls.lab_gula_darah IS NOT NULL THEN ac.id END) as diperiksaguladarah,
      COUNT(DISTINCT CASE 
        WHEN ls.lab_gula_darah IS NOT NULL 
        AND ls.lab_gula_darah REGEXP '^[0-9]+\\.?[0-9]*$'
        AND CAST(ls.lab_gula_darah AS DECIMAL(10,2)) < 140 
        THEN ac.id 
      END) as guladarah_ringan,
      COUNT(DISTINCT CASE 
        WHEN ls.lab_gula_darah IS NOT NULL 
        AND ls.lab_gula_darah REGEXP '^[0-9]+\\.?[0-9]*$'
        AND CAST(ls.lab_gula_darah AS DECIMAL(10,2)) >= 140 
        AND CAST(ls.lab_gula_darah AS DECIMAL(10,2)) <= 200 
        THEN ac.id 
      END) as guladarah_sedang,
      COUNT(DISTINCT CASE 
        WHEN ls.lab_gula_darah IS NOT NULL 
        AND ls.lab_gula_darah REGEXP '^[0-9]+\\.?[0-9]*$'
        AND CAST(ls.lab_gula_darah AS DECIMAL(10,2)) > 200 
        THEN ac.id 
      END) as guladarah_berat,
      
      -- HIV screening
      COUNT(DISTINCT CASE WHEN ls.skrining_hiv IS NOT NULL AND ls.skrining_hiv != 'Belum Diperiksa' THEN ac.id END) as diperiksaahiv,
      COUNT(DISTINCT CASE WHEN ls.skrining_hiv = 'Reaktif' THEN ac.id END) as hivpositif,
      COUNT(DISTINCT CASE 
        WHEN ls.skrining_hiv = 'Reaktif' 
        AND ls.status_art IN ('Sedang ART', 'Belum ART')
        THEN ac.id 
      END) as bumil_mendapatart,
      COUNT(DISTINCT CASE 
        WHEN ls.skrining_hiv = 'Reaktif' 
        AND ps.id IS NOT NULL 
        AND ps.cara_persalinan = 'Spontan'
        THEN k.forkey_ibu 
      END) as hiv_persalinannormal,
      COUNT(DISTINCT CASE 
        WHEN ls.skrining_hiv = 'Reaktif' 
        AND ps.id IS NOT NULL 
        AND ps.cara_persalinan = 'Sectio'
        THEN k.forkey_ibu 
      END) as hiv_persalinansectio,
      
      -- Malaria screening
      COUNT(DISTINCT CASE WHEN ls.status_malaria IS NOT NULL AND ls.status_malaria != 'Belum Diperiksa' THEN ac.id END) as diperiksamalaria,
      COUNT(DISTINCT CASE WHEN ls.status_malaria = 'Positif' THEN ac.id END) as positifmalaria,
      COUNT(DISTINCT CASE 
        WHEN ls.status_malaria = 'Positif' 
        AND ls.terapi_malaria = 1
        THEN ac.id 
      END) as malariatatalaksana,
      
      -- Worm infection (kecacingan) screening
      COUNT(DISTINCT CASE WHEN ls.status_kecacingan IS NOT NULL AND ls.status_kecacingan != 'Belum Diperiksa' THEN ac.id END) as diperiksacacingan,
      COUNT(DISTINCT CASE WHEN ls.status_kecacingan = 'Positif' THEN ac.id END) as positifcacingan,
      COUNT(DISTINCT CASE 
        WHEN ls.status_kecacingan = 'Positif' 
        AND ls.terapi_kecacingan = 1
        THEN ac.id 
      END) as cacingantatalaksana,
      
      -- STI/IMS screening (sifilis, gonorea, klamidia)
      COUNT(DISTINCT CASE 
        WHEN (ls.skrining_sifilis IS NOT NULL AND ls.skrining_sifilis != 'Belum Diperiksa')
        OR (ls.skrining_gonorea IS NOT NULL AND ls.skrining_gonorea != 'Belum Diperiksa')
        OR (ls.skrining_klamidia IS NOT NULL AND ls.skrining_klamidia != 'Belum Diperiksa')
        THEN ac.id 
      END) as diperiksaims,
      COUNT(DISTINCT CASE 
        WHEN ls.skrining_sifilis = 'Reaktif' 
        OR ls.skrining_gonorea = 'Reaktif' 
        OR ls.skrining_klamidia = 'Reaktif' 
        THEN ac.id 
      END) as positifims,
      COUNT(DISTINCT CASE 
        WHEN (ls.skrining_sifilis = 'Reaktif' 
        OR ls.skrining_gonorea = 'Reaktif' 
        OR ls.skrining_klamidia = 'Reaktif')
        AND ko.nama_komplikasi LIKE '%Sifilis%'
        AND ko.terapi_diberikan IS NOT NULL
        THEN k.forkey_ibu 
      END) as imstatalaksana,
      
      -- HBsAg screening
      COUNT(DISTINCT CASE WHEN ls.skrining_hbsag IS NOT NULL AND ls.skrining_hbsag != 'Belum Diperiksa' THEN ac.id END) as diperiksahbsag,
      COUNT(DISTINCT CASE WHEN ls.skrining_hbsag = 'Reaktif' THEN ac.id END) as positifhbsag,
      COUNT(DISTINCT CASE 
        WHEN ls.skrining_hbsag = 'Reaktif' 
        AND ko.nama_komplikasi LIKE '%Hepatitis%'
        AND ko.terapi_diberikan IS NOT NULL
        THEN k.forkey_ibu 
      END) as hbsagtatalaksana,
      
      -- Complications during pregnancy - detected from actual screening data
      -- Anemia: detected from lab HB results
      COUNT(DISTINCT CASE 
        WHEN ls.hasil_lab_hb < 11
        THEN k.forkey_ibu 
      END) as komplikasi_anc_anemia,
      
      -- KEK: detected from LILA measurement
      COUNT(DISTINCT CASE 
        WHEN ac.lila < 23.5
        THEN k.forkey_ibu 
      END) as komplikasi_anc_kek,
      
      -- Preeklampsia/Eklamsia: detected from high blood pressure and protein urine
      COUNT(DISTINCT CASE 
        WHEN ac.tekanan_darah IS NOT NULL
        AND (
          CAST(SUBSTRING_INDEX(ac.tekanan_darah, '/', 1) AS UNSIGNED) >= 140
          OR CAST(SUBSTRING_INDEX(ac.tekanan_darah, '/', -1) AS UNSIGNED) >= 90
        )
        AND ls.lab_protein_urine IN ('+1', '+2', '+3', '+4')
        THEN k.forkey_ibu 
      END) as komplikasi_anc_preeklamsiaeklamsia,
      
      -- Infeksi: detected from various infection screenings or komplikasi table
      COUNT(DISTINCT CASE 
        WHEN (ko.nama_komplikasi LIKE '%Infeksi%' AND ko.kejadian = 'Saat Hamil')
        OR ls.skrining_tb = 'Positif'
        OR ls.status_kecacingan = 'Positif'
        THEN k.forkey_ibu 
      END) as komplikasi_anc_infeksi,
      
      -- Tuberculosis: detected from TB screening
      COUNT(DISTINCT CASE 
        WHEN ls.skrining_tb IN ('Positif', 'Suspek')
        THEN k.forkey_ibu 
      END) as komplikasi_anc_tuberculosis,
      
      -- Malaria: detected from malaria screening
      COUNT(DISTINCT CASE 
        WHEN ls.status_malaria = 'Positif'
        THEN k.forkey_ibu 
      END) as komplikasi_anc_malaria,
      
      -- HIV: detected from HIV screening
      COUNT(DISTINCT CASE 
        WHEN ls.skrining_hiv = 'Reaktif'
        THEN k.forkey_ibu 
      END) as komplikasi_anc_hiv,
      
      -- Jantung: from komplikasi table (no direct screening)
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%Jantung%' 
        AND ko.kejadian = 'Saat Hamil'
        THEN k.forkey_ibu 
      END) as komplikasi_anc_jantung,
      
      -- Diabetes: detected from high blood sugar
      COUNT(DISTINCT CASE 
        WHEN ls.lab_gula_darah IS NOT NULL 
        AND ls.lab_gula_darah REGEXP '^[0-9]+\\.?[0-9]*$'
        AND CAST(ls.lab_gula_darah AS DECIMAL(10,2)) >= 140
        THEN k.forkey_ibu 
      END) as komplikasi_anc_diabetes_melitus,
      
      -- Obesitas: detected from BMI >= 30
      COUNT(DISTINCT CASE 
        WHEN i.beratbadan IS NOT NULL 
        AND i.tinggi_badan IS NOT NULL
        AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 30
        THEN k.forkey_ibu 
      END) as komplikasi_anc_obesitas,
      
      -- Keguguran: from komplikasi table
      COUNT(DISTINCT CASE 
        WHEN ko.nama_komplikasi LIKE '%Keguguran%' 
        AND ko.kejadian = 'Saat Hamil'
        THEN k.forkey_ibu 
      END) as komplikasi_anc_keguguran,
      
      -- Other complications: from komplikasi table (excluding the ones above)
      COUNT(DISTINCT CASE 
        WHEN ko.kejadian = 'Saat Hamil'
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
      END) as komplikasi_anc_lainlain,
      
      -- Total bumil with any complication (from screening data OR komplikasi table)
      COUNT(DISTINCT CASE 
        WHEN (ls.hasil_lab_hb < 11)  -- Anemia
        OR (ac.lila < 23.5)  -- KEK
        OR (ac.tekanan_darah IS NOT NULL AND (
          CAST(SUBSTRING_INDEX(ac.tekanan_darah, '/', 1) AS UNSIGNED) >= 140
          OR CAST(SUBSTRING_INDEX(ac.tekanan_darah, '/', -1) AS UNSIGNED) >= 90
        ) AND ls.lab_protein_urine IN ('+1', '+2', '+3', '+4'))  -- Preeklampsia
        OR (ls.skrining_tb IN ('Positif', 'Suspek'))  -- TB
        OR (ls.status_malaria = 'Positif')  -- Malaria
        OR (ls.skrining_hiv = 'Reaktif')  -- HIV
        OR (ls.lab_gula_darah IS NOT NULL AND ls.lab_gula_darah REGEXP '^[0-9]+\\.?[0-9]*$' 
            AND CAST(ls.lab_gula_darah AS DECIMAL(10,2)) >= 140)  -- Diabetes
        OR (i.beratbadan IS NOT NULL AND i.tinggi_badan IS NOT NULL 
            AND (i.beratbadan / POWER(i.tinggi_badan / 100, 2)) >= 30)  -- Obesitas
        OR (ko.kejadian = 'Saat Hamil')  -- Any komplikasi record
        THEN k.forkey_ibu 
      END) as komplikasi_anc_bumil,
      
      -- Total bumil referred to hospital
      COUNT(DISTINCT CASE 
        WHEN ko.kejadian = 'Saat Hamil'
        AND ko.rujuk_rs = 1
        THEN k.forkey_ibu 
      END) as komplikasi_anc_bumil_rujukrs
      
    FROM kelurahan kel
    LEFT JOIN ibu i ON i.kelurahan_id = kel.id
    LEFT JOIN kehamilan k ON k.forkey_ibu = i.id
    LEFT JOIN antenatal_care ac ON ac.forkey_hamil = k.id
    LEFT JOIN lab_screening ls ON ls.id = ac.forkey_lab_screening
    LEFT JOIN persalinan ps ON ps.forkey_hamil = k.id
    LEFT JOIN komplikasi ko ON ko.forkey_hamil = k.id
    WHERE 1=1 ${kelurahanFilter} ${dateWhereANC}
    GROUP BY kel.id, kel.nama_kelurahan
    ORDER BY kel.nama_kelurahan
  `;

  try {
    const [kelurahanData] = await pool.query(query, [...kelurahanParams, ...dateParamsANC]);

    console.log('ANC Terpadu query executed successfully, rows:', kelurahanData.length);

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
  } catch (error) {
    console.error('ANC Terpadu SQL Error:', error.message);
    console.error('SQL:', error.sql);
    console.error('SQL Message:', error.sqlMessage);
    throw error;
  }
}


function populateANCTerpaduRow(row, stat) {
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
    
    // Handle special cases for +1, +2, +3, +4 (protein urine)
    if (metric.includes('positif+')) {
      const plusNum = metric.match(/positif\+(\d)/)?.[1];
      if (plusNum) {
        const baseMetric = `positif${plusNum}`;
        if (isPercentage) {
          const count = stat[baseMetric] || 0;
          const denominator = stat.skriningproteinurin || 1;
          const percentage = denominator > 0 ? Math.round((count / denominator) * 100) : 0;
          cell.value = percentage + '%';
        } else if (isJumlah) {
          cell.value = stat[baseMetric] || 0;
        }
        return;
      }
    }
    
    // Handle komplikasi_anc with nested names (e.g., preeklamsia/eklamsia)
    if (metric.includes('komplikasi_anc_')) {
      const komplikasiMatch = metric.match(/komplikasi_anc_([^_]+(?:\/[^_]+)?)_(jumlah|persen)/);
      if (komplikasiMatch) {
        const komplikasiType = komplikasiMatch[1].replace('/', '');
        const valueType = komplikasiMatch[2];
        const baseMetric = `komplikasi_anc_${komplikasiType}`;
        
        if (valueType === 'persen') {
          const count = stat[baseMetric] || 0;
          const denominator = stat.jumlahbumil || 1;
          const percentage = denominator > 0 ? Math.round((count / denominator) * 100) : 0;
          cell.value = percentage + '%';
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
      
      // Special denominators for specific metrics
      if (baseMetric.includes('anemia') && baseMetric.match(/tm\d/)) {
        // Trimester anemia percentages use trimester diperiksa as denominator
        const trimester = baseMetric.match(/tm(\d)/)?.[1];
        if (trimester) {
          denominator = stat[`tm${trimester}_diperiksa`] || 1;
        }
      } else if (baseMetric === 'bumilanemia' || baseMetric.includes('anemia')) {
        // Total anemia percentages use total pregnant mothers
        denominator = stat.jumlahbumil || 1;
      } else if (baseMetric.includes('sedangberat_tatalaksana')) {
        denominator = stat.anemiasedangberat || 1;
      } else if (baseMetric.includes('anemiaringan_naikhb')) {
        denominator = stat.anemiaringan || 1;
      } else if (baseMetric.includes('anemiaberat_rujukrs')) {
        denominator = stat.anemiaberat || 1;
      } else if (baseMetric === 'diperiksalila' || baseMetric === 'kek' || baseMetric === 'kek_gizi' || baseMetric === 'kek_tatalaksana') {
        denominator = stat.jumlahbumil || 1;
      } else if (baseMetric.includes('bmi') || baseMetric.includes('diperiksa_bmitm')) {
        denominator = stat.jumlahbumil || 1;
      } else if (baseMetric.includes('bmikurus_naik')) {
        denominator = stat.bmikurus || 1;
      } else if (baseMetric.includes('bminormal_naik') || baseMetric.includes('bminormal_turun')) {
        denominator = stat.bminormal || 1;
      } else if (baseMetric.includes('skriningproteinurin') || baseMetric.includes('positif')) {
        denominator = stat.jumlahbumil || 1;
      } else if (baseMetric.includes('guladarah')) {
        if (baseMetric === 'diperiksaguladarah') {
          denominator = stat.jumlahbumil || 1;
        } else {
          denominator = stat.diperiksaguladarah || 1;
        }
      } else if (baseMetric.includes('hiv')) {
        if (baseMetric === 'diperiksaahiv') {
          denominator = stat.jumlahbumil || 1;
        } else if (baseMetric === 'hivpositif') {
          denominator = stat.diperiksaahiv || 1;
        } else if (baseMetric === 'bumil_mendapatart') {
          denominator = stat.hivpositif || 1;
        }
      } else if (baseMetric.includes('malaria')) {
        if (baseMetric === 'diperiksamalaria') {
          denominator = stat.jumlahbumil || 1;
        } else if (baseMetric === 'positifmalaria') {
          denominator = stat.diperiksamalaria || 1;
        } else if (baseMetric === 'malariatatalaksana') {
          denominator = stat.positifmalaria || 1;
        }
      } else if (baseMetric.includes('cacingan')) {
        if (baseMetric === 'diperiksacacingan') {
          denominator = stat.jumlahbumil || 1;
        } else if (baseMetric === 'positifcacingan') {
          denominator = stat.diperiksacacingan || 1;
        } else if (baseMetric === 'cacingantatalaksana') {
          denominator = stat.positifcacingan || 1;
        }
      } else if (baseMetric.includes('ims')) {
        if (baseMetric === 'diperiksaims') {
          denominator = stat.jumlahbumil || 1;
        } else if (baseMetric === 'positifims') {
          denominator = stat.diperiksaims || 1;
        } else if (baseMetric === 'imstatalaksana') {
          denominator = stat.positifims || 1;
        }
      } else if (baseMetric.includes('hbsag')) {
        if (baseMetric === 'diperiksahbsag') {
          denominator = stat.jumlahbumil || 1;
        } else if (baseMetric === 'positifhbsag') {
          denominator = stat.diperiksahbsag || 1;
        } else if (baseMetric === 'hbsagtatalaksana') {
          denominator = stat.positifhbsag || 1;
        }
      } else if (baseMetric.includes('komplikasi_anc')) {
        denominator = stat.jumlahbumil || 1;
      }
      
      const percentage = denominator > 0 ? Math.round((count / denominator) * 100) : 0;
      cell.value = percentage + '%';
      
    } else if (isJumlah) {
      // Extract the base metric name (remove jumlah_)
      const baseMetric = metric.replace('jumlah_', '');
      cell.value = stat[baseMetric] || 0;
      
    } else {
      // Direct field mapping (no jumlah/persen prefix)
      // Handle special cases
      if (metric === 'jumlahbumil' || metric === 'jumlahbersalin') {
        cell.value = stat[metric] || 0;
      } else if (metric.startsWith('bumil_tm')) {
        cell.value = stat[metric] || 0;
      } else if (metric.startsWith('tm') && metric.includes('_')) {
        // Trimester metrics like tm1_diperiksa, tm1_anemia_berat, etc.
        cell.value = stat[metric] || 0;
      } else if (metric.startsWith('hiv_persalinan')) {
        // HIV delivery type metrics
        cell.value = stat[metric] || 0;
      } else {
        cell.value = stat[metric] || 0;
      }
    }
  });
}

module.exports = { populateANCTerpadu };
