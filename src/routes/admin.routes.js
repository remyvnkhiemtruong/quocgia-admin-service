// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = require('../middlewares/upload');
const adminController = require('../controllers/admin.controller');

// Middleware wrapper to handle multer errors nicely
const uploadFieldsMiddleware = (req, res, next) => {
  const uploader = upload.fields([
    { name: 'image', maxCount: 1 },      // Main cover image
    { name: 'audio', maxCount: 1 },      // Audio for original language
    { name: 'gallery', maxCount: 20 },    // Gallery images (up to 20)
    { name: 'image360', maxCount: 1 },
    { name: 'fineart', maxCount: 20 },
  ]);

  uploader(req, res, function (err) {
    console.log(req.files)
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File vượt quá 50MB giới hạn.' });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ message: 'Quá nhiều files hoặc tên field không đúng.' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    next();
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

//
// MUSIC ROUTES (YouTube link only)
//

router.post('/music', adminController.createMusic);
router.get('/music', adminController.getAllMusic);
router.get('/music/:id', adminController.getMusicById);
router.delete('/music/:id', adminController.deleteMusic);

//
// FINEART ROUTES (YouTube link only)
//

router.post('/fineart', uploadFieldsMiddleware, adminController.createfineArt);
router.get('/fineart', adminController.getAllfineArt);
router.get('/fineart/:id', adminController.getfineArtById);
router.delete('/fineart/:id', adminController.deletefineArt);

//
// ECONOMICS ROUTES
//

router.post('/economics', adminController.createEconomic);
router.get('/economics', adminController.getAllEconomic);
router.get('/economics/:id', adminController.getEconomicById);
router.put('/economics/:id', adminController.updateEconomic);
router.delete('/economics/:id', adminController.deleteEconomic);


module.exports = router;