const jwt = require('jsonwebtoken');

exports.signToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

exports.createSendToken = (user, statusCode, res) => {
  const token = this.signToken(user.userId);

  // Remove sensitive data
  const userResponse = user.get();
  delete userResponse.passwordHash;
  delete userResponse.verificationToken;

  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user: userResponse }
  });
};

exports.verifyToken = async (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
