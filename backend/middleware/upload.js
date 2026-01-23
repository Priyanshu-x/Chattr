const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/AppError');

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chattr-uploads', // Folder name in Cloudinary
    resource_type: 'auto', // Automatically detect image/video/raw
    // public_id: (req, file) => 'computed-filename-using-request',
  },
});

const fileFilter = (req, file, cb) => {
  // Allow all file types
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 10 }, // 10MB limit
  fileFilter: fileFilter
});

module.exports = upload;