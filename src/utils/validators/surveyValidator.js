const Joi = require('joi');

/**
 * Validate survey data
 * @param {Object} data - The survey data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateSurvey = (data, isUpdate = false) => {
  const schema = Joi.object({
    title: isUpdate ? Joi.string().min(3).max(100) : Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).max(2000),
    courseId: isUpdate ? Joi.number().integer() : Joi.number().integer(),
    classId: isUpdate ? Joi.number().integer() : Joi.number().integer(),
    isAnonymous: Joi.boolean(),
    isPublished: Joi.boolean(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    instructions: Joi.string().max(2000),
    questions: Joi.array().items(
      Joi.object({
        questionText: Joi.string().required(),
        questionType: Joi.string().valid(
          'single_choice',
          'multiple_choice',
          'text',
          'textarea',
          'rating'
        ).required(),
        isRequired: Joi.boolean(),
        options: Joi.alternatives().conditional('questionType', {
          is: Joi.string().valid('single_choice', 'multiple_choice'),
          then: Joi.array().items(
            Joi.object({
              text: Joi.string().required()
            })
          ).min(2).required(),
          otherwise: Joi.array().items(
            Joi.object({
              text: Joi.string().required()
            })
          )
        })
      })
    ).min(1)
  })
  .or('courseId', 'classId');

  return schema.validate(data);
};

/**
 * Validate survey response data
 * @param {Object} data - The response data to validate
 * @returns {Object} - Validation result
 */
const validateSurveyResponse = (data) => {
  const schema = Joi.object({
    questionResponses: Joi.array().items(
      Joi.object({
        questionId: Joi.number().integer().required(),
        optionId: Joi.alternatives().try(
          Joi.number().integer(),
          Joi.array().items(Joi.number().integer())
        ),
        textResponse: Joi.string(),
        rating: Joi.number().integer().min(1).max(5)
      })
    ).min(1).required()
  });

  return schema.validate(data);
};

module.exports = {
  validateSurvey,
  validateSurveyResponse
};
