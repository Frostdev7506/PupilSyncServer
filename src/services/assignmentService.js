const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');
const modelAssociationUtil = require('../utils/modelAssociationUtil');

const models = initModels(sequelize);
const { 
  Assignments, 
  Submissions, 
  Courses, 
  Lessons, 
  Teachers, 
  Students, 
  Users,
  AssignmentRubrics,
  RubricCriteria,
  RubricScores,
  SubmissionAttachments
} = models;

// Verify required associations
const requiredAssociations = ['course', 'lesson', 'submissions'];
const associationVerification = modelAssociationUtil.verifyRequiredAssociations('Assignments', requiredAssociations);

if (!associationVerification.valid) {
  console.error(`Missing required associations for Assignments: ${associationVerification.missing.join(', ')}`);
}

const assignmentService = {
  /**
   * Create a new assignment
   * @param {Object} assignmentData - The assignment data
   * @returns {Promise<Object>} - The created assignment
   */
  async createAssignment(assignmentData) {
    const transaction = await sequelize.transaction();
    
    try {
      // Create the assignment
      const assignment = await Assignments.create({
        courseId: assignmentData.courseId,
        lessonId: assignmentData.lessonId,
        title: assignmentData.title,
        description: assignmentData.description,
        instructions: assignmentData.instructions,
        dueDate: assignmentData.dueDate,
        availableFrom: assignmentData.availableFrom,
        availableUntil: assignmentData.availableUntil,
        maxPoints: assignmentData.maxPoints,
        submissionType: assignmentData.submissionType || 'file',
        allowLateSubmissions: assignmentData.allowLateSubmissions || false,
        latePenalty: assignmentData.latePenalty,
        visibleToStudents: assignmentData.visibleToStudents || false,
        attachments: assignmentData.attachments
      }, { transaction });
      
      // If rubric is provided, create it
      if (assignmentData.rubric) {
        const rubric = await AssignmentRubrics.create({
          assignmentId: assignment.assignmentId,
          title: assignmentData.rubric.title || `Rubric for ${assignment.title}`,
          description: assignmentData.rubric.description,
          totalPoints: assignmentData.rubric.totalPoints || assignmentData.maxPoints
        }, { transaction });
        
        // Create rubric criteria
        if (assignmentData.rubric.criteria && Array.isArray(assignmentData.rubric.criteria)) {
          for (const [index, criterionData] of assignmentData.rubric.criteria.entries()) {
            await RubricCriteria.create({
              rubricId: rubric.rubricId,
              title: criterionData.title,
              description: criterionData.description,
              maxPoints: criterionData.maxPoints,
              orderNumber: index + 1
            }, { transaction });
          }
        }
      }
      
      await transaction.commit();
      
      // Return the assignment with associations
      return this.getAssignmentById(assignment.assignmentId);
    } catch (error) {
      await transaction.rollback();
      throw new AppError(`Error creating assignment: ${error.message}`, 500);
    }
  },
  
  /**
   * Get an assignment by ID
   * @param {number} assignmentId - The assignment ID
   * @returns {Promise<Object>} - The assignment
   */
  async getAssignmentById(assignmentId) {
    try {
      const assignment = await Assignments.findByPk(assignmentId, {
        include: [
          {
            model: Courses,
            as: 'course'
          },
          {
            model: Lessons,
            as: 'lesson'
          },
          {
            model: AssignmentRubrics,
            as: 'rubric',
            include: [
              {
                model: RubricCriteria,
                as: 'criteria',
                order: [['orderNumber', 'ASC']]
              }
            ]
          }
        ]
      });
      
      if (!assignment) {
        throw new AppError('Assignment not found', 404);
      }
      
      return assignment;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving assignment: ${error.message}`, 500);
    }
  },
  
  /**
   * Get all assignments for a course
   * @param {number} courseId - The course ID
   * @param {Object} filters - The filters to apply
   * @returns {Promise<Array>} - The assignments
   */
  async getAssignmentsByCourse(courseId, filters = {}) {
    try {
      const { lessonId, visibleToStudents } = filters;
      
      // Build the where clause
      const where = { courseId };
      
      if (lessonId) {
        where.lessonId = lessonId;
      }
      
      if (visibleToStudents !== undefined) {
        where.visibleToStudents = visibleToStudents;
      }
      
      const assignments = await Assignments.findAll({
        where,
        include: [
          {
            model: Lessons,
            as: 'lesson'
          }
        ],
        order: [['dueDate', 'ASC']]
      });
      
      return assignments;
    } catch (error) {
      throw new AppError(`Error retrieving assignments: ${error.message}`, 500);
    }
  },
  
  /**
   * Get all assignments for a student
   * @param {number} studentId - The student ID
   * @param {Object} filters - The filters to apply
   * @returns {Promise<Array>} - The assignments with submission status
   */
  async getAssignmentsForStudent(studentId, filters = {}) {
    try {
      const { courseId, status, dueAfter, dueBefore } = filters;
      
      // Get the student's courses
      const student = await Students.findByPk(studentId, {
        include: [
          {
            model: Courses,
            as: 'courses',
            through: { attributes: [] }
          }
        ]
      });
      
      if (!student) {
        throw new AppError('Student not found', 404);
      }
      
      // Get course IDs the student is enrolled in
      let courseIds = student.courses.map(course => course.courseId);
      
      // If courseId filter is provided, check if student is enrolled
      if (courseId) {
        if (!courseIds.includes(parseInt(courseId))) {
          throw new AppError('Student is not enrolled in this course', 403);
        }
        courseIds = [parseInt(courseId)];
      }
      
      // Build the where clause for assignments
      const assignmentWhere = {
        courseId: { [Op.in]: courseIds },
        visibleToStudents: true
      };
      
      // Add date filters if provided
      if (dueAfter) {
        assignmentWhere.dueDate = { ...(assignmentWhere.dueDate || {}), [Op.gte]: new Date(dueAfter) };
      }
      
      if (dueBefore) {
        assignmentWhere.dueDate = { ...(assignmentWhere.dueDate || {}), [Op.lte]: new Date(dueBefore) };
      }
      
      // Get all visible assignments for the student's courses
      const assignments = await Assignments.findAll({
        where: assignmentWhere,
        include: [
          {
            model: Courses,
            as: 'course'
          },
          {
            model: Lessons,
            as: 'lesson'
          }
        ],
        order: [['dueDate', 'ASC']]
      });
      
      // Get all submissions for these assignments
      const submissions = await Submissions.findAll({
        where: {
          assignmentId: { [Op.in]: assignments.map(a => a.assignmentId) },
          studentId
        }
      });
      
      // Create a map of assignment ID to submission
      const submissionMap = {};
      submissions.forEach(submission => {
        submissionMap[submission.assignmentId] = submission;
      });
      
      // Add submission status to each assignment
      const assignmentsWithStatus = assignments.map(assignment => {
        const submission = submissionMap[assignment.assignmentId];
        const now = new Date();
        const dueDate = new Date(assignment.dueDate);
        
        let status = 'not_submitted';
        if (submission) {
          if (submission.grade !== null) {
            status = 'graded';
          } else {
            status = 'submitted';
          }
        } else if (dueDate < now) {
          status = 'overdue';
        } else if (assignment.availableFrom && new Date(assignment.availableFrom) > now) {
          status = 'upcoming';
        } else {
          status = 'open';
        }
        
        return {
          ...assignment.toJSON(),
          submissionStatus: status,
          submission: submission || null
        };
      });
      
      // Filter by status if provided
      if (status) {
        return assignmentsWithStatus.filter(a => a.submissionStatus === status);
      }
      
      return assignmentsWithStatus;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving assignments for student: ${error.message}`, 500);
    }
  },
  
  /**
   * Update an assignment
   * @param {number} assignmentId - The assignment ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated assignment
   */
  async updateAssignment(assignmentId, updateData) {
    const transaction = await sequelize.transaction();
    
    try {
      const assignment = await Assignments.findByPk(assignmentId, { transaction });
      
      if (!assignment) {
        await transaction.rollback();
        throw new AppError('Assignment not found', 404);
      }
      
      // Update the assignment
      await assignment.update(updateData, { transaction });
      
      // If rubric is provided, update it
      if (updateData.rubric) {
        // Find existing rubric
        let rubric = await AssignmentRubrics.findOne({
          where: { assignmentId },
          transaction
        });
        
        if (rubric) {
          // Update existing rubric
          await rubric.update({
            title: updateData.rubric.title || rubric.title,
            description: updateData.rubric.description !== undefined ? updateData.rubric.description : rubric.description,
            totalPoints: updateData.rubric.totalPoints || rubric.totalPoints
          }, { transaction });
        } else {
          // Create new rubric
          rubric = await AssignmentRubrics.create({
            assignmentId,
            title: updateData.rubric.title || `Rubric for ${assignment.title}`,
            description: updateData.rubric.description,
            totalPoints: updateData.rubric.totalPoints || assignment.maxPoints
          }, { transaction });
        }
        
        // If criteria are provided, update them
        if (updateData.rubric.criteria && Array.isArray(updateData.rubric.criteria)) {
          // Delete existing criteria
          await RubricCriteria.destroy({
            where: { rubricId: rubric.rubricId },
            transaction
          });
          
          // Create new criteria
          for (const [index, criterionData] of updateData.rubric.criteria.entries()) {
            await RubricCriteria.create({
              rubricId: rubric.rubricId,
              title: criterionData.title,
              description: criterionData.description,
              maxPoints: criterionData.maxPoints,
              orderNumber: index + 1
            }, { transaction });
          }
        }
      }
      
      await transaction.commit();
      
      // Return the updated assignment with associations
      return this.getAssignmentById(assignmentId);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error updating assignment: ${error.message}`, 500);
    }
  },
  
  /**
   * Delete an assignment
   * @param {number} assignmentId - The assignment ID
   * @returns {Promise<void>}
   */
  async deleteAssignment(assignmentId) {
    const transaction = await sequelize.transaction();
    
    try {
      const assignment = await Assignments.findByPk(assignmentId, { transaction });
      
      if (!assignment) {
        await transaction.rollback();
        throw new AppError('Assignment not found', 404);
      }
      
      // Check if there are any submissions
      const submissionCount = await Submissions.count({
        where: { assignmentId },
        transaction
      });
      
      if (submissionCount > 0) {
        await transaction.rollback();
        throw new AppError('Cannot delete assignment with existing submissions', 400);
      }
      
      // Find and delete rubric and criteria
      const rubric = await AssignmentRubrics.findOne({
        where: { assignmentId },
        transaction
      });
      
      if (rubric) {
        await RubricCriteria.destroy({
          where: { rubricId: rubric.rubricId },
          transaction
        });
        
        await rubric.destroy({ transaction });
      }
      
      // Delete the assignment
      await assignment.destroy({ transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error deleting assignment: ${error.message}`, 500);
    }
  }
};

module.exports = assignmentService;
