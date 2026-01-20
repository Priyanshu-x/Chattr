const AdminUser = require('../models/AdminUser');
const Message = require('../models/Message');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const xss = require('xss'); // Import xss for sanitization
const AppError = require('../utils/AppError'); // Import AppError

exports.login = async (req, res) => {
	try {
		const { username, password } = req.body;
		const admin = await AdminUser.findOne({ username });
		if (!admin) {
			throw new AppError('Invalid credentials', 401); // Use AppError
		}
		const isValid = await admin.comparePassword(password);
		if (!isValid) {
			throw new AppError('Invalid credentials', 401); // Use AppError
		}
		admin.lastLogin = new Date();
		await admin.save();
		const token = jwt.sign(
			{ adminId: admin._id, role: admin.role },
			process.env.JWT_SECRET,
			{ expiresIn: '24h' }
		);
		res.cookie('adminToken', token, {
			httpOnly: true, // Make the cookie inaccessible to client-side scripts
			secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
			maxAge: 24 * 60 * 60 * 1000, // 24 hours
			sameSite: 'Lax', // Protect against CSRF
			path: '/'
		});
		res.status(200).json({
			admin: {
				id: admin._id,
				username: admin.username,
				role: admin.role
			}
		});
	} catch (error) {
		// Ensure AppError is used if not already an AppError instance
		next(error instanceof AppError ? error : new AppError(error.message, error.statusCode || 500));
	}
};

exports.sendAnnouncement = async (req, res, next) => {
	try {
		const { content, type } = req.body;
		// Sanitize announcement content before saving/broadcasting
		const sanitizedContent = xss(content.trim());

		// In a real application, you might save this to a database
		// and then broadcast via websockets to connected clients.
		// For now, we'll just log and send a success response.
		// Example: await Announcement.create({ content: sanitizedContent, type });
		console.log('New Announcement:', { content: sanitizedContent, type });

		// Assuming socket.io is available via req or context for broadcasting
		// req.io.emit('announcement', { content: sanitizedContent, type });

		res.status(200).json({ success: true, message: 'Announcement sent and sanitized.', announcement: { content: sanitizedContent, type } });
	} catch (error) {
		next(error);
	}
};

exports.getStats = async (req, res) => {
	try {
		const stats = {
			activeUsers: await User.countDocuments(),
			totalMessages: await Message.countDocuments(),
			voiceMessages: await Message.countDocuments({ type: 'voice' }),
			imageMessages: await Message.countDocuments({ type: 'image' }),
			pinnedMessages: await Message.countDocuments({ isPinned: true }),
			messagesLast24h: await Message.countDocuments({
				createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
			})
		};
		res.json(stats);
	} catch (error) {
		next(error instanceof AppError ? error : new AppError(error.message, error.statusCode || 500));
	}
};

exports.getUsers = async (req, res) => {
	try {
		const users = await User.find()
			.select('username avatar joinedAt messageCount isBanned')
			.sort({ joinedAt: -1 });
		res.json(users);
	} catch (error) {
		next(error instanceof AppError ? error : new AppError(error.message, error.statusCode || 500));
	}
};

exports.banUser = async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user) throw new AppError('User not found', 404); // Use AppError
		user.isBanned = !user.isBanned;
		await user.save();
		res.json({ success: true, isBanned: user.isBanned });
	} catch (error) {
		next(error instanceof AppError ? error : new AppError(error.message, error.statusCode || 500));
	}
};

exports.pinMessage = async (req, res) => {
	try {
		const message = await Message.findById(req.params.id);
		if (!message) throw new AppError('Message not found', 404); // Use AppError
		message.isPinned = !message.isPinned;
		await message.save();
		res.json({ success: true, isPinned: message.isPinned });
	} catch (error) {
		next(error instanceof AppError ? error : new AppError(error.message, error.statusCode || 500));
	}
};

const GlobalSettings = require('../models/GlobalSettings');

exports.getSettings = async (req, res, next) => {
	try {
		const settings = await GlobalSettings.getSettings();
		res.json(settings);
	} catch (error) {
		next(error instanceof AppError ? error : new AppError(error.message, 500));
	}
};

exports.updateSettings = async (req, res, next) => {
	try {
		const settings = await GlobalSettings.getSettings();

		// Whitelist allowed fields to prevent pollution
		const allowedFields = [
			'messageExpiry', 'maxFileSize', 'allowImages', 'allowVoice',
			'allowStickers', 'maxUsersOnline', 'rateLimitMessages', 'rateLimitWindow'
		];

		allowedFields.forEach(field => {
			if (req.body[field] !== undefined) {
				settings[field] = req.body[field];
			}
		});

		// settings.updatedBy = req.admin.adminId; // req.admin comes from auth middleware
		settings.updatedAt = Date.now();

		await settings.save();
		res.json(settings);
	} catch (error) {
		next(error instanceof AppError ? error : new AppError(error.message, 500));
	}
};
