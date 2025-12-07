// backend/config/database.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    logger.info(`Attempting to connect to MongoDB with URI: ${process.env.MONGODB_URI}`);
    logger.info(`MONGODB_URI from environment: ${process.env.MONGODB_URI}`);
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      autoIndex: process.env.NODE_ENV !== 'production', // Disable autoIndex in production
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
      // Mongoose's built-in reconnection logic will try to reconnect
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected!');
    });

    mongoose.connection.on('connecting', () => {
      logger.info('MongoDB connecting...');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Database connection failed:', error.message);
    logger.error('Full database connection error details:', error);
    process.exit(1);
  }
};

module.exports = connectDB;

