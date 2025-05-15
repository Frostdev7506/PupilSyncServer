const { Op, Sequelize } = require('sequelize');
const AppError = require('../../src/utils/errors/AppError');

// Import the test database instead of the production one
const { sequelize } = require('../../src/config/test-db');
const initModels = require('../../src/models/init-models');

const models = initModels(sequelize);
const { Institutions, Teachers, Students, Classes, Courses, Users } = models;

const institutionService = {
  /**
   * Get institution with all associations including user data
   */
  async getInstitutionWithAssociations(institutionId) {
    if (!institutionId) {
      throw new AppError('Institution ID is required', 400);
    }

    const institution = await Institutions.findByPk(institutionId, {
      include: [
        {
          model: Users,
          as: 'user',
          attributes: { exclude: ['passwordHash', 'verificationToken'] }
        },
        {
          model: Teachers,
          as: 'Teachers',
          include: [
            {
              model: Users,
              as: 'user',
              attributes: { exclude: ['passwordHash', 'verificationToken'] }
            }
          ]
        },
        {
          model: Students,
          as: 'Students',
          include: [
            {
              model: Users,
              as: 'user',
              attributes: { exclude: ['passwordHash', 'verificationToken'] }
            }
          ]
        },
        {
          model: Classes,
          as: 'Classes',
          include: [
            {
              model: Courses,
              as: 'Course'
            }
          ]
        }
      ]
    });

    if (!institution) {
      throw new AppError(`Institution with ID ${institutionId} not found`, 404);
    }

    return institution;
  },

  /**
   * Update institution details
   */
  async updateInstitution(institutionId, updateData) {
    const institution = await Institutions.findByPk(institutionId);

    if (!institution) {
      throw new AppError(`Institution with ID ${institutionId} not found`, 404);
    }

    // Update only allowed fields
    const allowedFields = ['name', 'address', 'contactEmail'];
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        institution[key] = updateData[key];
      }
    });

    await institution.save();
    return institution;
  },

  /**
   * Add a teacher to an institution
   */
  async addTeacherToInstitution(institutionId, teacherId) {
    const institution = await Institutions.findByPk(institutionId);
    if (!institution) {
      throw new AppError(`Institution with ID ${institutionId} not found`, 404);
    }

    const teacher = await Teachers.findByPk(teacherId);
    if (!teacher) {
      throw new AppError(`Teacher with ID ${teacherId} not found`, 404);
    }

    // Check if relationship already exists
    const existingRelation = await models.TeacherInstitutions.findOne({
      where: {
        teacherId,
        institutionId
      }
    });

    if (existingRelation) {
      throw new AppError('Teacher is already associated with this institution', 400);
    }

    // Create the relationship
    await models.TeacherInstitutions.create({
      teacherId,
      institutionId,
      isPrimary: false // Default to non-primary
    });

    return { message: 'Teacher added successfully' };
  },

  /**
   * Calculate institution statistics
   */
  calculateStatistics(institution) {
    try {
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
    } catch (err) {
      throw new AppError(`Error calculating statistics: ${err.message}`, 500);
    }
  }
};

module.exports = institutionService;
