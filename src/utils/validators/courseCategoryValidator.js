const Joi = require('joi');

/**
 * Validate course category data
 * @param {Object} data - The category data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateCourseCategory = (data, isUpdate = false) => {
  const schema = Joi.object({
    name: isUpdate ? Joi.string().max(100) : Joi.string().max(100).required(),
    slug: Joi.string().max(100).pattern(/^[a-z0-9-]+$/),
    description: Joi.string(),
    parentCategoryId: Joi.number().integer().positive().allow(null),
    iconUrl: Joi.string().uri(),
    imageUrl: Joi.string().uri(),
    color: Joi.string().max(20),
    displayOrder: Joi.number().integer().min(0),
    isActive: Joi.boolean(),
    isFeatured: Joi.boolean(),
    metaTitle: Joi.string().max(255),
    metaDescription: Joi.string(),
    metaKeywords: Joi.string().max(255),
    courseCount: Joi.number().integer().min(0)
  });

  return schema.validate(data);
};

module.exports = {
  validateCourseCategory
};
