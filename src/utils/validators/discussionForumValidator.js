const Joi = require('joi');

/**
 * Validate discussion forum data
 * @param {Object} data - The forum data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateDiscussionForum = (data, isUpdate = false) => {
  const schema = Joi.object({
    courseId: Joi.number().integer().positive().allow(null),
    lessonId: Joi.number().integer().positive().allow(null),
    classId: Joi.number().integer().positive().allow(null),
    title: isUpdate ? Joi.string().max(255) : Joi.string().max(255).required(),
    description: Joi.string(),
    forumType: Joi.string().valid('general', 'announcement', 'question_answer', 'discussion', 'project'),
    createdBy: Joi.number().integer().positive(),
    isActive: Joi.boolean(),
    isModerated: Joi.boolean(),
    allowAnonymous: Joi.boolean(),
    allowAttachments: Joi.boolean(),
    sortOrder: Joi.number().integer().min(0),
    postCount: Joi.number().integer().min(0),
    lastPostAt: Joi.date(),
    lastPostBy: Joi.number().integer().positive()
  }).custom((value, helpers) => {
    // At least one of courseId, lessonId, or classId must be provided
    if (!value.courseId && !value.lessonId && !value.classId) {
      return helpers.error('any.custom', { message: 'At least one of courseId, lessonId, or classId must be provided' });
    }
    return value;
  });

  return schema.validate(data);
};

/**
 * Validate discussion topic data
 * @param {Object} data - The topic data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateDiscussionTopic = (data, isUpdate = false) => {
  const schema = Joi.object({
    forumId: isUpdate ? Joi.number().integer().positive() : Joi.number().integer().positive().required(),
    title: isUpdate ? Joi.string().max(255) : Joi.string().max(255).required(),
    content: isUpdate ? Joi.string() : Joi.string().required(),
    createdBy: Joi.number().integer().positive(),
    isAnonymous: Joi.boolean(),
    isPinned: Joi.boolean(),
    isLocked: Joi.boolean(),
    status: Joi.string().valid('pending', 'approved', 'rejected'),
    moderatedBy: Joi.number().integer().positive(),
    moderatedAt: Joi.date(),
    moderationNotes: Joi.string(),
    viewCount: Joi.number().integer().min(0),
    replyCount: Joi.number().integer().min(0),
    lastReplyAt: Joi.date(),
    lastReplyBy: Joi.number().integer().positive(),
    tags: Joi.array().items(Joi.string()),
    attachments: Joi.array().items(
      Joi.object({
        fileName: Joi.string().required(),
        fileUrl: Joi.string().uri().required(),
        fileType: Joi.string(),
        fileSize: Joi.number().integer().positive()
      })
    )
  });

  return schema.validate(data);
};

/**
 * Validate discussion reply data
 * @param {Object} data - The reply data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateDiscussionReply = (data, isUpdate = false) => {
  const schema = Joi.object({
    topicId: isUpdate ? Joi.number().integer().positive() : Joi.number().integer().positive().required(),
    parentReplyId: Joi.number().integer().positive().allow(null),
    content: isUpdate ? Joi.string() : Joi.string().required(),
    createdBy: Joi.number().integer().positive(),
    isAnonymous: Joi.boolean(),
    isInstructorResponse: Joi.boolean(),
    status: Joi.string().valid('pending', 'approved', 'rejected'),
    moderatedBy: Joi.number().integer().positive(),
    moderatedAt: Joi.date(),
    moderationNotes: Joi.string(),
    upvoteCount: Joi.number().integer().min(0),
    downvoteCount: Joi.number().integer().min(0),
    isAcceptedAnswer: Joi.boolean(),
    attachments: Joi.array().items(
      Joi.object({
        fileName: Joi.string().required(),
        fileUrl: Joi.string().uri().required(),
        fileType: Joi.string(),
        fileSize: Joi.number().integer().positive()
      })
    )
  });

  return schema.validate(data);
};

module.exports = {
  validateDiscussionForum,
  validateDiscussionTopic,
  validateDiscussionReply
};
