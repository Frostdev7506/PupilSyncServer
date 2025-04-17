const {
  AppError,
  ValidationError,
  AuthenticationError,
  DatabaseError
} = require('../../utils/errors');
const logger = require('../../utils/logger');
const config = require('../../config');

const isDev = config.env === 'development';

const handleJWTError = () => new AuthenticationError('Invalid token. Please log in again!');
const handleJWTExpiredError = () => new AuthenticationError('Your token has expired! Please log in again.');

const formatError = (err) => {
  const errorResponse = {
    status: err.status,
    message: err.message
  };

  if (isDev) {
    errorResponse.error = err;
    errorResponse.stack = err.stack;
  }

  return errorResponse;
};

const sendError = (err, req, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json(formatError(err));
  } else {
    // Log detailed error for debugging
    logger.error('Unhandled Error:', {
      error: err.message,
      stack: err.stack,
      timestamp: new Date().toISOString(),
      url: req.originalUrl
    });

    // Send generic message to client
    res.status(500).json({
      status: 'error',
      message: isDev ? err.message : 'Something went wrong!'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err, message: err.message };

  // JWT related errors
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
  
  // Sequelize errors
  if (error.name === 'SequelizeUniqueConstraintError') {
    error = new ValidationError(`Duplicate field value: ${error.errors[0].value}. Please use another value!`);
  }
  if (error.name === 'SequelizeValidationError') {
    const messages = error.errors.map(e => e.message);
    error = new ValidationError(`Invalid input data. ${messages.join('. ')}`);
  }
  if (error.name === 'SequelizeDatabaseError') {
    error = new DatabaseError('Database operation failed');
  }

  // Log all errors in development
  if (isDev) {
    logger.debug('Error details:', {
      error: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
      path: req.path,
      method: req.method
    });
  }

  sendError(error, req, res);
};