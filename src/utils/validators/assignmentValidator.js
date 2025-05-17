const Joi = require('joi');

/**
 * Validate assignment data
 * @param {Object} data - The assignment data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateAssignment = (data, isUpdate = false) => {
  const schema = Joi.object({
    courseId: isUpdate ? Joi.number().integer() : Joi.number().integer().required(),
    lessonId: Joi.number().integer(),
    title: isUpdate ? Joi.string().min(3).max(100) : Joi.string().min(3).max(100).required(),
    description: Joi.string().min(10).max(2000),
    instructions: Joi.string().min(10).max(5000),
    dueDate: Joi.date().iso(),
    availableFrom: Joi.date().iso(),
    availableUntil: Joi.date().iso().min(Joi.ref('availableFrom')),
    maxPoints: Joi.number().min(0),
    submissionType: Joi.string().valid('file', 'text', 'both'),
    allowLateSubmissions: Joi.boolean(),
    latePenalty: Joi.number().min(0).max(100),
    visibleToStudents: Joi.boolean(),
    attachments: Joi.array().items(
      Joi.object({
        fileName: Joi.string().required(),
        fileUrl: Joi.string().uri().required(),
        fileType: Joi.string(),
        fileSize: Joi.number().integer()
      })
    ),
    rubric: Joi.object({
      title: Joi.string().min(3).max(100),
      description: Joi.string().max(1000),
      totalPoints: Joi.number().min(0),
      criteria: Joi.array().items(
        Joi.object({
          title: Joi.string().required(),
          description: Joi.string(),
          maxPoints: Joi.number().min(0).required()
        })
      ).min(1)
    })
  });

  return schema.validate(data);
};

/**
 * Validate rubric data
 * @param {Object} data - The rubric data to validate
 * @returns {Object} - Validation result
 */
const validateRubric = (data) => {
  const schema = Joi.object({
    title: Joi.string().min(3).max(100),
    description: Joi.string().max(1000),
    totalPoints: Joi.number().min(0),
    criteria: Joi.array().items(
      Joi.object({
        title: Joi.string().required(),
        description: Joi.string(),
        maxPoints: Joi.number().min(0).required()
      })
    ).min(1).required()
  });

  return schema.validate(data);
};

module.exports = {
  validateAssignment,
  validateRubric
};
