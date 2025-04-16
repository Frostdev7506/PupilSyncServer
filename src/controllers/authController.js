const authService = require('../services/authService');
const { createSendToken } = require('../utils/authUtils');
const AppError = require('../utils/errors/AppError');
const catchAsync = require('../utils/errors/catchAsync');
// Removed: const { generateToken } = require('../utils/authUtils');

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

// Define and export the registerInstitution controller function
exports.registerInstitution = async (req, res, next) => {
  // Extract data from request body
  const { email, password, firstName, lastName, name, address, contactEmail } = req.body;

  // Basic validation (you might want more robust validation)
  if (!email || !password || !name) {
    return next(new AppError('Please provide email, password, and institution name', 400));
  }

  const institutionData = {
    email,
    password,
    firstName,
    lastName,
    name,
    address,
    contactEmail
  };

  try {
    const { user, institution } = await authService.registerInstitution(institutionData);

    // Ensure user and institution are plain objects
    const userObj = user && typeof user.toJSON === 'function' ? user.toJSON() : user;
    const institutionObj = institution && typeof institution.toJSON === 'function' ? institution.toJSON() : institution;

    createSendToken(userObj, 201, res, {
      institution: institutionObj
        ? {
            institutionId: institutionObj.institutionId,
            userId: institutionObj.userId,
            name: institutionObj.name,
            address: institutionObj.address,
            contactEmail: institutionObj.contactEmail
          }
        : null
    });
  } catch (err) {
    next(new AppError(err.message, 400));
  }
};