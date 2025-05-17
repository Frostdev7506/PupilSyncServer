const Joi = require('joi');

/**
 * Validate teacher service data
 * @param {Object} data - The service data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateTeacherService = (data, isUpdate = false) => {
  const schema = Joi.object({
    title: isUpdate ? Joi.string().min(3).max(100) : Joi.string().min(3).max(100).required(),
    description: isUpdate ? Joi.string().min(10).max(2000) : Joi.string().min(10).max(2000).required(),
    category: isUpdate ? Joi.string().min(3).max(50) : Joi.string().min(3).max(50).required(),
    subcategory: Joi.string().min(3).max(50),
    price: isUpdate ? Joi.number().min(0) : Joi.number().min(0).required(),
    currency: Joi.string().length(3).default('USD'),
    duration: isUpdate ? Joi.number().integer().min(1) : Joi.number().integer().min(1).required(),
    durationUnit: Joi.string().valid('minutes', 'hours', 'days', 'weeks').default('hours'),
    isPublished: Joi.boolean().default(false),
    tags: Joi.array().items(Joi.string()),
    requirements: Joi.array().items(Joi.string()),
    deliverables: Joi.array().items(Joi.string())
  });

  return schema.validate(data);
};

/**
 * Validate service booking data
 * @param {Object} data - The booking data to validate
 * @returns {Object} - Validation result
 */
const validateServiceBooking = (data) => {
  const schema = Joi.object({
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().min(Joi.ref('startTime')).required(),
    notes: Joi.string().max(500),
    requirements: Joi.array().items(Joi.string())
  });

  return schema.validate(data);
};

/**
 * Validate teacher availability data
 * @param {Object} data - The availability data to validate
 * @returns {Object} - Validation result
 */
const validateTeacherAvailability = (data) => {
  const schema = Joi.object({
    availabilitySlots: Joi.array().items(
      Joi.object({
        startTime: Joi.date().iso().required(),
        endTime: Joi.date().iso().min(Joi.ref('startTime')).required()
      })
    ).min(1).required()
  });

  return schema.validate(data);
};

/**
 * Validate service review data
 * @param {Object} data - The review data to validate
 * @returns {Object} - Validation result
 */
const validateServiceReview = (data) => {
  const schema = Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().min(10).max(500).required()
  });

  return schema.validate(data);
};

module.exports = {
  validateTeacherService,
  validateServiceBooking,
  validateTeacherAvailability,
  validateServiceReview
};
