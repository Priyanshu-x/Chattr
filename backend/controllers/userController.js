const User = require('../models/User');
const jwt = require('jsonwebtoken');
const xss = require('xss'); // Import xss for sanitization
const AppError = require('../utils/AppError'); // Import AppError

exports.register = async (req, res) => {
	try {
		const { username, password, avatar } = req.body;
		if (!username || !password) {
			throw new AppError('Username and password required', 400); // Use AppError
		}
		const existingUser = await User.findOne({ username });
		if (existingUser) {
			throw new AppError('Username already exists', 409); // Use AppError
		}
		// Sanitize username and avatar before saving
		const sanitizedUsername = xss(username.trim());
		const sanitizedAvatar = avatar ? xss(avatar.trim()) : undefined;

		const user = new User({ username: sanitizedUsername, password, avatar: sanitizedAvatar });
		await user.save();
		res.status(201).json({ success: true, user: { id: user._id, username: user.username, avatar: user.avatar } });
	} catch (error) {
		next(error instanceof AppError ? error : new AppError(error.message, error.statusCode || 500));
	}
};

exports.login = async (req, res) => {
	try {
		const { username, password } = req.body;
		const user = await User.findOne({ username });
		if (!user) {
			throw new AppError('Invalid credentials', 401); // Use AppError
		}
		const isValid = await user.comparePassword(password);
		if (!isValid) {
			throw new AppError('Invalid credentials', 401); // Use AppError
		}
		const token = jwt.sign(
			{ userId: user._id, username: user.username },
			process.env.JWT_SECRET,
			{ expiresIn: '24h' }
		);
		res.cookie('token', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: 24 * 60 * 60 * 1000, // 24 hours
			sameSite: 'Lax',
			path: '/'
		});
		res.status(200).json({ user: { id: user._id, username: user.username, avatar: user.avatar } });
	} catch (error) {
		next(error instanceof AppError ? error : new AppError(error.message, error.statusCode || 500));
	}
};

exports.getProfile = async (req, res) => {
	try {
		const user = await User.findById(req.user.userId).select('username avatar joinedAt messageCount');
		if (!user) throw new AppError('User not found', 404); // Use AppError
		res.json(user);
	} catch (error) {
		next(error instanceof AppError ? error : new AppError(error.message, error.statusCode || 500));
	}
};

exports.updateProfile = async (req, res) => {
	try {
		const { avatar } = req.body;
		const user = await User.findById(req.user.userId);
		if (!user) throw new AppError('User not found', 404); // Use AppError
		// Sanitize avatar before saving
		if (avatar) user.avatar = xss(avatar.trim());
		await user.save();
		res.json({ success: true, avatar: user.avatar });
	} catch (error) {
		next(error instanceof AppError ? error : new AppError(error.message, error.statusCode || 500));
	}
};
