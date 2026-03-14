// Nifas Persalinan Controller
// Handles all Nifas and Persalinan related queries and logic

const getNifasPersalinanData = async (pool, req, res) => {
    try {
        const { year = '', month = '' } = req.query;

        // Build WHERE clause for date filtering
        let whereConditions = [];
        let params = [];

        if (year) {
            whereConditions.push('YEAR(p.tanggal_persalinan) = ?');
            params.push(year);
        }

        if (month) {
            whereConditions.push('MONTH(p.tanggal_persalinan) = ?');
            params.push(month);
        }

        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ') 
            : '';

        // Query for each kelurahan
        const kelurahanQuery = buildNifasPersalinanQuery(whereClause);

        const [kelurahanData] = await pool.query(kelurahanQuery, params);

        // Calculate totals
        const total = calculateTotals(kelurahanData);

        res.json({
            kelurahan: kelurahanData,
            total
        });

    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Helper function to build the Nifas Persalinan SQL query
const buildNifasPersalinanQuery = (whereClause) => {
    return `
        SELECT 
            kel.id,
            kel.nama_kelurahan as kelurahan,
            
            -- Jumlah Ibu Bersalin
            COUNT(DISTINCT k.id) as jumlah_bumil,
            COUNT(DISTINCT p.id) as jumlah_bersalin,

             -- Bumil per Trimester (based on HPHT)
            COUNT(DISTINCT CASE WHEN DATEDIFF(CURDATE(), k.haid_terakhir) <= 84 THEN k.id END) as tm1,
            COUNT(DISTINCT CASE WHEN DATEDIFF(CURDATE(), k.haid_terakhir) BETWEEN 85 AND 196 THEN k.id END) as tm2,
            COUNT(DISTINCT CASE WHEN DATEDIFF(CURDATE(), k.haid_terakhir) > 196 THEN k.id END) as tm3,
            
            -- Persalinan di Fasilitas Kesehatan
            COUNT(DISTINCT CASE WHEN p.tempat_persalinan IN ('RS', 'Puskesmas', 'Klinik') THEN p.id END) as jumlah_faskes,
            ROUND(COUNT(DISTINCT CASE WHEN p.tempat_persalinan IN ('RS', 'Puskesmas', 'Klinik') THEN p.id END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_faskes,
            
            -- Persalinan oleh Tenaga Kesehatan
            COUNT(DISTINCT CASE WHEN p.penolong IN ('Bidan', 'Dokter') THEN p.id END) as jumlah_nakes,
            ROUND(COUNT(DISTINCT CASE WHEN p.penolong IN ('Bidan', 'Dokter') THEN p.id END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_nakes,
            
            -- Persalinan Spontan
            COUNT(DISTINCT CASE WHEN p.cara_persalinan = 'Spontan' THEN p.id END) as jumlah_spontan,
            ROUND(COUNT(DISTINCT CASE WHEN p.cara_persalinan = 'Spontan' THEN p.id END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_spontan,
            
            -- Persalinan dengan Komplikasi
            COUNT(DISTINCT CASE WHEN p.komplikasi_ibu IS NOT NULL OR p.perdarahan != 'Tidak' THEN p.id END) as jumlah_komplikasi,
            ROUND(COUNT(DISTINCT CASE WHEN p.komplikasi_ibu IS NOT NULL OR p.perdarahan != 'Tidak' THEN p.id END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_komplikasi,
            
            -- Pelayanan Nifas KF1
            COUNT(DISTINCT CASE WHEN kn.jenis_kunjungan = 'KF1' THEN kn.forkey_hamil END) as jumlah_kf1,
            ROUND(COUNT(DISTINCT CASE WHEN kn.jenis_kunjungan = 'KF1' THEN kn.forkey_hamil END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_kf1,
            
            -- Pelayanan Nifas KF2
            COUNT(DISTINCT CASE WHEN kn.jenis_kunjungan = 'KF2' THEN kn.forkey_hamil END) as jumlah_kf2,
            ROUND(COUNT(DISTINCT CASE WHEN kn.jenis_kunjungan = 'KF2' THEN kn.forkey_hamil END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_kf2,
            
            -- Pelayanan Nifas KF3
            COUNT(DISTINCT CASE WHEN kn.jenis_kunjungan = 'KF3' THEN kn.forkey_hamil END) as jumlah_kf3,
            ROUND(COUNT(DISTINCT CASE WHEN kn.jenis_kunjungan = 'KF3' THEN kn.forkey_hamil END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_kf3,
            
            -- Pelayanan Nifas Lengkap (KF1-KF3)
            COUNT(DISTINCT CASE WHEN (
                SELECT COUNT(DISTINCT jenis_kunjungan) 
                FROM kunjungan_nifas 
                WHERE forkey_hamil = k.id 
                AND jenis_kunjungan IN ('KF1', 'KF2', 'KF3')
            ) >= 3 THEN p.id END) as jumlah_kf_lengkap,
            ROUND(COUNT(DISTINCT CASE WHEN (
                SELECT COUNT(DISTINCT jenis_kunjungan) 
                FROM kunjungan_nifas 
                WHERE forkey_hamil = k.id 
                AND jenis_kunjungan IN ('KF1', 'KF2', 'KF3')
            ) >= 3 THEN p.id END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_kf_lengkap,
            
            -- Mendapat TTD
            COUNT(DISTINCT CASE WHEN p.beri_ttd = 1 THEN p.id END) as jumlah_ttd,
            ROUND(COUNT(DISTINCT CASE WHEN p.beri_ttd = 1 THEN p.id END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_ttd,
            
            -- Komplikasi Persalinan/Nifas by Type
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND nama_komplikasi LIKE '%Anemia%'
            ) THEN p.id END) as jumlah_anemia,
            ROUND(COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND nama_komplikasi LIKE '%Anemia%'
            ) THEN p.id END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_anemia,
            
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND nama_komplikasi LIKE '%KEK%'
            ) THEN p.id END) as jumlah_kek,
            ROUND(COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND nama_komplikasi LIKE '%KEK%'
            ) THEN p.id END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_kek,
            
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND nama_komplikasi LIKE '%eklamsia%'
            ) THEN p.id END) as jumlah_eklamsia,
            ROUND(COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND nama_komplikasi LIKE '%eklamsia%'
            ) THEN p.id END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_eklamsia,
            
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND nama_komplikasi LIKE '%Infeksi%'
            ) THEN p.id END) as jumlah_infeksi,
            ROUND(COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND nama_komplikasi LIKE '%Infeksi%'
            ) THEN p.id END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_infeksi,
            
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND nama_komplikasi LIKE '%TB%'
            ) THEN p.id END) as jumlah_tb,
            ROUND(COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND nama_komplikasi LIKE '%TB%'
            ) THEN p.id END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_tb,
            
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND nama_komplikasi LIKE '%Malaria%'
            ) THEN p.id END) as jumlah_malaria,
            ROUND(COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND nama_komplikasi LIKE '%Malaria%'
            ) THEN p.id END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_malaria,
            
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND nama_komplikasi LIKE '%HIV%'
            ) THEN p.id END) as jumlah_hiv,
            ROUND(COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND nama_komplikasi LIKE '%HIV%'
            ) THEN p.id END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_hiv,
            
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND nama_komplikasi LIKE '%Jantung%'
            ) THEN p.id END) as jumlah_jantung,
            ROUND(COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND nama_komplikasi LIKE '%Jantung%'
            ) THEN p.id END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_jantung,
            
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND nama_komplikasi LIKE '%Diabetes%'
            ) THEN p.id END) as jumlah_diabetes,
            ROUND(COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND nama_komplikasi LIKE '%Diabetes%'
            ) THEN p.id END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_diabetes,
            
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND nama_komplikasi LIKE '%Obesitas%'
            ) THEN p.id END) as jumlah_obesitas,
            ROUND(COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND nama_komplikasi LIKE '%Obesitas%'
            ) THEN p.id END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_obesitas,
            
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND nama_komplikasi LIKE '%Keguguran%'
            ) THEN p.id END) as jumlah_keguguran,
            ROUND(COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND nama_komplikasi LIKE '%Keguguran%'
            ) THEN p.id END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_keguguran,
            
            -- Komplikasi Lainnya
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id 
                AND nama_komplikasi NOT LIKE '%Anemia%'
                AND nama_komplikasi NOT LIKE '%KEK%'
                AND nama_komplikasi NOT LIKE '%eklamsia%'
                AND nama_komplikasi NOT LIKE '%Infeksi%'
                AND nama_komplikasi NOT LIKE '%TB%'
                AND nama_komplikasi NOT LIKE '%Malaria%'
                AND nama_komplikasi NOT LIKE '%HIV%'
                AND nama_komplikasi NOT LIKE '%Jantung%'
                AND nama_komplikasi NOT LIKE '%Diabetes%'
                AND nama_komplikasi NOT LIKE '%Obesitas%'
                AND nama_komplikasi NOT LIKE '%Keguguran%'
            ) THEN p.id END) as jumlah_lainnya,
            ROUND(COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id 
                AND nama_komplikasi NOT LIKE '%Anemia%'
                AND nama_komplikasi NOT LIKE '%KEK%'
                AND nama_komplikasi NOT LIKE '%eklamsia%'
                AND nama_komplikasi NOT LIKE '%Infeksi%'
                AND nama_komplikasi NOT LIKE '%TB%'
                AND nama_komplikasi NOT LIKE '%Malaria%'
                AND nama_komplikasi NOT LIKE '%HIV%'
                AND nama_komplikasi NOT LIKE '%Jantung%'
                AND nama_komplikasi NOT LIKE '%Diabetes%'
                AND nama_komplikasi NOT LIKE '%Obesitas%'
                AND nama_komplikasi NOT LIKE '%Keguguran%'
            ) THEN p.id END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_lainnya,
            
            -- Total Bumil dengan Komplikasi
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id
            ) THEN p.id END) as jumlah_bumil_komplikasi,
            ROUND(COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id
            ) THEN p.id END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_bumil_komplikasi,
            
            -- Bumil Dirujuk ke RS
            COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND rujuk_rs = 1
            ) THEN p.id END) as jumlah_rujuk_rs,
            ROUND(COUNT(DISTINCT CASE WHEN EXISTS (
                SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND rujuk_rs = 1
            ) THEN p.id END) * 100.0 / NULLIF(COUNT(DISTINCT p.id), 0), 1) as persen_rujuk_rs
            
        FROM kelurahan kel
        LEFT JOIN ibu i ON i.kelurahan_id = kel.id
        LEFT JOIN kehamilan k ON k.forkey_ibu = i.id
        LEFT JOIN persalinan p ON p.forkey_hamil = k.id
        LEFT JOIN kunjungan_nifas kn ON kn.forkey_hamil = k.id
        ${whereClause}
        GROUP BY kel.id, kel.nama_kelurahan
        ORDER BY kel.nama_kelurahan
    `;
};

// Helper function to calculate totals
const calculateTotals = (kelurahanData) => {
    const total = {
        kelurahan: 'TOTAL',
        jumlah_bumil: 0,
        jumlah_bersalin: 0,
        tm1: 0,
        tm2: 0,
        tm3: 0
    };

    // Sum all numeric fields that start with 'jumlah_' and tm1, tm2, tm3
    kelurahanData.forEach(row => {
        Object.keys(row).forEach(key => {
            if (key !== 'kelurahan' && key !== 'id' && (key.startsWith('jumlah_') || key === 'tm1' || key === 'tm2' || key === 'tm3')) {
                if (!total[key]) total[key] = 0;
                total[key] += parseInt(row[key]) || 0;
            }
        });
    });

    // Calculate percentages for totals
    Object.keys(total).forEach(key => {
        if (key.startsWith('jumlah_') && key !== 'jumlah_bersalin' && key !== 'jumlah_bumil') {
            const persenKey = key.replace('jumlah_', 'persen_');
            total[persenKey] = total.jumlah_bersalin > 0 
                ? (total[key] * 100 / total.jumlah_bersalin).toFixed(1)
                : '0.0';
        }
    });

    return total;
};

module.exports = { getNifasPersalinanData };
