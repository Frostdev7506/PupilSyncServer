const { Op } = require('sequelize');
const { Users } = require('../models/users');const AppError = require('../utils/errors/AppError');
const { verifyToken } = require('../utils/authUtils');

exports.createUser = async (userData) => {
  try {
    // Set default role if not provided
    if (!userData.role) {
      userData.role = 'user';
    }

    // Handle password separately
    const password = userData.password;
    delete userData.password;

    const user = await User.create(userData);

    // Set password using the method that will hash it
    if (password) {
      await user.setPassword(password);
      await user.save();
    }

    return user;
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      throw new Error('User already exists with this email');
    }
    throw new Error(`Error creating user: ${err.message}`);
  }
};

exports.loginUser = async (email, password) => {
  const user = await User.findOne({
    where: { email }
  });

  if (!user || !(await user.correctPassword(password))) {
    throw new Error('Incorrect email or password');
  }

  // Update last login time
  user.last_login = new Date();
  await user.save();

  return user;
};

exports.refreshAuthToken = async (token) => {
  const decoded = await verifyToken(token);
  const user = await User.findByPk(decoded.user_id);

  if (!user) {
    throw new Error('User belonging to this token no longer exists');
  }

  return user;
};