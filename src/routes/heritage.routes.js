// src/routes/heritage.routes.js
const express = require('express');
const router = express.Router();
const heritageController = require('../controllers/heritage.controller');

// Public routes - Get by language
router.get('/', heritageController.getAll);
router.get('/:id', heritageController.getById);

module.exports = router;