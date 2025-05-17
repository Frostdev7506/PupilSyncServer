const Joi = require('joi');

/**
 * Validate learning analytics data
 * @param {Object} data - The analytics data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateLearningAnalytics = (data, isUpdate = false) => {
  const schema = Joi.object({
    studentId: isUpdate ? Joi.number().integer().positive() : Joi.number().integer().positive().required(),
    entityType: isUpdate ? Joi.string().max(100) : Joi.string().max(100).required(),
    entityId: isUpdate ? Joi.number().integer().positive() : Joi.number().integer().positive().required(),
    metricType: isUpdate ? Joi.string().max(100) : Joi.string().max(100).required(),
    value: isUpdate ? Joi.number() : Joi.number().required(),
    timestamp: Joi.date().default(Date.now),
    metadata: Joi.object()
  });

  return schema.validate(data);
};

module.exports = {
  validateLearningAnalytics
};
