const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const authMiddleware = require('../middleware/auth');
const ExcelJS = require('exceljs');
const path = require('path');
const { fillMonthlyDataWorksheet } = require('../process/worksheets/monthlyDataWorksheet');

// Helper function to determine anemia category
function getKategoriAnemia(hb) {
    if (!hb) return '-';
    if (hb < 8) return 'Berat';
    if (hb < 10) return 'Sedang';
    if (hb < 11) return 'Ringan';
    return 'Normal';
}

// Helper function to determine hypertension status
function getHipertensiStatus(tekananDarah) {
    if (!tekananDarah) return 'Non-Preeklampsia';
    
    // Parse blood pressure (format: "120/80")
    const parts = tekananDarah.split('/');
    if (parts.length !== 2) return 'Non-Preeklampsia';
    
    const systolic = parseInt(parts[0]);
    const diastolic = parseInt(parts[1]);
    
    if (isNaN(systolic) || isNaN(diastolic)) return 'Non-Preeklampsia';
    
    // Check if systolic >= 140 OR diastolic >= 90
    return (systolic >= 140 || diastolic >= 90) ? 'Preeklampsia' : 'Non-Preeklampsia';
}

// Helper function to determine diabetes status
function getDiabetesStatus(gulaDarah) {
    if (!gulaDarah) return 'Non-Diabetes';
    
    const gula = parseFloat(gulaDarah);
    if (isNaN(gula)) return 'Non-Diabetes';
    
    // Check if blood sugar > 140
    return gula > 140 ? 'Diabetes' : 'Non-Diabetes';
}

// Helper function to determine lab test status
function getLabStatus(labResult) {
    if (!labResult) return 'Non-Reaktif';
    
    const result = labResult.toString().toLowerCase();
    if (result.includes('positif') || result.includes('reaktif') || result === '1') {
        return 'Reaktif';
    }
    return 'Non-Reaktif';
}

// Get yearly data for all months (for Excel export)
const getYearlyData = async (pool, tahun, kelurahan_id) => {
    const monthlyData = {};

    // Get data for each month
    for (let bulan = 1; bulan <= 12; bulan++) {
        // Query for ANC data
        let ancQuery = `
            SELECT 
                ROW_NUMBER() OVER (ORDER BY i.nama_lengkap) as no,
                i.nama_lengkap,
                i.nik_ibu as nik,
                i.tanggal_lahir,
                i.gol_darah,
                i.rhesus,
                i.no_hp,
                k.nama_kelurahan as kelurahan,
                wp.nama_posyandu as posyandu,
                kh.haid_terakhir as hpht,
                kh.gravida,
                kh.partus,
                kh.abortus,
                kh.taksiran_persalinan as tp,
                ls.hasil_lab_hb as hb,
                anc.lila,
                anc.jenis_kunjungan,
                anc.tanggal_kunjungan,
                anc.tekanan_darah,
                ls.lab_gula_darah,
                ls.skrining_hiv,
                ls.skrining_hbsag,
                ls.skrining_sifilis,
                'ANC' as tipe_kunjungan
            FROM ibu i
            INNER JOIN kehamilan kh ON i.id = kh.forkey_ibu
            INNER JOIN antenatal_care anc ON kh.id = anc.forkey_hamil
            LEFT JOIN kelurahan k ON i.kelurahan_id = k.id
            LEFT JOIN wilker_posyandu wp ON i.posyandu_id = wp.id
            LEFT JOIN lab_screening ls ON anc.forkey_lab_screening = ls.id
            WHERE YEAR(anc.tanggal_kunjungan) = ?
            AND MONTH(anc.tanggal_kunjungan) = ?
            AND kh.status_kehamilan = 'Hamil'
        `;

        // Query for Persalinan data
        let persalinanQuery = `
            SELECT 
                ROW_NUMBER() OVER (ORDER BY i.nama_lengkap) as no,
                i.nama_lengkap,
                i.nik_ibu as nik,
                i.tanggal_lahir,
                i.gol_darah,
                i.rhesus,
                i.no_hp,
                k.nama_kelurahan as kelurahan,
                wp.nama_posyandu as posyandu,
                kh.haid_terakhir as hpht,
                kh.gravida,
                kh.partus,
                kh.abortus,
                kh.taksiran_persalinan as tp,
                NULL as hb,
                NULL as lila,
                NULL as tekanan_darah,
                NULL as hasil_lab_gula_darah,
                NULL as hasil_lab_hiv,
                NULL as hasil_lab_hbsag,
                NULL as hasil_lab_sifilis,
                'Persalinan' as jenis_kunjungan,
                p.tanggal_persalinan as tanggal_kunjungan,
                'Persalinan' as tipe_kunjungan
            FROM ibu i
            INNER JOIN kehamilan kh ON i.id = kh.forkey_ibu
            INNER JOIN persalinan p ON kh.id = p.forkey_hamil
            LEFT JOIN kelurahan k ON i.kelurahan_id = k.id
            LEFT JOIN wilker_posyandu wp ON i.posyandu_id = wp.id
            WHERE YEAR(p.tanggal_persalinan) = ?
            AND MONTH(p.tanggal_persalinan) = ?
        `;

        // Query for Nifas data
        let nifasQuery = `
            SELECT 
                ROW_NUMBER() OVER (ORDER BY i.nama_lengkap) as no,
                i.nama_lengkap,
                i.nik_ibu as nik,
                i.tanggal_lahir,
                i.gol_darah,
                i.rhesus,
                i.no_hp,
                k.nama_kelurahan as kelurahan,
                wp.nama_posyandu as posyandu,
                kh.haid_terakhir as hpht,
                kh.gravida,
                kh.partus,
                kh.abortus,
                kh.taksiran_persalinan as tp,
                NULL as hb,
                NULL as lila,
                NULL as tekanan_darah,
                NULL as hasil_lab_gula_darah,
                NULL as hasil_lab_hiv,
                NULL as hasil_lab_hbsag,
                NULL as hasil_lab_sifilis,
                COALESCE(kn.jenis_kunjungan, 'Kunjungan Nifas') as jenis_kunjungan,
                kn.tanggal_kunjungan,
                'Nifas' as tipe_kunjungan
            FROM ibu i
            INNER JOIN kehamilan kh ON i.id = kh.forkey_ibu
            INNER JOIN kunjungan_nifas kn ON kh.id = kn.forkey_hamil
            LEFT JOIN kelurahan k ON i.kelurahan_id = k.id
            LEFT JOIN wilker_posyandu wp ON i.posyandu_id = wp.id
            WHERE YEAR(kn.tanggal_kunjungan) = ?
            AND MONTH(kn.tanggal_kunjungan) = ?
        `;

        const params = [tahun, bulan];

        if (kelurahan_id) {
            ancQuery += ' AND i.kelurahan_id = ?';
            persalinanQuery += ' AND i.kelurahan_id = ?';
            nifasQuery += ' AND i.kelurahan_id = ?';
            params.push(kelurahan_id);
        }

        // Execute all queries
        const [ancRows] = await pool.query(ancQuery, params);
        const [persalinanRows] = await pool.query(persalinanQuery, params);
        const [nifasRows] = await pool.query(nifasQuery, params);

        // Combine all data
        const allRows = [...ancRows, ...persalinanRows, ...nifasRows];

        // Process data and renumber
        monthlyData[bulan] = allRows.map((row, index) => ({
            ...row,
            no: index + 1,
            kategori_anemia: getKategoriAnemia(row.hb),
            kek: row.lila && row.lila < 23.5 ? 'Ya' : (row.lila ? 'Tidak' : '-'),
            hipertensi: getHipertensiStatus(row.tekanan_darah),
            diabetes: getDiabetesStatus(row.hasil_lab_gula_darah),
            hiv: getLabStatus(row.hasil_lab_hiv),
            hbsag: getLabStatus(row.hasil_lab_hbsag),
            sifilis: getLabStatus(row.hasil_lab_sifilis)
        }));

        // Sort by name and date
        monthlyData[bulan].sort((a, b) => {
            const nameCompare = a.nama_lengkap.localeCompare(b.nama_lengkap);
            if (nameCompare !== 0) return nameCompare;
            return new Date(a.tanggal_kunjungan) - new Date(b.tanggal_kunjungan);
        });
    }

    return monthlyData;
};

// Export data to Excel using new template (covers all months for the selected year)
router.get('/generate', authMiddleware, async (req, res) => {
    try {
        const { year, kelurahan_id } = req.query;
        const tahun = year; // Convert parameter name for compatibility

        if (!tahun) {
            return res.status(400).json({
                success: false,
                message: 'Parameter year diperlukan'
            });
        }

        // Load the new template
        const workbook = new ExcelJS.Workbook();
        const templatePath = path.join(__dirname, '..', 'laporan_bulanan_iBundaCare.xlsx');
        await workbook.xlsx.readFile(templatePath);

        // Get current date for report
        const currentDate = new Date();
        const tanggal_laporan = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
        const nama_puskesmas = 'Puskesmas Handil Bakti';

        // Get yearly data using the correct queries
        console.log('Fetching yearly data for tahun:', tahun, 'kelurahan_id:', kelurahan_id);
        const yearlyData = await getYearlyData(pool, tahun, kelurahan_id);
        
        console.log('Yearly data fetched:', {
            totalMonths: Object.keys(yearlyData).length,
            sampleMonth: yearlyData[1] ? yearlyData[1].length : 0
        });

        // Fill monthly worksheets with data
        try {
            await fillMonthlyDataWorksheet(workbook, yearlyData, tanggal_laporan, nama_puskesmas);
        } catch (error) {
            console.error('Error filling monthly worksheets:', error);
            console.error('Error details:', error.stack);
        }

        // Generate filename
        const kelurahanName = kelurahan_id ? `_Kelurahan_${kelurahan_id}` : '_Semua_Kelurahan';
        const filename = `Laporan_Puskesmas_${tahun}${kelurahanName}_${currentDate.toISOString().split('T')[0]}.xlsx`;

        // Send file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error exporting Excel:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengekspor laporan',
            error: error.message
        });
    }
});

module.exports = router;