// backend/config/socket.js
const socketIo = require('socket.io');
const Message = require('../models/Message');
const User = require('../models/User');
const BlockedIP = require('../models/BlockedIP');
const getIp = require('../middleware/getIp');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

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

        let user = await User.findOne({ socketId: socket.id });
        if (user) {
          logger.info(`Existing user reconnected: ${user.username}`);
          user.lastActive = new Date();
          await user.save();
        } else {
          logger.info(`Creating new user: ${userData.username}`);
          user = new User({
            socketId: socket.id,
            username: userData.username,
            avatar: userData.avatar,
            joinedAt: new Date(),
            lastActive: new Date(),
            ip: ip,
          });
          await user.save();
          logger.info(`New user ${user.username} saved to DB.`);
        }

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
        socket.emit('error', { message: error.message || 'Failed to join chat' });
        socket.disconnect(true); // Force disconnect on critical errors
      }
    });

    // Handle new message
    socket.on('new-message', async (messageData) => {
      try {
        const user = activeUsers.get(socket.id);
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return; // Exit early if user not found
        }

        // Rate limiting check
        const recentMessages = await Message.countDocuments({
          user: user._id,
          createdAt: { $gte: new Date(Date.now() - 60000) } // Last minute
        });

        if (recentMessages >= 10) {
          socket.emit('error', { message: 'Rate limit exceeded' });
          return; // Exit early if rate limit exceeded
        }

        const message = new Message({
          content: messageData.content,
          type: messageData.type || 'text',
          user: user._id,
          fileUrl: messageData.fileUrl,
          fileName: messageData.fileName,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          reactions: []
        });

        await message.save();
        await message.populate('user', 'username avatar');

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
          isPinned: message.isPinned
        });

        logger.info(`Message from ${user.username}: ${message.type}`);
      } catch (error) {
        logger.error('Error handling message:', error);
        socket.emit('error', { message: error.message || 'Failed to send message' });
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
          socket.emit('error', { message: 'Message not found' });
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
        socket.emit('error', { message: error.message || 'Failed to toggle reaction' });
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
          await User.findByIdAndDelete(user._id);
          activeUsers.delete(socket.id);
          
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