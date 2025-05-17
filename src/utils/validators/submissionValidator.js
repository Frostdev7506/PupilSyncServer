const Joi = require('joi');

/**
 * Validate submission data
 * @param {Object} data - The submission data to validate
 * @returns {Object} - Validation result
 */
const validateSubmission = (data) => {
  const schema = Joi.object({
    content: Joi.string().allow(''),
    attachments: Joi.array().items(
      Joi.object({
        fileName: Joi.string().required(),
        fileUrl: Joi.string().uri().required(),
        fileType: Joi.string(),
        fileSize: Joi.number().integer()
      })
    )
  }).or('content', 'attachments');

  return schema.validate(data);
};

/**
 * Validate grade data
 * @param {Object} data - The grade data to validate
 * @returns {Object} - Validation result
 */
const validateGrade = (data) => {
  const schema = Joi.object({
    grade: Joi.number().min(0).required(),
    feedback: Joi.string().allow(''),
    rubricScores: Joi.array().items(
      Joi.object({
        criterionId: Joi.number().integer().required(),
        score: Joi.number().min(0).required(),
        comment: Joi.string().allow('')
      })
    )
  });

  return schema.validate(data);
};

module.exports = {
  validateSubmission,
  validateGrade
};
