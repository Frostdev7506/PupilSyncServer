const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TeacherProfiles', {
    profileId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'profile_id'
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'teachers',
        key: 'teacher_id'
      },
      unique: "teacher_profiles_teacher_id_key",
      field: 'teacher_id'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Professional title displayed on profile"
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Short professional summary"
    },
    detailedBio: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Detailed professional biography"
    },
    yearsOfExperience: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'years_of_experience'
    },
    education: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Array of education credentials"
    },
    certifications: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Array of professional certifications"
    },
    specializations: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      comment: "Areas of specialization"
    },
    languages: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Languages spoken with proficiency levels"
    },
    teachingPhilosophy: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'teaching_philosophy'
    },
    portfolioLinks: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'portfolio_links',
      comment: "Links to portfolios, websites, etc."
    },
    socialMediaLinks: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'social_media_links'
    },
    isFreelancer: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_freelancer',
      comment: "Whether teacher offers freelance services"
    },
    hourlyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'hourly_rate',
      comment: "Base hourly rate for freelance services"
    },
    availability: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Availability schedule for freelance work"
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      comment: "Average rating from students/clients"
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'review_count'
    },
    featuredCourses: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      field: 'featured_courses',
      comment: "IDs of courses to feature on profile"
    },
    profileVisibility: {
      type: DataTypes.ENUM('public', 'institutions_only', 'private'),
      allowNull: false,
      defaultValue: 'public',
      field: 'profile_visibility'
    },
    coverImageUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'cover_image_url'
    },
    videoIntroUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'video_intro_url'
    }
  }, {
    sequelize,
    tableName: 'teacher_profiles',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "teacher_profiles_pkey",
        unique: true,
        fields: [
          { name: "profile_id" },
        ]
      },
      {
        name: "teacher_profiles_teacher_id_key",
        unique: true,
        fields: [
          { name: "teacher_id" },
        ]
      },
      {
        name: "idx_teacher_profiles_is_freelancer",
        fields: [
          { name: "is_freelancer" },
        ]
      }
    ]
  });
};
