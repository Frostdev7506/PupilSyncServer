const Joi = require('joi');

/**
 * Validate quiz data
 * @param {Object} data - The quiz data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateQuiz = (data, isUpdate = false) => {
  const schema = Joi.object({
    courseId: isUpdate ? Joi.number().integer() : Joi.number().integer().required(),
    lessonId: Joi.number().integer(),
    title: isUpdate ? Joi.string().min(3).max(100) : Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).max(2000),
    timeLimitMinutes: Joi.number().integer().min(1),
    passingScore: Joi.number().min(0).max(100),
    maxAttempts: Joi.number().integer().min(1),
    isRandomized: Joi.boolean(),
    showAnswers: Joi.boolean(),
    isPublished: Joi.boolean(),
    availableFrom: Joi.date().iso(),
    availableTo: Joi.date().iso().min(Joi.ref('availableFrom')),
    instructions: Joi.string().max(2000),
    questions: Joi.array().items(
      Joi.object({
        questionText: Joi.string().required(),
        questionType: Joi.string().valid('multiple_choice', 'true_false', 'short_answer', 'matching').required(),
        points: Joi.number().min(0),
        answers: Joi.array().items(
          Joi.object({
            answerText: Joi.string().required(),
            isCorrect: Joi.boolean().required(),
            feedback: Joi.string()
          })
        ).min(1)
      })
    )
  });

  return schema.validate(data);
};

/**
 * Validate quiz question data
 * @param {Object} data - The question data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateQuizQuestion = (data, isUpdate = false) => {
  const schema = Joi.object({
    questionText: Joi.string().required(),
    questionType: Joi.string().valid('multiple_choice', 'true_false', 'short_answer', 'matching').required(),
    points: Joi.number().min(0),
    answers: Joi.array().items(
      Joi.object({
        answerText: Joi.string().required(),
        isCorrect: Joi.boolean().required(),
        feedback: Joi.string()
      })
    ).min(1)
  });

  return schema.validate(data);
};

/**
 * Validate quiz attempt data
 * @param {Object} data - The attempt data to validate
 * @returns {Object} - Validation result
 */
const validateQuizAttempt = (data) => {
  const schema = Joi.object({
    responses: Joi.array().items(
      Joi.object({
        questionId: Joi.number().integer().required(),
        answerId: Joi.number().integer(),
        textResponse: Joi.string()
      })
    ).required()
  });

  return schema.validate(data);
};

module.exports = {
  validateQuiz,
  validateQuizQuestion,
  validateQuizAttempt
};
