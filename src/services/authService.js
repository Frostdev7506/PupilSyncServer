const { Op } = require('sequelize');
const User = require('../models/userModel');
const AppError = require('../utils/errors/AppError');
const { verifyToken } = require('../utils/authUtils');

exports.createUser = async (userData) => {
  try {
    return await User.create(userData);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      throw new Error('User already exists with this email');
    }
    throw new Error('Error creating user');
  }
};

exports.loginUser = async (email, password) => {
  const user = await User.findOne({ 
    where: { email },
    attributes: { include: ['password'] }
  });

  if (!user || !(await user.correctPassword(password))) {
    throw new Error('Incorrect email or password');
  }

  return user;
};

exports.refreshAuthToken = async (token) => {
  const decoded = await verifyToken(token);
  const user = await User.findByPk(decoded.id);
  
  if (!user) {
    throw new Error('User belonging to this token no longer exists');
  }

  return user;
};