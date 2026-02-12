const pool = require('./database/db');

/**
 * Excel Data Service - Generates data for all Excel template placeholders
 * Based on the detected placeholders from your template
 */
class ExcelDataService {
  
  /**
   * Generate complete data for all placeholders
   */
  async generateAllData(filters = {}) {
    const { kelurahan, year, month, startDate, endDate } = filters;
    
    try {
      console.log('Generating complete Excel data with filters:', filters);
      
      // Disable ONLY_FULL_GROUP_BY for this session
      await pool.query("SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");
      
      const data = {};
      
      // 1. Common data (used across all sheets)
      data.tanggal_laporan = new Date().toLocaleDateString('id-ID');
      data.nama_puskesmas = 'Puskesmas Jambi Selatan';
      
      // 2. Generate kelurahan-specific data (Sheet 2 ANC)
      const kelurahanData = await this.generateKelurahanData(filters);
      Object.assign(data, kelurahanData);
      
      // 3. Generate totals data (Sheet 2 ANC)
      const totalsData = await this.generateTotalsData(filters);
      Object.assign(data, totalsData);
      
      // 4. Generate Sheet 3 ANC Terpadu data (hemoglobin, anemia, KEK, BMI, screening)
      const ancTerpaduData = await this.generateANCTerpaduData(filters);
      Object.assign(data, ancTerpaduData);
      
      // 5. Generate Sheet 4 Persalinan Nifas data
      const persalinanNifasData = await this.generatePersalinanNifasData(filters);
      Object.assign(data, persalinanNifasData);
      
      // 6. Generate Sheet 5 Komplikasi data
      const komplikasiData = await this.generateKomplikasiData(filters);
      Object.assign(data, komplikasiData);
      
      // 7. Generate Sheet 1 Patient Data (will be handled separately for row-by-row data)
      const patientData = await this.generatePatientData(filters);
      Object.assign(data, patientData);
      
      console.log(`Generated data for ${Object.keys(data).length} placeholders`);
      return data;
      
    } catch (error) {
      console.error('Error generating Excel data:', error);
      throw error;
    }
  }

  /**
   * Generate data for all kelurahan (Simpang Pasir, Rawa Makmur, Handil Bakti)
   */
  async generateKelurahanData(filters) {
    const data = {};
    
    // Kelurahan mapping
    const kelurahanList = [
      { key: 'simpangpasir', name: 'Simpang Pasir' },
      { key: 'rawamakmur', name: 'Rawa Makmur' },
      { key: 'handilbakti', name: 'Handil Bakti' }
    ];
    
    const dateFilters = this.buildDateFilters(filters);
    
    for (const kelurahan of kelurahanList) {
      console.log(`Calculating data for ${kelurahan.name}...`);
      
      const kelurahanFilter = 'AND kel.nama_kelurahan = ?';
      const kelurahanParams = [kelurahan.name];
      
      try {
        // 1. Jumlah Bumil (Pregnant mothers)
        const bumilQuery = `
          SELECT COUNT(DISTINCT i.id) as count 
          FROM kehamilan k 
          INNER JOIN ibu i ON k.forkey_ibu = i.id 
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          WHERE k.status_kehamilan = 'Hamil' ${kelurahanFilter}`;
        const [bumilResult] = await pool.query(bumilQuery, kelurahanParams);
        data[`${kelurahan.key}_jumlahbumil`] = bumilResult[0].count;
        
        // 2. Jumlah Bersalin (Deliveries)
        const bersalinQuery = `
          SELECT COUNT(*) as count 
          FROM persalinan p
          INNER JOIN kehamilan k ON p.forkey_hamil = k.id
          INNER JOIN ibu i ON k.forkey_ibu = i.id 
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          WHERE 1=1 ${kelurahanFilter} ${dateFilters.persalinan.where}`;
        const [bersalinResult] = await pool.query(bersalinQuery, [...kelurahanParams, ...dateFilters.persalinan.params]);
        data[`${kelurahan.key}_jumlahbersalin`] = bersalinResult[0].count;
        
        // 3. Jumlah Resti (High risk pregnancies)
        const restiQuery = `
          SELECT COUNT(DISTINCT k.id) as count 
          FROM antenatal_care ac
          INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
          INNER JOIN ibu i ON k.forkey_ibu = i.id 
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          WHERE ac.status_risiko_visit = 'Risiko Tinggi' ${kelurahanFilter} ${dateFilters.anc.where}`;
        const [restiResult] = await pool.query(restiQuery, [...kelurahanParams, ...dateFilters.anc.params]);
        data[`${kelurahan.key}_jumlahresti`] = restiResult[0].count;
        
        // 4. Memiliki Buku KIA
        const bukuKiaQuery = `
          SELECT 
            COUNT(DISTINCT i.id) as total_ibu,
            SUM(CASE WHEN i.buku_kia = 'Ada' THEN 1 ELSE 0 END) as with_buku_kia
          FROM ibu i
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          INNER JOIN kehamilan k ON k.forkey_ibu = i.id
          WHERE k.status_kehamilan = 'Hamil' ${kelurahanFilter}`;
        const [bukuKiaResult] = await pool.query(bukuKiaQuery, kelurahanParams);
        const bukuKiaCount = bukuKiaResult[0].with_buku_kia || 0;
        const bukuKiaTotal = bukuKiaResult[0].total_ibu || 0;
        data[`${kelurahan.key}_jumlah_milikibukukia`] = bukuKiaCount;
        data[`${kelurahan.key}_persen_milikibukukia`] = bukuKiaTotal > 0 ? 
          Math.round((bukuKiaCount / bukuKiaTotal) * 100 * 10) / 10 : 0;
        
        // 5. Standar 12T (Complete ANC standard - using TT immunization and Fe tablets as proxy)
        const standar12tQuery = `
          SELECT 
            COUNT(DISTINCT k.id) as total_pregnancies,
            COUNT(DISTINCT CASE WHEN ac.status_imunisasi_tt IN ('T2', 'T3', 'T4', 'T5') 
                                AND ac.beri_tablet_fe = 1 THEN k.id END) as complete_anc
          FROM kehamilan k
          INNER JOIN ibu i ON k.forkey_ibu = i.id 
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          LEFT JOIN antenatal_care ac ON ac.forkey_hamil = k.id
          WHERE k.status_kehamilan = 'Hamil' ${kelurahanFilter}`;
        const [standar12tResult] = await pool.query(standar12tQuery, kelurahanParams);
        const standar12tCount = standar12tResult[0].complete_anc || 0;
        const standar12tTotal = standar12tResult[0].total_pregnancies || 0;
        data[`${kelurahan.key}_jumlah_standar12t`] = standar12tCount;
        data[`${kelurahan.key}_persen_standar12t`] = standar12tTotal > 0 ? 
          Math.round((standar12tCount / standar12tTotal) * 100 * 10) / 10 : 0;
        
        // 6. 4 Terlalu (4T risk factors: too young <20, too old >35, too short <145cm, too many pregnancies >4)
        const terlalu4Query = `
          SELECT COUNT(DISTINCT i.id) as count 
          FROM ibu i
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          INNER JOIN kehamilan k ON k.forkey_ibu = i.id
          WHERE (
            TIMESTAMPDIFF(YEAR, i.tanggal_lahir, CURDATE()) < 20 OR 
            TIMESTAMPDIFF(YEAR, i.tanggal_lahir, CURDATE()) > 35 OR
            i.tinggi_badan < 145 OR
            (SELECT COUNT(*) FROM kehamilan k2 WHERE k2.forkey_ibu = i.id) > 4
          ) AND k.status_kehamilan = 'Hamil' ${kelurahanFilter}`;
        const [terlalu4Result] = await pool.query(terlalu4Query, kelurahanParams);
        const terlalu4Count = terlalu4Result[0].count || 0;
        data[`${kelurahan.key}_jumlah_4terlalu`] = terlalu4Count;
        data[`${kelurahan.key}_persen_4terlalu`] = data[`${kelurahan.key}_jumlahbumil`] > 0 ? 
          Math.round((terlalu4Count / data[`${kelurahan.key}_jumlahbumil`]) * 100 * 10) / 10 : 0;
        
        // 7. K1 Murni (First ANC visit in first trimester with 'Murni' access)
        const k1MurniQuery = `
          SELECT COUNT(DISTINCT k.id) as count 
          FROM antenatal_care ac
          INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
          INNER JOIN ibu i ON k.forkey_ibu = i.id 
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          WHERE ac.jenis_kunjungan = 'K1' 
            AND ac.jenis_akses = 'Murni'
            AND DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) <= 91
            ${kelurahanFilter} ${dateFilters.anc.where}`;
        const [k1MurniResult] = await pool.query(k1MurniQuery, [...kelurahanParams, ...dateFilters.anc.params]);
        const k1MurniCount = k1MurniResult[0].count || 0;
        data[`${kelurahan.key}_jumlah_k1murni`] = k1MurniCount;
        data[`${kelurahan.key}_persen_k1murni`] = data[`${kelurahan.key}_jumlahbumil`] > 0 ? 
          Math.round((k1MurniCount / data[`${kelurahan.key}_jumlahbumil`]) * 100 * 10) / 10 : 0;
        
        // 8. K1 Akses (All K1 visits - both Murni and Akses)
        const k1AksesQuery = `
          SELECT COUNT(DISTINCT k.id) as count 
          FROM antenatal_care ac
          INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
          INNER JOIN ibu i ON k.forkey_ibu = i.id 
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          WHERE ac.jenis_kunjungan = 'K1' ${kelurahanFilter} ${dateFilters.anc.where}`;
        const [k1AksesResult] = await pool.query(k1AksesQuery, [...kelurahanParams, ...dateFilters.anc.params]);
        const k1AksesCount = k1AksesResult[0].count || 0;
        data[`${kelurahan.key}_jumlah_k1akses`] = k1AksesCount;
        data[`${kelurahan.key}_persen_k1akses`] = data[`${kelurahan.key}_jumlahbumil`] > 0 ? 
          Math.round((k1AksesCount / data[`${kelurahan.key}_jumlahbumil`]) * 100 * 10) / 10 : 0;
        
        // 9. K1 Dokter (K1 visits by doctor)
        const k1DokterQuery = `
          SELECT COUNT(DISTINCT k.id) as count 
          FROM antenatal_care ac
          INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
          INNER JOIN ibu i ON k.forkey_ibu = i.id 
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          WHERE ac.jenis_kunjungan = 'K1' 
            AND ac.pemeriksa = 'Dokter'
            ${kelurahanFilter} ${dateFilters.anc.where}`;
        const [k1DokterResult] = await pool.query(k1DokterQuery, [...kelurahanParams, ...dateFilters.anc.params]);
        const k1DokterCount = k1DokterResult[0].count || 0;
        data[`${kelurahan.key}_jumlah_k1dokter`] = k1DokterCount;
        data[`${kelurahan.key}_persen_k1dokter`] = k1AksesCount > 0 ? 
          Math.round((k1DokterCount / k1AksesCount) * 100 * 10) / 10 : 0;
        
        // 10. K1 USG (K1 visits with USG confirmation)
        const k1UsgQuery = `
          SELECT COUNT(DISTINCT k.id) as count 
          FROM antenatal_care ac
          INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
          INNER JOIN ibu i ON k.forkey_ibu = i.id 
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          WHERE ac.jenis_kunjungan = 'K1' 
            AND ac.confirm_usg = 1
            ${kelurahanFilter} ${dateFilters.anc.where}`;
        const [k1UsgResult] = await pool.query(k1UsgQuery, [...kelurahanParams, ...dateFilters.anc.params]);
        const k1UsgCount = k1UsgResult[0].count || 0;
        data[`${kelurahan.key}_jumlah_k1usg`] = k1UsgCount;
        data[`${kelurahan.key}_persen_k1usg`] = k1AksesCount > 0 ? 
          Math.round((k1UsgCount / k1AksesCount) * 100 * 10) / 10 : 0;
        
        // 11. K4 (Fourth ANC visit)
        const k4Query = `
          SELECT COUNT(DISTINCT k.id) as count 
          FROM antenatal_care ac
          INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
          INNER JOIN ibu i ON k.forkey_ibu = i.id 
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          WHERE ac.jenis_kunjungan = 'K4' ${kelurahanFilter} ${dateFilters.anc.where}`;
        const [k4Result] = await pool.query(k4Query, [...kelurahanParams, ...dateFilters.anc.params]);
        const k4Count = k4Result[0].count || 0;
        data[`${kelurahan.key}_jumlah_k4`] = k4Count;
        data[`${kelurahan.key}_persen_k4`] = data[`${kelurahan.key}_jumlahbumil`] > 0 ? 
          Math.round((k4Count / data[`${kelurahan.key}_jumlahbumil`]) * 100 * 10) / 10 : 0;
        
      } catch (error) {
        console.error(`Error calculating data for ${kelurahan.name}:`, error);
        // Set default values for this kelurahan on error
        this.setDefaultKelurahanValues(data, kelurahan.key);
      }
    }
    
    return data;
  }

  /**
   * Generate totals data (sum of all kelurahan)
   */
  async generateTotalsData(filters) {
    const data = {};
    
    const dateFilters = this.buildDateFilters(filters);
    
    console.log('Calculating total/summary data...');
    
    // Apply kelurahan filter if specified
    const kelurahanFilter = filters.kelurahan ? 'AND kel.nama_kelurahan = ?' : '';
    const kelurahanParams = filters.kelurahan ? [filters.kelurahan] : [];
    
    try {
      // 1. Total Jumlah Bumil
      const totalBumilQuery = `
        SELECT COUNT(DISTINCT i.id) as count 
        FROM kehamilan k 
        INNER JOIN ibu i ON k.forkey_ibu = i.id 
        LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
        WHERE k.status_kehamilan = 'Hamil' ${kelurahanFilter}`;
      const [totalBumilResult] = await pool.query(totalBumilQuery, kelurahanParams);
      data.total_jumlahbumil = totalBumilResult[0].count;
      
      // 2. Total Jumlah Bersalin
      const totalBersalinQuery = `
        SELECT COUNT(*) as count 
        FROM persalinan p
        INNER JOIN kehamilan k ON p.forkey_hamil = k.id
        INNER JOIN ibu i ON k.forkey_ibu = i.id 
        LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
        WHERE 1=1 ${kelurahanFilter} ${dateFilters.persalinan.where}`;
      const [totalBersalinResult] = await pool.query(totalBersalinQuery, [...kelurahanParams, ...dateFilters.persalinan.params]);
      data.total_jumlahbersalin = totalBersalinResult[0].count;
      
      // 3. Total Resti
      const totalRestiQuery = `
        SELECT COUNT(DISTINCT k.id) as count 
        FROM antenatal_care ac
        INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
        INNER JOIN ibu i ON k.forkey_ibu = i.id 
        LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
        WHERE ac.status_risiko_visit = 'Risiko Tinggi' ${kelurahanFilter} ${dateFilters.anc.where}`;
      const [totalRestiResult] = await pool.query(totalRestiQuery, [...kelurahanParams, ...dateFilters.anc.params]);
      data.total_jumlahresti = totalRestiResult[0].count;
      
      // 4. Total Buku KIA
      const totalBukuKiaQuery = `
        SELECT 
          COUNT(DISTINCT i.id) as total_ibu,
          SUM(CASE WHEN i.buku_kia = 'Ada' THEN 1 ELSE 0 END) as with_buku_kia
        FROM ibu i
        LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
        INNER JOIN kehamilan k ON k.forkey_ibu = i.id
        WHERE k.status_kehamilan = 'Hamil' ${kelurahanFilter}`;
      const [totalBukuKiaResult] = await pool.query(totalBukuKiaQuery, kelurahanParams);
      const totalBukuKiaCount = totalBukuKiaResult[0].with_buku_kia || 0;
      const totalBukuKiaTotal = totalBukuKiaResult[0].total_ibu || 0;
      data.total_jumlah_milikibukukia = totalBukuKiaCount;
      data.total_persen_milikibukukia = totalBukuKiaTotal > 0 ? 
        Math.round((totalBukuKiaCount / totalBukuKiaTotal) * 100 * 10) / 10 : 0;
      
      // Continue with other totals using similar patterns...
      // For efficiency, I'll calculate the main ones and use formulas for others
      
      // 5-19. Calculate remaining totals
      const metrics = [
        { name: 'standar12t', query: `
          SELECT 
            COUNT(DISTINCT k.id) as total_pregnancies,
            COUNT(DISTINCT CASE WHEN ac.status_imunisasi_tt IN ('T2', 'T3', 'T4', 'T5') 
                                AND ac.beri_tablet_fe = 1 THEN k.id END) as complete_anc
          FROM kehamilan k
          INNER JOIN ibu i ON k.forkey_ibu = i.id 
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          LEFT JOIN antenatal_care ac ON ac.forkey_hamil = k.id
          WHERE k.status_kehamilan = 'Hamil' ${kelurahanFilter}` },
        
        { name: '4terlalu', query: `
          SELECT COUNT(DISTINCT i.id) as count 
          FROM ibu i
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          INNER JOIN kehamilan k ON k.forkey_ibu = i.id
          WHERE (
            TIMESTAMPDIFF(YEAR, i.tanggal_lahir, CURDATE()) < 20 OR 
            TIMESTAMPDIFF(YEAR, i.tanggal_lahir, CURDATE()) > 35 OR
            i.tinggi_badan < 145 OR
            (SELECT COUNT(*) FROM kehamilan k2 WHERE k2.forkey_ibu = i.id) > 4
          ) AND k.status_kehamilan = 'Hamil' ${kelurahanFilter}` },
        
        { name: 'k1murni', query: `
          SELECT COUNT(DISTINCT k.id) as count 
          FROM antenatal_care ac
          INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
          INNER JOIN ibu i ON k.forkey_ibu = i.id 
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          WHERE ac.jenis_kunjungan = 'K1' 
            AND ac.jenis_akses = 'Murni'
            AND DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) <= 91
            ${kelurahanFilter} ${dateFilters.anc.where}` },
        
        { name: 'k1akses', query: `
          SELECT COUNT(DISTINCT k.id) as count 
          FROM antenatal_care ac
          INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
          INNER JOIN ibu i ON k.forkey_ibu = i.id 
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          WHERE ac.jenis_kunjungan = 'K1' ${kelurahanFilter} ${dateFilters.anc.where}` },
        
        { name: 'k1dokter', query: `
          SELECT COUNT(DISTINCT k.id) as count 
          FROM antenatal_care ac
          INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
          INNER JOIN ibu i ON k.forkey_ibu = i.id 
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          WHERE ac.jenis_kunjungan = 'K1' 
            AND ac.pemeriksa = 'Dokter'
            ${kelurahanFilter} ${dateFilters.anc.where}` },
        
        { name: 'k1usg', query: `
          SELECT COUNT(DISTINCT k.id) as count 
          FROM antenatal_care ac
          INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
          INNER JOIN ibu i ON k.forkey_ibu = i.id 
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          WHERE ac.jenis_kunjungan = 'K1' 
            AND ac.confirm_usg = 1
            ${kelurahanFilter} ${dateFilters.anc.where}` },
        
        { name: 'k4', query: `
          SELECT COUNT(DISTINCT k.id) as count 
          FROM antenatal_care ac
          INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
          INNER JOIN ibu i ON k.forkey_ibu = i.id 
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          WHERE ac.jenis_kunjungan = 'K4' ${kelurahanFilter} ${dateFilters.anc.where}` }
      ];
      
      for (const metric of metrics) {
        try {
          const params = metric.name.includes('k1') || metric.name.includes('k4') ? 
            [...kelurahanParams, ...dateFilters.anc.params] : kelurahanParams;
          
          const [result] = await pool.query(metric.query, params);
          
          let count = 0;
          if (metric.name === 'standar12t') {
            count = result[0].complete_anc || 0;
          } else {
            count = result[0].count || 0;
          }
          
          data[`total_jumlah_${metric.name}`] = count;
          
          // Calculate percentage
          let percentage = 0;
          if (metric.name === 'k1dokter' || metric.name === 'k1usg') {
            // Percentage of K1 visits
            const k1Total = data.total_jumlah_k1akses || 0;
            percentage = k1Total > 0 ? Math.round((count / k1Total) * 100 * 10) / 10 : 0;
          } else {
            // Percentage of total pregnant mothers
            percentage = data.total_jumlahbumil > 0 ? 
              Math.round((count / data.total_jumlahbumil) * 100 * 10) / 10 : 0;
          }
          
          data[`total_persen_${metric.name}`] = percentage;
          
        } catch (error) {
          console.error(`Error calculating total for ${metric.name}:`, error);
          data[`total_jumlah_${metric.name}`] = 0;
          data[`total_persen_${metric.name}`] = 0;
        }
      }
      
    } catch (error) {
      console.error('Error calculating totals:', error);
      // Set default values for all totals
      this.setDefaultTotalValues(data);
    }
    
    return data;
  }

  /**
   * Build date filters for different query types
   */
  buildDateFilters(filters) {
    const { year, month, startDate, endDate } = filters;
    
    const buildFilter = (dateField) => {
      const conditions = [];
      const params = [];
      
      if (year) {
        conditions.push(`YEAR(${dateField}) = ?`);
        params.push(year);
      }
      if (month) {
        conditions.push(`MONTH(${dateField}) = ?`);
        params.push(month);
      }
      if (startDate) {
        conditions.push(`${dateField} >= ?`);
        params.push(startDate);
      }
      if (endDate) {
        conditions.push(`${dateField} <= ?`);
        params.push(endDate);
      }
      
      return {
        where: conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : '',
        params
      };
    };
    
    return {
      anc: buildFilter('ac.tanggal_kunjungan'),
      persalinan: buildFilter('p.tanggal_persalinan'),
      nifas: buildFilter('nf.tanggal_kunjungan'),
      komplikasi: buildFilter('ko.tanggal_diagnosis')
    };
  }

  /**
   * Set default values for kelurahan data on error
   */
  setDefaultKelurahanValues(data, kelurahanKey) {
    const metrics = [
      'jumlahbumil', 'jumlahbersalin', 'jumlahresti', 'jumlah_milikibukukia', 'persen_milikibukukia',
      'jumlah_standar12t', 'persen_standar12t', 'jumlah_4terlalu', 'persen_4terlalu',
      'jumlah_k1murni', 'persen_k1murni', 'jumlah_k1akses', 'persen_k1akses',
      'jumlah_k1dokter', 'persen_k1dokter', 'jumlah_k1usg', 'persen_k1usg',
      'jumlah_k4', 'persen_k4'
    ];
    
    metrics.forEach(metric => {
      data[`${kelurahanKey}_${metric}`] = 0;
    });
  }

  /**
   * Set default values for totals data on error
   */
  setDefaultTotalValues(data) {
    const metrics = [
      'jumlahbumil', 'jumlahbersalin', 'jumlahresti', 'jumlah_milikibukukia', 'persen_milikibukukia',
      'jumlah_standar12t', 'persen_standar12t', 'jumlah_4terlalu', 'persen_4terlalu',
      'jumlah_k1murni', 'persen_k1murni', 'jumlah_k1akses', 'persen_k1akses',
      'jumlah_k1dokter', 'persen_k1dokter', 'jumlah_k1usg', 'persen_k1usg',
      'jumlah_k4', 'persen_k4'
    ];
    
    metrics.forEach(metric => {
      data[`total_${metric}`] = 0;
    });
  }

  /**
   * Generate ANC Terpadu data (Sheet 3) - Hemoglobin, Anemia, KEK, BMI, Screening
   */
  async generateANCTerpaduData(filters) {
    const data = {};
    const dateFilters = this.buildDateFilters(filters);
    
    console.log('Generating ANC Terpadu data (Sheet 3)...');
    
    try {
      // Kelurahan list for iteration
      const kelurahanList = [
        { key: 'simpangpasir', name: 'Simpang Pasir' },
        { key: 'rawamakmur', name: 'Rawa Makmur' },
        { key: 'handilbakti', name: 'Handil Bakti' }
      ];
      
      for (const kelurahan of kelurahanList) {
        const kelurahanFilter = 'AND kel.nama_kelurahan = ?';
        const kelurahanParams = [kelurahan.name];
        
        // 1. Hemoglobin Analysis by Trimester
        const hbQuery = `
          SELECT 
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) <= 91 THEN k.id END) as tm1_diperiksa,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) <= 91 AND ls.hasil_lab_hb < 7 THEN k.id END) as tm1_anemia_berat,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) <= 91 AND ls.hasil_lab_hb BETWEEN 7 AND 9.9 THEN k.id END) as tm1_anemia_sedang,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) <= 91 AND ls.hasil_lab_hb BETWEEN 10 AND 10.9 THEN k.id END) as tm1_anemia_ringan,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) BETWEEN 92 AND 182 THEN k.id END) as tm2_diperiksa,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) BETWEEN 92 AND 182 AND ls.hasil_lab_hb < 7 THEN k.id END) as tm2_anemia_berat,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) BETWEEN 92 AND 182 AND ls.hasil_lab_hb BETWEEN 7 AND 9.9 THEN k.id END) as tm2_anemia_sedang,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) BETWEEN 92 AND 182 AND ls.hasil_lab_hb BETWEEN 10 AND 10.9 THEN k.id END) as tm2_anemia_ringan,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) > 182 THEN k.id END) as tm3_diperiksa,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) > 182 AND ls.hasil_lab_hb < 7 THEN k.id END) as tm3_anemia_berat,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) > 182 AND ls.hasil_lab_hb BETWEEN 7 AND 9.9 THEN k.id END) as tm3_anemia_sedang,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) > 182 AND ls.hasil_lab_hb BETWEEN 10 AND 10.9 THEN k.id END) as tm3_anemia_ringan
          FROM antenatal_care ac
          INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
          INNER JOIN ibu i ON k.forkey_ibu = i.id
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          LEFT JOIN lab_screening ls ON ac.forkey_lab_screening = ls.id
          WHERE k.status_kehamilan = 'Hamil' ${kelurahanFilter} ${dateFilters.anc.where}`;
        
        const [hbResult] = await pool.query(hbQuery, [...kelurahanParams, ...dateFilters.anc.params]);
        const hb = hbResult[0];
        
        // Store hemoglobin data
        ['tm1', 'tm2', 'tm3'].forEach(tm => {
          data[`${kelurahan.key}_${tm}_diperiksa`] = hb[`${tm}_diperiksa`] || 0;
          data[`${kelurahan.key}_${tm}_anemia_berat`] = hb[`${tm}_anemia_berat`] || 0;
          data[`${kelurahan.key}_${tm}_anemia_sedang`] = hb[`${tm}_anemia_sedang`] || 0;
          data[`${kelurahan.key}_${tm}_anemia_ringan`] = hb[`${tm}_anemia_ringan`] || 0;
          data[`${kelurahan.key}_${tm}_jumlah_anemia`] = (hb[`${tm}_anemia_berat`] || 0) + (hb[`${tm}_anemia_sedang`] || 0) + (hb[`${tm}_anemia_ringan`] || 0);
        });
        
        // 2. KEK (LILA < 23.5) Analysis
        const kekQuery = `
          SELECT 
            COUNT(DISTINCT CASE WHEN ac.lila IS NOT NULL THEN k.id END) as lila_diperiksa,
            COUNT(DISTINCT CASE WHEN ac.lila < 23.5 THEN k.id END) as kek_count,
            COUNT(DISTINCT CASE WHEN ac.lila < 23.5 AND ac.beri_tablet_fe = 1 THEN k.id END) as kek_mendapat_gizi
          FROM antenatal_care ac
          INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
          INNER JOIN ibu i ON k.forkey_ibu = i.id
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          WHERE k.status_kehamilan = 'Hamil' ${kelurahanFilter} ${dateFilters.anc.where}`;
        
        const [kekResult] = await pool.query(kekQuery, [...kelurahanParams, ...dateFilters.anc.params]);
        const kek = kekResult[0];
        
        data[`${kelurahan.key}_lila_diperiksa`] = kek.lila_diperiksa || 0;
        data[`${kelurahan.key}_kek_count`] = kek.kek_count || 0;
        data[`${kelurahan.key}_kek_mendapat_gizi`] = kek.kek_mendapat_gizi || 0;
        
        // 3. BMI Analysis by Trimester
        const bmiQuery = `
          SELECT 
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) <= 91 AND i.beratbadan IS NOT NULL AND i.tinggi_badan IS NOT NULL THEN k.id END) as tm1_bmi_diperiksa,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) <= 91 AND (i.beratbadan / POWER(i.tinggi_badan/100, 2)) < 18.5 THEN k.id END) as tm1_bmi_kurus,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) <= 91 AND (i.beratbadan / POWER(i.tinggi_badan/100, 2)) BETWEEN 18.5 AND 24.9 THEN k.id END) as tm1_bmi_normal,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) <= 91 AND (i.beratbadan / POWER(i.tinggi_badan/100, 2)) BETWEEN 25 AND 29.9 THEN k.id END) as tm1_bmi_gemuk,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) <= 91 AND (i.beratbadan / POWER(i.tinggi_badan/100, 2)) >= 30 THEN k.id END) as tm1_bmi_obesitas,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) BETWEEN 92 AND 182 AND i.beratbadan IS NOT NULL AND i.tinggi_badan IS NOT NULL THEN k.id END) as tm2_bmi_diperiksa,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) BETWEEN 92 AND 182 AND (i.beratbadan / POWER(i.tinggi_badan/100, 2)) < 18.5 THEN k.id END) as tm2_bmi_kurus,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) BETWEEN 92 AND 182 AND (i.beratbadan / POWER(i.tinggi_badan/100, 2)) BETWEEN 18.5 AND 24.9 THEN k.id END) as tm2_bmi_normal,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) BETWEEN 92 AND 182 AND (i.beratbadan / POWER(i.tinggi_badan/100, 2)) BETWEEN 25 AND 29.9 THEN k.id END) as tm2_bmi_gemuk,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) BETWEEN 92 AND 182 AND (i.beratbadan / POWER(i.tinggi_badan/100, 2)) >= 30 THEN k.id END) as tm2_bmi_obesitas,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) > 182 AND i.beratbadan IS NOT NULL AND i.tinggi_badan IS NOT NULL THEN k.id END) as tm3_bmi_diperiksa,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) > 182 AND (i.beratbadan / POWER(i.tinggi_badan/100, 2)) < 18.5 THEN k.id END) as tm3_bmi_kurus,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) > 182 AND (i.beratbadan / POWER(i.tinggi_badan/100, 2)) BETWEEN 18.5 AND 24.9 THEN k.id END) as tm3_bmi_normal,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) > 182 AND (i.beratbadan / POWER(i.tinggi_badan/100, 2)) BETWEEN 25 AND 29.9 THEN k.id END) as tm3_bmi_gemuk,
            COUNT(DISTINCT CASE WHEN DATEDIFF(ac.tanggal_kunjungan, k.haid_terakhir) > 182 AND (i.beratbadan / POWER(i.tinggi_badan/100, 2)) >= 30 THEN k.id END) as tm3_bmi_obesitas
          FROM antenatal_care ac
          INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
          INNER JOIN ibu i ON k.forkey_ibu = i.id
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          WHERE k.status_kehamilan = 'Hamil' ${kelurahanFilter} ${dateFilters.anc.where}`;
        
        const [bmiResult] = await pool.query(bmiQuery, [...kelurahanParams, ...dateFilters.anc.params]);
        const bmi = bmiResult[0];
        
        // Store BMI data
        ['tm1', 'tm2', 'tm3'].forEach(tm => {
          data[`${kelurahan.key}_${tm}_bmi_diperiksa`] = bmi[`${tm}_bmi_diperiksa`] || 0;
          data[`${kelurahan.key}_${tm}_bmi_kurus`] = bmi[`${tm}_bmi_kurus`] || 0;
          data[`${kelurahan.key}_${tm}_bmi_normal`] = bmi[`${tm}_bmi_normal`] || 0;
          data[`${kelurahan.key}_${tm}_bmi_gemuk`] = bmi[`${tm}_bmi_gemuk`] || 0;
          data[`${kelurahan.key}_${tm}_bmi_obesitas`] = bmi[`${tm}_bmi_obesitas`] || 0;
        });
        
        // 4. Screening Tests (Protein Urine, Gula Darah, HIV, Malaria, etc.)
        const screeningQuery = `
          SELECT 
            COUNT(DISTINCT CASE WHEN ls.lab_protein_urine IS NOT NULL THEN k.id END) as protein_urine_diperiksa,
            COUNT(DISTINCT CASE WHEN ls.lab_protein_urine = '+1' THEN k.id END) as protein_urine_plus1,
            COUNT(DISTINCT CASE WHEN ls.lab_protein_urine = '+2' THEN k.id END) as protein_urine_plus2,
            COUNT(DISTINCT CASE WHEN ls.lab_protein_urine = '+3' THEN k.id END) as protein_urine_plus3,
            COUNT(DISTINCT CASE WHEN ls.lab_protein_urine = '+4' THEN k.id END) as protein_urine_plus4,
            COUNT(DISTINCT CASE WHEN ls.lab_gula_darah IS NOT NULL THEN k.id END) as gula_darah_diperiksa,
            COUNT(DISTINCT CASE WHEN CAST(ls.lab_gula_darah AS UNSIGNED) < 140 THEN k.id END) as gula_darah_normal,
            COUNT(DISTINCT CASE WHEN CAST(ls.lab_gula_darah AS UNSIGNED) BETWEEN 140 AND 199 THEN k.id END) as gula_darah_sedang,
            COUNT(DISTINCT CASE WHEN CAST(ls.lab_gula_darah AS UNSIGNED) >= 200 THEN k.id END) as gula_darah_tinggi,
            COUNT(DISTINCT CASE WHEN ls.skrining_hiv != 'Belum Diperiksa' THEN k.id END) as hiv_diperiksa,
            COUNT(DISTINCT CASE WHEN ls.skrining_hiv = 'Reaktif' THEN k.id END) as hiv_positif,
            COUNT(DISTINCT CASE WHEN ls.skrining_hiv = 'Reaktif' AND ls.status_art = 'Sedang ART' THEN k.id END) as hiv_dapat_art,
            COUNT(DISTINCT CASE WHEN ls.status_malaria != 'Belum Diperiksa' THEN k.id END) as malaria_diperiksa,
            COUNT(DISTINCT CASE WHEN ls.status_malaria = 'Positif' THEN k.id END) as malaria_positif,
            COUNT(DISTINCT CASE WHEN ls.malaria_diberi_kelambu = 'Ya' THEN k.id END) as malaria_kelambu,
            COUNT(DISTINCT CASE WHEN ls.status_kecacingan != 'Belum Diperiksa' THEN k.id END) as kecacingan_diperiksa,
            COUNT(DISTINCT CASE WHEN ls.status_kecacingan = 'Positif' THEN k.id END) as kecacingan_positif,
            COUNT(DISTINCT CASE WHEN ls.terapi_kecacingan = 1 THEN k.id END) as kecacingan_terapi,
            COUNT(DISTINCT CASE WHEN ls.skrining_sifilis != 'Belum Diperiksa' THEN k.id END) as sifilis_diperiksa,
            COUNT(DISTINCT CASE WHEN ls.skrining_sifilis = 'Reaktif' THEN k.id END) as sifilis_positif,
            COUNT(DISTINCT CASE WHEN ls.skrining_hbsag != 'Belum Diperiksa' THEN k.id END) as hepatitis_diperiksa,
            COUNT(DISTINCT CASE WHEN ls.skrining_hbsag = 'Reaktif' THEN k.id END) as hepatitis_positif
          FROM antenatal_care ac
          INNER JOIN kehamilan k ON ac.forkey_hamil = k.id
          INNER JOIN ibu i ON k.forkey_ibu = i.id
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          LEFT JOIN lab_screening ls ON ac.forkey_lab_screening = ls.id
          WHERE k.status_kehamilan = 'Hamil' ${kelurahanFilter} ${dateFilters.anc.where}`;
        
        const [screeningResult] = await pool.query(screeningQuery, [...kelurahanParams, ...dateFilters.anc.params]);
        const screening = screeningResult[0];
        
        // Store screening data
        Object.keys(screening).forEach(key => {
          data[`${kelurahan.key}_${key}`] = screening[key] || 0;
        });
      }
      
      // Generate totals for ANC Terpadu data
      await this.generateANCTerpaduTotals(data, filters);
      
    } catch (error) {
      console.error('Error generating ANC Terpadu data:', error);
      // Set default values on error
      this.setDefaultANCTerpaduValues(data);
    }
    
    return data;
  }

  /**
   * Generate Persalinan Nifas data (Sheet 4)
   */
  async generatePersalinanNifasData(filters) {
    const data = {};
    const dateFilters = this.buildDateFilters(filters);
    
    console.log('Generating Persalinan Nifas data (Sheet 4)...');
    
    try {
      const kelurahanList = [
        { key: 'simpangpasir', name: 'Simpang Pasir' },
        { key: 'rawamakmur', name: 'Rawa Makmur' },
        { key: 'handilbakti', name: 'Handil Bakti' }
      ];
      
      for (const kelurahan of kelurahanList) {
        const kelurahanFilter = 'AND kel.nama_kelurahan = ?';
        const kelurahanParams = [kelurahan.name];
        
        // Persalinan data
        const persalinanQuery = `
          SELECT 
            COUNT(DISTINCT CASE WHEN p.penolong IN ('Bidan', 'Dokter') THEN p.id END) as persalinan_nakes,
            COUNT(DISTINCT CASE WHEN p.penolong NOT IN ('Bidan', 'Dokter') THEN p.id END) as persalinan_non_nakes,
            COUNT(DISTINCT CASE WHEN p.tempat_persalinan IN ('RS', 'Puskesmas', 'Klinik') THEN p.id END) as persalinan_fasyankes,
            COUNT(DISTINCT CASE WHEN p.tempat_persalinan NOT IN ('RS', 'Puskesmas', 'Klinik') THEN p.id END) as persalinan_non_fasyankes
          FROM persalinan p
          INNER JOIN kehamilan k ON p.forkey_hamil = k.id
          INNER JOIN ibu i ON k.forkey_ibu = i.id
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          WHERE 1=1 ${kelurahanFilter} ${dateFilters.persalinan.where}`;
        
        const [persalinanResult] = await pool.query(persalinanQuery, [...kelurahanParams, ...dateFilters.persalinan.params]);
        const persalinan = persalinanResult[0];
        
        // Nifas data
        const nifasQuery = `
          SELECT 
            COUNT(DISTINCT CASE WHEN nf.jenis_kunjungan = 'KF1' THEN nf.forkey_hamil END) as kf1,
            COUNT(DISTINCT CASE WHEN nf.jenis_kunjungan = 'KF2' THEN nf.forkey_hamil END) as kf2,
            COUNT(DISTINCT CASE WHEN nf.jenis_kunjungan = 'KF3' THEN nf.forkey_hamil END) as kf3,
            COUNT(DISTINCT CASE WHEN nf.jenis_kunjungan = 'KF4' THEN nf.forkey_hamil END) as kf4,
            COUNT(DISTINCT CASE WHEN nf.pemberian_asi = 'ASI Eksklusif' THEN nf.forkey_hamil END) as asi_eksklusif
          FROM kunjungan_nifas nf
          INNER JOIN kehamilan k ON nf.forkey_hamil = k.id
          INNER JOIN ibu i ON k.forkey_ibu = i.id
          LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
          WHERE 1=1 ${kelurahanFilter} ${dateFilters.nifas.where}`;
        
        const [nifasResult] = await pool.query(nifasQuery, [...kelurahanParams, ...dateFilters.nifas.params]);
        const nifas = nifasResult[0];
        
        // Store persalinan nifas data
        data[`${kelurahan.key}_persalinan_nakes`] = persalinan.persalinan_nakes || 0;
        data[`${kelurahan.key}_persalinan_non_nakes`] = persalinan.persalinan_non_nakes || 0;
        data[`${kelurahan.key}_persalinan_fasyankes`] = persalinan.persalinan_fasyankes || 0;
        data[`${kelurahan.key}_persalinan_non_fasyankes`] = persalinan.persalinan_non_fasyankes || 0;
        data[`${kelurahan.key}_kf1`] = nifas.kf1 || 0;
        data[`${kelurahan.key}_kf2`] = nifas.kf2 || 0;
        data[`${kelurahan.key}_kf3`] = nifas.kf3 || 0;
        data[`${kelurahan.key}_kf4`] = nifas.kf4 || 0;
        data[`${kelurahan.key}_asi_eksklusif`] = nifas.asi_eksklusif || 0;
      }
      
      // Generate totals for Persalinan Nifas
      await this.generatePersalinanNifasTotals(data, filters);
      
    } catch (error) {
      console.error('Error generating Persalinan Nifas data:', error);
      this.setDefaultPersalinanNifasValues(data);
    }
    
    return data;
  }

  /**
   * Generate Komplikasi data (Sheet 5)
   */
  async generateKomplikasiData(filters) {
    const data = {};
    const dateFilters = this.buildDateFilters(filters);
    
    console.log('Generating Komplikasi data (Sheet 5)...');
    
    try {
      const kelurahanList = [
        { key: 'simpangpasir', name: 'Simpang Pasir' },
        { key: 'rawamakmur', name: 'Rawa Makmur' },
        { key: 'handilbakti', name: 'Handil Bakti' }
      ];
      
      const komplikasiTypes = [
        'Anemia', 'KEK', 'Preeklamsia', 'Infeksi', 'Tuberculosis', 
        'Malaria', 'HIV', 'Jantung', 'Diabetes', 'Obesitas', 
        'Covid-19', 'Keguguran', 'Lain-lain'
      ];
      
      for (const kelurahan of kelurahanList) {
        const kelurahanFilter = 'AND kel.nama_kelurahan = ?';
        const kelurahanParams = [kelurahan.name];
        
        // Komplikasi by timing (Hamil, Bersalin, Nifas)
        for (const timing of ['Saat Hamil', 'Saat Bersalin', 'Saat Nifas']) {
          const komplikasiQuery = `
            SELECT 
              COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Anemia%' OR ko.nama_komplikasi LIKE '%Hb%' THEN ko.forkey_hamil END) as anemia,
              COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%KEK%' OR ko.nama_komplikasi LIKE '%LILA%' THEN ko.forkey_hamil END) as kek,
              COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Preeklamsia%' OR ko.nama_komplikasi LIKE '%Eklamsia%' THEN ko.forkey_hamil END) as preeklamsia,
              COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Infeksi%' THEN ko.forkey_hamil END) as infeksi,
              COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%TB%' OR ko.nama_komplikasi LIKE '%Tuberkulosis%' THEN ko.forkey_hamil END) as tuberculosis,
              COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Malaria%' THEN ko.forkey_hamil END) as malaria,
              COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%HIV%' THEN ko.forkey_hamil END) as hiv,
              COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Jantung%' THEN ko.forkey_hamil END) as jantung,
              COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Diabetes%' THEN ko.forkey_hamil END) as diabetes,
              COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Obesitas%' THEN ko.forkey_hamil END) as obesitas,
              COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Covid%' THEN ko.forkey_hamil END) as covid19,
              COUNT(DISTINCT CASE WHEN ko.nama_komplikasi LIKE '%Keguguran%' THEN ko.forkey_hamil END) as keguguran,
              COUNT(DISTINCT ko.forkey_hamil) as total_komplikasi,
              COUNT(DISTINCT CASE WHEN ko.rujuk_rs = 1 THEN ko.forkey_hamil END) as total_rujuk
            FROM komplikasi ko
            INNER JOIN kehamilan k ON ko.forkey_hamil = k.id
            INNER JOIN ibu i ON k.forkey_ibu = i.id
            LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
            WHERE ko.kejadian = ? ${kelurahanFilter} ${dateFilters.komplikasi.where}`;
          
          const [komplikasiResult] = await pool.query(komplikasiQuery, [timing, ...kelurahanParams, ...dateFilters.komplikasi.params]);
          const komplikasi = komplikasiResult[0];
          
          // Store komplikasi data with timing prefix
          const timingKey = timing.replace('Saat ', '').toLowerCase();
          Object.keys(komplikasi).forEach(key => {
            data[`${kelurahan.key}_${timingKey}_${key}`] = komplikasi[key] || 0;
          });
        }
      }
      
      // Generate totals for Komplikasi
      await this.generateKomplikasiTotals(data, filters);
      
    } catch (error) {
      console.error('Error generating Komplikasi data:', error);
      this.setDefaultKomplikasiValues(data);
    }
    
    return data;
  }

  /**
   * Generate Patient Data (Sheet 1) - Individual patient records
   */
  async generatePatientData(filters) {
    const data = {};
    
    console.log('Generating Patient Data (Sheet 1)...');
    
    try {
      // This will be used for row-by-row patient data in Sheet 1
      // For now, we'll generate summary counts
      const patientQuery = `
        SELECT 
          COUNT(DISTINCT i.id) as total_patients,
          COUNT(DISTINCT CASE WHEN i.buku_kia = 'Ada' THEN i.id END) as patients_with_kia
        FROM ibu i
        INNER JOIN kehamilan k ON k.forkey_ibu = i.id
        WHERE k.status_kehamilan = 'Hamil'`;
      
      const [patientResult] = await pool.query(patientQuery);
      const patient = patientResult[0];
      
      data.total_patients = patient.total_patients || 0;
      data.patients_with_kia = patient.patients_with_kia || 0;
      
    } catch (error) {
      console.error('Error generating Patient data:', error);
      data.total_patients = 0;
      data.patients_with_kia = 0;
    }
    
    return data;
  }

  /**
   * Generate totals for ANC Terpadu data
   */
  async generateANCTerpaduTotals(data, filters) {
    // Calculate totals by summing kelurahan data
    const kelurahanKeys = ['simpangpasir', 'rawamakmur', 'handilbakti'];
    
    // Hemoglobin totals
    ['tm1', 'tm2', 'tm3'].forEach(tm => {
      data[`total_${tm}_diperiksa`] = kelurahanKeys.reduce((sum, key) => sum + (data[`${key}_${tm}_diperiksa`] || 0), 0);
      data[`total_${tm}_anemia_berat`] = kelurahanKeys.reduce((sum, key) => sum + (data[`${key}_${tm}_anemia_berat`] || 0), 0);
      data[`total_${tm}_anemia_sedang`] = kelurahanKeys.reduce((sum, key) => sum + (data[`${key}_${tm}_anemia_sedang`] || 0), 0);
      data[`total_${tm}_anemia_ringan`] = kelurahanKeys.reduce((sum, key) => sum + (data[`${key}_${tm}_anemia_ringan`] || 0), 0);
      data[`total_${tm}_jumlah_anemia`] = kelurahanKeys.reduce((sum, key) => sum + (data[`${key}_${tm}_jumlah_anemia`] || 0), 0);
    });
    
    // KEK totals
    data.total_lila_diperiksa = kelurahanKeys.reduce((sum, key) => sum + (data[`${key}_lila_diperiksa`] || 0), 0);
    data.total_kek_count = kelurahanKeys.reduce((sum, key) => sum + (data[`${key}_kek_count`] || 0), 0);
    data.total_kek_mendapat_gizi = kelurahanKeys.reduce((sum, key) => sum + (data[`${key}_kek_mendapat_gizi`] || 0), 0);
    
    // BMI totals
    ['tm1', 'tm2', 'tm3'].forEach(tm => {
      data[`total_${tm}_bmi_diperiksa`] = kelurahanKeys.reduce((sum, key) => sum + (data[`${key}_${tm}_bmi_diperiksa`] || 0), 0);
      data[`total_${tm}_bmi_kurus`] = kelurahanKeys.reduce((sum, key) => sum + (data[`${key}_${tm}_bmi_kurus`] || 0), 0);
      data[`total_${tm}_bmi_normal`] = kelurahanKeys.reduce((sum, key) => sum + (data[`${key}_${tm}_bmi_normal`] || 0), 0);
      data[`total_${tm}_bmi_gemuk`] = kelurahanKeys.reduce((sum, key) => sum + (data[`${key}_${tm}_bmi_gemuk`] || 0), 0);
      data[`total_${tm}_bmi_obesitas`] = kelurahanKeys.reduce((sum, key) => sum + (data[`${key}_${tm}_bmi_obesitas`] || 0), 0);
    });
    
    // Screening totals
    const screeningFields = [
      'protein_urine_diperiksa', 'protein_urine_plus1', 'protein_urine_plus2', 'protein_urine_plus3', 'protein_urine_plus4',
      'gula_darah_diperiksa', 'gula_darah_normal', 'gula_darah_sedang', 'gula_darah_tinggi',
      'hiv_diperiksa', 'hiv_positif', 'hiv_dapat_art',
      'malaria_diperiksa', 'malaria_positif', 'malaria_kelambu',
      'kecacingan_diperiksa', 'kecacingan_positif', 'kecacingan_terapi',
      'sifilis_diperiksa', 'sifilis_positif',
      'hepatitis_diperiksa', 'hepatitis_positif'
    ];
    
    screeningFields.forEach(field => {
      data[`total_${field}`] = kelurahanKeys.reduce((sum, key) => sum + (data[`${key}_${field}`] || 0), 0);
    });
  }

  /**
   * Generate totals for Persalinan Nifas data
   */
  async generatePersalinanNifasTotals(data, filters) {
    const kelurahanKeys = ['simpangpasir', 'rawamakmur', 'handilbakti'];
    
    const fields = [
      'persalinan_nakes', 'persalinan_non_nakes', 'persalinan_fasyankes', 'persalinan_non_fasyankes',
      'kf1', 'kf2', 'kf3', 'kf4', 'asi_eksklusif'
    ];
    
    fields.forEach(field => {
      const total = kelurahanKeys.reduce((sum, key) => sum + (data[`${key}_${field}`] || 0), 0);
      data[`total_${field}`] = total;
      
      // Calculate percentages
      if (field.startsWith('persalinan_')) {
        const totalPersalinan = (data.total_persalinan_nakes || 0) + (data.total_persalinan_non_nakes || 0);
        data[`total_persen_${field}`] = totalPersalinan > 0 ? 
          Math.round((total / totalPersalinan) * 100 * 10) / 10 : 0;
      } else if (field.startsWith('kf') || field === 'asi_eksklusif') {
        const totalNifas = Math.max(data.total_kf1 || 0, data.total_kf2 || 0, data.total_kf3 || 0, data.total_kf4 || 0);
        data[`total_persen_${field}`] = totalNifas > 0 ? 
          Math.round((total / totalNifas) * 100 * 10) / 10 : 0;
      }
    });
    
    // Calculate kelurahan percentages
    kelurahanKeys.forEach(key => {
      fields.forEach(field => {
        const value = data[`${key}_${field}`] || 0;
        
        if (field.startsWith('persalinan_')) {
          const kelurahanTotal = (data[`${key}_persalinan_nakes`] || 0) + (data[`${key}_persalinan_non_nakes`] || 0);
          data[`${key}_persen_${field}`] = kelurahanTotal > 0 ? 
            Math.round((value / kelurahanTotal) * 100 * 10) / 10 : 0;
        } else if (field.startsWith('kf') || field === 'asi_eksklusif') {
          const kelurahanNifas = Math.max(
            data[`${key}_kf1`] || 0, data[`${key}_kf2`] || 0, 
            data[`${key}_kf3`] || 0, data[`${key}_kf4`] || 0
          );
          data[`${key}_persen_${field}`] = kelurahanNifas > 0 ? 
            Math.round((value / kelurahanNifas) * 100 * 10) / 10 : 0;
        }
      });
    });
  }

  /**
   * Generate totals for Komplikasi data
   */
  async generateKomplikasiTotals(data, filters) {
    const kelurahanKeys = ['simpangpasir', 'rawamakmur', 'handilbakti'];
    const timings = ['hamil', 'bersalin', 'nifas'];
    
    const komplikasiFields = [
      'anemia', 'kek', 'preeklamsia', 'infeksi', 'tuberculosis', 
      'malaria', 'hiv', 'jantung', 'diabetes', 'obesitas', 
      'covid19', 'keguguran', 'total_komplikasi', 'total_rujuk'
    ];
    
    timings.forEach(timing => {
      komplikasiFields.forEach(field => {
        const total = kelurahanKeys.reduce((sum, key) => sum + (data[`${key}_${timing}_${field}`] || 0), 0);
        data[`total_${timing}_${field}`] = total;
        
        // Calculate percentages
        const totalKomplikasi = data[`total_${timing}_total_komplikasi`] || 0;
        data[`total_${timing}_persen_${field}`] = totalKomplikasi > 0 ? 
          Math.round((total / totalKomplikasi) * 100 * 10) / 10 : 0;
      });
      
      // Calculate kelurahan percentages
      kelurahanKeys.forEach(key => {
        komplikasiFields.forEach(field => {
          const value = data[`${key}_${timing}_${field}`] || 0;
          const kelurahanTotal = data[`${key}_${timing}_total_komplikasi`] || 0;
          data[`${key}_${timing}_persen_${field}`] = kelurahanTotal > 0 ? 
            Math.round((value / kelurahanTotal) * 100 * 10) / 10 : 0;
        });
      });
    });
  }

  /**
   * Set default values for ANC Terpadu data on error
   */
  setDefaultANCTerpaduValues(data) {
    const kelurahanKeys = ['simpangpasir', 'rawamakmur', 'handilbakti', 'total'];
    
    kelurahanKeys.forEach(key => {
      // Hemoglobin defaults
      ['tm1', 'tm2', 'tm3'].forEach(tm => {
        data[`${key}_${tm}_diperiksa`] = 0;
        data[`${key}_${tm}_anemia_berat`] = 0;
        data[`${key}_${tm}_anemia_sedang`] = 0;
        data[`${key}_${tm}_anemia_ringan`] = 0;
        data[`${key}_${tm}_jumlah_anemia`] = 0;
      });
      
      // KEK defaults
      data[`${key}_lila_diperiksa`] = 0;
      data[`${key}_kek_count`] = 0;
      data[`${key}_kek_mendapat_gizi`] = 0;
      
      // BMI defaults
      ['tm1', 'tm2', 'tm3'].forEach(tm => {
        data[`${key}_${tm}_bmi_diperiksa`] = 0;
        data[`${key}_${tm}_bmi_kurus`] = 0;
        data[`${key}_${tm}_bmi_normal`] = 0;
        data[`${key}_${tm}_bmi_gemuk`] = 0;
        data[`${key}_${tm}_bmi_obesitas`] = 0;
      });
    });
  }

  /**
   * Set default values for Persalinan Nifas data on error
   */
  setDefaultPersalinanNifasValues(data) {
    const kelurahanKeys = ['simpangpasir', 'rawamakmur', 'handilbakti', 'total'];
    const fields = [
      'persalinan_nakes', 'persalinan_non_nakes', 'persalinan_fasyankes', 'persalinan_non_fasyankes',
      'kf1', 'kf2', 'kf3', 'kf4', 'asi_eksklusif'
    ];
    
    kelurahanKeys.forEach(key => {
      fields.forEach(field => {
        data[`${key}_${field}`] = 0;
      });
    });
  }

  /**
   * Set default values for Komplikasi data on error
   */
  setDefaultKomplikasiValues(data) {
    const kelurahanKeys = ['simpangpasir', 'rawamakmur', 'handilbakti', 'total'];
    const timings = ['hamil', 'bersalin', 'nifas'];
    const komplikasiFields = [
      'anemia', 'kek', 'preeklamsia', 'infeksi', 'tuberculosis', 
      'malaria', 'hiv', 'jantung', 'diabetes', 'obesitas', 
      'covid19', 'keguguran', 'total_komplikasi', 'total_rujuk'
    ];
    
    kelurahanKeys.forEach(key => {
      timings.forEach(timing => {
        komplikasiFields.forEach(field => {
          data[`${key}_${timing}_${field}`] = 0;
        });
      });
    });
  }
}

module.exports = ExcelDataService;