const { Op, Sequelize } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');

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
    
    try {
      const institution = await Institutions.findByPk(institutionId, {
        include: [
          {
            association: 'teachers',
            through: 'TeacherInstitutions',
            include: [{
              model: Users,
              as: 'user',
              attributes: ['userId', 'email', 'firstName', 'lastName', 'role']
            }],
            attributes: []
          },
          {
            association: 'students',
            include: [{
              model: Users,
              as: 'user',
              attributes: ['userId', 'email', 'firstName', 'lastName', 'role']
            }],
            attributes: []
          },
          {
            model: Users,
            as: 'user',
            attributes: ['userId', 'email', 'firstName', 'lastName', 'role']
          }
        ]
      });

      if (!institution) {
        throw new AppError(`Institution with ID ${institutionId} not found`, 404);
      }

      return institution;
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(`Error fetching institution: ${err.message}`, err.status || 500);
    }
  },

  /**
   * Update institution details
   */
  async updateInstitution(institutionId, updateData) {
    const transaction = await sequelize.transaction();

    try {
      const institution = await Institutions.findByPk(institutionId);
      if (!institution) {
        throw new AppError('Institution not found', 404);
      }

      await institution.update(updateData, { transaction });
      await transaction.commit();
      return institution;
    } catch (err) {
      await transaction.rollback();
      throw new AppError(`Error updating institution: ${err.message}`, err.status || 500);
    }
  },

  /**
   * Add teacher to institution
   */
  async addTeacherToInstitution(institutionId, teacherId) {
    const transaction = await sequelize.transaction();

    try {
      const institution = await Institutions.findByPk(institutionId);
      if (!institution) {
        throw new AppError('Institution not found', 404);
      }

      const teacher = await Teachers.findByPk(teacherId);
      if (!teacher) {
        throw new AppError('Teacher not found', 404);
      }

      await institution.addTeacher(parseInt(teacherId), { transaction });
      await transaction.commit();
      return { message: 'Teacher added successfully' };
    } catch (err) {
      await transaction.rollback();
      throw new AppError(`Error adding teacher: ${err.message}`, err.status || 500);
    }
  },

  /**
   * Remove teacher from institution
   */
  async removeTeacherFromInstitution(institutionId, teacherId) {
    const transaction = await sequelize.transaction();

    try {
      const institution = await Institutions.findByPk(institutionId);
      if (!institution) {
        throw new AppError('Institution not found', 404);
      }

      await institution.removeTeacher(parseInt(teacherId), { transaction });
      await transaction.commit();
      return { message: 'Teacher removed successfully' };
    } catch (err) {
      await transaction.rollback();
      throw new AppError(`Error removing teacher: ${err.message}`, err.status || 500);
    }
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