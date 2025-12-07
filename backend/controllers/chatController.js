const Message = require('../models/Message');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');
const xss = require('xss'); // Import xss library

exports.sendMessage = async (req, res, next) => {
	try {
		const { user, content, type, imageUrl, voiceUrl, fileUrl, fileName } = req.body;

		const authenticatedUserId = req.user ? req.user._id : user;

		if (!authenticatedUserId) {
			throw new AppError('Authentication required to send messages.', 401);
		}

		// Sanitize content using xss library before storing
		const sanitizedContent = content ? xss(content.trim()) : '';
		// Sanitize fileName as well
		const sanitizedFileName = fileName ? xss(fileName.trim()) : '';

		const message = new Message({
			user: authenticatedUserId,
			content: sanitizedContent,
			type,
			imageUrl,
			voiceUrl,
			fileUrl,
			fileName: sanitizedFileName,
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
		});
		await message.save();
		res.status(201).json(message);
	} catch (error) {
		next(error);
	}
};

exports.uploadImage = (req, res, next) => {
	try {
		if (!req.file) {
			throw new AppError('No file uploaded', 400);
		}
		// Return the sanitized filename from multer
		res.json({
			fileUrl: `/uploads/${req.file.filename}`, // Use /uploads route for secure access
			fileName: req.file.originalname, // Original filename for display
			fileType: req.file.mimetype // Mimetype for display/handling
		});
	} catch (error) {
		next(error);
	}
};

exports.uploadVoice = (req, res, next) => {
	try {
		if (!req.file) {
			throw new AppError('No file uploaded', 400);
		}
		// Return the sanitized filename from multer
		res.json({
			fileUrl: `/uploads/${req.file.filename}`, // Use /uploads route for secure access
			fileName: req.file.originalname, // Original filename for display
			fileType: req.file.mimetype
		});
	} catch (error) {
		next(error);
	}
};

exports.uploadFile = async (req, res, next) => {
	try {
		if (!req.file) {
			throw new AppError('No file uploaded', 400);
		}
		// Return the sanitized filename from multer
		res.json({
			fileUrl: `/uploads/${req.file.filename}`, // Use /uploads route for secure access
			fileName: req.file.originalname, // Original filename for display
			fileType: req.file.mimetype
		});
	} catch (error) {
		next(error);
	}
};

exports.getMessages = async (req, res, next) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 50;
		const skip = (page - 1) * limit;
		const messages = await Message.find()
			.populate('user', 'username avatar')
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
};

exports.getPinnedMessages = async (req, res, next) => {
	try {
		const pinnedMessages = await Message.find({ isPinned: true })
			.populate('user', 'username avatar')
			.sort({ createdAt: -1 })
			.limit(10);
		res.json(pinnedMessages);
	} catch (error) {
		next(error);
	}
};

// New function to serve uploaded files securely
exports.serveUploadedFile = (req, res, next) => {
	try {
		const { filename } = req.params;
		const filePath = path.join(__dirname, '../safe-uploads', filename);

		// Basic path traversal prevention
		if (!path.normalize(filePath).startsWith(path.normalize(path.join(__dirname, '../safe-uploads')))) {
			throw new AppError('Access denied: Invalid file path.', 403);
		}

		fs.stat(filePath, (err, stats) => {
			if (err) {
				if (err.code === 'ENOENT') {
					return next(new AppError('File not found.', 404));
				}
				return next(new AppError('Error accessing file.', 500));
			}

			// Set appropriate Content-Type header to prevent browser from guessing
			const mimeType = require('mime-types').lookup(filename); // Dynamic MIME type based on filename
			res.setHeader('Content-Type', mimeType || 'application/octet-stream');
			res.setHeader('X-Content-Type-Options', 'nosniff'); // Prevent MIME sniffing
			res.setHeader('Content-Disposition', `inline; filename="${filename}"`); // Encourage display in browser

			// Stream the file
			const readStream = fs.createReadStream(filePath);
			readStream.pipe(res);

			readStream.on('error', (streamErr) => {
				next(new AppError('Error streaming file.', 500));
			});
		});
	} catch (error) {
		next(error);
	}
};
