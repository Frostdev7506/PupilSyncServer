const Joi = require('joi');

/**
 * Validate teacher review data
 * @param {Object} data - The review data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateTeacherReview = (data, isUpdate = false) => {
  const schema = Joi.object({
    teacherId: isUpdate ? Joi.number().integer().positive() : Joi.number().integer().positive().required(),
    studentId: isUpdate ? Joi.number().integer().positive() : Joi.number().integer().positive().required(),
    courseId: isUpdate ? Joi.number().integer().positive() : Joi.number().integer().positive().required(),
    rating: isUpdate ? Joi.number().integer().min(1).max(5) : Joi.number().integer().min(1).max(5).required(),
    reviewText: Joi.string().max(2000),
    isPublic: Joi.boolean(),
    status: Joi.string().valid('pending', 'approved', 'rejected'),
    moderatedBy: Joi.number().integer().positive(),
    moderatedAt: Joi.date(),
    moderationNotes: Joi.string(),
    teacherResponse: Joi.string(),
    teacherResponseAt: Joi.date(),
    helpfulCount: Joi.number().integer().min(0),
    reportCount: Joi.number().integer().min(0)
  });

  return schema.validate(data);
};

module.exports = {
  validateTeacherReview
};
