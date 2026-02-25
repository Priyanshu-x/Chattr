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
const adminController = require('../controllers/adminController');

// Admin login
// Admin login
router.post('/login', rateLimitMiddleware(5, 60000), validateInput(adminLoginSchema), adminController.login);

// Admin logout
router.post('/logout', adminAuth, (req, res) => {
  res.clearCookie('adminToken', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

// Get admin stats
router.get('/stats', adminAuth, adminController.getStats);

// Get system diagnostics
router.get('/system/diagnostics', adminAuth, adminController.getDiagnostics);

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

// Bulk delete messages
router.post('/messages/bulk-delete', adminAuth, async (req, res, next) => {
  try {
    const { messageIds } = req.body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      throw new Error('No message IDs provided', 400);
    }

    await Message.deleteMany({ _id: { $in: messageIds } });

    // Emit bulk deletion to all clients
    const { getIO } = require('../config/socket');
    const io = getIO();
    io.emit('messages-deleted-bulk', { messageIds });

    res.json({ message: `${messageIds.length} messages deleted successfully` });
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

// Blocked IP Management
router.get('/blocked-ips', adminAuth, async (req, res, next) => {
  try {
    const BlockedIP = require('../models/BlockedIP');
    const blockedIps = await BlockedIP.find().sort({ blockedAt: -1 });
    res.json(blockedIps);
  } catch (error) {
    next(error);
  }
});

router.post('/block-ip', adminAuth, validateInput(require('../utils/validationSchemas').blockIpSchema), async (req, res, next) => {
  try {
    const { ip, reason } = req.body;
    const BlockedIP = require('../models/BlockedIP');

    const existing = await BlockedIP.findOne({ ip });
    if (existing) {
      throw new Error('IP is already blocked', 400);
    }

    await BlockedIP.create({ ip, reason: reason || 'Blocked by administrator' });
    res.json({ message: `IP ${ip} blocked successfully` });
  } catch (error) {
    next(error);
  }
});

router.delete('/block-ip/:ip', adminAuth, async (req, res, next) => {
  try {
    const { ip } = req.params;
    const BlockedIP = require('../models/BlockedIP');

    const result = await BlockedIP.findOneAndDelete({ ip });
    if (!result) {
      throw new Error('IP block not found', 404);
    }

    res.json({ message: `IP ${ip} unblocked successfully` });
  } catch (error) {
    next(error);
  }
});

// Global Settings
router.get('/settings', adminAuth, adminController.getSettings);
router.put('/settings', adminAuth, adminController.updateSettings);

module.exports = router;

