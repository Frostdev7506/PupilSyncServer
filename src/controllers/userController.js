const { Users } = require('../models/users');
const AppError = require('../utils/errors/AppError');

/**
 * Get current user profile
 */
exports.getMe = async (req, res, next) => {
  try {
    // User is already available on req.user from the protect middleware
    // Remove sensitive data
    const user = req.user.get();
    delete user.password_hash;
    delete user.verification_token;

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

/**
 * Get all users (admin only)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await Users.findAll({
      attributes: { exclude: ['password_hash', 'verification_token'] }
    });

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

/**
 * Update current user profile
 */
exports.updateMe = async (req, res, next) => {
  try {
    // 1) Check if password is being updated (not allowed here)
    if (req.body.password) {
      return next(
        new AppError('This route is not for password updates. Please use /updatePassword.', 400)
      );
    }

    // 2) Filter out unwanted fields that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'first_name', 'last_name', 'email');

    // 3) Update user document
    const updatedUser = await Users.update(filteredBody, {
      where: { user_id: req.user.user_id },
      returning: true,
      plain: true
    });

    // Remove sensitive data
    const user = updatedUser[1].get();
    delete user.password_hash;
    delete user.verification_token;

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
    next(new AppError(err.message, 500));
  }
};

/**
 * Helper function to filter object properties
 */
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};
