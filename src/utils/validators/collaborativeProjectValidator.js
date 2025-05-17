const Joi = require('joi');

/**
 * Validate collaborative project data
 * @param {Object} data - The project data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateCollaborativeProject = (data, isUpdate = false) => {
  const schema = Joi.object({
    courseId: Joi.number().integer().positive().allow(null),
    classId: Joi.number().integer().positive().allow(null),
    title: isUpdate ? Joi.string().max(255) : Joi.string().max(255).required(),
    description: isUpdate ? Joi.string() : Joi.string().required(),
    objectives: Joi.array().items(Joi.string()),
    instructions: Joi.string(),
    createdBy: Joi.number().integer().positive(),
    startDate: Joi.date(),
    dueDate: Joi.date().greater(Joi.ref('startDate')),
    maxTeamSize: Joi.number().integer().positive(),
    minTeamSize: Joi.number().integer().positive().min(1),
    allowTeamFormation: Joi.boolean(),
    status: Joi.string().valid('draft', 'active', 'completed', 'archived'),
    gradingRubric: Joi.array().items(
      Joi.object({
        criterion: Joi.string().required(),
        description: Joi.string(),
        maxPoints: Joi.number().positive().required(),
        levels: Joi.array().items(
          Joi.object({
            level: Joi.string().required(),
            description: Joi.string().required(),
            points: Joi.number().min(0).required()
          })
        )
      })
    ),
    totalPoints: Joi.number().precision(2).positive(),
    resources: Joi.array().items(
      Joi.object({
        title: Joi.string().required(),
        description: Joi.string(),
        url: Joi.string().uri(),
        type: Joi.string()
      })
    ),
    attachments: Joi.array().items(
      Joi.object({
        fileName: Joi.string().required(),
        fileUrl: Joi.string().uri().required(),
        fileType: Joi.string(),
        fileSize: Joi.number().integer().positive()
      })
    ),
    tags: Joi.array().items(Joi.string())
  }).custom((value, helpers) => {
    // At least one of courseId or classId must be provided
    if (!value.courseId && !value.classId) {
      return helpers.error('any.custom', { message: 'At least one of courseId or classId must be provided' });
    }
    
    // If minTeamSize and maxTeamSize are both provided, minTeamSize must be <= maxTeamSize
    if (value.minTeamSize && value.maxTeamSize && value.minTeamSize > value.maxTeamSize) {
      return helpers.error('any.custom', { message: 'minTeamSize must be less than or equal to maxTeamSize' });
    }
    
    return value;
  });

  return schema.validate(data);
};

/**
 * Validate project team data
 * @param {Object} data - The team data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateProjectTeam = (data, isUpdate = false) => {
  const schema = Joi.object({
    projectId: isUpdate ? Joi.number().integer().positive() : Joi.number().integer().positive().required(),
    name: isUpdate ? Joi.string().max(255) : Joi.string().max(255).required(),
    description: Joi.string(),
    createdBy: Joi.number().integer().positive(),
    teamLeaderId: Joi.number().integer().positive(),
    status: Joi.string().valid('forming', 'active', 'completed'),
    submissionStatus: Joi.string().valid('not_submitted', 'in_progress', 'submitted', 'graded'),
    submissionDate: Joi.date(),
    grade: Joi.number().precision(2).min(0),
    feedback: Joi.string(),
    gradedBy: Joi.number().integer().positive(),
    gradedAt: Joi.date(),
    submissionFiles: Joi.array().items(
      Joi.object({
        fileName: Joi.string().required(),
        fileUrl: Joi.string().uri().required(),
        fileType: Joi.string(),
        fileSize: Joi.number().integer().positive()
      })
    ),
    submissionNotes: Joi.string()
  });

  return schema.validate(data);
};

/**
 * Validate team member data
 * @param {Object} data - The team member data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateTeamMember = (data, isUpdate = false) => {
  const schema = Joi.object({
    teamId: isUpdate ? Joi.number().integer().positive() : Joi.number().integer().positive().required(),
    studentId: isUpdate ? Joi.number().integer().positive() : Joi.number().integer().positive().required(),
    role: Joi.string().max(100),
    invitedBy: Joi.number().integer().positive(),
    status: Joi.string().valid('invited', 'active', 'left', 'removed'),
    contributionScore: Joi.number().precision(2).min(0).max(100),
    peerFeedback: Joi.array().items(
      Joi.object({
        fromStudentId: Joi.number().integer().positive().required(),
        rating: Joi.number().integer().min(1).max(5).required(),
        feedback: Joi.string(),
        submittedAt: Joi.date()
      })
    ),
    individualGrade: Joi.number().precision(2).min(0)
  });

  return schema.validate(data);
};

module.exports = {
  validateCollaborativeProject,
  validateProjectTeam,
  validateTeamMember
};
