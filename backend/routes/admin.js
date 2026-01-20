// backend/routes/admin.js
const express = require('express');
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const Message = require('../models/Message');
const User = require('../models/User');
const { adminAuth } = require('../middleware/adminAuth');
const router = express.Router();
const { validateInput, validateObjectId, rateLimitMiddleware } = require('../middleware/auth');
const { adminLoginSchema, banUserSchema, announcementSchema } = require('../utils/validationSchemas');
const logger = require('../utils/logger');

// Admin login
router.post('/login', rateLimitMiddleware(5, 60000), validateInput(adminLoginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body;
    logger.info(`Admin login attempt for username: ${username}`);

    let admin = await AdminUser.findOne({ username });
    if (!admin) {
      logger.warn(`Admin user ${username} not found.`);
      throw new Error('Invalid credentials', 401);
    }

    const isValid = await admin.comparePassword(password);
    if (!isValid) {
      logger.error(`Invalid credentials for ${username}: Password mismatch.`);
      throw new Error('Invalid credentials', 401);
    }

    admin.lastLogin = new Date();
    await admin.save();
    logger.info(`Admin ${username} logged in successfully. Updating lastLogin.`);

    const token = jwt.sign(
      { adminId: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    logger.info(`JWT token generated for admin ${username}.`);

    res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (error) {
    logger.error(`Admin login error for ${req.body.username}: ${error.message}`);
    next(error);
  }
});

// Admin logout
router.post('/logout', adminAuth, (req, res) => {
  res.clearCookie('adminToken', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

// Get admin stats
router.get('/stats', adminAuth, async (req, res) => {
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
    next(error);
  }
});

// Get all active users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find()
      .select('username avatar joinedAt messageCount isBanned ip')
      .sort({ joinedAt: -1 });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Ban user
router.post('/users/:userId/ban', adminAuth, validateObjectId('userId'), validateInput(banUserSchema), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { duration } = req.body; // hours

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found', 404);
    }

    user.isBanned = true;
    user.bannedUntil = new Date(Date.now() + duration * 60 * 60 * 1000);
    await user.save();

    // Emit ban event to socket
    const { getIO } = require('../config/socket');
    const io = getIO();
    io.to(user.socketId).emit('user-banned', {
      reason: 'Banned by administrator',
      duration: duration
    });

    res.json({ message: 'User banned successfully' });
  } catch (error) {
    next(error);
  }
});

// Kick user
router.post('/users/:userId/kick', adminAuth, validateObjectId('userId'), async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found', 404);
    }

    // Emit kick event to socket
    const { getIO } = require('../config/socket');
    const io = getIO();
    io.to(user.socketId).emit('user-kicked', {
      reason: 'Kicked by administrator'
    });

    // Disconnect the user
    io.sockets.sockets.get(user.socketId)?.disconnect();

    res.json({ message: 'User kicked successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete message
router.delete('/messages/:messageId', adminAuth, validateObjectId('messageId'), async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndDelete(messageId);
    if (!message) {
      throw new Error('Message not found', 404);
    }

    // Emit message deletion to all clients
    const { getIO } = require('../config/socket');
    const io = getIO();
    io.emit('message-deleted', { messageId });

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Toggle pin message
router.patch('/messages/:messageId/pin', adminAuth, validateObjectId('messageId'), async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error('Message not found', 404);
    }

    message.isPinned = !message.isPinned;
    await message.save();

    // Emit pin update to all clients
    const { getIO } = require('../config/socket');
    const io = getIO();
    io.emit('message-pin-updated', {
      messageId,
      isPinned: message.isPinned
    });

    res.json({ message: `Message ${message.isPinned ? 'pinned' : 'unpinned'} successfully` });
  } catch (error) {
    next(error);
  }
});

// Broadcast announcement
router.post('/announcement', adminAuth, validateInput(announcementSchema), async (req, res, next) => {
  try {
    const { content, type } = req.body;

    // Emit announcement to all clients
    const { getIO } = require('../config/socket');
    const io = getIO();
    io.emit('admin-announcement', {
      content,
      type,
      timestamp: new Date()
    });

    res.json({ message: 'Announcement sent successfully' });
  } catch (error) {
    next(error);
  }
});

// Global Settings
router.get('/settings', adminAuth, adminController.getSettings);
router.put('/settings', adminAuth, adminController.updateSettings);

module.exports = router;

