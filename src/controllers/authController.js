const authService = require('../services/authService');
const { createSendToken } = require('../utils/authUtils');
const AppError = require('../utils/errors/AppError');
// const catchAsync = require('../utils/errors/catchAsync');
// Removed: const { generateToken } = require('../utils/authUtils');

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Bad request
 */
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

/**
 * @swagger
 * /registerInstitution:
 *   post:
 *     summary: Register a new institution
 *     tags: [Institution]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *     responses:
 *       201:
 *         description: Institution registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 institution:
 *                   type: object
 *                   properties:
 *                     institutionId:
 *                       type: integer
 *                     userId:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     address:
 *                       type: string
 *                     contactEmail:
 *                       type: string
 *       400:
 *         description: Bad request
 */


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

// Add controller for registering a student
exports.registerStudent = async (req, res, next) => {
  try {
    // Basic validation (add more as needed)
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return next(new AppError('Please provide email, password, first name, and last name', 400));
    }

    const { user, student } = await authService.registerStudent(req.body);

    // Use createSendToken, passing student data
    createSendToken(user, 201, res, { student });

  } catch (err) {
    // Use the error handling from the service or a generic one
    next(err instanceof AppError ? err : new AppError(err.message, 400));
  }
};

// Add controller for registering a teacher
exports.registerTeacher = async (req, res, next) => {
  try {
    // Basic validation (add more as needed)
    const { email, password, firstName, lastName } = req.body;
    console.log(req.body,"req.body----------");
    
    if (!email || !password || !firstName || !lastName) {
      return next(new AppError('Please provide email, password, first name, and last name', 400));
    }

    const { user, teacher } = await authService.registerTeacher(req.body);

    // Use createSendToken, passing teacher data
    createSendToken(user, 201, res, { teacher });

  } catch (err) {
    // Pass the original error to the global error handler
    // It will classify it as operational (AppError) or programming error
    next(err);
  }
};