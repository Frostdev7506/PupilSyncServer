const Joi = require('joi');

/**
 * Validate teacher profile data
 * @param {Object} data - The profile data to validate
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - Validation result
 */
const validateTeacherProfile = (data, isUpdate = false) => {
  const schema = Joi.object({
    teacherId: isUpdate ? Joi.number().integer().positive() : Joi.number().integer().positive().required(),
    title: Joi.string().max(255),
    summary: Joi.string(),
    detailedBio: Joi.string(),
    yearsOfExperience: Joi.number().integer().min(0),
    education: Joi.array().items(
      Joi.object({
        institution: Joi.string().required(),
        degree: Joi.string().required(),
        fieldOfStudy: Joi.string(),
        from: Joi.date(),
        to: Joi.date().greater(Joi.ref('from')),
        current: Joi.boolean(),
        description: Joi.string()
      })
    ),
    certifications: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        issuer: Joi.string().required(),
        issueDate: Joi.date(),
        expiryDate: Joi.date().greater(Joi.ref('issueDate')),
        credentialId: Joi.string(),
        credentialUrl: Joi.string().uri()
      })
    ),
    specializations: Joi.array().items(Joi.string()),
    languages: Joi.array().items(
      Joi.object({
        language: Joi.string().required(),
        proficiency: Joi.string().valid('beginner', 'intermediate', 'advanced', 'native').required()
      })
    ),
    teachingPhilosophy: Joi.string(),
    portfolioLinks: Joi.array().items(
      Joi.object({
        title: Joi.string().required(),
        url: Joi.string().uri().required(),
        description: Joi.string()
      })
    ),
    socialMediaLinks: Joi.object({
      linkedin: Joi.string().uri(),
      twitter: Joi.string().uri(),
      facebook: Joi.string().uri(),
      instagram: Joi.string().uri(),
      youtube: Joi.string().uri(),
      website: Joi.string().uri(),
      other: Joi.array().items(
        Joi.object({
          platform: Joi.string().required(),
          url: Joi.string().uri().required()
        })
      )
    }),
    isFreelancer: Joi.boolean(),
    hourlyRate: Joi.number().precision(2).min(0),
    availability: Joi.object({
      schedule: Joi.array().items(
        Joi.object({
          day: Joi.string().valid('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday').required(),
          startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
          endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
        })
      ),
      timezone: Joi.string(),
      availableFrom: Joi.date(),
      availableTo: Joi.date().greater(Joi.ref('availableFrom'))
    }),
    featuredCourses: Joi.array().items(Joi.number().integer().positive()),
    profileVisibility: Joi.string().valid('public', 'institutions_only', 'private'),
    coverImageUrl: Joi.string().uri(),
    videoIntroUrl: Joi.string().uri()
  });

  return schema.validate(data);
};

module.exports = {
  validateTeacherProfile
};
