const submissionService = require('../services/submissionService');
const assignmentService = require('../services/assignmentService');
const courseService = require('../services/courseService');
const AppError = require('../utils/errors/AppError');
const { validateSubmission, validateGrade } = require('../utils/validators/submissionValidator');
const paramParser = require('../utils/paramParser');

const submissionController = {
  /**
   * Submit an assignment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async submitAssignment(req, res, next) {
    try {
      const { assignmentId } = req.params;
      
      // Validate request body
      const { error } = validateSubmission(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Check if user is a student
      if (!req.user.student) {
        return next(new AppError('Only students can submit assignments', 403));
      }
      
      // Check if the assignment exists and is available
      const assignment = await assignmentService.getAssignmentById(assignmentId);
      
      // Check if student is enrolled in the course
      const course = await courseService.getCourseById(assignment.courseId);
      const isEnrolled = course.students.some(student => student.studentId === req.user.student.studentId);
      
      if (!isEnrolled) {
        return next(new AppError('You are not enrolled in this course', 403));
      }
      
      // Create submission data
      const submissionData = {
        assignmentId: parseInt(assignmentId),
        studentId: req.user.student.studentId,
        content: req.body.content,
        attachments: req.body.attachments
      };
      
      const submission = await submissionService.createSubmission(submissionData);
      
      res.status(201).json({
        status: 'success',
        data: {
          submission
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get a submission by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getSubmissionById(req, res, next) {
    try {
      const { id } = req.params;
      
      const submission = await submissionService.getSubmissionById(id);
      
      // Check if user is authorized to view this submission
      if (req.user.role === 'student') {
        // Students can only view their own submissions
        if (req.user.student.studentId !== submission.studentId) {
          return next(new AppError('You are not authorized to view this submission', 403));
        }
      } else if (req.user.role === 'teacher') {
        // Teachers can only view submissions for their courses
        const course = await courseService.getCourseById(submission.assignment.courseId);
        
        if (req.user.teacher.teacherId !== course.teacherId) {
          return next(new AppError('You are not authorized to view this submission', 403));
        }
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          submission
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get all submissions for an assignment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getSubmissionsByAssignment(req, res, next) {
    try {
      const { assignmentId } = req.params;
      const { graded, studentId } = req.query;
      
      // Check if the assignment exists
      const assignment = await assignmentService.getAssignmentById(assignmentId);
      
      // Check if user is authorized to view submissions for this assignment
      if (req.user.role === 'teacher') {
        const course = await courseService.getCourseById(assignment.courseId);
        
        if (req.user.teacher.teacherId !== course.teacherId) {
          return next(new AppError('You are not authorized to view submissions for this assignment', 403));
        }
      } else if (req.user.role === 'student') {
        // Students can only view their own submissions
        if (!studentId || parseInt(studentId) !== req.user.student.studentId) {
          return next(new AppError('You can only view your own submissions', 403));
        }
      }
      
      const filters = {
        graded: paramParser.parseBoolean(graded),
        studentId: paramParser.parseInteger(studentId)
      };
      
      const submissions = await submissionService.getSubmissionsByAssignment(assignmentId, filters);
      
      res.status(200).json({
        status: 'success',
        results: submissions.length,
        data: {
          submissions
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get all submissions for the current student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getStudentSubmissions(req, res, next) {
    try {
      // Check if user is a student
      if (!req.user.student) {
        return next(new AppError('Only students can access their submissions', 403));
      }
      
      const { courseId, graded } = req.query;
      
      const filters = {
        courseId: paramParser.parseInteger(courseId),
        graded: paramParser.parseBoolean(graded)
      };
      
      const submissions = await submissionService.getSubmissionsByStudent(req.user.student.studentId, filters);
      
      res.status(200).json({
        status: 'success',
        results: submissions.length,
        data: {
          submissions
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Grade a submission
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async gradeSubmission(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateGrade(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Check if user is a teacher or admin
      if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return next(new AppError('Only teachers and admins can grade submissions', 403));
      }
      
      // Check if user is authorized to grade this submission
      const submission = await submissionService.getSubmissionById(id);
      
      if (req.user.role === 'teacher') {
        const course = await courseService.getCourseById(submission.assignment.courseId);
        
        if (req.user.teacher.teacherId !== course.teacherId) {
          return next(new AppError('You are not authorized to grade this submission', 403));
        }
      }
      
      // Create grade data
      const gradeData = {
        grade: req.body.grade,
        feedback: req.body.feedback,
        graderId: req.user.userId,
        rubricScores: req.body.rubricScores
      };
      
      const gradedSubmission = await submissionService.gradeSubmission(id, gradeData);
      
      res.status(200).json({
        status: 'success',
        data: {
          submission: gradedSubmission
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = submissionController;
