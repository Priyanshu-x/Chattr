// backend/server.js
const express = require('express');
const http = require('http');
const { initializeSocket } = require('./config/socket');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const helmet = require('helmet'); // Import helmet for security headers
const cookieParser = require('cookie-parser'); // Import cookie-parser
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const connectDB = require('./config/database'); // Import connectDB
const { serveUploadedFile } = require('./controllers/chatController'); // Import the new file serving controller

const app = express();
const server = http.createServer(app);
initializeSocket(server);

// Connect to MongoDB
connectDB(); // Call connectDB

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:5173'],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://api.dicebear.com"],
      mediaSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts if needed (often for simple apps)
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// HSTS configuration
app.use(helmet.hsts({
  maxAge: 31536000, // 1 year in seconds
  includeSubDomains: true,
  preload: true
}));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173', // Restrict CORS to specific origin
  credentials: true, // Allow sending cookies
}));
app.use(express.json());
app.use(cookieParser()); // Use cookie-parser middleware

// Add logging after all app.use middleware
logger.info(`CORS origin set to: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
logger.info(`NODE_ENV is: ${process.env.NODE_ENV}`);
app.use(express.json());
app.use(cookieParser()); // Use cookie-parser middleware

// Configure secure cookies (already in adminController, ensuring for all where possible)
app.use((req, res, next) => {
  res.cookie = (name, value, options) => {
    const defaultOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/'
    };
    res.setHeader('Set-Cookie', `${name}=${value}; ${Object.entries({ ...defaultOptions, ...options }).map(([key, val]) => {
      if (val === true) return key;
      if (val === false) return ''; // Don't include if false
      return `${key}=${val}`;
    }).filter(Boolean).join('; ')}`);
    return res;
  };
  next();
});
// Removed direct static file serving for uploads, now handled by serveUploadedFile route

// New route for secure file serving
app.get('/uploads/:filename', serveUploadedFile);

// Models
const Message = require('./models/Message');
const User = require('./models/User');
const AdminUser = require('./models/AdminUser');

// Routes
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/adminBlockIp'));

// Error handling middleware
app.use(errorHandler);

// Socket.io connection handling

// Serve static files from the React frontend app
const frontendPath = path.join(__dirname, '../frontend/dist');
const fs = require('fs');
// Ensure fs is required if not already globally available (usually redundant if fs is top-level, but safe here)

logger.info(`Serving static files from: ${frontendPath}`);
if (fs.existsSync(path.join(frontendPath, 'index.html'))) {
  logger.info('frontend/dist/index.html found');
} else {
  logger.error('frontend/dist/index.html NOT found! Check build process.');
}

// Only serve if the directory exists (optional check, but good for local dev if dist is missing)
app.use(express.static(frontendPath));

// Anything that doesn't match the above, send back index.html
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = { app };