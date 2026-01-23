// backend/routes/chat.js
const express = require('express');
const path = require('path');
const Message = require('../models/Message');
const router = express.Router();
const { validateInput, validateFileUpload } = require('../middleware/auth');
const { messageSchema } = require('../utils/validationSchemas');
const upload = require('../middleware/upload'); // Import the new upload middleware
const fs = require('fs'); // For file system operations

// Serve uploaded files statically
router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Upload generic file
router.post('/upload/file', upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    // Return the full Cloudinary URL from req.file.path
    res.json({
      fileUrl: req.file.path,
      fileName: req.file.originalname,
      fileType: req.file.mimetype
    });
  } catch (error) {
    next(error);
  }
});

// Upload image
router.post('/upload/image', upload.single('image'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded.' });
    }
    res.json({
      fileUrl: req.file.path,
      fileName: req.file.originalname
    });
  } catch (error) {
    next(error);
  }
});

// Upload voice message
router.post('/upload/voice', upload.single('voice'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No voice message uploaded.' });
    }
    res.json({
      fileUrl: req.file.path,
      fileName: req.file.originalname
    });
  } catch (error) {
    next(error);
  }
});

// Download file
router.get('/download/:filename', (req, res, next) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ message: 'File not found.' });
    }
    res.download(filePath, filename, (err) => {
      if (err) {
        next(err);
      }
    });
  });
});

// Get messages with pagination
router.get('/messages', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find()
      .populate('user', 'username avatar')
      .populate({
        path: 'replyTo',
        select: 'content user type fileUrl fileName',
        populate: { path: 'user', select: 'username' }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      messages: messages.reverse(),
      hasMore: messages.length === limit
    });
  } catch (error) {
    next(error);
  }
});

// Get pinned messages
router.get('/pinned', async (req, res) => {
  try {
    const pinnedMessages = await Message.find({ isPinned: true })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(pinnedMessages);
  } catch (error) {
    next(error);
  }
});

module.exports = router;