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

  // Update last login time using the correct field name
  await user.update({ lastLogin: new Date() });

  // Return user without sensitive data
  const userResponse = user.toJSON();
  delete userResponse.passwordHash;
  delete userResponse.verificationToken;

  return userResponse;
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
      institutionId: userPlain.institutionId // Ensure institutionId is correctly referenced
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
    
    // Handle foreign key constraint violations
    if (err.name === 'SequelizeForeignKeyConstraintError' || 
        (err.original && err.original.constraint === 'students_institution_id_fkey')) {
      throw new AppError('Invalid institution ID. Please ensure the institution exists.', 400);
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

    // Handle institution relationships
    if (teacherData.institutions && teacherData.institutions.length > 0) {
      const teacherInstitutions = teacherData.institutions.map((institutionId, index) => ({
        teacherId: teacher.teacherId,
        institutionId,
        isPrimary: index === 0 // First institution is set as primary
      }));

      await models.TeacherInstitutions.bulkCreate(teacherInstitutions, { transaction });
    }

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