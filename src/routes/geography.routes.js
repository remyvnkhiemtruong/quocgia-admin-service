const express = require('express');
const router = express.Router();
const geographyController = require('../controllers/geography.controller');

// Public routes - Get by language
router.get('/', geographyController.getAll);
router.get('/:id', geographyController.getById);

module.exports = router;