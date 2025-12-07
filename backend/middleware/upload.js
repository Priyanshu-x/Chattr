const multer = require('multer');
const path = require('path');
const { lookup } = require('mime-types');
const AppError = require('../utils/AppError');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'backend/safe-uploads/'); // Files will be stored in a non-web-accessible directory
  },
  filename: (req, file, cb) => {
    const sanitizedFilename = file.originalname.replace(/[^a-z0-9\.\-]/gi, '_'); // Sanitize filename
    cb(null, Date.now() + '-' + sanitizedFilename); // Unique and sanitized filename
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image, video, audio, and common document types
  // Stricter file type validation
  const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const audioMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/webm'];
  const videoMimeTypes = ['video/mp4', 'video/webm']; // Removed .mov, .avi due to broader codec support issues and potential for complex codecs.
  const documentMimeTypes = ['application/pdf', 'text/plain']; // Restricted document types. Removed doc, docx, xls, xlsx for security.

  const allowedMimeTypes = [...imageMimeTypes, ...audioMimeTypes, ...videoMimeTypes, ...documentMimeTypes];

  const allowedExtensions = allowedMimeTypes.map(mime => lookup(mime)).filter(Boolean);

  if (!allowedMimeTypes.includes(file.mimetype)) {
    cb(new AppError('Invalid file type. Only images (jpeg, png, gif), audio (mp3, wav, webm), video (mp4, webm), PDF, and text files are allowed.', 400), false);
  } else {
    const fileExtension = path.extname(file.originalname).toLowerCase();
    // Validate that the file extension is one of the allowed extensions, based on the MIME type
    if (!allowedExtensions.includes(fileExtension.substring(1))) { // Remove leading dot from extension
      cb(new AppError('Invalid file extension.', 400), false);
    } else {
      cb(null, true);
    }
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 10 }, // Reduced to 10MB file size limit for better DoS protection
  fileFilter: fileFilter
});

module.exports = upload;