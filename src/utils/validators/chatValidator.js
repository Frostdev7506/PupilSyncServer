// src/utils/validators/chatValidator.js

const Joi = require('joi');

const chatValidator = {
  /**
   * Validates the data for creating a new chat room.
   */
  validateCreateRoom(data) {
    const schema = Joi.object({
      name: Joi.string().min(2).max(100).when('isGroup', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional().allow(null, '') 
      }),
      type: Joi.string().valid('direct', 'course', 'project', 'group').default('direct'),
      isGroup: Joi.boolean().required(),
      participantIds: Joi.array().items(Joi.number().integer().positive()).when('isGroup', {
        is: false,
        then: Joi.array().length(1).required(),
        otherwise: Joi.array().min(1).required()
      }),
      entityId: Joi.number().integer().positive().optional(),
      isModerated: Joi.boolean().optional()
    });
    return schema.validate(data);
  },

  /**
   * Validates data for updating a group chat's details (e.g., its name).
   */
  validateUpdateRoom(data) {
    const schema = Joi.object({
      name: Joi.string().min(2).max(100).optional(),
      isModerated: Joi.boolean().optional(),
    }).min(1); // At least one field must be provided to update.
    return schema.validate(data);
  },

  /**
   * Validates the content for sending a new chat message.
   */
  validateSendMessage(data) {
    const schema = Joi.object({
      content: Joi.string().min(1).max(5000).required(),
    });
    return schema.validate(data);
  },

  /**
   * Validates the data for adding a single user to a group.
   */
  validateAddUser(data) {
    const schema = Joi.object({
      userIdToAdd: Joi.number().integer().positive().required(),
    });
    return schema.validate(data);
  },
};

module.exports = chatValidator;