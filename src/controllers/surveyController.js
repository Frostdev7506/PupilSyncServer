const surveyService = require('../services/surveyService');
const AppError = require('../utils/errors/AppError');
const { validateSurvey, validateSurveyResponse } = require('../utils/validators/surveyValidator');
const paramParser = require('../utils/paramParser');

const surveyController = {
  /**
   * Create a new survey
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async createSurvey(req, res, next) {
    try {
      // Validate request body
      const { error } = validateSurvey(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Check if user is a teacher
      if (!req.user.teacher) {
        return next(new AppError('Only teachers can create surveys', 403));
      }
      
      // Set the current teacher as the creator
      const surveyData = {
        ...req.body,
        teacherId: req.user.teacher.teacherId
      };
      
      const survey = await surveyService.createSurvey(surveyData);
      
      res.status(201).json({
        status: 'success',
        data: {
          survey
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get a survey by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getSurveyById(req, res, next) {
    try {
      const { id } = req.params;
      const { includeResponses } = req.query;
      
      // Parse includeResponses parameter
      const showResponses = paramParser.parseBoolean(includeResponses, false);
      
      // Only teachers and admins can see responses
      if (showResponses && req.user.role !== 'admin' && !req.user.teacher) {
        return next(new AppError('You are not authorized to view survey responses', 403));
      }
      
      const survey = await surveyService.getSurveyById(id, showResponses);
      
      res.status(200).json({
        status: 'success',
        data: {
          survey
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get all surveys for the current teacher
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getTeacherSurveys(req, res, next) {
    try {
      // Check if user is a teacher
      if (!req.user.teacher) {
        return next(new AppError('Only teachers can access their surveys', 403));
      }
      
      const { courseId, classId, isPublished } = req.query;
      
      const filters = {
        courseId: paramParser.parseInteger(courseId),
        classId: paramParser.parseInteger(classId),
        isPublished: paramParser.parseBoolean(isPublished)
      };
      
      const surveys = await surveyService.getSurveysByTeacher(req.user.teacher.teacherId, filters);
      
      res.status(200).json({
        status: 'success',
        results: surveys.length,
        data: {
          surveys
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Get active surveys for a course or class
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getActiveSurveys(req, res, next) {
    try {
      const { courseId, classId } = req.query;
      
      if (!courseId && !classId) {
        return next(new AppError('Either courseId or classId is required', 400));
      }
      
      const filters = {
        courseId: paramParser.parseInteger(courseId),
        classId: paramParser.parseInteger(classId)
      };
      
      // If user is a student, add studentId to filter out completed surveys
      if (req.user.student) {
        filters.studentId = req.user.student.studentId;
      }
      
      const surveys = await surveyService.getActiveSurveys(filters);
      
      res.status(200).json({
        status: 'success',
        results: surveys.length,
        data: {
          surveys
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Update a survey
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async updateSurvey(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateSurvey(req.body, true);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Get the survey to check authorization
      const survey = await surveyService.getSurveyById(id);
      
      // Check if user is authorized to update this survey
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== survey.teacherId)) {
        return next(new AppError('You are not authorized to update this survey', 403));
      }
      
      const updatedSurvey = await surveyService.updateSurvey(id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: {
          survey: updatedSurvey
        }
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Delete a survey
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async deleteSurvey(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get the survey to check authorization
      const survey = await surveyService.getSurveyById(id);
      
      // Check if user is authorized to delete this survey
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== survey.teacherId)) {
        return next(new AppError('You are not authorized to delete this survey', 403));
      }
      
      await surveyService.deleteSurvey(id);
      
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      next(error);
    }
  },
  
  /**
   * Submit a response to a survey
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async submitSurveyResponse(req, res, next) {
    try {
      const { id } = req.params;
      
      // Validate request body
      const { error } = validateSurveyResponse(req.body);
      if (error) {
        return next(new AppError(error.details[0].message, 400));
      }
      
      // Check if user is a student
      if (!req.user.student) {
        return next(new AppError('Only students can respond to surveys', 403));
      }
      
      const response = await surveyService.submitSurveyResponse(
        parseInt(id),
        req.user.student.studentId,
        req.body.questionResponses
      );
      
      res.status(201).json({
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
   * Get survey results
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  async getSurveyResults(req, res, next) {
    try {
      const { id } = req.params;
      
      // Get the survey to check authorization
      const survey = await surveyService.getSurveyById(id);
      
      // Only teachers who created the survey and admins can see results
      if (req.user.role !== 'admin' && 
          (!req.user.teacher || req.user.teacher.teacherId !== survey.teacherId)) {
        return next(new AppError('You are not authorized to view survey results', 403));
      }
      
      const results = await surveyService.getSurveyResults(id);
      
      res.status(200).json({
        status: 'success',
        data: {
          results
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = surveyController;
