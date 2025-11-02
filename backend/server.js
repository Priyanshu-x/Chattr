// backend/server.js
const express = require('express');
const http = require('http');
const { initializeSocket } = require('./config/socket');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
initializeSocket(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  // useNewUrlParser and useUnifiedTopology are no longer needed in Mongoose 6+
});

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



const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = { app };