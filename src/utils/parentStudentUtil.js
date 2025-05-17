const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');
const AppError = require('./errors/AppError');

const models = initModels(sequelize);
const { ParentStudentLink, Parents, Students } = models;

/**
 * Utility functions for parent-student relationship verification
 */
const parentStudentUtil = {
  /**
   * Check if a parent is linked to a student
   * @param {number} parentId - The parent ID
   * @param {number} studentId - The student ID
   * @param {Object} options - Additional options (e.g., transaction)
   * @returns {Promise<boolean>} - True if parent is linked to student
   */
  async isParentLinkedToStudent(parentId, studentId, options = {}) {
    try {
      // Ensure IDs are numbers
      const pId = typeof parentId === 'object' ? parentId.parentId : Number(parentId);
      const sId = typeof studentId === 'object' ? studentId.studentId : Number(studentId);
      
      if (isNaN(pId) || isNaN(sId)) {
        throw new AppError('Invalid parent or student ID', 400);
      }
      
      const link = await ParentStudentLink.findOne({
        where: {
          parentId: pId,
          studentId: sId
        },
        ...options
      });
      
      return !!link;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error verifying parent-student relationship: ${error.message}`, 500);
    }
  },
  
  /**
   * Get all students linked to a parent
   * @param {number} parentId - The parent ID
   * @returns {Promise<Array>} - Array of student objects
   */
  async getStudentsForParent(parentId) {
    try {
      const pId = Number(parentId);
      
      if (isNaN(pId)) {
        throw new AppError('Invalid parent ID', 400);
      }
      
      const parent = await Parents.findByPk(pId, {
        include: [
          {
            model: Students,
            as: 'studentIdStudents',
            through: { attributes: [] }
          }
        ]
      });
      
      if (!parent) {
        throw new AppError('Parent not found', 404);
      }
      
      return parent.studentIdStudents || [];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error getting students for parent: ${error.message}`, 500);
    }
  },
  
  /**
   * Get all parents linked to a student
   * @param {number} studentId - The student ID
   * @returns {Promise<Array>} - Array of parent objects
   */
  async getParentsForStudent(studentId) {
    try {
      const sId = Number(studentId);
      
      if (isNaN(sId)) {
        throw new AppError('Invalid student ID', 400);
      }
      
      const student = await Students.findByPk(sId, {
        include: [
          {
            model: Parents,
            as: 'parentIdParents',
            through: { attributes: [] }
          }
        ]
      });
      
      if (!student) {
        throw new AppError('Student not found', 404);
      }
      
      return student.parentIdParents || [];
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error getting parents for student: ${error.message}`, 500);
    }
  }
};

module.exports = parentStudentUtil;
