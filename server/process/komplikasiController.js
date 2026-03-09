// Komplikasi Controller
// Aggregates komplikasi data from ANC Terpadu and Nifas Persalinan

const ancTerpaduController = require('./ancTerpaduController');
const nifasPersalinanController = require('./nifasPersalinanController');

const getKomplikasiData = async (pool, req, res) => {
    try {
        const { year = '', month = '' } = req.query;

        // Build WHERE clause for date filtering - same as ANC
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

        // Get base bumil count (same as ANC)
        const bumilQuery = buildBumilQuery(whereClause);
        const [bumilData] = await pool.query(bumilQuery, params);

        // Get ANC Terpadu komplikasi data
        const ancTerpaduQuery = buildAncTerpaduKomplikasiQuery(whereClause);
        const [ancTerpaduData] = await pool.query(ancTerpaduQuery, params);

        // Get Nifas Persalinan komplikasi data
        const nifasQuery = buildNifasKomplikasiQuery(whereClause);
        const [nifasData] = await pool.query(nifasQuery, params);

        // Merge the data
        const kelurahanData = mergeKomplikasiData(bumilData, ancTerpaduData, nifasData);

        res.json(kelurahanData);

    } catch (error) {
        console.error('Error fetching komplikasi data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get total bumil count per kelurahan (same as ANC)
const buildBumilQuery = (whereClause) => {
    return `
        SELECT 
            kel.id,
            kel.nama_kelurahan as kelurahan,
            COUNT(DISTINCT k.id) as total_bumil
        FROM kelurahan kel
        LEFT JOIN ibu i ON i.kelurahan_id = kel.id
        LEFT JOIN kehamilan k ON k.forkey_ibu = i.id
        LEFT JOIN antenatal_care anc ON anc.forkey_hamil = k.id
        LEFT JOIN persalinan p ON p.forkey_hamil = k.id
        ${whereClause}
        GROUP BY kel.id, kel.nama_kelurahan
        ORDER BY kel.nama_kelurahan
    `;
};

// Get ANC Terpadu komplikasi counts (from worksheet: komp_anemia, komp_kek, etc.)
const buildAncTerpaduKomplikasiQuery = (whereClause) => {
    return `
        SELECT 
            kel.id,
            kel.nama_kelurahan as kelurahan,
            
            -- Anemia (HB < 7 for severe anemia)
            COUNT(DISTINCT CASE WHEN (
                SELECT hasil_lab_hb 
                FROM lab_screening 
                WHERE forkey_hamil = k.id 
                AND hasil_lab_hb IS NOT NULL 
                ORDER BY created_at DESC 
                LIMIT 1
            ) < 7 THEN k.id END) as anemia_jumlah,
            
            -- KEK (LILA < 24)
            COUNT(DISTINCT CASE WHEN (
                SELECT lila 
                FROM antenatal_care 
                WHERE forkey_hamil = k.id 
                AND lila IS NOT NULL 
                ORDER BY tanggal_kunjungan DESC 
                LIMIT 1
            ) < 24 THEN k.id END) as kek_jumlah,
            
            -- Preeklamsia/Eklamsia
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
            ) THEN k.id END) as preeklamsia_jumlah,
            
            -- Infeksi
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi 
                WHERE forkey_hamil = k.id 
                AND kejadian = 'Saat Hamil' 
                AND LOWER(nama_komplikasi) LIKE '%infeksi%'
            ) THEN k.id END) as infeksi_jumlah,
            
            -- TB
            COUNT(DISTINCT CASE WHEN (
                EXISTS (SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND kejadian = 'Saat Hamil' AND (LOWER(nama_komplikasi) LIKE '%tb%' OR LOWER(nama_komplikasi) LIKE '%tuberkulosis%'))
                OR EXISTS (SELECT 1 FROM lab_screening WHERE forkey_hamil = k.id AND skrining_tb = 'Positif')
            ) THEN k.id END) as tb_jumlah,
            
            -- Malaria
            COUNT(DISTINCT CASE WHEN (
                EXISTS (SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND kejadian = 'Saat Hamil' AND LOWER(nama_komplikasi) LIKE '%malaria%')
                OR EXISTS (SELECT 1 FROM lab_screening WHERE forkey_hamil = k.id AND status_malaria = 'Positif')
            ) THEN k.id END) as malaria_jumlah,
            
            -- HIV
            COUNT(DISTINCT CASE WHEN (
                EXISTS (SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND kejadian = 'Saat Hamil' AND LOWER(nama_komplikasi) LIKE '%hiv%')
                OR EXISTS (SELECT 1 FROM lab_screening WHERE forkey_hamil = k.id AND skrining_hiv = 'Reaktif')
            ) THEN k.id END) as hiv_jumlah,
            
            -- Jantung (includes hypertension)
            COUNT(DISTINCT CASE WHEN (
                EXISTS (SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND kejadian = 'Saat Hamil' AND (LOWER(nama_komplikasi) LIKE '%jantung%' OR LOWER(nama_komplikasi) LIKE '%hipertensi%'))
                OR EXISTS (
                    SELECT 1 FROM antenatal_care 
                    WHERE forkey_hamil = k.id 
                    AND tekanan_darah IS NOT NULL 
                    AND CAST(SUBSTRING_INDEX(tekanan_darah, '/', 1) AS UNSIGNED) >= 140
                )
            ) THEN k.id END) as jantung_jumlah,
            
            -- Diabetes
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi 
                WHERE forkey_hamil = k.id 
                AND kejadian = 'Saat Hamil' 
                AND LOWER(nama_komplikasi) LIKE '%diabetes%'
            ) THEN k.id END) as diabetes_jumlah,
            
            -- Obesitas (BMI >= 30)
            COUNT(DISTINCT CASE WHEN (
                EXISTS (SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND kejadian = 'Saat Hamil' AND LOWER(nama_komplikasi) LIKE '%obesitas%')
                OR (
                    (SELECT berat_badan FROM antenatal_care WHERE forkey_hamil = k.id AND berat_badan IS NOT NULL AND DATEDIFF(tanggal_kunjungan, k.haid_terakhir) <= 84 ORDER BY tanggal_kunjungan DESC LIMIT 1) 
                    / POW(i.tinggi_badan / 100, 2)
                ) >= 30
            ) THEN k.id END) as obesitas_jumlah,
            
            -- Keguguran
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi 
                WHERE forkey_hamil = k.id 
                AND kejadian = 'Saat Hamil' 
                AND (LOWER(nama_komplikasi) LIKE '%keguguran%' OR LOWER(nama_komplikasi) LIKE '%abortus%')
            ) THEN k.id END) as keguguran_jumlah,
            
            -- Lainnya (other pregnancy complications)
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi 
                WHERE forkey_hamil = k.id 
                AND kejadian = 'Saat Hamil' 
                AND LOWER(nama_komplikasi) NOT LIKE '%anemia%' 
                AND LOWER(nama_komplikasi) NOT LIKE '%kek%' 
                AND LOWER(nama_komplikasi) NOT LIKE '%preeklampsia%' 
                AND LOWER(nama_komplikasi) NOT LIKE '%preeklamsia%'
                AND LOWER(nama_komplikasi) NOT LIKE '%eklampsia%'
                AND LOWER(nama_komplikasi) NOT LIKE '%eklamsia%'
                AND LOWER(nama_komplikasi) NOT LIKE '%infeksi%' 
                AND LOWER(nama_komplikasi) NOT LIKE '%tb%' 
                AND LOWER(nama_komplikasi) NOT LIKE '%tuberkulosis%'
                AND LOWER(nama_komplikasi) NOT LIKE '%malaria%'
                AND LOWER(nama_komplikasi) NOT LIKE '%hiv%' 
                AND LOWER(nama_komplikasi) NOT LIKE '%jantung%' 
                AND LOWER(nama_komplikasi) NOT LIKE '%hipertensi%'
                AND LOWER(nama_komplikasi) NOT LIKE '%diabetes%' 
                AND LOWER(nama_komplikasi) NOT LIKE '%obesitas%' 
                AND LOWER(nama_komplikasi) NOT LIKE '%keguguran%' 
                AND LOWER(nama_komplikasi) NOT LIKE '%abortus%'
            ) THEN k.id END) as lainnya_hamil_jumlah,
            
            -- Rujukan RS (pregnancy)
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi 
                WHERE forkey_hamil = k.id 
                AND kejadian = 'Saat Hamil'
                AND rujuk_rs = 1
            ) THEN k.id END) as rujuk_rs_hamil_jumlah
            
        FROM kelurahan kel
        LEFT JOIN ibu i ON i.kelurahan_id = kel.id
        LEFT JOIN kehamilan k ON k.forkey_ibu = i.id
        LEFT JOIN antenatal_care anc ON anc.forkey_hamil = k.id
        LEFT JOIN persalinan p ON p.forkey_hamil = k.id
        ${whereClause}
        GROUP BY kel.id, kel.nama_kelurahan
        ORDER BY kel.nama_kelurahan
    `;
};

// Get Nifas Persalinan komplikasi counts (delivery and postpartum complications)
const buildNifasKomplikasiQuery = (whereClause) => {
    return `
        SELECT 
            kel.id,
            kel.nama_kelurahan as kelurahan,
            
            -- Komplikasi Persalinan (from worksheet)
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi 
                WHERE forkey_hamil = k.id 
                AND kejadian IN ('Saat Bersalin', 'Saat Nifas')
                AND (
                    LOWER(nama_komplikasi) LIKE '%anemia%'
                    OR LOWER(nama_komplikasi) LIKE '%perdarahan%'
                )
            ) THEN k.id END) as nifas_anemia_jumlah,
            
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi 
                WHERE forkey_hamil = k.id 
                AND kejadian IN ('Saat Bersalin', 'Saat Nifas')
                AND LOWER(nama_komplikasi) LIKE '%kek%'
            ) THEN k.id END) as nifas_kek_jumlah,
            
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi 
                WHERE forkey_hamil = k.id 
                AND kejadian IN ('Saat Bersalin', 'Saat Nifas')
                AND (
                    LOWER(nama_komplikasi) LIKE '%preeklampsia%' 
                    OR LOWER(nama_komplikasi) LIKE '%preeklamsia%'
                    OR LOWER(nama_komplikasi) LIKE '%eklampsia%'
                    OR LOWER(nama_komplikasi) LIKE '%eklamsia%'
                )
            ) THEN k.id END) as nifas_preeklamsia_jumlah,
            
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi 
                WHERE forkey_hamil = k.id 
                AND kejadian IN ('Saat Bersalin', 'Saat Nifas')
                AND (LOWER(nama_komplikasi) LIKE '%infeksi%' OR LOWER(nama_komplikasi) LIKE '%sepsis%')
            ) THEN k.id END) as nifas_infeksi_jumlah,
            
            -- Lainnya (other delivery/postpartum complications)
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi 
                WHERE forkey_hamil = k.id 
                AND kejadian IN ('Saat Bersalin', 'Saat Nifas')
                AND LOWER(nama_komplikasi) NOT LIKE '%anemia%' 
                AND LOWER(nama_komplikasi) NOT LIKE '%perdarahan%'
                AND LOWER(nama_komplikasi) NOT LIKE '%kek%' 
                AND LOWER(nama_komplikasi) NOT LIKE '%preeklampsia%' 
                AND LOWER(nama_komplikasi) NOT LIKE '%preeklamsia%'
                AND LOWER(nama_komplikasi) NOT LIKE '%eklampsia%'
                AND LOWER(nama_komplikasi) NOT LIKE '%eklamsia%'
                AND LOWER(nama_komplikasi) NOT LIKE '%infeksi%' 
                AND LOWER(nama_komplikasi) NOT LIKE '%sepsis%'
            ) THEN k.id END) as lainnya_nifas_jumlah,
            
            -- Rujukan RS (delivery/postpartum)
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi 
                WHERE forkey_hamil = k.id 
                AND kejadian IN ('Saat Bersalin', 'Saat Nifas')
                AND rujuk_rs = 1
            ) THEN k.id END) as rujuk_rs_nifas_jumlah
            
        FROM kelurahan kel
        LEFT JOIN ibu i ON i.kelurahan_id = kel.id
        LEFT JOIN kehamilan k ON k.forkey_ibu = i.id
        LEFT JOIN antenatal_care anc ON anc.forkey_hamil = k.id
        LEFT JOIN persalinan p ON p.forkey_hamil = k.id
        ${whereClause}
        GROUP BY kel.id, kel.nama_kelurahan
        ORDER BY kel.nama_kelurahan
    `;
};

// Merge data from ANC Terpadu and Nifas Persalinan
const mergeKomplikasiData = (bumilData, ancTerpaduData, nifasData) => {
    return bumilData.map(bumil => {
        const ancTerpadu = ancTerpaduData.find(row => row.kelurahan === bumil.kelurahan) || {};
        const nifas = nifasData.find(row => row.kelurahan === bumil.kelurahan) || {};
        
        const totalBumil = parseInt(bumil.total_bumil) || 0;
        
        // Sum komplikasi from both sources
        const anemia_jumlah = (parseInt(ancTerpadu.anemia_jumlah) || 0) + (parseInt(nifas.nifas_anemia_jumlah) || 0);
        const kek_jumlah = (parseInt(ancTerpadu.kek_jumlah) || 0) + (parseInt(nifas.nifas_kek_jumlah) || 0);
        const preeklamsia_jumlah = (parseInt(ancTerpadu.preeklamsia_jumlah) || 0) + (parseInt(nifas.nifas_preeklamsia_jumlah) || 0);
        const infeksi_jumlah = (parseInt(ancTerpadu.infeksi_jumlah) || 0) + (parseInt(nifas.nifas_infeksi_jumlah) || 0);
        const tb_jumlah = parseInt(ancTerpadu.tb_jumlah) || 0;
        const malaria_jumlah = parseInt(ancTerpadu.malaria_jumlah) || 0;
        const hiv_jumlah = parseInt(ancTerpadu.hiv_jumlah) || 0;
        const jantung_jumlah = parseInt(ancTerpadu.jantung_jumlah) || 0;
        const diabetes_jumlah = parseInt(ancTerpadu.diabetes_jumlah) || 0;
        const obesitas_jumlah = parseInt(ancTerpadu.obesitas_jumlah) || 0;
        const keguguran_jumlah = parseInt(ancTerpadu.keguguran_jumlah) || 0;
        const lainnya_jumlah = (parseInt(ancTerpadu.lainnya_hamil_jumlah) || 0) + (parseInt(nifas.lainnya_nifas_jumlah) || 0);
        
        // Total bumil with any complication
        const total_bumil_komplikasi = anemia_jumlah + kek_jumlah + preeklamsia_jumlah + infeksi_jumlah + 
                                       tb_jumlah + malaria_jumlah + hiv_jumlah + jantung_jumlah + 
                                       diabetes_jumlah + obesitas_jumlah + keguguran_jumlah + lainnya_jumlah;
        
        // Total rujukan
        const rujuk_rs_jumlah = (parseInt(ancTerpadu.rujuk_rs_hamil_jumlah) || 0) + (parseInt(nifas.rujuk_rs_nifas_jumlah) || 0);
        
        const calcPercent = (value) => totalBumil > 0 ? ((value / totalBumil) * 100).toFixed(1) : '0.0';
        
        return {
            kelurahan: bumil.kelurahan,
            total_bumil: totalBumil,
            
            anemia_jumlah,
            anemia_persen: calcPercent(anemia_jumlah),
            
            kek_jumlah,
            kek_persen: calcPercent(kek_jumlah),
            
            preeklamsia_jumlah,
            preeklamsia_persen: calcPercent(preeklamsia_jumlah),
            
            infeksi_jumlah,
            infeksi_persen: calcPercent(infeksi_jumlah),
            
            tb_jumlah,
            tb_persen: calcPercent(tb_jumlah),
            
            malaria_jumlah,
            malaria_persen: calcPercent(malaria_jumlah),
            
            hiv_jumlah,
            hiv_persen: calcPercent(hiv_jumlah),
            
            jantung_jumlah,
            jantung_persen: calcPercent(jantung_jumlah),
            
            diabetes_jumlah,
            diabetes_persen: calcPercent(diabetes_jumlah),
            
            obesitas_jumlah,
            obesitas_persen: calcPercent(obesitas_jumlah),
            
            keguguran_jumlah,
            keguguran_persen: calcPercent(keguguran_jumlah),
            
            lainnya_jumlah,
            lainnya_persen: calcPercent(lainnya_jumlah),
            
            total_bumil_komplikasi,
            total_bumil_komplikasi_persen: calcPercent(total_bumil_komplikasi),
            
            rujuk_rs_jumlah,
            rujuk_rs_persen: calcPercent(rujuk_rs_jumlah)
        };
    });
};

module.exports = { getKomplikasiData };
