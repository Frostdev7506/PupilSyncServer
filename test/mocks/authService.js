const { Op, Sequelize } = require('sequelize');
const AppError = require('../../src/utils/errors/AppError');
const bcrypt = require('bcryptjs');

// Import the test database instead of the production one
const { sequelize } = require('../../src/config/test-db');
const initModels = require('../../src/models/init-models');

const models = initModels(sequelize);
const { Users, Institutions, Students, Teachers } = models;

exports.loginUser = async (email, password) => {
  // Find user by email
  const user = await Users.findOne({
    where: { email }
  });

  if (!user) {
    throw new AppError('Incorrect email or password', 401);
  }

  // Verify password using bcrypt
  const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordCorrect) {
    throw new AppError('Incorrect email or password', 401);
  }

  // Update last login time
  await user.update({ lastLogin: new Date() });

  // Return user without sensitive data
  const userResponse = user.toJSON();
  delete userResponse.passwordHash;
  delete userResponse.verificationToken;

  return userResponse;
};

exports.registerInstitution = async (institutionData) => {
  const transaction = await sequelize.transaction();

  try {
    // Hash the password
    const password = institutionData.password;
    if (!password) {
      throw new AppError('Password is required for registration.', 400);
    }
    const passwordHash = await bcrypt.hash(password, 12);

    // Prepare User data
    const userData = {
      email: institutionData.email,
      passwordHash: passwordHash,
      firstName: institutionData.firstName,
      lastName: institutionData.lastName,
      role: 'institution',
      isVerified: false
    };

    // Create the User record
    const user = await Users.create(userData, { transaction });

    // Create the Institution record
    const userPlain = user && typeof user.toJSON === 'function' ? user.toJSON() : user;
    const institutionDetails = {
      userId: userPlain.userId,
      name: institutionData.name,
      address: institutionData.address,
      contactEmail: institutionData.contactEmail || institutionData.email
    };

    const institution = await Institutions.create(institutionDetails, { transaction });

    // Commit transaction
    await transaction.commit();

    // Exclude password hash from the returned user object
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
    console.error("Error during institution registration:", err);

    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      const messages = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
      throw new AppError(`Validation Error: ${messages}`, 400);
    }
    throw new AppError(`Error registering institution: ${err.message || 'Internal Server Error'}`, 500);
  }
};

exports.registerStudent = async (studentData) => {
  const transaction = await sequelize.transaction();

  try {
    const password = studentData.password;
    if (!password) {
      throw new AppError('Password is required for registration.', 400);
    }
    const passwordHash = await bcrypt.hash(password, 12);

    const userData = {
      email: studentData.email,
      passwordHash,
      firstName: studentData.firstName,
      lastName: studentData.lastName,
      role: 'student',
      isVerified: false
    };

    const user = await Users.create(userData, { transaction });

    // Check if institution exists
    if (studentData.institutionId) {
      const institution = await Institutions.findByPk(studentData.institutionId);
      if (!institution) {
        await transaction.rollback();
        throw new AppError('Institution not found', 400);
      }
    }

    const userPlain = user && typeof user.toJSON === 'function' ? user.toJSON() : user;
    
    const studentDetails = {
      userId: user.userId,
      institutionId: studentData.institutionId,
      gradeLevel: studentData.gradeLevel,
    };

    const student = await Students.create(studentDetails, { transaction });

    await transaction.commit();

    let userResponse = userPlain;
    delete userResponse.passwordHash;

    return { user: userResponse, student };
  } catch (err) {
    await transaction.rollback();
    console.error("Error during student registration:", err);

    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      const messages = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
      throw new AppError(`Validation Error: ${messages}`, 400);
    }
    
    // Re-throw AppError instances
    if (err instanceof AppError) {
      throw err;
    }
    
    throw new AppError(`Error registering student: ${err.message || 'Internal Server Error'}`, 500);
  }
};

exports.registerTeacher = async (teacherData) => {
  const transaction = await sequelize.transaction();

  try {
    const password = teacherData.password;
    if (!password) {
      throw new AppError('Password is required for registration.', 400);
    }
    const passwordHash = await bcrypt.hash(password, 12);

    const userData = {
      email: teacherData.email,
      passwordHash,
      firstName: teacherData.firstName,
      lastName: teacherData.lastName,
      role: 'teacher',
      isVerified: false
    };

    const user = await Users.create(userData, { transaction });

    const userPlain = user && typeof user.toJSON === 'function' ? user.toJSON() : user;
    const teacherDetails = {
      userId: userPlain.userId,
      subjectExpertise: teacherData.subjectExpertise,
      bio: teacherData.bio,
      profilePictureUrl: teacherData.profilePictureUrl
    };

    const teacher = await Teachers.create(teacherDetails, { transaction });

    await transaction.commit();

    let userResponse = userPlain;
    delete userResponse.passwordHash;

    return { user: userResponse, teacher };
  } catch (err) {
    await transaction.rollback();
    console.error("Error during teacher registration:", err);

    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      const messages = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
      throw new AppError(`Validation Error: ${messages}`, 400);
    }
    throw new AppError(`Error registering teacher: ${err.message || 'Internal Server Error'}`, 500);
  }
};
