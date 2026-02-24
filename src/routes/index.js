// src/routes/index.js
const express = require('express');
const router = express.Router();

const adminRoutes = require('./admin.routes');
const heritageRoutes = require('./heritage.routes');
const musicRoutes = require('./music.routes')
const fineArtRoutes = require('./fineart.routes')
const economicRoutes = require('./economic.routes')
const geographyRoutes = require('./geography.routes')
const literatureRoutes = require('./literature.routes')

const { SUPPORTED_LANGUAGES } = require('../utils/constants');

// Admin routes
router.use('/admin', adminRoutes);

// Public routes
router.use('/heritages', heritageRoutes);

router.use('/music', musicRoutes);

router.use('/fineart', fineArtRoutes);

router.use('/economics', economicRoutes);

router.use('/geography', geographyRoutes);

router.use('/literature', literatureRoutes);

// Get supported languages
router.get('/languages', (req, res) => {
  res.json(SUPPORTED_LANGUAGES);
});

module.exports = router;