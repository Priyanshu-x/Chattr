// backend/routes/user.js
const express = require('express');
const User = require('../models/User');
const router = express.Router();
const { register, login, getProfile, updateProfile } = require('../controllers/userController');
const { authenticateUser } = require('../middleware/auth');
const { validateInput, rateLimitMiddleware } = require('../middleware/auth');
const { registerSchema, loginSchema, updateProfileSchema } = require('../utils/validationSchemas');

// Generate random username
router.get('/username', (req, res) => {
  const adjectives = ['Cool', 'Happy', 'Smart', 'Funny', 'Brave', 'Kind', 'Swift', 'Bright', 'Bold', 'Calm'];
  const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Lion', 'Wolf', 'Fox', 'Bear', 'Hawk', 'Shark'];
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);
  
  res.json({
    username: `${adjective}${noun}${number}`
  });
});

// Generate random avatar
router.get('/avatar', (req, res) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
  const avatarStyles = ['bottts', 'identicon', 'gridy', 'micah'];
  
  const style = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
  const seed = Math.random().toString(36).substring(7);
  const backgroundColor = colors[Math.floor(Math.random() * colors.length)].substring(1);
  
  res.json({
    avatar: `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=${backgroundColor}`
  });
});

// User authentication routes
router.post('/register', rateLimitMiddleware(5, 60000), validateInput(registerSchema), register); // 5 attempts per minute
router.post('/login', rateLimitMiddleware(5, 60000), validateInput(loginSchema), login); // 5 attempts per minute
router.get('/profile', authenticateUser, getProfile);
router.patch('/profile', authenticateUser, validateInput(updateProfileSchema), updateProfile);

// User logout
router.post('/logout', authenticateUser, (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
