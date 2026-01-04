// backend/config/socket.js
const socketIo = require('socket.io');
const Message = require('../models/Message');
const User = require('../models/User');
const BlockedIP = require('../models/BlockedIP');
const getIp = require('../middleware/getIp');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const ChatService = require('../services/chatService');

let io;
const activeUsers = new Map();

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.CLIENT_URL
        : "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);

    // Handle user joining
    socket.on('join-chat', async (userData) => {
      try {
        logger.info(`Attempting to join chat for socket ID: ${socket.id} with data: ${JSON.stringify(userData)}`);

        const ip = getIp(socket.handshake);
        logger.debug(`User IP: ${ip}`);

        const blocked = await BlockedIP.findOne({ ip });
        if (blocked) {
          logger.warn(`Blocked IP ${ip} attempted to join chat.`);
          socket.emit('error', { message: 'You are blocked from this chat.' });
          socket.disconnect(true); // Force disconnect
          return;
        }

        // Use ChatService to handle user creation/updating
        const user = await ChatService.joinUser(userData, socket.id, ip);

        activeUsers.set(socket.id, user);
        socket.join('public-chat');

        socket.broadcast.emit('user-joined', {
          username: user.username,
          avatar: user.avatar,
          id: user._id
        });

        const onlineUsers = Array.from(activeUsers.values()).map(u => ({
          username: u.username,
          avatar: u.avatar,
          id: u._id
        }));
        io.emit('online-users', onlineUsers);
        logger.debug(`Emitted online users: ${onlineUsers.length}`);

        socket.emit('user-info', {
          id: user._id,
          username: user.username,
          avatar: user.avatar,
          joinedAt: user.joinedAt,
          lastActive: user.lastActive,
          messageCount: user.messageCount
        });
        logger.debug(`Emitted user info for ${user.username}`);

        const recentMessages = await Message.find()
          .sort({ createdAt: -1 })
          .limit(50)
          .populate('user', 'username avatar')
          .populate('reactions.user', 'username');

        socket.emit('recent-messages', recentMessages.reverse());
        logger.debug(`Emitted ${recentMessages.length} recent messages.`);

        logger.info(`User ${user.username} (${user._id}) successfully joined the chat.`);
      } catch (error) {
        logger.error(`Error handling user join for socket ID ${socket.id}:`, error);
        const errorMessage = process.env.NODE_ENV === 'production'
          ? 'Failed to join chat.'
          : error.message || 'Failed to join chat';
        socket.emit('error', { message: errorMessage });
        socket.disconnect(true); // Force disconnect on critical errors
      }
    });

    // Handle new message
    socket.on('new-message', async (messageData) => {
      try {
        const user = activeUsers.get(socket.id);
        if (!user) {
          socket.emit('error', { message: 'User session expired or not found. Please rejoin.' });
          socket.disconnect(true); // Force disconnect
          return; // Exit early if user not found
        }

        // Rate limiting check using Service (In-Memory)
        if (!ChatService.checkRateLimit(user._id.toString())) {
          socket.emit('error', { message: 'You are sending messages too quickly. Please slow down.' });
          return; // Exit early
        }

        // Create message using Service (handles sanitization)
        const message = await ChatService.createMessage({
          ...messageData,
          user: user._id
        });

        await message.populate('user', 'username avatar');
        await message.populate({
          path: 'replyTo',
          select: 'content user type fileUrl fileName',
          populate: { path: 'user', select: 'username' }
        });

        // Update user message count
        user.messageCount = (user.messageCount || 0) + 1;
        user.lastActive = new Date();
        await user.save();

        // Broadcast message to all users
        io.emit('message-received', {
          _id: message._id,
          content: message.content,
          type: message.type,
          user: message.user,
          fileUrl: message.fileUrl,
          fileName: message.fileName,
          createdAt: message.createdAt,
          reactions: message.reactions,
          isPinned: message.isPinned,
          replyTo: message.replyTo
        });

        logger.info(`Message from ${user.username}: ${message.type}`);
      } catch (error) {
        logger.error('Error handling message:', error);
        const errorMessage = process.env.NODE_ENV === 'production'
          ? 'Failed to send message.'
          : error.message || 'Failed to send message';
        socket.emit('error', { message: errorMessage });
      }
    });

    // Handle message reaction
    socket.on('toggle-reaction', async (data) => {
      try {
        const { messageId, emoji } = data;
        const user = activeUsers.get(socket.id);
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return; // Exit early if user not found
        }

        const message = await Message.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found for reaction.' });
          return; // Exit early if message not found
        }

        const existingReaction = message.reactions.find(r =>
          r.emoji === emoji && r.user.toString() === user._id.toString()
        );

        if (existingReaction) {
          message.reactions.pull(existingReaction._id);
        } else {
          message.reactions.push({
            emoji,
            user: user._id
          });
        }

        await message.save();
        await message.populate('reactions.user', 'username');

        io.emit('reaction-updated', {
          messageId,
          reactions: message.reactions
        });
      } catch (error) {
        logger.error('Error handling reaction:', error);
        const errorMessage = process.env.NODE_ENV === 'production'
          ? 'Failed to toggle reaction.'
          : error.message || 'Failed to toggle reaction';
        socket.emit('error', { message: errorMessage });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', () => {
      const user = activeUsers.get(socket.id);
      if (user) {
        socket.broadcast.emit('user-typing', {
          username: user.username,
          avatar: user.avatar
        });
      }
    });

    socket.on('typing-stop', () => {
      const user = activeUsers.get(socket.id);
      if (user) {
        socket.broadcast.emit('user-stop-typing', {
          username: user.username
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        const user = activeUsers.get(socket.id);
        if (user) {
          // Instead of deleting the user, clear their socketId and update lastActive status
          // This allows for persistent users that can rejoin.
          user.socketId = undefined; // Clear socketId
          user.lastActive = new Date(); // Update last active timestamp
          await user.save(); // Save the updated user state

          activeUsers.delete(socket.id); // Remove from active users map

          socket.broadcast.emit('user-left', {
            username: user.username,
            id: user._id
          });

          const onlineUsers = Array.from(activeUsers.values()).map(u => ({
            username: u.username,
            avatar: u.avatar,
            id: u._id
          }));

          io.emit('online-users', onlineUsers);
          console.log(`User ${user.username} disconnected`);
        }
      } catch (error) {
        logger.error('Error handling disconnect:', error);
        // No socket.emit here as the socket is already disconnected
      }
    });

    // Handle admin events
    socket.on('admin-action', (data) => {
      // Only emit to admin clients
      socket.broadcast.to('admin-room').emit('admin-notification', data);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new AppError('Socket.io not initialized', 500);
  }
  return io;
};

const getActiveUsers = () => activeUsers;

module.exports = {
  initializeSocket,
  getIO,
  getActiveUsers
};