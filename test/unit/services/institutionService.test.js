const { sequelize, models } = require('../../../src/config/test-db'); // Use test database with models

// Use the models from test-db.js
const { Users, Institutions, Teachers, Classes, Courses, Students } = models;

// Create simple service functions for testing
const authService = {
  registerInstitution: async (data) => {
    try {
      const user = await Users.create({
        email: data.email,
        passwordHash: 'hashed_password',
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
    } catch (error) {
      console.error('Error in registerInstitution:', error);
      throw error;
    }
  },

  registerTeacher: async (data) => {
    try {
      const user = await Users.create({
        email: data.email,
        passwordHash: 'hashed_password',
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'teacher'
      });

      const teacher = await Teachers.create({
        userId: user.userId,
        subjectExpertise: data.subjectExpertise || 'General',
        bio: data.bio || 'Teacher bio'
      });

      return { user, teacher };
    } catch (error) {
      console.error('Error in registerTeacher:', error);
      throw error;
    }
  }
};

const institutionService = {
  getInstitutionWithAssociations: async (institutionId) => {
    const institution = await Institutions.findByPk(institutionId, {
      include: [
        { model: Users, as: 'user' },
        { model: Teachers, as: 'Teachers' },
        { model: Students, as: 'Students' },
        { model: Classes, as: 'Classes', include: [{ model: Courses, as: 'Course' }] }
      ]
    });

    if (!institution) {
      throw new Error(`Institution with ID ${institutionId} not found`);
    }

    return institution;
  },

  updateInstitution: async (institutionId, updateData) => {
    const institution = await Institutions.findByPk(institutionId);

    if (!institution) {
      throw new Error(`Institution with ID ${institutionId} not found`);
    }

    await institution.update(updateData);
    return institution;
  },

  addTeacherToInstitution: async (institutionId, teacherId) => {
    const institution = await Institutions.findByPk(institutionId);
    if (!institution) {
      throw new Error(`Institution with ID ${institutionId} not found`);
    }

    const teacher = await Teachers.findByPk(teacherId);
    if (!teacher) {
      throw new Error(`Teacher with ID ${teacherId} not found`);
    }

    await models.TeacherInstitutions.create({
      teacherId,
      institutionId,
      isPrimary: false
    });

    return { message: 'Teacher added successfully' };
  },

  calculateStatistics: (institution) => {
    const institutionJSON = institution.toJSON();
    return {
      totalTeachers: institutionJSON.Teachers?.length || 0,
      totalStudents: institutionJSON.Students?.length || 0,
      totalClasses: institutionJSON.Classes?.length || 0,
      activeCourses: [...new Set(
        institutionJSON.Classes
          ?.map(c => c.Course?.name)
          ?.filter(Boolean)
      )]
    };
  }
};

// Increase global timeout
jest.setTimeout(30000);

describe('Institution Service', () => {
  // Set up database once for all tests
  beforeAll(async () => {
    // Use the connectDB function from test-db.js
    await require('../../../src/config/test-db').connectDB();
  }, 10000);

  beforeEach(async () => {
    // For SQLite, we can just delete all records
    await Users.destroy({ where: {} });
    await Institutions.destroy({ where: {} });
    await Teachers.destroy({ where: {} });
    await Classes.destroy({ where: {} });
    await Courses.destroy({ where: {} });
    await models.TeacherInstitutions.destroy({ where: {} });
  }, 2000);

  afterAll(async () => {
    await sequelize.close();
  });

  describe('getInstitutionWithAssociations', () => {
    it('should get institution with all associations', async () => {
      // Create test institution
      const institutionData = {
        email: 'test@school.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'School',
        name: 'Test School',
        address: '123 Education St'
      };

      const { institution } = await authService.registerInstitution(institutionData);

      const result = await institutionService.getInstitutionWithAssociations(institution.institutionId);

      expect(result).toBeDefined();
      expect(result.name).toBe(institutionData.name);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(institutionData.email);
    });

    it('should throw error for non-existent institution', async () => {
      await expect(institutionService.getInstitutionWithAssociations(999))
        .rejects
        .toThrow('Institution with ID 999 not found');
    });
  });

  describe('updateInstitution', () => {
    it('should successfully update institution details', async () => {
      // Create test institution with unique email
      const { institution } = await authService.registerInstitution({
        email: 'update-test@school.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'School',
        name: 'Test School',
        address: '123 Education St'
      });

      const updateData = {
        name: 'Updated School Name',
        address: '456 New Address'
      };

      const result = await institutionService.updateInstitution(
        institution.institutionId,
        updateData
      );

      expect(result.name).toBe(updateData.name);
      expect(result.address).toBe(updateData.address);
    });
  });

  describe('addTeacherToInstitution', () => {
    it('should successfully add teacher to institution', async () => {
      // Create test institution with unique email
      const { institution } = await authService.registerInstitution({
        email: 'teacher-test@school.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'School',
        name: 'Test School'
      });

      // Create test teacher with unique email
      const teacherData = {
        email: 'teacher@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'Teacher'
      };

      const { teacher } = await authService.registerTeacher(teacherData);

      const result = await institutionService.addTeacherToInstitution(
        institution.institutionId,
        teacher.teacherId
      );

      expect(result.message).toBe('Teacher added successfully');
    });
  });

  describe('calculateStatistics', () => {
    it('should calculate correct institution statistics', async () => {
      // Create test institution with unique email
      const { institution } = await authService.registerInstitution({
        email: 'stats-test@school.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'School',
        name: 'Test School'
      });

      const institutionWithAssociations = await institutionService.getInstitutionWithAssociations(
        institution.institutionId
      );

      const stats = institutionService.calculateStatistics(institutionWithAssociations);

      expect(stats).toHaveProperty('totalTeachers');
      expect(stats).toHaveProperty('totalStudents');
      expect(stats).toHaveProperty('totalClasses');
      expect(stats).toHaveProperty('activeCourses');
    });
  });
});