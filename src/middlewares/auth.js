const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { Users } = require('../models/users');;
const AppError = require('../utils/errors/AppError');

exports.protect = async (req, res, next) => {
  try {
    // 1) Get token
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(new AppError('Please log in to access this resource', 401));
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3) Check if user exists
    const currentUser = await Users.findByPk(decoded.userId);
    if (!currentUser) {
      return next(new AppError('User no longer exists', 401));
    }

    // 4) Check if user is verified
    if (!currentUser.isVerified) {
      return next(new AppError('Please verify your email address', 401));
    }

    // 5) Check if password was changed after token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(new AppError('Password recently changed. Please log in again', 401));
    }

    // Update last login
    await currentUser.update({ lastLogin: new Date() });

    // Grant access
    req.user = currentUser;
    next();
  } catch (err) {
    next(new AppError('Authentication failed', 401));
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};