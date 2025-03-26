const authService = require('../services/authService');
const { createSendToken } = require('../utils/authUtils');
const AppError = require('../utils/errors/AppError');

exports.signup = async (req, res, next) => {
  try {
    const user = await authService.createUser(req.body);
    createSendToken(user, 201, res);
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await authService.loginUser(email, password);
    createSendToken(user, 200, res);
  } catch (err) {
    next(new AppError(err.message, 401));
  }
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

exports.refreshToken = async (req, res, next) => {
  try {
    const user = await authService.refreshAuthToken(req.cookies.jwt);
    createSendToken(user, 200, res);
  } catch (err) {
    next(new AppError(err.message, 401));
  }
};