const Joi = require('joi');

/**
 * Validate teacher earning data
 * @param {Object} data - The earning data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateTeacherEarning = (data, isUpdate = false) => {
  const schema = Joi.object({
    teacherId: isUpdate ? Joi.number().integer().positive() : Joi.number().integer().positive().required(),
    courseId: Joi.number().integer().positive(),
    studentId: Joi.number().integer().positive(),
    amount: isUpdate ? Joi.number().precision(2).min(0) : Joi.number().precision(2).min(0).required(),
    currency: Joi.string().length(3).default('USD'),
    earningType: isUpdate ? Joi.string().valid('course_enrollment', 'private_session', 'subscription', 'bonus', 'other') : 
      Joi.string().valid('course_enrollment', 'private_session', 'subscription', 'bonus', 'other').required(),
    description: Joi.string(),
    status: Joi.string().valid('pending', 'available', 'paid', 'cancelled'),
    earnedAt: Joi.date(),
    availableAt: Joi.date(),
    paidAt: Joi.date(),
    paymentId: Joi.number().integer().positive(),
    platformFee: Joi.number().precision(2).min(0),
    taxAmount: Joi.number().precision(2).min(0)
  });

  return schema.validate(data);
};

module.exports = {
  validateTeacherEarning
};
