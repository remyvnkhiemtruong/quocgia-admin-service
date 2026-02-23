const express = require('express');
const router = express.Router();
const economicController = require('../controllers/economic.controller');

// Public routes - Get by language
router.get('/', economicController.getAll);
router.get('/:id', economicController.getById);

module.exports = router;