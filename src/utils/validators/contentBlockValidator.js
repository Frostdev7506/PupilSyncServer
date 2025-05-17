const Joi = require('joi');

/**
 * Validate content block data
 * @param {Object} data - The content block data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateContentBlock = (data, isUpdate = false) => {
  const schema = Joi.object({
    lessonId: isUpdate ? Joi.number().integer() : Joi.number().integer().required(),
    type: isUpdate ? Joi.string().valid(
      'text', 
      'video', 
      'audio', 
      'image', 
      'file', 
      'quiz', 
      'assignment', 
      'interactive',
      'h5p',
      'iframe',
      'pdf',
      'code',
      'markdown',
      'html'
    ) : Joi.string().valid(
      'text', 
      'video', 
      'audio', 
      'image', 
      'file', 
      'quiz', 
      'assignment', 
      'interactive',
      'h5p',
      'iframe',
      'pdf',
      'code',
      'markdown',
      'html'
    ).required(),
    title: isUpdate ? Joi.string().min(3).max(100) : Joi.string().min(3).max(100).required(),
    content: Joi.alternatives().conditional('type', {
      is: Joi.string().valid('text', 'code', 'markdown', 'html'),
      then: Joi.string().required(),
      otherwise: Joi.any()
    }),
    url: Joi.alternatives().conditional('type', {
      is: Joi.string().valid('video', 'audio', 'image', 'file', 'pdf', 'iframe'),
      then: Joi.string().uri().required(),
      otherwise: Joi.any()
    }),
    duration: Joi.alternatives().conditional('type', {
      is: Joi.string().valid('video', 'audio'),
      then: Joi.number().integer().min(1),
      otherwise: Joi.any()
    }),
    quizId: Joi.alternatives().conditional('type', {
      is: 'quiz',
      then: Joi.number().integer().required(),
      otherwise: Joi.any()
    }),
    assignmentId: Joi.alternatives().conditional('type', {
      is: 'assignment',
      then: Joi.number().integer().required(),
      otherwise: Joi.any()
    }),
    interactiveType: Joi.alternatives().conditional('type', {
      is: 'interactive',
      then: Joi.string().valid('h5p', 'iframe', 'custom').required(),
      otherwise: Joi.any()
    }),
    interactiveConfig: Joi.alternatives().conditional('type', {
      is: 'interactive',
      then: Joi.object().required(),
      otherwise: Joi.any()
    }),
    h5pId: Joi.alternatives().conditional('type', {
      is: 'h5p',
      then: Joi.string().required(),
      otherwise: Joi.any()
    }),
    codeLanguage: Joi.alternatives().conditional('type', {
      is: 'code',
      then: Joi.string().valid(
        'javascript', 
        'python', 
        'java', 
        'csharp', 
        'cpp', 
        'php', 
        'ruby', 
        'swift', 
        'go', 
        'rust',
        'html',
        'css',
        'sql',
        'bash',
        'typescript'
      ).required(),
      otherwise: Joi.any()
    }),
    isRequired: Joi.boolean(),
    order: Joi.number().integer().min(1),
    metadata: Joi.object()
  });

  return schema.validate(data);
};

/**
 * Validate content engagement data
 * @param {Object} data - The content engagement data to validate
 * @returns {Object} - Validation result
 */
const validateContentEngagement = (data) => {
  const schema = Joi.object({
    engagementType: Joi.string().valid(
      'view', 
      'complete', 
      'interact', 
      'download', 
      'like', 
      'share'
    ).required(),
    progress: Joi.number().min(0).max(100),
    timeSpent: Joi.number().integer().min(0)
  });

  return schema.validate(data);
};

module.exports = {
  validateContentBlock,
  validateContentEngagement
};
