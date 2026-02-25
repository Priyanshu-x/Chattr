// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const getIp = require('./getIp');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');
const Joi = require('joi'); // Added Joi for validateObjectId

// Basic authentication middleware for regular users (if needed)
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.cookies.token; // Get token from HttpOnly cookie

    if (!token) {
      throw new AppError('Access denied. No token provided.', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new AppError('Invalid token. User not found.', 401);
    }

    // Check if user is banned
    if (user.isBanned && user.bannedUntil && user.bannedUntil > new Date()) {
      throw new AppError('User is banned', 403, { bannedUntil: user.bannedUntil, reason: user.banReason });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      next(new AppError('Token expired', 401));
    } else if (error.name === 'JsonWebTokenError') {
      next(new AppError('Invalid token', 401));
    } else {
      next(error instanceof AppError ? error : new AppError(error.message, error.statusCode || 500));
    }
  }
};

// Rate limiting middleware
const rateLimitMiddleware = (defaultMax = 10, defaultWindow = 60000) => {
  const requests = new Map();
  const GlobalSettings = require('../models/GlobalSettings');

  return async (req, res, next) => {
    try {
      const settings = await GlobalSettings.getSettings();
      const maxRequests = settings.rateLimitMessages || defaultMax;
      const windowMs = (settings.rateLimitWindow * 1000) || defaultWindow;

      const identifier = getIp(req);
      const now = Date.now();

      if (!requests.has(identifier)) {
        requests.set(identifier, { count: 1, resetTime: now + windowMs });
        return next();
      }

      const userRequests = requests.get(identifier);

      if (now > userRequests.resetTime) {
        userRequests.count = 1;
        userRequests.resetTime = now + windowMs;
        return next();
      }

      if (userRequests.count >= maxRequests) {
        throw new AppError('Too many requests. Please try again later.', 429, { resetTime: userRequests.resetTime });
      }

      userRequests.count++;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Input validation middleware
const validateInput = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property]);
    if (error) {
      throw new AppError('Validation failed', 400, { details: error.details.message });
    }
    next();
  };
};

const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const { error } = Joi.string().hex().length(24).validate(req.params[paramName]);
    if (error) {
      throw new AppError(`Invalid ${paramName} ID`, 400);
    }
    next();
  };
};

// File upload validation middleware
const validateFileUpload = (allowedTypes, maxSize = 10 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // Check file type
    if (!allowedTypes.includes(req.file.mimetype)) {
      throw new AppError('Invalid file type', 400, { allowedTypes });
    }

    // Check file size
    if (req.file.size > maxSize) {
      throw new AppError('File too large', 400, { maxSize: `${maxSize / (1024 * 1024)}MB` });
    }

    next();
  };
};

// CORS middleware configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      process.env.CLIENT_URL
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new AppError('Not allowed by CORS', 403));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = {
  authenticateUser,
  rateLimitMiddleware,
  validateInput,
  validateObjectId,
  validateFileUpload,
  corsOptions
};
