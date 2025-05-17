const Joi = require('joi');

/**
 * Validate parent access settings data
 * @param {Object} data - The settings data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateParentAccessSettings = (data, isUpdate = false) => {
  const schema = Joi.object({
    parentId: isUpdate ? Joi.number().integer().positive() : Joi.number().integer().positive().required(),
    studentId: isUpdate ? Joi.number().integer().positive() : Joi.number().integer().positive().required(),
    canAccessGrades: Joi.boolean().default(true),
    canAccessAttendance: Joi.boolean().default(true),
    canAccessBehavior: Joi.boolean().default(true),
    canAccessAssignments: Joi.boolean().default(true),
    canAccessExams: Joi.boolean().default(true),
    canAccessProgressReports: Joi.boolean().default(true),
    canAccessTeacherComments: Joi.boolean().default(true),
    canAccessCourseContent: Joi.boolean().default(false),
    canAccessFinancialInfo: Joi.boolean().default(true),
    canContactTeachers: Joi.boolean().default(true),
    canReceiveNotifications: Joi.boolean().default(true),
    notificationPreferences: Joi.object({
      email: Joi.boolean().default(true),
      sms: Joi.boolean().default(false),
      push: Joi.boolean().default(true),
      frequency: Joi.string().valid('immediate', 'daily', 'weekly').default('immediate')
    }),
    customSettings: Joi.object()
  });

  return schema.validate(data);
};

module.exports = {
  validateParentAccessSettings
};
