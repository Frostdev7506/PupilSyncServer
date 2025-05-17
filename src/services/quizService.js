const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');
const modelAssociationUtil = require('../utils/modelAssociationUtil');

const models = initModels(sequelize);
const { 
  Quizzes, 
  QuizQuestions, 
  QuizAnswers,
  StudentQuizAttempts,
  StudentQuizResponses,
  Courses,
  Lessons,
  Teachers,
  Students,
  Users
} = models;

// Verify required associations
const quizAssociations = ['course', 'lesson', 'questions'];
const quizVerification = modelAssociationUtil.verifyRequiredAssociations('Quizzes', quizAssociations);

if (!quizVerification.valid) {
  console.error(`Missing required associations for Quizzes: ${quizVerification.missing.join(', ')}`);
}

const quizService = {
  /**
   * Create a new quiz
   * @param {Object} quizData - The quiz data
   * @returns {Promise<Object>} - The created quiz
   */
  async createQuiz(quizData) {
    const transaction = await sequelize.transaction();
    
    try {
      // Create the quiz
      const quiz = await Quizzes.create({
        courseId: quizData.courseId,
        lessonId: quizData.lessonId,
        title: quizData.title,
        description: quizData.description,
        timeLimitMinutes: quizData.timeLimitMinutes,
        passingScore: quizData.passingScore,
        maxAttempts: quizData.maxAttempts,
        isRandomized: quizData.isRandomized || false,
        showAnswers: quizData.showAnswers || false,
        isPublished: quizData.isPublished || false,
        availableFrom: quizData.availableFrom,
        availableTo: quizData.availableTo,
        instructions: quizData.instructions
      }, { transaction });
      
      // If questions are provided, create them
      if (quizData.questions && Array.isArray(quizData.questions)) {
        for (const [index, questionData] of quizData.questions.entries()) {
          const question = await QuizQuestions.create({
            quizId: quiz.quizId,
            questionText: questionData.questionText,
            questionType: questionData.questionType,
            orderNumber: index + 1,
            points: questionData.points || 1
          }, { transaction });
          
          // If answers are provided for the question, create them
          if (questionData.answers && Array.isArray(questionData.answers)) {
            for (const [ansIndex, answerData] of questionData.answers.entries()) {
              await QuizAnswers.create({
                questionId: question.questionId,
                answerText: answerData.answerText,
                isCorrect: answerData.isCorrect || false,
                orderNumber: ansIndex + 1,
                feedback: answerData.feedback
              }, { transaction });
            }
          }
        }
      }
      
      await transaction.commit();
      
      // Return the quiz with associations
      return this.getQuizById(quiz.quizId);
    } catch (error) {
      await transaction.rollback();
      throw new AppError(`Error creating quiz: ${error.message}`, 500);
    }
  },
  
  /**
   * Get a quiz by ID
   * @param {number} quizId - The quiz ID
   * @param {boolean} includeAnswers - Whether to include correct answers
   * @returns {Promise<Object>} - The quiz
   */
  async getQuizById(quizId, includeAnswers = true) {
    try {
      const quiz = await Quizzes.findByPk(quizId, {
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
            model: QuizQuestions,
            as: 'questions',
            include: includeAnswers ? [
              {
                model: QuizAnswers,
                as: 'quizAnswers'
              }
            ] : []
          }
        ]
      });
      
      if (!quiz) {
        throw new AppError('Quiz not found', 404);
      }
      
      return quiz;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving quiz: ${error.message}`, 500);
    }
  },
  
  /**
   * Get all quizzes for a course
   * @param {number} courseId - The course ID
   * @param {Object} filters - The filters to apply
   * @returns {Promise<Array>} - The quizzes
   */
  async getQuizzesByCourse(courseId, filters = {}) {
    try {
      const { isPublished, lessonId } = filters;
      
      // Build the where clause
      const where = { courseId };
      
      if (isPublished !== undefined) {
        where.isPublished = isPublished;
      }
      
      if (lessonId) {
        where.lessonId = lessonId;
      }
      
      const quizzes = await Quizzes.findAll({
        where,
        include: [
          {
            model: Lessons,
            as: 'lesson'
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      return quizzes;
    } catch (error) {
      throw new AppError(`Error retrieving quizzes: ${error.message}`, 500);
    }
  },
  
  /**
   * Update a quiz
   * @param {number} quizId - The quiz ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated quiz
   */
  async updateQuiz(quizId, updateData) {
    try {
      const quiz = await Quizzes.findByPk(quizId);
      
      if (!quiz) {
        throw new AppError('Quiz not found', 404);
      }
      
      // Update the quiz
      await quiz.update(updateData);
      
      // Return the updated quiz with associations
      return this.getQuizById(quizId);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error updating quiz: ${error.message}`, 500);
    }
  },
  
  /**
   * Delete a quiz
   * @param {number} quizId - The quiz ID
   * @returns {Promise<void>}
   */
  async deleteQuiz(quizId) {
    const transaction = await sequelize.transaction();
    
    try {
      const quiz = await Quizzes.findByPk(quizId, { transaction });
      
      if (!quiz) {
        await transaction.rollback();
        throw new AppError('Quiz not found', 404);
      }
      
      // Check if there are any attempts
      const attempts = await StudentQuizAttempts.count({
        where: { quizId },
        transaction
      });
      
      if (attempts > 0) {
        await transaction.rollback();
        throw new AppError('Cannot delete quiz with existing student attempts', 400);
      }
      
      // Get all questions
      const questions = await QuizQuestions.findAll({
        where: { quizId },
        transaction
      });
      
      // Delete all answers for each question
      for (const question of questions) {
        await QuizAnswers.destroy({
          where: { questionId: question.questionId },
          transaction
        });
      }
      
      // Delete all questions
      await QuizQuestions.destroy({
        where: { quizId },
        transaction
      });
      
      // Delete the quiz
      await quiz.destroy({ transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error deleting quiz: ${error.message}`, 500);
    }
  },
  
  /**
   * Add a question to a quiz
   * @param {number} quizId - The quiz ID
   * @param {Object} questionData - The question data
   * @returns {Promise<Object>} - The created question
   */
  async addQuestionToQuiz(quizId, questionData) {
    const transaction = await sequelize.transaction();
    
    try {
      const quiz = await Quizzes.findByPk(quizId, { transaction });
      
      if (!quiz) {
        await transaction.rollback();
        throw new AppError('Quiz not found', 404);
      }
      
      // Get the current highest order number
      const maxOrderQuestion = await QuizQuestions.findOne({
        where: { quizId },
        order: [['orderNumber', 'DESC']],
        transaction
      });
      
      const orderNumber = maxOrderQuestion ? maxOrderQuestion.orderNumber + 1 : 1;
      
      // Create the question
      const question = await QuizQuestions.create({
        quizId,
        questionText: questionData.questionText,
        questionType: questionData.questionType,
        orderNumber,
        points: questionData.points || 1
      }, { transaction });
      
      // If answers are provided, create them
      if (questionData.answers && Array.isArray(questionData.answers)) {
        for (const [index, answerData] of questionData.answers.entries()) {
          await QuizAnswers.create({
            questionId: question.questionId,
            answerText: answerData.answerText,
            isCorrect: answerData.isCorrect || false,
            orderNumber: index + 1,
            feedback: answerData.feedback
          }, { transaction });
        }
      }
      
      await transaction.commit();
      
      // Return the question with answers
      return this.getQuestionById(question.questionId);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error adding question to quiz: ${error.message}`, 500);
    }
  },
  
  /**
   * Get a question by ID
   * @param {number} questionId - The question ID
   * @returns {Promise<Object>} - The question
   */
  async getQuestionById(questionId) {
    try {
      const question = await QuizQuestions.findByPk(questionId, {
        include: [
          {
            model: QuizAnswers,
            as: 'quizAnswers',
            order: [['orderNumber', 'ASC']]
          }
        ]
      });
      
      if (!question) {
        throw new AppError('Question not found', 404);
      }
      
      return question;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving question: ${error.message}`, 500);
    }
  },
  
  /**
   * Update a question
   * @param {number} questionId - The question ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated question
   */
  async updateQuestion(questionId, updateData) {
    const transaction = await sequelize.transaction();
    
    try {
      const question = await QuizQuestions.findByPk(questionId, { transaction });
      
      if (!question) {
        await transaction.rollback();
        throw new AppError('Question not found', 404);
      }
      
      // Update the question
      await question.update({
        questionText: updateData.questionText !== undefined ? updateData.questionText : question.questionText,
        questionType: updateData.questionType !== undefined ? updateData.questionType : question.questionType,
        points: updateData.points !== undefined ? updateData.points : question.points
      }, { transaction });
      
      // If answers are provided, update them
      if (updateData.answers && Array.isArray(updateData.answers)) {
        // Delete existing answers
        await QuizAnswers.destroy({
          where: { questionId },
          transaction
        });
        
        // Create new answers
        for (const [index, answerData] of updateData.answers.entries()) {
          await QuizAnswers.create({
            questionId,
            answerText: answerData.answerText,
            isCorrect: answerData.isCorrect || false,
            orderNumber: index + 1,
            feedback: answerData.feedback
          }, { transaction });
        }
      }
      
      await transaction.commit();
      
      // Return the updated question with answers
      return this.getQuestionById(questionId);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error updating question: ${error.message}`, 500);
    }
  },
  
  /**
   * Delete a question
   * @param {number} questionId - The question ID
   * @returns {Promise<void>}
   */
  async deleteQuestion(questionId) {
    const transaction = await sequelize.transaction();
    
    try {
      const question = await QuizQuestions.findByPk(questionId, { transaction });
      
      if (!question) {
        await transaction.rollback();
        throw new AppError('Question not found', 404);
      }
      
      // Check if there are any responses to this question
      const responses = await StudentQuizResponses.count({
        where: { questionId },
        transaction
      });
      
      if (responses > 0) {
        await transaction.rollback();
        throw new AppError('Cannot delete question with existing student responses', 400);
      }
      
      // Delete all answers
      await QuizAnswers.destroy({
        where: { questionId },
        transaction
      });
      
      // Delete the question
      await question.destroy({ transaction });
      
      // Reorder remaining questions
      const remainingQuestions = await QuizQuestions.findAll({
        where: { 
          quizId: question.quizId,
          orderNumber: { [Op.gt]: question.orderNumber }
        },
        order: [['orderNumber', 'ASC']],
        transaction
      });
      
      for (const q of remainingQuestions) {
        await q.update({ orderNumber: q.orderNumber - 1 }, { transaction });
      }
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error deleting question: ${error.message}`, 500);
    }
  }
};

module.exports = quizService;
