const Joi = require('joi');

/**
 * Validate poll data
 * @param {Object} data - The poll data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validatePoll = (data, isUpdate = false) => {
  const schema = Joi.object({
    title: isUpdate ? Joi.string().min(3).max(100) : Joi.string().min(3).max(100).required(),
    question: isUpdate ? Joi.string().min(5).max(500) : Joi.string().min(5).max(500).required(),
    courseId: isUpdate ? Joi.number().integer() : Joi.number().integer(),
    classId: isUpdate ? Joi.number().integer() : Joi.number().integer(),
    isAnonymous: Joi.boolean(),
    isMultipleChoice: Joi.boolean(),
    isActive: Joi.boolean(),
    expiresAt: Joi.date().iso(),
    options: Joi.array().items(
      Joi.object({
        text: Joi.string().required()
      })
    ).min(2)
  })
  .or('courseId', 'classId');

  return schema.validate(data);
};

/**
 * Validate poll response data
 * @param {Object} data - The response data to validate
 * @returns {Object} - Validation result
 */
const validatePollResponse = (data) => {
  const schema = Joi.object({
    optionId: Joi.alternatives().try(
      Joi.number().integer().required(),
      Joi.array().items(Joi.number().integer()).min(1).required()
    )
  });

  return schema.validate(data);
};

module.exports = {
  validatePoll,
  validatePollResponse
};
