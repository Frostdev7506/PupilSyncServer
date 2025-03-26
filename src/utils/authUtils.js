const jwt = require('jsonwebtoken');
const config = require('../config');

const signToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + config.jwt.cookieExpiresIn * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

const verifyToken = async (token) => {
  return await jwt.verify(token, config.jwt.secret);
};

module.exports = {
  signToken,
  createSendToken,
  verifyToken
};