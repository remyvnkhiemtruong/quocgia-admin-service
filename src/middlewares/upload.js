// src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure directories exist
const audioDir = path.join(__dirname, '../../uploads/audio');
const imageDir = path.join(__dirname, '../../uploads/images');
fs.mkdirSync(audioDir, { recursive: true });
fs.mkdirSync(imageDir, { recursive: true });

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      cb(null, audioDir);
    } else if (file.fieldname === 'image') {
      cb(null, imageDir);
    } else {
      cb(null, path.join(__dirname, '../../uploads'));
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'audio') {
    if (!file.mimetype.startsWith('audio/')) {
      return cb(new Error('Only audio files allowed'), false);
    }
    // Allow audio up to 50MB (checked later by multer limit)
    cb(null, true);

  } else if (file.fieldname === 'image') {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files allowed'), false);
    }
    cb(null, true);

  } else {
    cb(null, true);
  }
};


const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max (for audio)
});

module.exports = upload;