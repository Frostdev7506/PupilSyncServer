const Joi = require('joi');

/**
 * Validate learning path data
 * @param {Object} data - The learning path data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateLearningPath = (data, isUpdate = false) => {
  const schema = Joi.object({
    studentId: isUpdate ? Joi.number().integer() : Joi.number().integer().required(),
    courseId: isUpdate ? Joi.number().integer() : Joi.number().integer().required(),
    title: isUpdate ? Joi.string().min(3).max(100) : Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).max(500),
    isActive: Joi.boolean(),
    items: Joi.array().items(
      Joi.object({
        entityType: Joi.string().valid('lesson', 'contentBlock', 'quiz', 'assignment').required(),
        entityId: Joi.number().integer().required(),
        order: Joi.number().integer().min(1),
        isRequired: Joi.boolean(),
        completionCriteria: Joi.object({
          requiredProgress: Joi.number().min(0).max(100),
          requiredScore: Joi.number().min(0).max(100),
          requiredTimeSpent: Joi.number().integer().min(0)
        })
      })
    )
  });

  return schema.validate(data);
};

/**
 * Validate learning path item data
 * @param {Object} data - The learning path item data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateLearningPathItem = (data, isUpdate = false) => {
  const schema = Joi.object({
    learningPathId: isUpdate ? Joi.number().integer() : Joi.number().integer().required(),
    entityType: isUpdate ? Joi.string().valid('lesson', 'contentBlock', 'quiz', 'assignment') : Joi.string().valid('lesson', 'contentBlock', 'quiz', 'assignment').required(),
    entityId: isUpdate ? Joi.number().integer() : Joi.number().integer().required(),
    order: Joi.number().integer().min(1),
    isRequired: Joi.boolean(),
    completionCriteria: Joi.object({
      requiredProgress: Joi.number().min(0).max(100),
      requiredScore: Joi.number().min(0).max(100),
      requiredTimeSpent: Joi.number().integer().min(0)
    })
  });

  return schema.validate(data);
};

module.exports = {
  validateLearningPath,
  validateLearningPathItem
};
