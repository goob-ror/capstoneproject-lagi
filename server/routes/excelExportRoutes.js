const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const authMiddleware = require('../middleware/auth');
const { generateExcelReport } = require('../process/excelExportController');

// Generate Excel report
router.get('/generate', authMiddleware, async (req, res) => {
    await generateExcelReport(pool, req, res);
});

module.exports = router;
