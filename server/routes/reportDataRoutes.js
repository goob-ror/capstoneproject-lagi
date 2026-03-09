const express = require('express');
const router = express.Router();
const pool = require('../database/db');
const authMiddleware = require('../middleware/auth');
const { getAncData } = require('../process/ancController');
const { getAncTerpaduData } = require('../process/ancTerpaduController');
const { getNifasPersalinanData } = require('../process/nifasPersalinanController');
const { getKomplikasiData } = require('../process/komplikasiController');
const { getDataPasien } = require('../process/dataPasienController');
const { getKelurahanList, getAvailableYears } = require('../process/commonController');

// Get ANC report data
router.get('/anc', authMiddleware, async (req, res) => {
    await getAncData(pool, req, res);
});

// Get ANC Terpadu report data
router.get('/anc-terpadu', authMiddleware, async (req, res) => {
    await getAncTerpaduData(pool, req, res);
});

// Get Nifas Persalinan report data
router.get('/nifas-persalinan', authMiddleware, async (req, res) => {
    await getNifasPersalinanData(pool, req, res);
});

// Get Komplikasi report data
router.get('/komplikasi', authMiddleware, async (req, res) => {
    await getKomplikasiData(pool, req, res);
});

// Get Data Pasien report data
router.get('/data-pasien', authMiddleware, async (req, res) => {
    await getDataPasien(pool, req, res);
});

// Get Kelurahan list
router.get('/kelurahan', authMiddleware, async (req, res) => {
    await getKelurahanList(pool, req, res);
});

// Get available years
router.get('/years', authMiddleware, async (req, res) => {
    await getAvailableYears(pool, req, res);
});

module.exports = router;
