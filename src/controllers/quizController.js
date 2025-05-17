const quizService = require('../services/quizService');
const courseService = require('../services/courseService');
const AppError = require('../utils/errors/AppError');
const { validateQuiz, validateQuizQuestion } = require('../utils/validators/quizValidator');
const paramParser = require('../utils/paramParser');

const quizController = {
  /**
   * Create a new quiz
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createQuiz(req, res, next) {
    try {
      // Validate request body
      const { error } = validateQuiz(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Check if user is authorized to create a quiz for this course
      const course = await courseService.getCourseById(req.body.courseId);
      
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to create quizzes for this course', 403));
      }
      
      const quiz = await quizService.createQuiz(req.body);
      
      res.status(201).json({
        status: 'success',
        data: {
          quiz
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get a quiz by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getQuizById(req, res, next) {
    try {
      const { id } = req.params;
      const { includeAnswers } = req.query;
      
      // Parse includeAnswers parameter
      const showAnswers = paramParser.parseBoolean(includeAnswers, true);
      
      const quiz = await quizService.getQuizById(id, showAnswers);
      
      res.status(200).json({
        status: 'success',
        data: {
          quiz
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get all quizzes for a course
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getQuizzesByCourse(req, res, next) {
    try {
      const { courseId } = req.params;
      const { isPublished, lessonId } = req.query;
      
      const filters = {
        isPublished: paramParser.parseBoolean(isPublished),
        lessonId: paramParser.parseInteger(lessonId)
      };
      
      const quizzes = await quizService.getQuizzesByCourse(courseId, filters);
      
      res.status(200).json({
        status: 'success',
        results: quizzes.length,
        data: {
          quizzes
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Update a quiz
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateQuiz(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateQuiz(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Get the quiz to check authorization
      const quiz = await quizService.getQuizById(id);
      const course = await courseService.getCourseById(quiz.courseId);
      
      // Check if user is authorized to update this quiz
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to update this quiz', 403));
      }
      
      const updatedQuiz = await quizService.updateQuiz(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          quiz: updatedQuiz
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Delete a quiz
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteQuiz(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get the quiz to check authorization
      const quiz = await quizService.getQuizById(id);
      const course = await courseService.getCourseById(quiz.courseId);
      
      // Check if user is authorized to delete this quiz
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to delete this quiz', 403));
      }
      
      await quizService.deleteQuiz(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Add a question to a quiz
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async addQuestionToQuiz(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateQuizQuestion(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Get the quiz to check authorization
      const quiz = await quizService.getQuizById(id);
      const course = await courseService.getCourseById(quiz.courseId);
      
      // Check if user is authorized to add questions to this quiz
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to add questions to this quiz', 403));
      }
      
      const question = await quizService.addQuestionToQuiz(id, req.body);
      
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
   * Get a question by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getQuestionById(req, res, next) {
    try {
      const { questionId } = req.params;
      
      const question = await quizService.getQuestionById(questionId);
      
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
   * Update a question
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateQuestion(req, res, next) {
    try {
      const { questionId } = req.params;
      
      // Validate request body
      const { error } = validateQuizQuestion(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Get the question to check authorization
      const question = await quizService.getQuestionById(questionId);
      const quiz = await quizService.getQuizById(question.quizId);
      const course = await courseService.getCourseById(quiz.courseId);
      
      // Check if user is authorized to update this question
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to update this question', 403));
      }
      
      const updatedQuestion = await quizService.updateQuestion(questionId, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          question: updatedQuestion
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
      
      // Get the question to check authorization
      const question = await quizService.getQuestionById(questionId);
      const quiz = await quizService.getQuizById(question.quizId);
      const course = await courseService.getCourseById(quiz.courseId);
      
      // Check if user is authorized to delete this question
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== course.teacherId)) {
        return next(new AppError('You are not authorized to delete this question', 403));
      }
      
      await quizService.deleteQuestion(questionId);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = quizController;
