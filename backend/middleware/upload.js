const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/AppError');

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Force 'raw' for documents to prevent Cloudinary from trying to convert them to images
    const isRaw = file.mimetype.includes('pdf') ||
      file.mimetype.includes('application') ||
      file.mimetype.includes('text');

    if (isRaw) {
      return {
        folder: 'chattr-uploads',
        resource_type: 'raw', // Use 'raw' for PDFs, Docs, etc.
        public_id: file.originalname.replace(/[^a-z0-9]/gi, '_').split('.')[0] + '_' + Date.now(),
        // Keep extension for raw files implies we might need to handle filename manually or let cloudinary handle it
        format: file.originalname.split('.').pop()
      };
    }

    return {
      folder: 'chattr-uploads',
      resource_type: 'auto',
    };
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