const Joi = require('joi');

/**
 * Validate analytics event data
 * @param {Object} data - The event data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateAnalyticsEvent = (data, isUpdate = false) => {
  const schema = Joi.object({
    userId: Joi.number().integer().positive(),
    eventType: isUpdate ? Joi.string().max(100) : Joi.string().max(100).required(),
    entityType: Joi.string().max(100),
    entityId: Joi.number().integer().positive(),
    timestamp: Joi.date().default(Date.now),
    sessionId: Joi.string().max(255),
    ipAddress: Joi.string().max(45),
    userAgent: Joi.string(),
    referrer: Joi.string(),
    page: Joi.string(),
    duration: Joi.number().min(0),
    metadata: Joi.object()
  });

  return schema.validate(data);
};

module.exports = {
  validateAnalyticsEvent
};
