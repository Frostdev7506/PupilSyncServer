const examService = require('../services/examService');
const AppError = require('../utils/errors/AppError');

const examController = {
  /**
   * Create a new exam
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createExam(req, res, next) {
    try {
      const examData = {
        ...req.body,
        teacherId: req.user.teacher.teacherId // Set the current teacher as the creator
      };
      
      const exam = await examService.createExam(examData);
      
      res.status(201).json({
        status: 'success',
        data: {
          exam
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get exam by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getExamById(req, res, next) {
    try {
      const { id } = req.params;
      
      const exam = await examService.getExamById(id);
      
      res.status(200).json({
        status: 'success',
        data: {
          exam
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all exams
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getAllExams(req, res, next) {
    try {
      const { teacherId, courseId, classId, isPublished } = req.query;
      
      const options = {
        teacherId: teacherId ? parseInt(teacherId) : undefined,
        courseId: courseId ? parseInt(courseId) : undefined,
        classId: classId ? parseInt(classId) : undefined,
        isPublished: isPublished !== undefined ? isPublished === 'true' : undefined
      };
      
      const exams = await examService.getAllExams(options);
      
      res.status(200).json({
        status: 'success',
        results: exams.length,
        data: {
          exams
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update an exam
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateExam(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const exam = await examService.updateExam(id, updateData);
      
      res.status(200).json({
        status: 'success',
        data: {
          exam
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete an exam
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteExam(req, res, next) {
    try {
      const { id } = req.params;
      
      await examService.deleteExam(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Add a question to an exam
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async addQuestionToExam(req, res, next) {
    try {
      const { examId } = req.params;
      const questionData = req.body;
      
      const question = await examService.addQuestionToExam(examId, questionData);
      
      res.status(201).json({
        status: 'success',
        data: {
          question
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a question
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateQuestion(req, res, next) {
    try {
      const { questionId } = req.params;
      const updateData = req.body;
      
      const question = await examService.updateQuestion(questionId, updateData);
      
      res.status(200).json({
        status: 'success',
        data: {
          question
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a question
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteQuestion(req, res, next) {
    try {
      const { questionId } = req.params;
      
      await examService.deleteQuestion(questionId);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Assign an exam to students
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async assignExamToStudents(req, res, next) {
    try {
      const { examId } = req.params;
      const { studentIds, options } = req.body;
      
      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return next(new AppError('Please provide an array of student IDs', 400));
      }
      
      const assignments = await examService.assignExamToStudents(
        examId, 
        studentIds, 
        req.user.userId, 
        options
      );
      
      res.status(201).json({
        status: 'success',
        results: assignments.length,
        data: {
          assignments
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get exams assigned to a student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getStudentAssignedExams(req, res, next) {
    try {
      const { studentId } = req.params;
      const { status, upcoming, past, current } = req.query;
      
      const options = {
        status,
        upcoming: upcoming === 'true',
        past: past === 'true',
        current: current === 'true'
      };
      
      const assignments = await examService.getStudentAssignedExams(studentId, options);
      
      res.status(200).json({
        status: 'success',
        results: assignments.length,
        data: {
          assignments
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Start an exam attempt
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async startExamAttempt(req, res, next) {
    try {
      const { assignmentId } = req.params;
      const studentId = req.user.student.studentId;
      
      const metadata = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      };
      
      const attempt = await examService.startExamAttempt(assignmentId, studentId, metadata);
      
      res.status(201).json({
        status: 'success',
        data: {
          attempt
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Submit a response for an exam question
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async submitExamResponse(req, res, next) {
    try {
      const { attemptId, questionId } = req.params;
      const responseData = req.body;
      
      const response = await examService.submitExamResponse(attemptId, questionId, responseData);
      
      res.status(200).json({
        status: 'success',
        data: {
          response
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Complete an exam attempt
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async completeExamAttempt(req, res, next) {
    try {
      const { attemptId } = req.params;
      
      const attempt = await examService.completeExamAttempt(attemptId);
      
      res.status(200).json({
        status: 'success',
        data: {
          attempt
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = examController;
