// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../middlewares/upload');
const adminController = require('../controllers/admin.controller');

// Middleware wrapper to handle multer errors nicely
const uploadFieldsMiddleware = (req, res, next) => {
  const uploader = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'audio', maxCount: 1 }
  ]);

  uploader(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File vượt quá 50MB giới hạn.' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    next(); // ✅ continue to controller
  });
};

//
// CRUD routes
//
router.post('/heritages', uploadFieldsMiddleware, adminController.create);
router.get('/heritages', adminController.getAll);
router.get('/heritages/:id', adminController.getById);
router.put('/heritages/:id', uploadFieldsMiddleware, adminController.update);
router.delete('/heritages/:id', adminController.delete);

module.exports = router;
