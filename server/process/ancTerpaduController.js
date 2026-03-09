// ANC Terpadu Controller
// Handles ANC Terpadu (Integrated Antenatal Care) queries and logic
// Uses SQL aggregation approach consistent with ancController

const getAncTerpaduData = async (pool, req, res) => {
    try {
        const { year = '', month = '' } = req.query;

        // Build WHERE clause for date filtering - using tanggal_kunjungan for ANC and tanggal_persalinan for births
        let whereConditions = [];
        let params = [];

        if (year) {
            whereConditions.push('(YEAR(anc.tanggal_kunjungan) = ? OR YEAR(p.tanggal_persalinan) = ?)');
            params.push(year, year);
        }

        if (month) {
            whereConditions.push('(MONTH(anc.tanggal_kunjungan) = ? OR MONTH(p.tanggal_persalinan) = ?)');
            params.push(month, month);
        }

        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ') 
            : '';

        // Query for each kelurahan using SQL aggregation
        const kelurahanQuery = buildAncTerpaduQuery(whereClause);

        const [kelurahanData] = await pool.query(kelurahanQuery, params);

        // Calculate totals
        const total = calculateTotals(kelurahanData);

        res.json({
            kelurahan: kelurahanData,
            total
        });

    } catch (error) {
        console.error('Error fetching ANC Terpadu data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Helper function to build the ANC Terpadu SQL query
const buildAncTerpaduQuery = (whereClause) => {
    return `
        SELECT 
            kel.id,
            kel.nama_kelurahan as kelurahan,
            
            -- Jumlah Bumil dan Bersalin (consistent with ANC)
            COUNT(DISTINCT k.id) as jumlah_bumil,
            COUNT(DISTINCT CASE WHEN k.status_kehamilan IN ('Bersalin', 'Nifas', 'Selesai') THEN k.id END) as jumlah_bersalin,
            
            -- Bumil per Trimester (based on HPHT)
            COUNT(DISTINCT CASE WHEN DATEDIFF(CURDATE(), k.haid_terakhir) <= 84 THEN k.id END) as tm1,
            COUNT(DISTINCT CASE WHEN DATEDIFF(CURDATE(), k.haid_terakhir) BETWEEN 85 AND 196 THEN k.id END) as tm2,
            COUNT(DISTINCT CASE WHEN DATEDIFF(CURDATE(), k.haid_terakhir) > 196 THEN k.id END) as tm3,
            
            -- Anemia TM1 (HB < 12 in first trimester)
            COUNT(DISTINCT CASE WHEN DATEDIFF(CURDATE(), k.haid_terakhir) <= 84 AND ls.hasil_lab_hb IS NOT NULL THEN k.id END) as anemia_tm1_diperiksa,
            COUNT(DISTINCT CASE WHEN DATEDIFF(CURDATE(), k.haid_terakhir) <= 84 AND ls.hasil_lab_hb < 7 THEN k.id END) as anemia_tm1_berat,
            COUNT(DISTINCT CASE WHEN DATEDIFF(CURDATE(), k.haid_terakhir) <= 84 AND ls.hasil_lab_hb >= 7 AND ls.hasil_lab_hb < 10 THEN k.id END) as anemia_tm1_sedang,
            COUNT(DISTINCT CASE WHEN DATEDIFF(CURDATE(), k.haid_terakhir) <= 84 AND ls.hasil_lab_hb >= 10 AND ls.hasil_lab_hb < 12 THEN k.id END) as anemia_tm1_ringan,
            COUNT(DISTINCT CASE WHEN DATEDIFF(CURDATE(), k.haid_terakhir) <= 84 AND ls.hasil_lab_hb < 12 THEN k.id END) as anemia_tm1_total,
            
            -- Anemia TM2
            COUNT(DISTINCT CASE WHEN DATEDIFF(CURDATE(), k.haid_terakhir) BETWEEN 85 AND 196 AND ls.hasil_lab_hb IS NOT NULL THEN k.id END) as anemia_tm2_diperiksa,
            COUNT(DISTINCT CASE WHEN DATEDIFF(CURDATE(), k.haid_terakhir) BETWEEN 85 AND 196 AND ls.hasil_lab_hb < 7 THEN k.id END) as anemia_tm2_berat,
            COUNT(DISTINCT CASE WHEN DATEDIFF(CURDATE(), k.haid_terakhir) BETWEEN 85 AND 196 AND ls.hasil_lab_hb >= 7 AND ls.hasil_lab_hb < 10 THEN k.id END) as anemia_tm2_sedang,
            COUNT(DISTINCT CASE WHEN DATEDIFF(CURDATE(), k.haid_terakhir) BETWEEN 85 AND 196 AND ls.hasil_lab_hb >= 10 AND ls.hasil_lab_hb < 12 THEN k.id END) as anemia_tm2_ringan,
            COUNT(DISTINCT CASE WHEN DATEDIFF(CURDATE(), k.haid_terakhir) BETWEEN 85 AND 196 AND ls.hasil_lab_hb < 12 THEN k.id END) as anemia_tm2_total,
            
            -- Anemia TM3
            COUNT(DISTINCT CASE WHEN DATEDIFF(CURDATE(), k.haid_terakhir) > 196 AND ls.hasil_lab_hb IS NOT NULL THEN k.id END) as anemia_tm3_diperiksa,
            COUNT(DISTINCT CASE WHEN DATEDIFF(CURDATE(), k.haid_terakhir) > 196 AND ls.hasil_lab_hb < 7 THEN k.id END) as anemia_tm3_berat,
            COUNT(DISTINCT CASE WHEN DATEDIFF(CURDATE(), k.haid_terakhir) > 196 AND ls.hasil_lab_hb >= 7 AND ls.hasil_lab_hb < 10 THEN k.id END) as anemia_tm3_sedang,
            COUNT(DISTINCT CASE WHEN DATEDIFF(CURDATE(), k.haid_terakhir) > 196 AND ls.hasil_lab_hb >= 10 AND ls.hasil_lab_hb < 12 THEN k.id END) as anemia_tm3_ringan,
            COUNT(DISTINCT CASE WHEN DATEDIFF(CURDATE(), k.haid_terakhir) > 196 AND ls.hasil_lab_hb < 12 THEN k.id END) as anemia_tm3_total,
            
            -- LILA & KEK
            COUNT(DISTINCT CASE WHEN (SELECT AVG(lila) FROM antenatal_care WHERE forkey_hamil = k.id AND lila IS NOT NULL) IS NOT NULL THEN k.id END) as lila_diperiksa_jml,
            COUNT(DISTINCT CASE WHEN (SELECT AVG(lila) FROM antenatal_care WHERE forkey_hamil = k.id AND lila IS NOT NULL) < 24 THEN k.id END) as kek_jml,
            COUNT(DISTINCT CASE WHEN (SELECT AVG(lila) FROM antenatal_care WHERE forkey_hamil = k.id AND lila IS NOT NULL) < 24 THEN k.id END) as kek_gizi_jml,
            COUNT(DISTINCT CASE WHEN (SELECT AVG(lila) FROM antenatal_care WHERE forkey_hamil = k.id AND lila IS NOT NULL) < 24 THEN k.id END) as kek_tatalaksana_jml,
            
            -- BMI Trimester 1 (using latest body weight from TM1 visits)
            COUNT(DISTINCT CASE WHEN i.tinggi_badan IS NOT NULL AND (
                SELECT berat_badan 
                FROM antenatal_care 
                WHERE forkey_hamil = k.id 
                AND berat_badan IS NOT NULL 
                AND DATEDIFF(tanggal_kunjungan, k.haid_terakhir) <= 84
                ORDER BY tanggal_kunjungan DESC 
                LIMIT 1
            ) IS NOT NULL THEN k.id END) as bmi_diperiksa_jml,
            COUNT(DISTINCT CASE WHEN (
                (SELECT berat_badan FROM antenatal_care WHERE forkey_hamil = k.id AND berat_badan IS NOT NULL AND DATEDIFF(tanggal_kunjungan, k.haid_terakhir) <= 84 ORDER BY tanggal_kunjungan DESC LIMIT 1) 
                / POW(i.tinggi_badan / 100, 2)
            ) < 18.5 THEN k.id END) as bmi_kurus_jml,
            COUNT(DISTINCT CASE WHEN (
                (SELECT berat_badan FROM antenatal_care WHERE forkey_hamil = k.id AND berat_badan IS NOT NULL AND DATEDIFF(tanggal_kunjungan, k.haid_terakhir) <= 84 ORDER BY tanggal_kunjungan DESC LIMIT 1) 
                / POW(i.tinggi_badan / 100, 2)
            ) >= 18.5 AND (
                (SELECT berat_badan FROM antenatal_care WHERE forkey_hamil = k.id AND berat_badan IS NOT NULL AND DATEDIFF(tanggal_kunjungan, k.haid_terakhir) <= 84 ORDER BY tanggal_kunjungan DESC LIMIT 1) 
                / POW(i.tinggi_badan / 100, 2)
            ) < 25 THEN k.id END) as bmi_normal_jml,
            COUNT(DISTINCT CASE WHEN (
                (SELECT berat_badan FROM antenatal_care WHERE forkey_hamil = k.id AND berat_badan IS NOT NULL AND DATEDIFF(tanggal_kunjungan, k.haid_terakhir) <= 84 ORDER BY tanggal_kunjungan DESC LIMIT 1) 
                / POW(i.tinggi_badan / 100, 2)
            ) >= 25 AND (
                (SELECT berat_badan FROM antenatal_care WHERE forkey_hamil = k.id AND berat_badan IS NOT NULL AND DATEDIFF(tanggal_kunjungan, k.haid_terakhir) <= 84 ORDER BY tanggal_kunjungan DESC LIMIT 1) 
                / POW(i.tinggi_badan / 100, 2)
            ) < 30 THEN k.id END) as bmi_gemuk_jml,
            COUNT(DISTINCT CASE WHEN (
                (SELECT berat_badan FROM antenatal_care WHERE forkey_hamil = k.id AND berat_badan IS NOT NULL AND DATEDIFF(tanggal_kunjungan, k.haid_terakhir) <= 84 ORDER BY tanggal_kunjungan DESC LIMIT 1) 
                / POW(i.tinggi_badan / 100, 2)
            ) >= 30 THEN k.id END) as bmi_obesitas_jml,
            
            -- Skrining Protein Urin
            COUNT(DISTINCT CASE WHEN ls.lab_protein_urine IS NOT NULL AND ls.lab_protein_urine != 'Negatif' THEN k.id END) as protein_diperiksa_jml,
            COUNT(DISTINCT CASE WHEN ls.lab_protein_urine = '+1' THEN k.id END) as protein_1_jml,
            COUNT(DISTINCT CASE WHEN ls.lab_protein_urine = '+2' THEN k.id END) as protein_2_jml,
            COUNT(DISTINCT CASE WHEN ls.lab_protein_urine IN ('+3', '+4') THEN k.id END) as protein_3_jml,
            
            -- Skrining Gula Darah
            COUNT(DISTINCT CASE WHEN ls.lab_gula_darah IS NOT NULL THEN k.id END) as gula_diperiksa_jml,
            COUNT(DISTINCT CASE WHEN CAST(ls.lab_gula_darah AS UNSIGNED) >= 100 AND CAST(ls.lab_gula_darah AS UNSIGNED) < 126 THEN k.id END) as gula_ringan_jml,
            COUNT(DISTINCT CASE WHEN CAST(ls.lab_gula_darah AS UNSIGNED) >= 126 THEN k.id END) as gula_sedang_jml,
            
            -- Skrining HIV
            COUNT(DISTINCT CASE WHEN ls.skrining_hiv IS NOT NULL AND ls.skrining_hiv != 'Belum Diperiksa' THEN k.id END) as hiv_diperiksa_jml,
            COUNT(DISTINCT CASE WHEN ls.skrining_hiv = 'Reaktif' THEN k.id END) as hiv_positif_jml,
            COUNT(DISTINCT CASE WHEN ls.skrining_hiv = 'Reaktif' AND ls.status_art = 'Sedang ART' THEN k.id END) as hiv_art_jml,
            COUNT(DISTINCT CASE WHEN ls.skrining_hiv = 'Reaktif' AND p.cara_persalinan = 'Spontan' THEN k.id END) as hiv_normal,
            COUNT(DISTINCT CASE WHEN ls.skrining_hiv = 'Reaktif' AND p.cara_persalinan = 'Sectio' THEN k.id END) as hiv_sectio,
            
            -- Skrining Malaria
            COUNT(DISTINCT CASE WHEN ls.status_malaria IS NOT NULL AND ls.status_malaria != 'Belum Diperiksa' THEN k.id END) as malaria_diperiksa_jml,
            COUNT(DISTINCT CASE WHEN ls.status_malaria = 'Positif' THEN k.id END) as malaria_positif_jml,
            COUNT(DISTINCT CASE WHEN ls.status_malaria = 'Positif' AND ls.terapi_malaria IS NOT NULL THEN k.id END) as malaria_tatalaksana_jml,
            
            -- Skrining Kecacingan
            COUNT(DISTINCT CASE WHEN ls.status_kecacingan IS NOT NULL AND ls.status_kecacingan != 'Belum Diperiksa' THEN k.id END) as kecacingan_diperiksa_jml,
            COUNT(DISTINCT CASE WHEN ls.status_kecacingan = 'Positif' THEN k.id END) as kecacingan_positif_jml,
            COUNT(DISTINCT CASE WHEN ls.status_kecacingan = 'Positif' AND ls.terapi_kecacingan IS NOT NULL THEN k.id END) as kecacingan_tatalaksana_jml,
            
            -- Skrining IMS (Sifilis)
            COUNT(DISTINCT CASE WHEN ls.skrining_sifilis IS NOT NULL AND ls.skrining_sifilis != 'Belum Diperiksa' THEN k.id END) as ims_diperiksa_jml,
            COUNT(DISTINCT CASE WHEN ls.skrining_sifilis = 'Reaktif' THEN k.id END) as ims_positif_jml,
            COUNT(DISTINCT CASE WHEN ls.skrining_sifilis = 'Reaktif' THEN k.id END) as ims_tatalaksana_jml,
            
            -- Skrining HBsAg
            COUNT(DISTINCT CASE WHEN ls.skrining_hbsag IS NOT NULL AND ls.skrining_hbsag != 'Belum Diperiksa' THEN k.id END) as hbsag_diperiksa_jml,
            COUNT(DISTINCT CASE WHEN ls.skrining_hbsag = 'Reaktif' THEN k.id END) as hbsag_positif_jml,
            COUNT(DISTINCT CASE WHEN ls.skrining_hbsag = 'Reaktif' THEN k.id END) as hbsag_tatalaksana_jml,
            
            -- Komplikasi ANC
            COUNT(DISTINCT CASE WHEN (
                SELECT hasil_lab_hb 
                FROM lab_screening 
                WHERE forkey_hamil = k.id 
                AND hasil_lab_hb IS NOT NULL 
                ORDER BY created_at DESC 
                LIMIT 1
            ) < 7 THEN k.id END) as komp_anemia_jml,
            COUNT(DISTINCT CASE WHEN (
                SELECT lila 
                FROM antenatal_care 
                WHERE forkey_hamil = k.id 
                AND lila IS NOT NULL 
                ORDER BY tanggal_kunjungan DESC 
                LIMIT 1
            ) < 24 THEN k.id END) as komp_kek_jml,
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi 
                WHERE forkey_hamil = k.id 
                AND kejadian = 'Saat Hamil' 
                AND (
                    LOWER(nama_komplikasi) LIKE '%preeklampsia%' 
                    OR LOWER(nama_komplikasi) LIKE '%preeklamsia%'
                    OR LOWER(nama_komplikasi) LIKE '%eklampsia%'
                    OR LOWER(nama_komplikasi) LIKE '%eklamsia%'
                )
            ) THEN k.id END) as komp_preeklampsia_jml,
            COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND kejadian = 'Saat Hamil' AND LOWER(nama_komplikasi) LIKE '%infeksi%') THEN k.id END) as komp_infeksi_jml,
            COUNT(DISTINCT CASE WHEN (
                EXISTS (SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND kejadian = 'Saat Hamil' AND (LOWER(nama_komplikasi) LIKE '%tb%' OR LOWER(nama_komplikasi) LIKE '%tuberkulosis%'))
                OR EXISTS (SELECT 1 FROM lab_screening WHERE forkey_hamil = k.id AND skrining_tb = 'Positif')
            ) THEN k.id END) as komp_tb_jml,
            COUNT(DISTINCT CASE WHEN (
                EXISTS (SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND kejadian = 'Saat Hamil' AND LOWER(nama_komplikasi) LIKE '%malaria%')
                OR EXISTS (SELECT 1 FROM lab_screening WHERE forkey_hamil = k.id AND status_malaria = 'Positif')
            ) THEN k.id END) as komp_malaria_jml,
            COUNT(DISTINCT CASE WHEN (
                EXISTS (SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND kejadian = 'Saat Hamil' AND LOWER(nama_komplikasi) LIKE '%hiv%')
                OR EXISTS (SELECT 1 FROM lab_screening WHERE forkey_hamil = k.id AND skrining_hiv = 'Reaktif')
            ) THEN k.id END) as komp_hiv_jml,
            COUNT(DISTINCT CASE WHEN (
                EXISTS (SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND kejadian = 'Saat Hamil' AND (LOWER(nama_komplikasi) LIKE '%jantung%' OR LOWER(nama_komplikasi) LIKE '%hipertensi%'))
                OR EXISTS (
                    SELECT 1 FROM antenatal_care 
                    WHERE forkey_hamil = k.id 
                    AND tekanan_darah IS NOT NULL 
                    AND CAST(SUBSTRING_INDEX(tekanan_darah, '/', 1) AS UNSIGNED) >= 140
                )
            ) THEN k.id END) as komp_jantung_jml,
            COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND kejadian = 'Saat Hamil' AND LOWER(nama_komplikasi) LIKE '%diabetes%') THEN k.id END) as komp_diabetes_jml,
            COUNT(DISTINCT CASE WHEN (
                EXISTS (SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND kejadian = 'Saat Hamil' AND LOWER(nama_komplikasi) LIKE '%obesitas%')
                OR (
                    (SELECT berat_badan FROM antenatal_care WHERE forkey_hamil = k.id AND berat_badan IS NOT NULL AND DATEDIFF(tanggal_kunjungan, k.haid_terakhir) <= 84 ORDER BY tanggal_kunjungan DESC LIMIT 1) 
                    / POW(i.tinggi_badan / 100, 2)
                ) >= 30
            ) THEN k.id END) as komp_obesitas_jml,
            COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND kejadian = 'Saat Hamil' AND (LOWER(nama_komplikasi) LIKE '%keguguran%' OR LOWER(nama_komplikasi) LIKE '%abortus%')) THEN k.id END) as komp_keguguran_jml,
            COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND kejadian = 'Saat Hamil' AND LOWER(nama_komplikasi) NOT LIKE '%anemia%' AND LOWER(nama_komplikasi) NOT LIKE '%kek%' AND LOWER(nama_komplikasi) NOT LIKE '%preeklampsia%' AND LOWER(nama_komplikasi) NOT LIKE '%preeklamsia%' AND LOWER(nama_komplikasi) NOT LIKE '%eklampsia%' AND LOWER(nama_komplikasi) NOT LIKE '%eklamsia%' AND LOWER(nama_komplikasi) NOT LIKE '%infeksi%' AND LOWER(nama_komplikasi) NOT LIKE '%tb%' AND LOWER(nama_komplikasi) NOT LIKE '%tuberkulosis%' AND LOWER(nama_komplikasi) NOT LIKE '%malaria%' AND LOWER(nama_komplikasi) NOT LIKE '%hiv%' AND LOWER(nama_komplikasi) NOT LIKE '%jantung%' AND LOWER(nama_komplikasi) NOT LIKE '%hipertensi%' AND LOWER(nama_komplikasi) NOT LIKE '%diabetes%' AND LOWER(nama_komplikasi) NOT LIKE '%obesitas%' AND LOWER(nama_komplikasi) NOT LIKE '%keguguran%' AND LOWER(nama_komplikasi) NOT LIKE '%abortus%') THEN k.id END) as komp_lainnya_jml,
            COUNT(DISTINCT CASE WHEN (
                EXISTS (SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND kejadian = 'Saat Hamil')
                OR EXISTS (SELECT 1 FROM lab_screening WHERE forkey_hamil = k.id AND (skrining_tb = 'Positif' OR status_malaria = 'Positif' OR skrining_hiv = 'Reaktif'))
                OR EXISTS (SELECT 1 FROM antenatal_care WHERE forkey_hamil = k.id AND tekanan_darah IS NOT NULL AND CAST(SUBSTRING_INDEX(tekanan_darah, '/', 1) AS UNSIGNED) >= 140)
                OR (
                    (SELECT berat_badan FROM antenatal_care WHERE forkey_hamil = k.id AND berat_badan IS NOT NULL AND DATEDIFF(tanggal_kunjungan, k.haid_terakhir) <= 84 ORDER BY tanggal_kunjungan DESC LIMIT 1) 
                    / POW(i.tinggi_badan / 100, 2)
                ) >= 30
                OR (SELECT hasil_lab_hb FROM lab_screening WHERE forkey_hamil = k.id AND hasil_lab_hb IS NOT NULL ORDER BY created_at DESC LIMIT 1) < 7
                OR (SELECT lila FROM antenatal_care WHERE forkey_hamil = k.id AND lila IS NOT NULL ORDER BY tanggal_kunjungan DESC LIMIT 1) < 23.5
            ) THEN k.id END) as komp_total_jml
            
        FROM kelurahan kel
        LEFT JOIN ibu i ON i.kelurahan_id = kel.id
        LEFT JOIN kehamilan k ON k.forkey_ibu = i.id
        LEFT JOIN antenatal_care anc ON anc.forkey_hamil = k.id
        LEFT JOIN lab_screening ls ON ls.forkey_hamil = k.id
        LEFT JOIN persalinan p ON p.forkey_hamil = k.id
        ${whereClause}
        GROUP BY kel.id, kel.nama_kelurahan
        ORDER BY kel.nama_kelurahan
    `;
};

// Helper function to calculate totals and percentages
const calculateTotals = (kelurahanData) => {
    const total = {
        kelurahan: 'TOTAL',
        jumlah_bumil: 0,
        jumlah_bersalin: 0,
        tm1: 0,
        tm2: 0,
        tm3: 0
    };

    // Sum all numeric fields
    kelurahanData.forEach(row => {
        Object.keys(row).forEach(key => {
            if (key !== 'kelurahan' && key !== 'id' && typeof row[key] === 'number') {
                if (!total[key]) total[key] = 0;
                total[key] += row[key];
            }
        });
    });

    // Calculate percentages for each kelurahan row
    kelurahanData.forEach(row => {
        calculateRowPercentages(row);
    });

    // Calculate percentages for totals
    calculateRowPercentages(total);

    return total;
};

// Helper function to calculate percentages for a single row
const calculateRowPercentages = (row) => {
    const bumil = row.jumlah_bumil || 1;
    
    // LILA & KEK percentages
    row.lila_diperiksa_persen = ((row.lila_diperiksa_jml / bumil) * 100).toFixed(1);
    row.kek_persen = ((row.kek_jml / bumil) * 100).toFixed(1);
    row.kek_gizi_persen = ((row.kek_gizi_jml / bumil) * 100).toFixed(1);
    row.kek_tatalaksana_persen = ((row.kek_tatalaksana_jml / bumil) * 100).toFixed(1);
    
    // BMI percentages
    row.bmi_diperiksa_persen = ((row.bmi_diperiksa_jml / bumil) * 100).toFixed(1);
    row.bmi_kurus_persen = ((row.bmi_kurus_jml / bumil) * 100).toFixed(1);
    row.bmi_normal_persen = ((row.bmi_normal_jml / bumil) * 100).toFixed(1);
    row.bmi_gemuk_persen = ((row.bmi_gemuk_jml / bumil) * 100).toFixed(1);
    row.bmi_obesitas_persen = ((row.bmi_obesitas_jml / bumil) * 100).toFixed(1);
    
    // Protein Urin percentages
    row.protein_diperiksa_persen = ((row.protein_diperiksa_jml / bumil) * 100).toFixed(1);
    row.protein_1_persen = ((row.protein_1_jml / bumil) * 100).toFixed(1);
    row.protein_2_persen = ((row.protein_2_jml / bumil) * 100).toFixed(1);
    row.protein_3_persen = ((row.protein_3_jml / bumil) * 100).toFixed(1);
    
    // Gula Darah percentages
    row.gula_diperiksa_persen = ((row.gula_diperiksa_jml / bumil) * 100).toFixed(1);
    row.gula_ringan_persen = ((row.gula_ringan_jml / bumil) * 100).toFixed(1);
    row.gula_sedang_persen = ((row.gula_sedang_jml / bumil) * 100).toFixed(1);
    
    // HIV percentages
    row.hiv_diperiksa_persen = ((row.hiv_diperiksa_jml / bumil) * 100).toFixed(1);
    row.hiv_positif_persen = ((row.hiv_positif_jml / bumil) * 100).toFixed(1);
    row.hiv_art_persen = ((row.hiv_art_jml / bumil) * 100).toFixed(1);
    
    // Malaria percentages
    row.malaria_diperiksa_persen = ((row.malaria_diperiksa_jml / bumil) * 100).toFixed(1);
    row.malaria_positif_persen = ((row.malaria_positif_jml / bumil) * 100).toFixed(1);
    row.malaria_tatalaksana_persen = ((row.malaria_tatalaksana_jml / bumil) * 100).toFixed(1);
    
    // Kecacingan percentages
    row.kecacingan_diperiksa_persen = ((row.kecacingan_diperiksa_jml / bumil) * 100).toFixed(1);
    row.kecacingan_positif_persen = ((row.kecacingan_positif_jml / bumil) * 100).toFixed(1);
    row.kecacingan_tatalaksana_persen = ((row.kecacingan_tatalaksana_jml / bumil) * 100).toFixed(1);
    
    // IMS percentages
    row.ims_diperiksa_persen = ((row.ims_diperiksa_jml / bumil) * 100).toFixed(1);
    row.ims_positif_persen = ((row.ims_positif_jml / bumil) * 100).toFixed(1);
    row.ims_tatalaksana_persen = ((row.ims_tatalaksana_jml / bumil) * 100).toFixed(1);
    
    // HBsAg percentages
    row.hbsag_diperiksa_persen = ((row.hbsag_diperiksa_jml / bumil) * 100).toFixed(1);
    row.hbsag_positif_persen = ((row.hbsag_positif_jml / bumil) * 100).toFixed(1);
    row.hbsag_tatalaksana_persen = ((row.hbsag_tatalaksana_jml / bumil) * 100).toFixed(1);
    
    // Komplikasi percentages
    row.komp_anemia_persen = ((row.komp_anemia_jml / bumil) * 100).toFixed(1);
    row.komp_kek_persen = ((row.komp_kek_jml / bumil) * 100).toFixed(1);
    row.komp_preeklampsia_persen = ((row.komp_preeklampsia_jml / bumil) * 100).toFixed(1);
    row.komp_infeksi_persen = ((row.komp_infeksi_jml / bumil) * 100).toFixed(1);
    row.komp_tb_persen = ((row.komp_tb_jml / bumil) * 100).toFixed(1);
    row.komp_malaria_persen = ((row.komp_malaria_jml / bumil) * 100).toFixed(1);
    row.komp_hiv_persen = ((row.komp_hiv_jml / bumil) * 100).toFixed(1);
    row.komp_jantung_persen = ((row.komp_jantung_jml / bumil) * 100).toFixed(1);
    row.komp_diabetes_persen = ((row.komp_diabetes_jml / bumil) * 100).toFixed(1);
    row.komp_obesitas_persen = ((row.komp_obesitas_jml / bumil) * 100).toFixed(1);
    row.komp_keguguran_persen = ((row.komp_keguguran_jml / bumil) * 100).toFixed(1);
    row.komp_lainnya_persen = ((row.komp_lainnya_jml / bumil) * 100).toFixed(1);
    row.komp_total_persen = ((row.komp_total_jml / bumil) * 100).toFixed(1);
};

module.exports = { getAncTerpaduData };
