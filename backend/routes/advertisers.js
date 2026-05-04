const express = require('express');
const router = express.Router();

// Importar módulos refactorizados
const authRoutes = require('./advertisers/auth');
const adsRoutes = require('./advertisers/ads');
const cuponesRoutes = require('./advertisers/cupones');
const statsRoutes = require('./advertisers/stats');
const creditsRoutes = require('./advertisers/credits');
const plansRoutes = require('./advertisers/plans');
const publicRoutes = require('./advertisers/public');

// Montar todas las rutas
router.use('/', authRoutes);
router.use('/', adsRoutes);
router.use('/', cuponesRoutes);
router.use('/', statsRoutes);
router.use('/', creditsRoutes);
router.use('/', plansRoutes);
router.use('/', publicRoutes);

module.exports = router;
