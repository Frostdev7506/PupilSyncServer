const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');

const models = initModels(sequelize);
const { 
  Submissions, 
  SubmissionAttachments,
  Assignments, 
  Students, 
  Teachers,
  Users,
  AssignmentRubrics,
  RubricCriteria,
  RubricScores
} = models;

const submissionService = {
  /**
   * Create a new submission
   * @param {Object} submissionData - The submission data
   * @returns {Promise<Object>} - The created submission
   */
  async createSubmission(submissionData) {
    const transaction = await sequelize.transaction();
    
    try {
      // Check if the assignment exists
      const assignment = await Assignments.findByPk(submissionData.assignmentId, { transaction });
      
      if (!assignment) {
        await transaction.rollback();
        throw new AppError('Assignment not found', 404);
      }
      
      // Check if the student exists
      const student = await Students.findByPk(submissionData.studentId, { transaction });
      
      if (!student) {
        await transaction.rollback();
        throw new AppError('Student not found', 404);
      }
      
      // Check if the assignment is visible to students
      if (!assignment.visibleToStudents) {
        await transaction.rollback();
        throw new AppError('Assignment is not available for submission', 403);
      }
      
      // Check if the assignment is within the submission window
      const now = new Date();
      
      if (assignment.availableFrom && new Date(assignment.availableFrom) > now) {
        await transaction.rollback();
        throw new AppError('Assignment is not yet available for submission', 403);
      }
      
      if (assignment.availableUntil && new Date(assignment.availableUntil) < now) {
        await transaction.rollback();
        throw new AppError('Assignment submission period has ended', 403);
      }
      
      // Check if the student has already submitted
      const existingSubmission = await Submissions.findOne({
        where: {
          assignmentId: submissionData.assignmentId,
          studentId: submissionData.studentId
        },
        transaction
      });
      
      if (existingSubmission) {
        // If submission exists, update it
        await existingSubmission.update({
          content: submissionData.content,
          submittedAt: now
        }, { transaction });
        
        // Delete existing attachments if new ones are provided
        if (submissionData.attachments && Array.isArray(submissionData.attachments)) {
          await SubmissionAttachments.destroy({
            where: { submissionId: existingSubmission.submissionId },
            transaction
          });
          
          // Create new attachments
          for (const attachment of submissionData.attachments) {
            await SubmissionAttachments.create({
              submissionId: existingSubmission.submissionId,
              fileName: attachment.fileName,
              fileUrl: attachment.fileUrl,
              fileType: attachment.fileType,
              fileSize: attachment.fileSize
            }, { transaction });
          }
        }
        
        await transaction.commit();
        
        return this.getSubmissionById(existingSubmission.submissionId);
      } else {
        // Create new submission
        const submission = await Submissions.create({
          assignmentId: submissionData.assignmentId,
          studentId: submissionData.studentId,
          content: submissionData.content,
          submittedAt: now
        }, { transaction });
        
        // Create attachments if provided
        if (submissionData.attachments && Array.isArray(submissionData.attachments)) {
          for (const attachment of submissionData.attachments) {
            await SubmissionAttachments.create({
              submissionId: submission.submissionId,
              fileName: attachment.fileName,
              fileUrl: attachment.fileUrl,
              fileType: attachment.fileType,
              fileSize: attachment.fileSize
            }, { transaction });
          }
        }
        
        await transaction.commit();
        
        return this.getSubmissionById(submission.submissionId);
      }
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error creating submission: ${error.message}`, 500);
    }
  },
  
  /**
   * Get a submission by ID
   * @param {number} submissionId - The submission ID
   * @returns {Promise<Object>} - The submission
   */
  async getSubmissionById(submissionId) {
    try {
      const submission = await Submissions.findByPk(submissionId, {
        include: [
          {
            model: Assignments,
            as: 'assignment',
            include: [
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
          },
          {
            model: Students,
            as: 'student',
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'email']
              }
            ]
          },
          {
            model: Users,
            as: 'grader',
            attributes: ['userId', 'firstName', 'lastName', 'email']
          },
          {
            model: SubmissionAttachments,
            as: 'attachments'
          },
          {
            model: RubricScores,
            as: 'rubricScores',
            include: [
              {
                model: RubricCriteria,
                as: 'criterion'
              }
            ]
          }
        ]
      });
      
      if (!submission) {
        throw new AppError('Submission not found', 404);
      }
      
      return submission;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving submission: ${error.message}`, 500);
    }
  },
  
  /**
   * Get all submissions for an assignment
   * @param {number} assignmentId - The assignment ID
   * @param {Object} filters - The filters to apply
   * @returns {Promise<Array>} - The submissions
   */
  async getSubmissionsByAssignment(assignmentId, filters = {}) {
    try {
      const { graded, studentId } = filters;
      
      // Build the where clause
      const where = { assignmentId };
      
      if (graded !== undefined) {
        if (graded) {
          where.grade = { [Op.ne]: null };
        } else {
          where.grade = null;
        }
      }
      
      if (studentId) {
        where.studentId = studentId;
      }
      
      const submissions = await Submissions.findAll({
        where,
        include: [
          {
            model: Students,
            as: 'student',
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'email']
              }
            ]
          },
          {
            model: Users,
            as: 'grader',
            attributes: ['userId', 'firstName', 'lastName', 'email']
          },
          {
            model: SubmissionAttachments,
            as: 'attachments'
          }
        ],
        order: [['submittedAt', 'DESC']]
      });
      
      return submissions;
    } catch (error) {
      throw new AppError(`Error retrieving submissions: ${error.message}`, 500);
    }
  },
  
  /**
   * Get all submissions for a student
   * @param {number} studentId - The student ID
   * @param {Object} filters - The filters to apply
   * @returns {Promise<Array>} - The submissions
   */
  async getSubmissionsByStudent(studentId, filters = {}) {
    try {
      const { courseId, graded } = filters;
      
      // Build the where clause
      const where = { studentId };
      
      if (graded !== undefined) {
        if (graded) {
          where.grade = { [Op.ne]: null };
        } else {
          where.grade = null;
        }
      }
      
      // Include assignments
      const include = [
        {
          model: Assignments,
          as: 'assignment',
          include: []
        },
        {
          model: Users,
          as: 'grader',
          attributes: ['userId', 'firstName', 'lastName', 'email']
        },
        {
          model: SubmissionAttachments,
          as: 'attachments'
        }
      ];
      
      // If courseId is provided, filter assignments by course
      if (courseId) {
        include[0].where = { courseId };
      }
      
      const submissions = await Submissions.findAll({
        where,
        include,
        order: [['submittedAt', 'DESC']]
      });
      
      return submissions;
    } catch (error) {
      throw new AppError(`Error retrieving submissions: ${error.message}`, 500);
    }
  },
  
  /**
   * Grade a submission
   * @param {number} submissionId - The submission ID
   * @param {Object} gradeData - The grade data
   * @returns {Promise<Object>} - The updated submission
   */
  async gradeSubmission(submissionId, gradeData) {
    const transaction = await sequelize.transaction();
    
    try {
      const submission = await Submissions.findByPk(submissionId, { transaction });
      
      if (!submission) {
        await transaction.rollback();
        throw new AppError('Submission not found', 404);
      }
      
      // Update the submission with grade data
      await submission.update({
        grade: gradeData.grade,
        feedback: gradeData.feedback,
        gradedAt: new Date(),
        graderId: gradeData.graderId
      }, { transaction });
      
      // If rubric scores are provided, save them
      if (gradeData.rubricScores && Array.isArray(gradeData.rubricScores)) {
        // Delete existing scores
        await RubricScores.destroy({
          where: { submissionId },
          transaction
        });
        
        // Create new scores
        for (const score of gradeData.rubricScores) {
          await RubricScores.create({
            submissionId,
            criterionId: score.criterionId,
            score: score.score,
            comment: score.comment
          }, { transaction });
        }
      }
      
      await transaction.commit();
      
      return this.getSubmissionById(submissionId);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error grading submission: ${error.message}`, 500);
    }
  }
};

module.exports = submissionService;
