const Joi = require('joi');

/**
 * Validate lesson data
 * @param {Object} data - The lesson data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateLesson = (data, isUpdate = false) => {
  const schema = Joi.object({
    title: isUpdate ? Joi.string().min(3).max(100) : Joi.string().min(3).max(100).required(),
    description: isUpdate ? Joi.string().min(10).max(2000) : Joi.string().min(10).max(2000).required(),
    courseId: isUpdate ? Joi.number().integer() : Joi.number().integer().required(),
    order: Joi.number().integer().min(1),
    duration: Joi.number().integer().min(1),
    durationUnit: Joi.string().valid('minutes', 'hours'),
    isPublished: Joi.boolean(),
    learningObjectives: Joi.array().items(Joi.string()),
    prerequisites: Joi.array().items(Joi.string()),
    contentBlocks: Joi.array().items(
      Joi.object({
        type: Joi.string().valid('text', 'video', 'audio', 'image', 'file', 'quiz', 'assignment', 'interactive').required(),
        title: Joi.string().min(3).max(100).required(),
        content: Joi.alternatives().conditional('type', {
          is: 'text',
          then: Joi.string().required(),
          otherwise: Joi.any()
        }),
        url: Joi.alternatives().conditional('type', {
          is: Joi.string().valid('video', 'audio', 'image', 'file'),
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
        isRequired: Joi.boolean(),
        order: Joi.number().integer().min(1)
      })
    )
  });

  return schema.validate(data);
};

/**
 * Validate content block data
 * @param {Object} data - The content block data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateContentBlock = (data, isUpdate = false) => {
  const schema = Joi.object({
    lessonId: isUpdate ? Joi.number().integer() : Joi.number().integer().required(),
    type: isUpdate ? Joi.string().valid('text', 'video', 'audio', 'image', 'file', 'quiz', 'assignment', 'interactive') : Joi.string().valid('text', 'video', 'audio', 'image', 'file', 'quiz', 'assignment', 'interactive').required(),
    title: isUpdate ? Joi.string().min(3).max(100) : Joi.string().min(3).max(100).required(),
    content: Joi.alternatives().conditional('type', {
      is: 'text',
      then: Joi.string().required(),
      otherwise: Joi.any()
    }),
    url: Joi.alternatives().conditional('type', {
      is: Joi.string().valid('video', 'audio', 'image', 'file'),
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
    isRequired: Joi.boolean(),
    order: Joi.number().integer().min(1)
  });

  return schema.validate(data);
};

/**
 * Validate learning objectives data
 * @param {Object} data - The learning objectives data to validate
 * @returns {Object} - Validation result
 */
const validateLearningObjectives = (data) => {
  const schema = Joi.object({
    objectives: Joi.array().items(Joi.string()).min(1).required()
  });

  return schema.validate(data);
};

module.exports = {
  validateLesson,
  validateContentBlock,
  validateLearningObjectives
};
