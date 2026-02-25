const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const pool = require('../../database/db');
const authMiddleware = require('../../middleware/auth');
const path = require('path');

// Import worksheet populators
const { populateDataPasien } = require('./dataPasienPopulator');
const { populateANC } = require('./ancPopulator');
const { populateANCTerpadu } = require('./ancTerpaduPopulator');
const { populatePersalinanNifas } = require('./persalinanNifasPopulator');
const { populateKomplikasi } = require('./komplikasiPopulator');

// Generate Excel report with real database data
router.get('/generate', authMiddleware, async (req, res) => {
  try {
    const { kelurahan, year, month } = req.query;
    console.log('Excel export request:', { kelurahan, year, month });

    // Load the template
    const workbook = new ExcelJS.Workbook();
    const templatePath = path.join(__dirname, '../../template_laporan_puskesmas.xlsx');
    await workbook.xlsx.readFile(templatePath);

    // Build filter parameters
    const filters = { kelurahan, year, month };

    // Populate each worksheet
    console.log('Populating Data Pasien sheet...');
    await populateDataPasien(workbook, pool, filters);

    console.log('Populating ANC sheet...');
    await populateANC(workbook, pool, filters);

    console.log('Populating ANC Terpadu sheet...');
    await populateANCTerpadu(workbook, pool, filters);

    console.log('Populating Persalinan Nifas sheet...');
    await populatePersalinanNifas(workbook, pool, filters);

    console.log('Populating Komplikasi Kebidanan sheet...');
    await populateKomplikasi(workbook, pool, filters);

    console.log('Generating Excel file...');
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set headers for file download
    const kelurahanName = kelurahan ? `_${kelurahan}` : '_Semua';
    const yearName = year ? `_${year}` : '';
    const monthName = month ? `_${getMonthName(month)}` : '';
    const filename = `Laporan_Puskesmas${kelurahanName}${yearName}${monthName}_${new Date().toISOString().split('T')[0]}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    console.log('Sending file to client...');
    res.send(buffer);

  } catch (error) {
    console.error('Error generating Excel:', error);
    res.status(500).json({
      message: 'Error generating Excel file',
      error: error.message
    });
  }
});

function getMonthName(month) {
  const months = {
    '01': 'Januari', '02': 'Februari', '03': 'Maret', '04': 'April',
    '05': 'Mei', '06': 'Juni', '07': 'Juli', '08': 'Agustus',
    '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Desember'
  };
  return months[month] || month;
}

module.exports = router;
