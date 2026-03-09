// Data Pasien Controller
// Handles all data pasien related queries and logic

const getDataPasien = async (pool, req, res) => {
    try {
        const { page = 1, year = '', month = '', kelurahan = '' } = req.query;
        const limit = 50;
        const offset = (page - 1) * limit;

        // Build WHERE clause - matching ANC and ANC Terpadu filtering logic
        let whereConditions = [];
        let whereConditionsSubquery = [];
        let params = [];
        let paramsSubquery = [];

        if (year) {
            whereConditions.push('(YEAR(anc.tanggal_kunjungan) = ? OR YEAR(pers.tanggal_persalinan) = ?)');
            params.push(year, year);
            whereConditionsSubquery.push('(YEAR(anc2.tanggal_kunjungan) = ? OR YEAR(pers2.tanggal_persalinan) = ?)');
            paramsSubquery.push(year, year);
        }

        if (month) {
            whereConditions.push('(MONTH(anc.tanggal_kunjungan) = ? OR MONTH(pers.tanggal_persalinan) = ?)');
            params.push(month, month);
            whereConditionsSubquery.push('(MONTH(anc2.tanggal_kunjungan) = ? OR MONTH(pers2.tanggal_persalinan) = ?)');
            paramsSubquery.push(month, month);
        }

        if (kelurahan) {
            whereConditions.push('i.kelurahan_id = ?');
            params.push(kelurahan);
            whereConditionsSubquery.push('i2.kelurahan_id = ?');
            paramsSubquery.push(kelurahan);
        }

        const whereClause = whereConditions.length > 0 
            ? 'WHERE ' + whereConditions.join(' AND ') 
            : '';
        
        const whereClauseSubquery = whereConditionsSubquery.length > 0 
            ? 'WHERE ' + whereConditionsSubquery.join(' AND ') 
            : '';

        // Get total count
        const countQuery = `
            SELECT COUNT(DISTINCT k.id) as total
            FROM kehamilan k
            LEFT JOIN ibu i ON i.id = k.forkey_ibu
            LEFT JOIN antenatal_care anc ON anc.forkey_hamil = k.id
            LEFT JOIN persalinan pers ON pers.forkey_hamil = k.id
            ${whereClause}
        `;
        const [countResult] = await pool.query(countQuery, params);
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        // Get data - using subquery to filter pregnancies first
        const dataQuery = `
            SELECT 
                i.id,
                i.nama_lengkap as datapasien_namapasien,
                i.nik_ibu as datapasien_nik,
                DATE_FORMAT(i.tanggal_lahir, '%d-%m-%Y') as datapasien_tanggallahir,
                i.gol_darah as datapasien_goldarah,
                i.no_hp as datapasien_nomorhp,
                kel.nama_kelurahan as datapasien_kelurahan,
                p.nama_posyandu as datapasien_posyandu,
                s.nama_lengkap as datapasien_namasuami,
                CASE WHEN s.isPerokok = 1 THEN 'Ya' ELSE 'Tidak' END as datapasien_suamiperokok,
                i.pendidikan as datapasien_pendidikan,
                i.pekerjaan as datapasien_pekerjaan,
                CASE 
                    WHEN i.tinggi_badan IS NOT NULL AND i.beratbadan IS NOT NULL 
                    THEN ROUND(i.beratbadan / POWER(i.tinggi_badan/100, 2), 2)
                    ELSE NULL 
                END as datapasien_bmi,
                DATE_FORMAT(k.haid_terakhir, '%d-%m-%Y') as datapasien_hpht,
                CONCAT(k.gravida, '-', k.partus, '-', k.abortus) as datapasien_gpa,
                DATE_FORMAT(k.taksiran_persalinan, '%d-%m-%Y') as datapasien_tp
            FROM kehamilan k
            INNER JOIN (
                SELECT DISTINCT k2.id
                FROM kehamilan k2
                LEFT JOIN ibu i2 ON i2.id = k2.forkey_ibu
                LEFT JOIN antenatal_care anc2 ON anc2.forkey_hamil = k2.id
                LEFT JOIN persalinan pers2 ON pers2.forkey_hamil = k2.id
                ${whereClauseSubquery}
                ORDER BY k2.id DESC
                LIMIT ? OFFSET ?
            ) filtered ON filtered.id = k.id
            LEFT JOIN ibu i ON i.id = k.forkey_ibu
            LEFT JOIN kelurahan kel ON i.kelurahan_id = kel.id
            LEFT JOIN wilker_posyandu p ON i.posyandu_id = p.id
            LEFT JOIN suami s ON i.id = s.forkey_ibu
            ORDER BY k.id DESC
        `;
        
        const [rows] = await pool.query(dataQuery, [...paramsSubquery, limit, offset]);

        res.json({
            data: rows,
            page: parseInt(page),
            totalPages,
            total
        });

    } catch (error) {
        console.error('Error fetching data pasien:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getDataPasien };
