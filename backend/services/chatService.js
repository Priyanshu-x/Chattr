const Message = require('../models/Message');
const User = require('../models/User');
const xss = require('xss');
const AppError = require('../utils/AppError');
const GlobalSettings = require('../models/GlobalSettings');

// In-memory rate limit store: Map<userId, {count, startTime}>
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_MESSAGES = 15; // Max messages per window

// Reserved usernames
const RESERVED_USERNAMES = ['admin', 'administrator', 'system', 'moderator', 'support', 'root', 'chattr'];

class ChatService {
  /**
   * Validates if a username is allowed
   * @param {string} username 
   * @returns {boolean}
   */
  static isUsernameAllowed(username) {
    if (!username) return false;
    const lower = username.toLowerCase().trim();
    return !RESERVED_USERNAMES.some(reserved => lower.includes(reserved));
  }

  /**
   * Checks rate limit for a user
   * @param {string} userId 
   * @returns {boolean} true if allowed, false if limit exceeded
   */
  static checkRateLimit(userId) {
    const now = Date.now();
    const userLimit = rateLimits.get(userId) || { count: 0, startTime: now };

    if (now - userLimit.startTime > RATE_LIMIT_WINDOW) {
      // Reset window
      userLimit.count = 1;
      userLimit.startTime = now;
    } else {
      userLimit.count++;
    }

    rateLimits.set(userId, userLimit);
    return userLimit.count <= MAX_MESSAGES;
  }

  /**
   * Create and save a new message
   * @param {Object} data - { user, content, type, ... }
   * @returns {Promise<Message>}
   */
  static async createMessage(data) {
    const { user, content, type, imageUrl, voiceUrl, fileUrl, fileName, replyTo } = data;

    // Fetch Global Settings
    const settings = await GlobalSettings.getSettings();

    // 1. Check Feature Toggles
    if (type === 'image' && !settings.allowImages) {
      throw new AppError('Image messages are currently disabled by the administrator.', 403);
    }
    if (type === 'voice' && !settings.allowVoice) {
      throw new AppError('Voice messages are currently disabled by the administrator.', 403);
    }
    // Sticker check (assuming type might be 'sticker' or handled via content) if relevant

    // 2. Check Rate Limits
    if (settings.rateLimitMessages > 0) {
      const windowStart = new Date(Date.now() - settings.rateLimitWindow * 1000);
      const messageCount = await Message.countDocuments({
        user: user,
        createdAt: { $gte: windowStart }
      });

      if (messageCount >= settings.rateLimitMessages) {
        throw new AppError(`Rate limit exceeded. You can only send ${settings.rateLimitMessages} messages every ${settings.rateLimitWindow} seconds.`, 429);
      }
    }

    // 1. Sanitize content (XSS Prevention)
    const sanitizedContent = content ? xss(content.trim()) : '';
    const sanitizedFileName = fileName ? xss(fileName.trim()) : '';

    // 2. Create Message
    const message = new Message({
      user,
      content: sanitizedContent,
      type: type || 'text',
      imageUrl,
      voiceUrl,
      fileUrl,
      fileName: sanitizedFileName,
      replyTo,
      expiresAt: new Date(Date.now() + settings.messageExpiry * 60 * 60 * 1000), // Dynamic expiry
      reactions: []
    });

    await message.save();
    return message;
  }

  /**
   * Handle user join logic
   * @param {Object} userData 
   * @param {string} socketId 
   * @param {string} ip 
   */
  static async joinUser(userData, socketId, ip) {
    if (!this.isUsernameAllowed(userData.username)) {
      throw new AppError('Username is reserved or invalid', 400);
    }

    let user = await User.findOne({ socketId });

    // If not found by socket, check by username to prevent duplicate active usernames (optional, but good practice)
    // For anonymous chat, we might want to allow re-claiming if the socket disconnected recently, 
    // but here we follow the existing pattern of creating/updating based on socket or existing data.

    if (user) {
      user.lastActive = new Date();
      await user.save();
    } else {
      user = new User({
        socketId,
        username: userData.username, // Assumption: validation happened
        avatar: userData.avatar,
        joinedAt: new Date(),
        lastActive: new Date(),
        ip
      });
      await user.save();
    }

    return user;
  }
}

module.exports = ChatService;
