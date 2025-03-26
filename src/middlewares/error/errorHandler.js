const AppError = require('../../utils/errors/AppError');
const logger = require('../../utils/logger');

const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401);

const sendError = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    logger.error(`ERROR 💥: ${err}`);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err, message: err.message };

  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
  
  // Handle Sequelize errors
  if (error.name === 'SequelizeUniqueConstraintError') {
    error = new AppError(`Duplicate field value: ${error.errors[0].value}. Please use another value!`, 400);
  }
  if (error.name === 'SequelizeValidationError') {
    const messages = error.errors.map(e => e.message);
    error = new AppError(`Invalid input data. ${messages.join('. ')}`, 400);
  }
  if (error.name === 'SequelizeDatabaseError') {
    error = new AppError('Database operation failed', 500);
  }

  sendError(error, res);
};