// backend/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack); // Log the error stack for debugging

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // In production, avoid sending detailed error messages to the client
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    return res.status(statusCode).json({ error: 'An unexpected error occurred.' });
  }

  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production' && statusCode === 500 ? 'An unexpected error occurred.' : message,
    details: process.env.NODE_ENV === 'production' && statusCode === 500 ? undefined : err.details || undefined // Only include details in non-production or for non-500 errors
  });
};

module.exports = errorHandler;