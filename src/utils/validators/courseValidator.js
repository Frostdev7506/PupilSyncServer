const Joi = require('joi');

/**
 * Validate course data
 * @param {Object} data - The course data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateCourse = (data, isUpdate = false) => {
  const schema = Joi.object({
    title: isUpdate ? Joi.string().min(3).max(100) : Joi.string().min(3).max(100).required(),
    description: isUpdate ? Joi.string().min(10).max(2000) : Joi.string().min(10).max(2000).required(),
    teacherId: isUpdate ? Joi.number().integer() : Joi.number().integer().required(),
    institutionId: isUpdate ? Joi.number().integer() : Joi.number().integer().required(),
    price: Joi.number().min(0),
    isPublished: Joi.boolean(),
    startDate: Joi.date(),
    endDate: Joi.date().min(Joi.ref('startDate')),
    enrollmentLimit: Joi.number().integer().min(1),
    format: Joi.string().valid('online', 'blended', 'in-person', 'self-paced', 'project-based'),
    formatSettings: Joi.object(),
    syllabus: Joi.object(),
    categories: Joi.array().items(Joi.number().integer()),
    primaryCategoryId: Joi.number().integer(),
    thumbnail: Joi.string().uri(),
    prerequisites: Joi.array().items(Joi.string()),
    learningOutcomes: Joi.array().items(Joi.string()),
    level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'all-levels'),
    estimatedDuration: Joi.number().integer().min(1),
    durationUnit: Joi.string().valid('hours', 'days', 'weeks', 'months'),
    language: Joi.string(),
    tags: Joi.array().items(Joi.string()),
    isFeatured: Joi.boolean(),
    isArchived: Joi.boolean()
  });

  return schema.validate(data);
};

/**
 * Validate course syllabus data
 * @param {Object} data - The syllabus data to validate
 * @returns {Object} - Validation result
 */
const validateCourseSyllabus = (data) => {
  const schema = Joi.object({
    sections: Joi.array().items(
      Joi.object({
        title: Joi.string().required(),
        description: Joi.string(),
        topics: Joi.array().items(Joi.string())
      })
    ).required(),
    objectives: Joi.array().items(Joi.string()),
    materials: Joi.array().items(Joi.string()),
    assessmentMethods: Joi.array().items(Joi.string())
  });

  return schema.validate(data);
};

/**
 * Validate course format settings
 * @param {string} format - The course format
 * @param {Object} data - The format settings to validate
 * @returns {Object} - Validation result
 */
const validateCourseFormatSettings = (format, data) => {
  let schema;

  switch (format) {
    case 'online':
      schema = Joi.object({
        platform: Joi.string().required(),
        isLive: Joi.boolean(),
        isRecorded: Joi.boolean(),
        meetingUrl: Joi.string().uri(),
        meetingSchedule: Joi.array().items(
          Joi.object({
            day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
            startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
            endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
            timeZone: Joi.string()
          })
        )
      });
      break;
    case 'blended':
      schema = Joi.object({
        onlineComponent: Joi.object({
          platform: Joi.string(),
          percentage: Joi.number().min(0).max(100)
        }),
        inPersonComponent: Joi.object({
          location: Joi.string(),
          percentage: Joi.number().min(0).max(100)
        }),
        schedule: Joi.array().items(
          Joi.object({
            type: Joi.string().valid('online', 'in-person'),
            day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
            startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
            endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
            location: Joi.string(),
            meetingUrl: Joi.string().uri()
          })
        )
      });
      break;
    case 'in-person':
      schema = Joi.object({
        location: Joi.string().required(),
        room: Joi.string(),
        capacity: Joi.number().integer().min(1),
        schedule: Joi.array().items(
          Joi.object({
            day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
            startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
            endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          })
        )
      });
      break;
    case 'self-paced':
      schema = Joi.object({
        estimatedCompletionTime: Joi.number().integer().min(1),
        timeUnit: Joi.string().valid('hours', 'days', 'weeks', 'months'),
        hasDeadlines: Joi.boolean(),
        deadlines: Joi.array().items(
          Joi.object({
            title: Joi.string(),
            date: Joi.date(),
            description: Joi.string()
          })
        )
      });
      break;
    case 'project-based':
      schema = Joi.object({
        projectCount: Joi.number().integer().min(1),
        projectDeadlines: Joi.array().items(
          Joi.object({
            projectTitle: Joi.string(),
            deadline: Joi.date(),
            description: Joi.string()
          })
        ),
        groupWork: Joi.boolean(),
        maxGroupSize: Joi.number().integer().min(2)
      });
      break;
    default:
      schema = Joi.object({});
  }

  return schema.validate(data);
};

module.exports = {
  validateCourse,
  validateCourseSyllabus,
  validateCourseFormatSettings
};
