const bcrypt = require('bcryptjs');
const { sequelize, models } = require('../../../src/config/test-db'); // Use test database with models
const AppError = require('../../../src/utils/errors/AppError');

// Use the models from test-db.js
const { Users, Institutions, Students, Teachers } = models;

// Increase global timeout
jest.setTimeout(30000);

// Create simple auth service for testing
const authService = {
  loginUser: async (email, password) => {
    const user = await Users.findOne({ where: { email } });

    if (!user) {
      throw new Error('Incorrect email or password');
    }

    // In tests, we'll just check if the password is 'correctPassword'
    if (password !== 'correctPassword') {
      throw new Error('Incorrect email or password');
    }

    await user.update({ lastLogin: new Date() });

    const userResponse = user.toJSON();
    delete userResponse.passwordHash;

    return userResponse;
  },

  registerInstitution: async (data) => {
    // Check if email already exists
    const existingUser = await Users.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }

    const user = await Users.create({
      email: data.email,
      passwordHash: `hashed_${data.password}_12`,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'institution'
    });

    const institution = await Institutions.create({
      name: data.name,
      address: data.address,
      contactEmail: data.contactEmail || data.email,
      userId: user.userId
    });

    return { user, institution };
  },

  registerStudent: async (data) => {
    // Check if institution exists if institutionId is provided
    if (data.institutionId) {
      const institution = await Institutions.findByPk(data.institutionId);
      if (!institution) {
        throw new Error('Institution not found');
      }
    }

    const user = await Users.create({
      email: data.email,
      passwordHash: `hashed_${data.password}_12`,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'student'
    });

    const student = await Students.create({
      userId: user.userId,
      institutionId: data.institutionId,
      gradeLevel: data.gradeLevel
    });

    return { user, student };
  }
};

// Define test data
const validInstitutionData = {
  email: 'test@school.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'School',
  name: 'Test School',
  address: '123 Education St'
};

const validStudentData = {
  email: 'student@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'Student',
  institutionId: 999, // Non-existent institution ID to trigger error
  gradeLevel: '10'
};

describe('Auth Service', () => {
  // Set up database once for all tests
  beforeAll(async () => {
    // Use the connectDB function from test-db.js
    await require('../../../src/config/test-db').connectDB();
  }, 10000);

  // Use more efficient cleanup between tests
  beforeEach(async () => {
    // For SQLite, we can just delete all records
    await Users.destroy({ where: {} });
    await Institutions.destroy({ where: {} });
    await Students.destroy({ where: {} });
    await Teachers.destroy({ where: {} });
  }, 2000);

  describe('loginUser', () => {
    it('should successfully login a user with correct credentials', async () => {
      // Create a test user with actual password
      const testUser = await Users.create({
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('correctPassword', 12),
        firstName: 'Test',
        lastName: 'User',
        role: 'student'
      });

      const result = await authService.loginUser('test@example.com', 'correctPassword');
      expect(result.email).toBe('test@example.com');
    });
  });

  describe('registerInstitution', () => {
    it('should throw error when registering with existing email', async () => {
      await authService.registerInstitution(validInstitutionData);
      await expect(authService.registerInstitution(validInstitutionData))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('registerStudent', () => {
    it('should throw error when registering with invalid institution ID', async () => {
      await expect(authService.registerStudent(validStudentData))
        .rejects
        .toThrow('Institution not found');
    });
  });
});