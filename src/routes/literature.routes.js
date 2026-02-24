const express = require('express');
const router = express.Router();
const literatureController = require('../controllers/literature.controller');

// Public routes - Get by language
router.get('/', literatureController.getAll);
router.get('/:id', literatureController.getById);

module.exports = router;