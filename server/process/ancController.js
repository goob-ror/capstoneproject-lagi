// ANC Controller
// Handles all ANC (Antenatal Care) related queries and logic

const getAncData = async (pool, req, res) => {
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

        // Query for each kelurahan - using SQL aggregation for efficiency
        const kelurahanQuery = buildAncQuery(whereClause);

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

// Helper function to build the ANC SQL query
const buildAncQuery = (whereClause) => {
    return `
        SELECT 
            kel.id,
            kel.nama_kelurahan as kelurahan,
            
            -- Jumlah Bumil, Bersalin, Resti
            COUNT(DISTINCT k.id) as jumlah_bumil,
            COUNT(DISTINCT CASE WHEN k.status_kehamilan IN ('Bersalin', 'Nifas', 'Selesai') THEN k.id END) as jumlah_bersalin,
            COUNT(DISTINCT CASE WHEN anc.status_risiko_visit IN ('Sedang', 'Tinggi') THEN k.id END) as jumlahresti,
            
            -- Buku KIA
            COUNT(DISTINCT CASE WHEN i.buku_kia = 'Ada' THEN k.id END) as jumlah_milikibukukia,
            ROUND(COUNT(DISTINCT CASE WHEN i.buku_kia = 'Ada' THEN k.id END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as persen_milikibukukia,
            
            -- Standar 12T (K6 or more visits)
            COUNT(DISTINCT CASE WHEN (SELECT COUNT(*) FROM antenatal_care WHERE forkey_hamil = k.id) >= 6 THEN k.id END) as jumlah_standar12t,
            ROUND(COUNT(DISTINCT CASE WHEN (SELECT COUNT(*) FROM antenatal_care WHERE forkey_hamil = k.id) >= 6 THEN k.id END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as persen_standar12t,
            
            -- 4 Terlalu
            COUNT(DISTINCT CASE WHEN (
                YEAR(CURDATE()) - YEAR(i.tanggal_lahir) < 20 OR 
                YEAR(CURDATE()) - YEAR(i.tanggal_lahir) > 35 OR 
                k.gravida >= 4
            ) THEN k.id END) as jumlah_4terlalu,
            ROUND(COUNT(DISTINCT CASE WHEN (
                YEAR(CURDATE()) - YEAR(i.tanggal_lahir) < 20 OR 
                YEAR(CURDATE()) - YEAR(i.tanggal_lahir) > 35 OR 
                k.gravida >= 4
            ) THEN k.id END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as persen_4terlalu,
            
            -- K1 Murni
            COUNT(DISTINCT CASE WHEN anc.jenis_kunjungan = 'K1' AND anc.jenis_akses = 'Murni' THEN anc.forkey_hamil END) as jumlah_k1murni,
            ROUND(COUNT(DISTINCT CASE WHEN anc.jenis_kunjungan = 'K1' AND anc.jenis_akses = 'Murni' THEN anc.forkey_hamil END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as persen_k1murni,
            
            -- K1 Akses
            COUNT(DISTINCT CASE WHEN anc.jenis_kunjungan = 'K1' AND anc.jenis_akses = 'Akses' THEN anc.forkey_hamil END) as jumlah_k1akses,
            ROUND(COUNT(DISTINCT CASE WHEN anc.jenis_kunjungan = 'K1' AND anc.jenis_akses = 'Akses' THEN anc.forkey_hamil END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as persen_k1akses,
            
            -- K1 Dokter, K1 USG, K4, K5, K5 Dokter, K5 USG, K6, K8
            COUNT(DISTINCT CASE WHEN anc.jenis_kunjungan = 'K1' AND anc.pemeriksa = 'Dokter' THEN anc.forkey_hamil END) as jumlah_k1dokter,
            ROUND(COUNT(DISTINCT CASE WHEN anc.jenis_kunjungan = 'K1' AND anc.pemeriksa = 'Dokter' THEN anc.forkey_hamil END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as persen_k1dokter,
            COUNT(DISTINCT CASE WHEN anc.jenis_kunjungan = 'K1' AND anc.confirm_usg = 1 THEN anc.forkey_hamil END) as jumlah_k1usg,
            ROUND(COUNT(DISTINCT CASE WHEN anc.jenis_kunjungan = 'K1' AND anc.confirm_usg = 1 THEN anc.forkey_hamil END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as persen_k1usg,
            COUNT(DISTINCT CASE WHEN anc.jenis_kunjungan = 'K4' THEN anc.forkey_hamil END) as jumlah_k4,
            ROUND(COUNT(DISTINCT CASE WHEN anc.jenis_kunjungan = 'K4' THEN anc.forkey_hamil END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as persen_k4,
            COUNT(DISTINCT CASE WHEN anc.jenis_kunjungan = 'K5' THEN anc.forkey_hamil END) as jumlah_k5,
            ROUND(COUNT(DISTINCT CASE WHEN anc.jenis_kunjungan = 'K5' THEN anc.forkey_hamil END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as persen_k5,
            COUNT(DISTINCT CASE WHEN anc.jenis_kunjungan = 'K5' AND anc.pemeriksa = 'Dokter' THEN anc.forkey_hamil END) as jumlah_k5dokter,
            ROUND(COUNT(DISTINCT CASE WHEN anc.jenis_kunjungan = 'K5' AND anc.pemeriksa = 'Dokter' THEN anc.forkey_hamil END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as persen_k5dokter,
            COUNT(DISTINCT CASE WHEN anc.jenis_kunjungan = 'K5' AND anc.confirm_usg = 1 THEN anc.forkey_hamil END) as jumlah_k5usg,
            ROUND(COUNT(DISTINCT CASE WHEN anc.jenis_kunjungan = 'K5' AND anc.confirm_usg = 1 THEN anc.forkey_hamil END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as persen_k5usg,
            COUNT(DISTINCT CASE WHEN anc.jenis_kunjungan = 'K6' THEN anc.forkey_hamil END) as jumlah_k6,
            ROUND(COUNT(DISTINCT CASE WHEN anc.jenis_kunjungan = 'K6' THEN anc.forkey_hamil END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as persen_k6,
            COUNT(DISTINCT CASE WHEN anc.jenis_kunjungan = 'K8' THEN anc.forkey_hamil END) as jumlah_k8,
            ROUND(COUNT(DISTINCT CASE WHEN anc.jenis_kunjungan = 'K8' THEN anc.forkey_hamil END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as persen_k8,
            
            -- T1-T5 Immunization
            COUNT(DISTINCT CASE WHEN anc.status_imunisasi_tt = 'T1' THEN anc.forkey_hamil END) as jumlah_t1,
            ROUND(COUNT(DISTINCT CASE WHEN anc.status_imunisasi_tt = 'T1' THEN anc.forkey_hamil END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as persen_t1,
            COUNT(DISTINCT CASE WHEN anc.status_imunisasi_tt = 'T2' THEN anc.forkey_hamil END) as jumlah_t2,
            ROUND(COUNT(DISTINCT CASE WHEN anc.status_imunisasi_tt = 'T2' THEN anc.forkey_hamil END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as persen_t2,
            COUNT(DISTINCT CASE WHEN anc.status_imunisasi_tt = 'T3' THEN anc.forkey_hamil END) as jumlah_t3,
            ROUND(COUNT(DISTINCT CASE WHEN anc.status_imunisasi_tt = 'T3' THEN anc.forkey_hamil END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as persen_t3,
            COUNT(DISTINCT CASE WHEN anc.status_imunisasi_tt = 'T4' THEN anc.forkey_hamil END) as jumlah_t4,
            ROUND(COUNT(DISTINCT CASE WHEN anc.status_imunisasi_tt = 'T4' THEN anc.forkey_hamil END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as persen_t4,
            COUNT(DISTINCT CASE WHEN anc.status_imunisasi_tt = 'T5' THEN anc.forkey_hamil END) as jumlah_t5,
            ROUND(COUNT(DISTINCT CASE WHEN anc.status_imunisasi_tt = 'T5' THEN anc.forkey_hamil END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as persen_t5,
            COUNT(DISTINCT CASE WHEN anc.status_imunisasi_tt IN ('T2', 'T3', 'T4', 'T5') THEN anc.forkey_hamil END) as 'jumlah_t2+',
            ROUND(COUNT(DISTINCT CASE WHEN anc.status_imunisasi_tt IN ('T2', 'T3', 'T4', 'T5') THEN anc.forkey_hamil END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as 'persen_t2+',
            
            -- FE 30 & 90
            COUNT(DISTINCT CASE WHEN anc.beri_tablet_fe = 1 THEN anc.forkey_hamil END) as jumlah_fe30,
            ROUND(COUNT(DISTINCT CASE WHEN anc.beri_tablet_fe = 1 THEN anc.forkey_hamil END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as persen_fe30,
            COUNT(DISTINCT CASE WHEN (SELECT COUNT(*) FROM antenatal_care WHERE forkey_hamil = k.id AND beri_tablet_fe = 1) >= 3 THEN k.id END) as jumlah_fe90,
            ROUND(COUNT(DISTINCT CASE WHEN (SELECT COUNT(*) FROM antenatal_care WHERE forkey_hamil = k.id AND beri_tablet_fe = 1) >= 3 THEN k.id END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as persen_fe90,
            
            -- Complications
            COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND kejadian = 'Saat Hamil') THEN k.id END) as jumlah_maternal,
            ROUND(COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM komplikasi WHERE forkey_hamil = k.id AND kejadian = 'Saat Hamil') THEN k.id END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as persen_maternal,
            COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM bayi b JOIN persalinan p ON b.forkey_persalinan = p.id WHERE p.forkey_hamil = k.id AND b.status_risiko IS NOT NULL) THEN k.id END) as jumlah_neonatal,
            ROUND(COUNT(DISTINCT CASE WHEN EXISTS (SELECT 1 FROM bayi b JOIN persalinan p ON b.forkey_persalinan = p.id WHERE p.forkey_hamil = k.id AND b.status_risiko IS NOT NULL) THEN k.id END) * 100.0 / NULLIF(COUNT(DISTINCT k.id), 0), 1) as persen_neonatal
            
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

// Helper function to calculate totals
const calculateTotals = (kelurahanData) => {
    const total = {
        kelurahan: 'TOTAL',
        jumlah_bumil: 0,
        jumlah_bersalin: 0,
        jumlahresti: 0
    };

    // Sum all numeric fields that start with 'jumlah_'
    kelurahanData.forEach(row => {
        Object.keys(row).forEach(key => {
            if (key !== 'kelurahan' && key !== 'id' && key.startsWith('jumlah_')) {
                if (!total[key]) total[key] = 0;
                total[key] += parseInt(row[key]) || 0;
            }
        });
    });

    // Calculate percentages for totals
    Object.keys(total).forEach(key => {
        if (key.startsWith('jumlah_') && key !== 'jumlah_bumil') {
            const persenKey = key.replace('jumlah_', 'persen_');
            total[persenKey] = total.jumlah_bumil > 0 
                ? (total[key] * 100 / total.jumlah_bumil).toFixed(1)
                : 0;
        }
    });

    return total;
};

module.exports = { getAncData };
