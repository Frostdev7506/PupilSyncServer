const Joi = require('joi');

/**
 * Validate parent notification data
 * @param {Object} data - The notification data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateParentNotification = (data, isUpdate = false) => {
  const schema = Joi.object({
    parentId: isUpdate ? Joi.number().integer().positive() : Joi.number().integer().positive().required(),
    studentId: isUpdate ? Joi.number().integer().positive() : Joi.number().integer().positive().required(),
    title: isUpdate ? Joi.string().max(255) : Joi.string().max(255).required(),
    message: isUpdate ? Joi.string() : Joi.string().required(),
    notificationType: Joi.string().valid(
      'grade', 
      'attendance', 
      'behavior', 
      'assignment', 
      'exam', 
      'announcement', 
      'event', 
      'payment', 
      'other'
    ),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
    isRead: Joi.boolean().default(false),
    readAt: Joi.date(),
    relatedId: Joi.number().integer().positive(),
    relatedType: Joi.string().valid(
      'grade', 
      'attendance', 
      'behavior', 
      'assignment', 
      'exam', 
      'course', 
      'class', 
      'payment'
    ),
    metadata: Joi.object(),
    expiresAt: Joi.date()
  });

  return schema.validate(data);
};

module.exports = {
  validateParentNotification
};
