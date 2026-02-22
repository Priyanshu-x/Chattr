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

        // --- GLOBAL EASTER EGGS (Hidden Commands) ---
        const lowerMsg = messageData.content?.toLowerCase().trim();
        const globalEffects = {
          'let it snow': { type: 'snow', duration: 15000 },
          'dark mode': { type: 'dark', duration: 10000 },
          'light mode': { type: 'light', duration: 10000 },
          'glitch': { type: 'glitch', duration: 5000 }
        };

        if (globalEffects[lowerMsg]) {
          io.emit('trigger-global-effect', globalEffects[lowerMsg]);
          return; // STOP: Don't save or broadcast secret commands
        }

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

        const messageDto = {
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
        };

        // Broadcast message to all users
        io.emit('message-received', messageDto);

        logger.info(`Message from ${user.username}: ${message.type}`);

        // --- KIRA AI INTEGRATION ---
        const AIService = require('../services/aiService');
        const lowerContent = message.content.toLowerCase();

        // --- REACTION WARS (Randomly react to messages) ---
        if (process.env.KIRA_ENABLED === 'true' && Math.random() < 0.15) { // 15% chance to react
          setTimeout(async () => {
            const kiraUser = await ChatService.getKiraUser();
            const botEmojis = ['💅', '🙄', '🔥', '💻', '🌌', '🧠', '⚡', '🤖', '💀', '🤡'];
            const randomEmoji = botEmojis[Math.floor(Math.random() * botEmojis.length)];

            message.reactions.push({
              emoji: randomEmoji,
              user: kiraUser._id
            });
            await message.save();
            io.emit('reaction-updated', {
              messageId: message._id,
              reactions: message.reactions
            });
          }, 2000);
        }

        const isMentioned = lowerContent.includes('@kira') || lowerContent.includes('kira');
        const isCommand = message.content.startsWith('/');

        // Random join-in logic (5% chance if tech keywords detected)
        const techKeywords = ['react', 'node', 'js', 'bug', 'css', 'api', 'server', 'database', 'mongo', 'frontend', 'backend', 'space', 'quantum', 'nano', 'crypto', 'web3'];
        const hasTechKeyword = techKeywords.some(kw => lowerContent.includes(kw));
        const randomJoin = !isMentioned && !isCommand && hasTechKeyword && Math.random() < 0.05;

        if (process.env.KIRA_ENABLED === 'true' && (isMentioned || randomJoin || (isCommand && lowerContent.includes('kira')))) {
          setTimeout(async () => {
            try {
              const kiraUser = await ChatService.getKiraUser();
              let aiResponse;

              // Handle Secret Commands
              if (message.content.startsWith('/kira glitch')) {
                aiResponse = "01101000 01100101 01101100 01110000 00100000 01101101 01111001 00100000 01100011 01101111 01100100 01100101 00100000 01101001 01110011 00100000 01100010 01110010 01101111 01101011 01100101 01101110 00100000 01001100 01001101 01000001 01001111 00101110 00101110 00101110";
              } else if (message.content.startsWith('/kira status')) {
                const mood = await AIService.analyzeMood([message]);
                aiResponse = `Systems optimal. Current mood: ${mood}. Sarcasm levels at 99%. 💅`;
              } else if (message.content.startsWith('/kira roast')) {
                const target = message.content.replace('/kira roast', '').trim() || user.username;
                aiResponse = await AIService.generateResponse(`Roast this person named ${target} in your signature sarcastic tech style. Keep it short.`, []);
              } else if (message.content.startsWith('/kira recap')) {
                // Get messages from the last 24 hours
                const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const dayMessages = await Message.find({ createdAt: { $gte: yesterday } })
                  .limit(20)
                  .populate('user', 'username');

                const summaryPrompt = `Recap these messages from the last 24 hours in your sarcastic tech-nerdy style. Be brief and judge the quality of discussion: ${dayMessages.map(m => `${m.user.username}: ${m.content}`).join(' | ')}`;
                aiResponse = await AIService.generateResponse(summaryPrompt, []);
              } else {
                // Get recent context
                const recentMessages = await Message.find()
                  .sort({ createdAt: -1 })
                  .limit(5)
                  .populate('user', 'username');

                const context = recentMessages.reverse().map(m => ({
                  role: m.user.username === 'Kira' ? 'Kira' : 'User',
                  username: m.user.username,
                  content: m.content
                }));

                aiResponse = await AIService.generateResponse(message.content, context);
              }

              // Simulate typing
              io.emit('user-typing', {
                username: kiraUser.username,
                avatar: kiraUser.avatar
              });

              // Stop typing after a delay
              setTimeout(() => {
                io.emit('user-stop-typing', { username: kiraUser.username });
              }, 2500);

              // Small delay to feel more human
              setTimeout(async () => {
                const kiraMessage = await ChatService.createMessage({
                  content: aiResponse,
                  user: kiraUser._id,
                  type: 'text'
                });

                await kiraMessage.populate('user', 'username avatar');

                io.emit('message-received', {
                  _id: kiraMessage._id,
                  content: kiraMessage.content,
                  type: kiraMessage.type,
                  user: kiraMessage.user,
                  createdAt: kiraMessage.createdAt,
                  reactions: kiraMessage.reactions
                });
              }, 3000);

            } catch (aiErr) {
              logger.error('Kira AI Error:', aiErr);
            }
          }, 1000);
        }
        // --- END KIRA AI INTEGRATION ---


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