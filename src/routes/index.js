// src/routes/index.js
const express = require('express');
const router = express.Router();

const adminRoutes = require('./admin.routes');
const heritageRoutes = require('./heritage.routes');
const { SUPPORTED_LANGUAGES } = require('../utils/constants');

// Admin routes
router.use('/admin', adminRoutes);

// Public routes
router.use('/heritages', heritageRoutes);

// Get supported languages
router.get('/languages', (req, res) => {
  res.json(SUPPORTED_LANGUAGES);
});

module.exports = router;