const Joi = require('joi');

// Schema for creating a discussion reply
const createReplySchema = Joi.object({
  topic: Joi.string().required().messages({
    'any.required': 'Topic ID is required',
    'string.empty': 'Topic ID cannot be empty'
  }),
  parentReply: Joi.string().allow(null, '').optional(), // Optional, for nested replies
  content: Joi.string().required().messages({
    'any.required': 'Content is required',
    'string.empty': 'Content cannot be empty'
  }),
  attachments: Joi.array().items(Joi.string()).optional() // Array of attachment URLs or IDs
  // Add other fields as needed, e.g., status if applicable during creation (less common)
});

// Schema for updating a discussion reply (partial update allowed)
const updateReplySchema = Joi.object({
  content: Joi.string().optional(),
  attachments: Joi.array().items(Joi.string()).optional(),
  status: Joi.string().valid('pending', 'approved', 'rejected').optional(), // Example status field
  // Add other fields that can be updated
});

/**
 * Validates the data for creating or updating a discussion reply.
 * @param {Object} data - The data to validate.
 * @param {boolean} isUpdate - True if validating for an update (allows partial data).
 * @returns {Object} - The validation result ({ error, value }).
 */
const validateDiscussionReply = (data, isUpdate = false) => {
  const schema = isUpdate ? updateReplySchema : createReplySchema;
  return schema.validate(data);
};

module.exports = {
  validateDiscussionReply
};