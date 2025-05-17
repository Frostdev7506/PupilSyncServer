const Joi = require('joi');

/**
 * Validate chat room data
 * @param {Object} data - The chat room data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateChat = (data, isUpdate = false) => {
  const schema = Joi.object({
    name: isUpdate ? Joi.string().min(3).max(100) : Joi.string().min(3).max(100).required(),
    type: isUpdate ? Joi.string().valid('class', 'course', 'group', 'private', 'project') : Joi.string().valid('class', 'course', 'group', 'private', 'project').required(),
    entityId: isUpdate ? Joi.number().integer() : Joi.number().integer().required(),
    isGroup: Joi.boolean(),
    isModerated: Joi.boolean(),
    participantIds: Joi.array().items(Joi.number().integer())
  });

  return schema.validate(data);
};

/**
 * Validate chat message data
 * @param {Object} data - The chat message data to validate
 * @returns {Object} - Validation result
 */
const validateChatMessage = (data) => {
  const schema = Joi.object({
    content: Joi.string().required(),
    contentType: Joi.string().valid('text', 'image', 'file', 'audio', 'video'),
    attachments: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('image', 'file', 'audio', 'video').required(),
        url: Joi.string().uri().required(),
        name: Joi.string(),
        size: Joi.number().integer(),
        mimeType: Joi.string()
      })
    )
  });

  return schema.validate(data);
};

/**
 * Validate chat participant data
 * @param {Object} data - The chat participant data to validate
 * @returns {Object} - Validation result
 */
const validateChatParticipant = (data) => {
  const schema = Joi.object({
    userIds: Joi.array().items(Joi.number().integer()).required()
  });

  return schema.validate(data);
};

module.exports = {
  validateChat,
  validateChatMessage,
  validateChatParticipant
};
