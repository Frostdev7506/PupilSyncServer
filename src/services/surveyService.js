const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');

const models = initModels(sequelize);
const { 
  Surveys, 
  SurveyQuestions, 
  SurveyOptions,
  SurveyResponses,
  SurveyQuestionResponses,
  Courses,
  Classes,
  Teachers,
  Students,
  Users
} = models;

const surveyService = {
  /**
   * Create a new survey
   * @param {Object} surveyData - The survey data
   * @returns {Promise<Object>} - The created survey
   */
  async createSurvey(surveyData) {
    const transaction = await sequelize.transaction();
    
    try {
      // Create the survey
      const survey = await Surveys.create({
        title: surveyData.title,
        description: surveyData.description,
        courseId: surveyData.courseId,
        classId: surveyData.classId,
        teacherId: surveyData.teacherId,
        isAnonymous: surveyData.isAnonymous || false,
        isPublished: surveyData.isPublished || false,
        startDate: surveyData.startDate,
        endDate: surveyData.endDate,
        instructions: surveyData.instructions
      }, { transaction });
      
      // If questions are provided, create them
      if (surveyData.questions && Array.isArray(surveyData.questions)) {
        for (const [index, questionData] of surveyData.questions.entries()) {
          const question = await SurveyQuestions.create({
            surveyId: survey.surveyId,
            questionText: questionData.questionText,
            questionType: questionData.questionType,
            isRequired: questionData.isRequired || false,
            orderNumber: index + 1
          }, { transaction });
          
          // If options are provided for the question, create them
          if (questionData.options && Array.isArray(questionData.options)) {
            for (const [optIndex, optionData] of questionData.options.entries()) {
              await SurveyOptions.create({
                questionId: question.questionId,
                text: optionData.text,
                orderNumber: optIndex + 1
              }, { transaction });
            }
          }
        }
      }
      
      await transaction.commit();
      
      // Return the survey with associations
      return this.getSurveyById(survey.surveyId);
    } catch (error) {
      await transaction.rollback();
      throw new AppError(`Error creating survey: ${error.message}`, 500);
    }
  },
  
  /**
   * Get a survey by ID
   * @param {number} surveyId - The survey ID
   * @param {boolean} includeResponses - Whether to include responses
   * @returns {Promise<Object>} - The survey
   */
  async getSurveyById(surveyId, includeResponses = false) {
    try {
      const includes = [
        {
          model: SurveyQuestions,
          as: 'questions',
          include: [
            {
              model: SurveyOptions,
              as: 'options',
              order: [['orderNumber', 'ASC']]
            }
          ],
          order: [['orderNumber', 'ASC']]
        },
        {
          model: Teachers,
          as: 'teacher',
          include: [
            {
              model: Users,
              as: 'user',
              attributes: ['userId', 'firstName', 'lastName']
            }
          ]
        }
      ];
      
      if (includeResponses) {
        includes.push({
          model: SurveyResponses,
          as: 'responses',
          include: [
            {
              model: Students,
              as: 'student',
              include: [
                {
                  model: Users,
                  as: 'user',
                  attributes: ['userId', 'firstName', 'lastName']
                }
              ]
            },
            {
              model: SurveyQuestionResponses,
              as: 'questionResponses',
              include: [
                {
                  model: SurveyQuestions,
                  as: 'question'
                },
                {
                  model: SurveyOptions,
                  as: 'option'
                }
              ]
            }
          ]
        });
      }
      
      const survey = await Surveys.findByPk(surveyId, {
        include: includes
      });
      
      if (!survey) {
        throw new AppError('Survey not found', 404);
      }
      
      return survey;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving survey: ${error.message}`, 500);
    }
  },
  
  /**
   * Get all surveys for a teacher
   * @param {number} teacherId - The teacher ID
   * @param {Object} filters - The filters to apply
   * @returns {Promise<Array>} - The surveys
   */
  async getSurveysByTeacher(teacherId, filters = {}) {
    try {
      const { courseId, classId, isPublished } = filters;
      
      // Build the where clause
      const where = { teacherId };
      
      if (courseId) {
        where.courseId = courseId;
      }
      
      if (classId) {
        where.classId = classId;
      }
      
      if (isPublished !== undefined) {
        where.isPublished = isPublished;
      }
      
      const surveys = await Surveys.findAll({
        where,
        include: [
          {
            model: Courses,
            as: 'course'
          },
          {
            model: Classes,
            as: 'class'
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      return surveys;
    } catch (error) {
      throw new AppError(`Error retrieving surveys: ${error.message}`, 500);
    }
  },
  
  /**
   * Get all active surveys for a course or class
   * @param {Object} filters - The filters to apply
   * @returns {Promise<Array>} - The surveys
   */
  async getActiveSurveys(filters = {}) {
    try {
      const { courseId, classId, studentId } = filters;
      
      // Build the where clause
      const where = { 
        isPublished: true,
        [Op.or]: []
      };
      
      if (courseId) {
        where[Op.or].push({ courseId });
      }
      
      if (classId) {
        where[Op.or].push({ classId });
      }
      
      // If neither courseId nor classId is provided, return an empty array
      if (where[Op.or].length === 0) {
        return [];
      }
      
      // Add date range check
      const now = new Date();
      where[Op.and] = [
        {
          [Op.or]: [
            { startDate: null },
            { startDate: { [Op.lte]: now } }
          ]
        },
        {
          [Op.or]: [
            { endDate: null },
            { endDate: { [Op.gte]: now } }
          ]
        }
      ];
      
      const surveys = await Surveys.findAll({
        where,
        include: [
          {
            model: Courses,
            as: 'course'
          },
          {
            model: Classes,
            as: 'class'
          },
          {
            model: SurveyQuestions,
            as: 'questions',
            include: [
              {
                model: SurveyOptions,
                as: 'options',
                order: [['orderNumber', 'ASC']]
              }
            ],
            order: [['orderNumber', 'ASC']]
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      // If studentId is provided, filter out surveys that the student has already completed
      if (studentId) {
        const completedSurveyIds = await SurveyResponses.findAll({
          where: { studentId },
          attributes: ['surveyId']
        }).then(responses => responses.map(r => r.surveyId));
        
        return surveys.filter(survey => !completedSurveyIds.includes(survey.surveyId));
      }
      
      return surveys;
    } catch (error) {
      throw new AppError(`Error retrieving active surveys: ${error.message}`, 500);
    }
  },
  
  /**
   * Update a survey
   * @param {number} surveyId - The survey ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated survey
   */
  async updateSurvey(surveyId, updateData) {
    const transaction = await sequelize.transaction();
    
    try {
      const survey = await Surveys.findByPk(surveyId, { transaction });
      
      if (!survey) {
        await transaction.rollback();
        throw new AppError('Survey not found', 404);
      }
      
      // Check if there are any responses
      const responseCount = await SurveyResponses.count({
        where: { surveyId },
        transaction
      });
      
      // If there are responses, only certain fields can be updated
      if (responseCount > 0) {
        const allowedUpdates = ['title', 'description', 'isPublished', 'endDate', 'instructions'];
        const attemptedUpdates = Object.keys(updateData);
        
        for (const field of attemptedUpdates) {
          if (!allowedUpdates.includes(field)) {
            await transaction.rollback();
            throw new AppError(`Cannot update ${field} after responses have been received`, 400);
          }
        }
      }
      
      // Update the survey
      await survey.update(updateData, { transaction });
      
      // If questions are provided and there are no responses, update them
      if (updateData.questions && Array.isArray(updateData.questions) && responseCount === 0) {
        // Get existing questions
        const existingQuestions = await SurveyQuestions.findAll({
          where: { surveyId },
          include: [
            {
              model: SurveyOptions,
              as: 'options'
            }
          ],
          transaction
        });
        
        // Delete existing questions and options
        for (const question of existingQuestions) {
          await SurveyOptions.destroy({
            where: { questionId: question.questionId },
            transaction
          });
        }
        
        await SurveyQuestions.destroy({
          where: { surveyId },
          transaction
        });
        
        // Create new questions and options
        for (const [index, questionData] of updateData.questions.entries()) {
          const question = await SurveyQuestions.create({
            surveyId,
            questionText: questionData.questionText,
            questionType: questionData.questionType,
            isRequired: questionData.isRequired || false,
            orderNumber: index + 1
          }, { transaction });
          
          // If options are provided for the question, create them
          if (questionData.options && Array.isArray(questionData.options)) {
            for (const [optIndex, optionData] of questionData.options.entries()) {
              await SurveyOptions.create({
                questionId: question.questionId,
                text: optionData.text,
                orderNumber: optIndex + 1
              }, { transaction });
            }
          }
        }
      }
      
      await transaction.commit();
      
      // Return the updated survey with associations
      return this.getSurveyById(surveyId);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error updating survey: ${error.message}`, 500);
    }
  },
  
  /**
   * Delete a survey
   * @param {number} surveyId - The survey ID
   * @returns {Promise<void>}
   */
  async deleteSurvey(surveyId) {
    const transaction = await sequelize.transaction();
    
    try {
      const survey = await Surveys.findByPk(surveyId, { transaction });
      
      if (!survey) {
        await transaction.rollback();
        throw new AppError('Survey not found', 404);
      }
      
      // Get all questions
      const questions = await SurveyQuestions.findAll({
        where: { surveyId },
        transaction
      });
      
      // Get all responses
      const responses = await SurveyResponses.findAll({
        where: { surveyId },
        transaction
      });
      
      // Delete all question responses
      for (const response of responses) {
        await SurveyQuestionResponses.destroy({
          where: { responseId: response.responseId },
          transaction
        });
      }
      
      // Delete all responses
      await SurveyResponses.destroy({
        where: { surveyId },
        transaction
      });
      
      // Delete all options for each question
      for (const question of questions) {
        await SurveyOptions.destroy({
          where: { questionId: question.questionId },
          transaction
        });
      }
      
      // Delete all questions
      await SurveyQuestions.destroy({
        where: { surveyId },
        transaction
      });
      
      // Delete the survey
      await survey.destroy({ transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error deleting survey: ${error.message}`, 500);
    }
  },
  
  /**
   * Submit a survey response
   * @param {number} surveyId - The survey ID
   * @param {number} studentId - The student ID
   * @param {Array} questionResponses - The question responses
   * @returns {Promise<Object>} - The created response
   */
  async submitSurveyResponse(surveyId, studentId, questionResponses) {
    const transaction = await sequelize.transaction();
    
    try {
      const survey = await Surveys.findByPk(surveyId, {
        include: [
          {
            model: SurveyQuestions,
            as: 'questions'
          }
        ],
        transaction
      });
      
      if (!survey) {
        await transaction.rollback();
        throw new AppError('Survey not found', 404);
      }
      
      // Check if the survey is published
      if (!survey.isPublished) {
        await transaction.rollback();
        throw new AppError('Survey is not published', 400);
      }
      
      // Check if the survey is within the date range
      const now = new Date();
      if (survey.startDate && new Date(survey.startDate) > now) {
        await transaction.rollback();
        throw new AppError('Survey has not started yet', 400);
      }
      
      if (survey.endDate && new Date(survey.endDate) < now) {
        await transaction.rollback();
        throw new AppError('Survey has ended', 400);
      }
      
      // Check if the student has already responded
      const existingResponse = await SurveyResponses.findOne({
        where: { surveyId, studentId },
        transaction
      });
      
      if (existingResponse) {
        await transaction.rollback();
        throw new AppError('You have already responded to this survey', 400);
      }
      
      // Validate required questions
      const requiredQuestionIds = survey.questions
        .filter(q => q.isRequired)
        .map(q => q.questionId);
      
      const respondedQuestionIds = questionResponses.map(r => r.questionId);
      
      const missingRequiredQuestions = requiredQuestionIds.filter(
        id => !respondedQuestionIds.includes(id)
      );
      
      if (missingRequiredQuestions.length > 0) {
        await transaction.rollback();
        throw new AppError('All required questions must be answered', 400);
      }
      
      // Create the response
      const response = await SurveyResponses.create({
        surveyId,
        studentId
      }, { transaction });
      
      // Create the question responses
      for (const qResponse of questionResponses) {
        // Validate the question
        const question = await SurveyQuestions.findOne({
          where: { 
            questionId: qResponse.questionId,
            surveyId
          },
          transaction
        });
        
        if (!question) {
          await transaction.rollback();
          throw new AppError(`Question with ID ${qResponse.questionId} not found for this survey`, 404);
        }
        
        // Handle different question types
        if (question.questionType === 'multiple_choice' || question.questionType === 'single_choice') {
          // Validate the option(s)
          const optionIds = Array.isArray(qResponse.optionId) ? qResponse.optionId : [qResponse.optionId];
          
          for (const optionId of optionIds) {
            const option = await SurveyOptions.findOne({
              where: { 
                optionId,
                questionId: qResponse.questionId
              },
              transaction
            });
            
            if (!option) {
              await transaction.rollback();
              throw new AppError(`Option with ID ${optionId} not found for question ${qResponse.questionId}`, 404);
            }
            
            // Create the question response
            await SurveyQuestionResponses.create({
              responseId: response.responseId,
              questionId: qResponse.questionId,
              optionId,
              textResponse: null
            }, { transaction });
          }
        } else if (question.questionType === 'text' || question.questionType === 'textarea') {
          // Create the question response with text
          await SurveyQuestionResponses.create({
            responseId: response.responseId,
            questionId: qResponse.questionId,
            optionId: null,
            textResponse: qResponse.textResponse
          }, { transaction });
        } else if (question.questionType === 'rating') {
          // Create the question response with rating
          await SurveyQuestionResponses.create({
            responseId: response.responseId,
            questionId: qResponse.questionId,
            optionId: null,
            textResponse: qResponse.rating.toString()
          }, { transaction });
        }
      }
      
      await transaction.commit();
      
      return response;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error submitting survey response: ${error.message}`, 500);
    }
  },
  
  /**
   * Get survey results
   * @param {number} surveyId - The survey ID
   * @returns {Promise<Object>} - The survey results
   */
  async getSurveyResults(surveyId) {
    try {
      const survey = await this.getSurveyById(surveyId, true);
      
      // Calculate results for each question
      const questionResults = await Promise.all(survey.questions.map(async (question) => {
        let result = {
          questionId: question.questionId,
          questionText: question.questionText,
          questionType: question.questionType,
          responseCount: 0
        };
        
        // Get all responses for this question
        const questionResponses = survey.responses.flatMap(response => 
          response.questionResponses.filter(qr => qr.questionId === question.questionId)
        );
        
        result.responseCount = questionResponses.length;
        
        // Handle different question types
        if (question.questionType === 'multiple_choice' || question.questionType === 'single_choice') {
          // Count responses for each option
          result.options = question.options.map(option => {
            const optionResponseCount = questionResponses.filter(qr => 
              qr.optionId === option.optionId
            ).length;
            
            return {
              optionId: option.optionId,
              text: option.text,
              responseCount: optionResponseCount,
              percentage: questionResponses.length > 0 
                ? (optionResponseCount / questionResponses.length) * 100 
                : 0
            };
          });
        } else if (question.questionType === 'text' || question.questionType === 'textarea') {
          // Collect text responses
          result.textResponses = questionResponses.map(qr => ({
            responseId: qr.responseId,
            text: qr.textResponse
          }));
        } else if (question.questionType === 'rating') {
          // Calculate average rating
          const ratings = questionResponses
            .map(qr => parseInt(qr.textResponse))
            .filter(rating => !isNaN(rating));
          
          result.averageRating = ratings.length > 0 
            ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
            : 0;
          
          // Count ratings by value
          result.ratingDistribution = {};
          ratings.forEach(rating => {
            result.ratingDistribution[rating] = (result.ratingDistribution[rating] || 0) + 1;
          });
        }
        
        return result;
      }));
      
      return {
        surveyId: survey.surveyId,
        title: survey.title,
        description: survey.description,
        totalResponses: survey.responses.length,
        questions: questionResults
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving survey results: ${error.message}`, 500);
    }
  }
};

module.exports = surveyService;
