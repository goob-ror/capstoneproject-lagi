// Excel Export Controller
// Generates Excel reports using data from other controllers

const ExcelJS = require('exceljs');
const path = require('path');
const { getAncData } = require('./ancController');
const { getAncTerpaduData } = require('./ancTerpaduController');
const { getNifasPersalinanData } = require('./nifasPersalinanController');
const { getKomplikasiData } = require('./komplikasiController');
const { getDataPasien } = require('./dataPasienController');

// Import worksheet fillers
const { fillDataPasienWorksheet } = require('./worksheets/dataPasienWorksheet');
const { fillANCWorksheet } = require('./worksheets/ancWorksheet');
const { fillANCTerpaduWorksheet } = require('./worksheets/ancTerpaduWorksheet');
const { fillNifasPersalinanWorksheet } = require('./worksheets/nifasPersalinanWorksheet');
const { fillKomplikasiWorksheet } = require('./worksheets/komplikasiWorksheet');

const generateExcelReport = async (pool, req, res) => {
    try {
        const { year = '', month = '', nama_puskesmas = 'Puskesmas' } = req.query;

        // Load template
        const templatePath = path.join(__dirname, '../template_laporan_puskesmas.xlsx');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(templatePath);

        // Format date for report
        const tanggal_laporan = new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        // Get data from controllers
        const ancData = await getDataFromController(pool, req, getAncData);
        const ancTerpaduData = await getDataFromController(pool, req, getAncTerpaduData);
        const nifasPersalinanData = await getDataFromController(pool, req, getNifasPersalinanData);
        const komplikasiData = await getDataFromController(pool, req, getKomplikasiData);
        const dataPasienData = await getDataFromController(pool, req, getDataPasien);

        // Fill worksheets
        await fillDataPasienWorksheet(workbook, dataPasienData, tanggal_laporan, nama_puskesmas);
        await fillANCWorksheet(workbook, ancData, tanggal_laporan, nama_puskesmas);
        await fillANCTerpaduWorksheet(workbook, ancTerpaduData, tanggal_laporan, nama_puskesmas);
        await fillNifasPersalinanWorksheet(workbook, nifasPersalinanData, tanggal_laporan, nama_puskesmas);
        await fillKomplikasiWorksheet(workbook, komplikasiData, tanggal_laporan, nama_puskesmas);

        // Generate filename
        const filename = `Laporan_${nama_puskesmas}_${year || 'All'}_${month || 'All'}.xlsx`;


        // Send file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error generating Excel report:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
};

// Helper function to get data from controller
const getDataFromController = async (pool, req, controllerFunc) => {
    return new Promise((resolve, reject) => {
        const mockRes = {
            json: (data) => resolve(data),
            status: (code) => ({
                json: (data) => reject(new Error(data.error || 'Controller error'))
            })
        };
        controllerFunc(pool, req, mockRes);
    });
};

module.exports = { generateExcelReport };
