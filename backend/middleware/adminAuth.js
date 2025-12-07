const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const getIp = require('./getIp');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

const adminAuth = async (req, res, next) => {
  try {
    const token = req.cookies.adminToken; // Get token from HttpOnly cookie
    
    if (!token) {
      throw new AppError('Access denied. No admin token provided.', 401);
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await AdminUser.findById(decoded.adminId).select('-password');
    
    if (!admin) {
      throw new AppError('Invalid token. Admin not found.', 401);
    }
    
    // Check if admin account is active
    if (admin.isActive === false) {
      throw new AppError('Admin account is deactivated', 403);
    }
    
    // Update last activity
    admin.lastActivity = new Date();
    await admin.save();
    
    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      next(new AppError('Admin token expired. Please login again.', 401));
    } else if (error.name === 'JsonWebTokenError') {
      next(new AppError('Invalid admin token', 401));
    } else {
      next(error instanceof AppError ? error : new AppError(error.message, error.statusCode || 500));
    }
  }
};

// Middleware to check admin permissions
const checkAdminPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.admin) {
      throw new AppError('Admin authentication required', 401);
    }
    
    // Super admin has all permissions
    if (req.admin.role === 'admin') {
      return next();
    }
    
    // Check if moderator has required permission
    if (req.admin.role === 'moderator') {
      const moderatorPermissions = [
        'view_messages',
        'delete_messages',
        'pin_messages',
        'kick_users',
        'view_stats'
      ];
      
      if (!moderatorPermissions.includes(requiredPermission)) {
        throw new AppError('Insufficient permissions', 403, { required: requiredPermission, userRole: req.admin.role });
      }
    }
    
    next();
  };
};

// Middleware for logging admin actions
const logAdminAction = (action) => {
  return (req, res, next) => {
    // Store action details for potential audit logging
    req.adminAction = {
      action,
      adminId: req.admin?._id,
      adminUsername: req.admin?.username,
      timestamp: new Date(),
      ip: getIp(req),
      userAgent: req.get('User-Agent'),
      params: req.params,
      body: { ...req.body }
    };
    
    // Remove sensitive data from logs
    if (req.adminAction.body.password) {
      req.adminAction.body.password = '[REDACTED]';
    }
    
    // In production, you might want to save this to a separate audit log collection
    logger.info('Admin Action:', req.adminAction);
    
    next();
  };
};

// Rate limiting for admin endpoints
const adminRateLimit = (maxRequests = 100, windowMs = 60000) => {
  const adminRequests = new Map();
  
  return (req, res, next) => {
    const adminId = req.admin?._id?.toString();
    if (!adminId) return next();
    
    const now = Date.now();
    
    if (!adminRequests.has(adminId)) {
      adminRequests.set(adminId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const userRequests = adminRequests.get(adminId);
    
    if (now > userRequests.resetTime) {
      userRequests.count = 1;
      userRequests.resetTime = now + windowMs;
      return next();
    }
    
    if (userRequests.count >= maxRequests) {
      throw new AppError('Admin rate limit exceeded. Please slow down.', 429, { resetTime: userRequests.resetTime });
    }
    
    userRequests.count++;
    next();
  };
};

// Middleware to validate admin session
const validateAdminSession = async (req, res, next) => {
  try {
    if (!req.admin) {
      throw new AppError('Admin session required', 401);
    }
    
    // Check if session is still valid (not expired due to inactivity)
    const maxInactivityTime = 24 * 60 * 60 * 1000; // 24 hours
    const lastActivity = req.admin.lastActivity || req.admin.lastLogin;
    
    if (lastActivity && (Date.now() - lastActivity.getTime()) > maxInactivityTime) {
      throw new AppError('Admin session expired due to inactivity', 401, { lastActivity });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  adminAuth,
  checkAdminPermission,
  logAdminAction,
  adminRateLimit,
  validateAdminSession
};