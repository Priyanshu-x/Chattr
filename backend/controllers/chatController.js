const Message = require('../models/Message');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');
// xss import removed as it is now handled in service
const ChatService = require('../services/chatService');

exports.sendMessage = async (req, res, next) => {
	try {
		const { user, content, type, imageUrl, voiceUrl, fileUrl, fileName } = req.body;

		const authenticatedUserId = req.user ? req.user._id : user;

		if (!authenticatedUserId) {
			throw new AppError('Authentication required to send messages.', 401);
		}

		// Use ChatService to create message (handles sanitization)
		const message = await ChatService.createMessage({
			user: authenticatedUserId,
			content,
			type,
			imageUrl,
			voiceUrl,
			fileUrl,
			fileName
		});

		res.status(201).json(message);
	} catch (error) {
		next(error);
	}
};

const GlobalSettings = require('../models/GlobalSettings');

exports.uploadImage = async (req, res, next) => {
	try {
		if (!req.file) {
			throw new AppError('No file uploaded', 400);
		}

		const settings = await GlobalSettings.getSettings();
		const maxSizeBytes = settings.maxFileSize * 1024 * 1024;

		if (req.file.size > maxSizeBytes) {
			fs.unlink(req.file.path, (err) => {
				if (err) console.error('Error deleting large file:', err);
			});
			throw new AppError(`File too large. Max size is ${settings.maxFileSize}MB.`, 400);
		}

		if (!settings.allowImages) {
			fs.unlink(req.file.path, () => { });
			throw new AppError('Image uploads are currently disabled.', 403);
		}

		// Return the sanitized filename from multer
		res.json({
			fileUrl: `/uploads/${req.file.filename}`, // Use /uploads route for secure access
			fileName: req.file.originalname, // Original filename for display
			fileType: req.file.mimetype // Mimetype for display/handling
		});
	} catch (error) {
		// Clean up file if error occurs
		if (req.file) fs.unlink(req.file.path, () => { });
		next(error);
	}
};

exports.uploadVoice = async (req, res, next) => {
	try {
		if (!req.file) {
			throw new AppError('No file uploaded', 400);
		}

		const settings = await GlobalSettings.getSettings();
		const maxSizeBytes = settings.maxFileSize * 1024 * 1024;

		if (req.file.size > maxSizeBytes) {
			fs.unlink(req.file.path, () => { });
			throw new AppError(`File too large. Max size is ${settings.maxFileSize}MB.`, 400);
		}

		if (!settings.allowVoice) {
			fs.unlink(req.file.path, () => { });
			throw new AppError('Voice messages are currently disabled.', 403);
		}

		// Return the sanitized filename from multer
		res.json({
			fileUrl: `/uploads/${req.file.filename}`, // Use /uploads route for secure access
			fileName: req.file.originalname, // Original filename for display
			fileType: req.file.mimetype
		});
	} catch (error) {
		if (req.file) fs.unlink(req.file.path, () => { });
		next(error);
	}
};

exports.uploadFile = async (req, res, next) => {
	try {
		if (!req.file) {
			throw new AppError('No file uploaded', 400);
		}

		const settings = await GlobalSettings.getSettings();
		const maxSizeBytes = settings.maxFileSize * 1024 * 1024;

		if (req.file.size > maxSizeBytes) {
			fs.unlink(req.file.path, () => { });
			throw new AppError(`File too large. Max size is ${settings.maxFileSize}MB.`, 400);
		}

		// Return the sanitized filename from multer
		res.json({
			fileUrl: `/uploads/${req.file.filename}`, // Use /uploads route for secure access
			fileName: req.file.originalname, // Original filename for display
			fileType: req.file.mimetype
		});
	} catch (error) {
		if (req.file) fs.unlink(req.file.path, () => { });
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
		const filePath = path.join(__dirname, '../uploads', filename);

		// Basic path traversal prevention
		if (!path.normalize(filePath).startsWith(path.normalize(path.join(__dirname, '../uploads')))) {
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
