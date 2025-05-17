const Joi = require('joi');

/**
 * Validate student progress report data
 * @param {Object} data - The report data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateStudentProgressReport = (data, isUpdate = false) => {
  const schema = Joi.object({
    studentId: isUpdate ? Joi.number().integer().positive() : Joi.number().integer().positive().required(),
    teacherId: isUpdate ? Joi.number().integer().positive() : Joi.number().integer().positive(),
    courseId: Joi.number().integer().positive(),
    classId: Joi.number().integer().positive(),
    reportType: Joi.string().valid(
      'weekly', 
      'monthly', 
      'quarterly', 
      'semester', 
      'annual', 
      'custom'
    ).default('custom'),
    title: isUpdate ? Joi.string().max(255) : Joi.string().max(255).required(),
    content: isUpdate ? Joi.string() : Joi.string().required(),
    academicPerformance: Joi.object({
      overallGrade: Joi.string(),
      overallPercentage: Joi.number().min(0).max(100),
      strengths: Joi.array().items(Joi.string()),
      areasForImprovement: Joi.array().items(Joi.string()),
      comments: Joi.string()
    }),
    behavioralAssessment: Joi.object({
      classParticipation: Joi.string().valid('excellent', 'good', 'satisfactory', 'needs_improvement', 'poor'),
      teamwork: Joi.string().valid('excellent', 'good', 'satisfactory', 'needs_improvement', 'poor'),
      behavior: Joi.string().valid('excellent', 'good', 'satisfactory', 'needs_improvement', 'poor'),
      comments: Joi.string()
    }),
    attendanceData: Joi.object({
      present: Joi.number().integer().min(0),
      absent: Joi.number().integer().min(0),
      late: Joi.number().integer().min(0),
      excused: Joi.number().integer().min(0),
      comments: Joi.string()
    }),
    goals: Joi.array().items(
      Joi.object({
        description: Joi.string().required(),
        status: Joi.string().valid('not_started', 'in_progress', 'completed', 'deferred'),
        dueDate: Joi.date(),
        comments: Joi.string()
      })
    ),
    recommendations: Joi.array().items(Joi.string()),
    reportDate: Joi.date().default(Date.now),
    periodStart: Joi.date(),
    periodEnd: Joi.date().greater(Joi.ref('periodStart')),
    isPublished: Joi.boolean().default(true),
    publishedAt: Joi.date(),
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
  validateStudentProgressReport
};
