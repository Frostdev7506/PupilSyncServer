const { Op, Sequelize } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { verifyToken } = require('../utils/authUtils');
const bcrypt = require('bcryptjs'); // Make sure bcryptjs is required

// 1. Import sequelize instance directly
const { sequelize } = require('../config/db.js');
// 2. Import the initModels function
const initModels = require('../models/init-models');

// 3. Call initModels to get the models object
const models = initModels(sequelize);
// 4. Destructure the specific models you need
const { Users, Institutions } = models;

exports.createUser = async (userData) => {
  try {
    // Set default role if not provided
    if (!userData.role) {
      userData.role = 'user';
    }

    // Handle password separately
    const password = userData.password;
    delete userData.password;

    // Use the imported variable 'Users' (plural)
    const user = await Users.create(userData); // Should work now

    // Set password using the method that will hash it
    if (password) {
      // Assuming setPassword exists on the Users model instance
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
  // Ensure this uses 'Users' correctly
  const user = await Users.findOne({
    where: { email }
  });

  if (!user || !(await user.correctPassword(password))) { // Assuming correctPassword exists
    throw new Error('Incorrect email or password');
  }

  // Update last login time
  user.last_login = new Date();
  await user.save();

  return user;
};

exports.refreshAuthToken = async (token) => {
  const decoded = await verifyToken(token);
  // Use the imported variable 'Users' (plural)
  const user = await Users.findByPk(decoded.user_id);

  if (!user) {
    throw new Error('User belonging to this token no longer exists');
  }

  return user;
};

exports.registerInstitution = async (institutionData) => {
  const transaction = await sequelize.transaction();

  try {
    // 1. Hash the password first
    const password = institutionData.password;
    if (!password) {
      // Optionally handle cases where password might be missing, though validation should catch this
      throw new AppError('Password is required for registration.', 400);
    }
    const passwordHash = await bcrypt.hash(password, 12); // Hash the password

    // 2. Prepare User data including the hash
    const userData = {
      email: institutionData.email,
      passwordHash: passwordHash, // Include the hashed password
      firstName: institutionData.firstName,
      lastName: institutionData.lastName,
      role: 'institution',
      isVerified: false // Or true, depending on your verification flow
    };

    // 3. Create the User record with the hash included
    const user = await Users.create(userData, { transaction });

    // 4. Remove the separate setPassword and save calls, as it's handled above
    // if (password) {
    //   await user.setPassword(password); // No longer needed
    //   await user.save({ transaction }); // No longer needed
    // }

    // 5. Create the Institution record
    const userPlain = user && typeof user.toJSON === 'function' ? user.toJSON() : user;
    const institutionDetails = {
      userId: userPlain.userId,
      name: institutionData.name,
      address: institutionData.address,
      contactEmail: institutionData.contactEmail || institutionData.email,
    };

    const institution = await Institutions.create(institutionDetails, { transaction });

    // 6. Commit transaction
    await transaction.commit();

    // Exclude password hash from the returned user object for security
    let userResponse;
    if (user && typeof user.toJSON === 'function') {
      userResponse = user.toJSON();
    } else {
      userResponse = user;
    }
    delete userResponse.passwordHash;

    return { user: userResponse, institution };

  } catch (err) {
    await transaction.rollback();
    console.error("Error during institution registration:", err); // Keep logging

    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
       // Provide more specific messages based on error details if needed
       const messages = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
       throw new AppError(`Validation Error: ${messages}`, 400); // Use 400 for validation errors
    }
    // Throw a generic server error for other issues
    throw new AppError(`Error registering institution: ${err.message || 'Internal Server Error'}`, 500);
  }
};