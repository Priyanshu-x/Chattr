const Message = require('../models/Message');

exports.sendMessage = async (req, res) => {
	try {
		const { user, content, type, imageUrl, voiceUrl, fileUrl, fileName } = req.body;
		const message = new Message({
			user,
			content,
			type,
			imageUrl,
			voiceUrl,
			fileUrl,
			fileName,
			expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
		});
		await message.save();
		res.status(201).json(message);
	} catch (error) {
		next(error);
	}
};

exports.uploadImage = (req, res) => {
	try {
		if (!req.file) {
			throw new Error('No file uploaded', 400);
		}
		res.json({
			imageUrl: `/uploads/images/${req.file.filename}`,
			fileName: req.file.originalname
		});
	} catch (error) {
		next(error);
	}
};

exports.uploadVoice = (req, res) => {
	try {
		if (!req.file) {
			throw new Error('No file uploaded', 400);
		}
		res.json({
			voiceUrl: `/uploads/voice/${req.file.filename}`,
			fileName: req.file.originalname
		});
	} catch (error) {
		next(error);
	}
};

exports.uploadFile = async (req, res, next) => {
	try {
		if (!req.file) {
			throw new Error('No file uploaded', 400);
		}
		res.json({
			fileUrl: `/uploads/${req.file.filename}`,
			fileName: req.file.originalname,
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

exports.getPinnedMessages = async (req, res) => {
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
