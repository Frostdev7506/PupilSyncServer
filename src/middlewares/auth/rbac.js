const AppError = require('../../utils/errors/AppError');

const rbac = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new AppError('Authentication error, user role not found.', 401));
    }

    const userRole = req.user.role;

    if (allowedRoles.includes(userRole)) {
      next();
    } else {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
  };
};

module.exports = rbac;
