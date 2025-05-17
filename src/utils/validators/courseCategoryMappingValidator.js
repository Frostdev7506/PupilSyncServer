const Joi = require('joi');

/**
 * Validate course category mapping data
 * @param {Object} data - The mapping data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateCourseCategoryMapping = (data, isUpdate = false) => {
  const schema = Joi.object({
    courseId: isUpdate ? Joi.number().integer().positive() : Joi.number().integer().positive().required(),
    categoryId: isUpdate ? Joi.number().integer().positive() : Joi.number().integer().positive().required(),
    isPrimary: Joi.boolean()
  });

  return schema.validate(data);
};

module.exports = {
  validateCourseCategoryMapping
};
