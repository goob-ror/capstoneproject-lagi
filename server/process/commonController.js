// Common Controller
// Handles common/shared queries like kelurahan and years

const getKelurahanList = async (pool, req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, nama_kelurahan FROM kelurahan ORDER BY nama_kelurahan');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getAvailableYears = async (pool, req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT DISTINCT YEAR(haid_terakhir) as year 
            FROM kehamilan 
            WHERE haid_terakhir IS NOT NULL 
            ORDER BY year DESC
        `);
        res.json(rows.map(r => r.year));
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getKelurahanList,
    getAvailableYears
};
