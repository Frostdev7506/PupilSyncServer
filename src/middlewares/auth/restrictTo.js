const AppError = require('../../utils/errors/AppError');

/**
 * Middleware to restrict access to certain roles
 * @param  {...String} roles - The roles allowed to access the route
 * @returns {Function} - Express middleware
 */
module.exports = (...roles) => {
  return (req, res, next) => {
    // Check if user exists (should be set by protect middleware)
    if (!req.user) {
      return next(
        new AppError('You must be logged in to access this route', 401)
      );
    }

    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};
