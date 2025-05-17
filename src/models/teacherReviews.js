const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TeacherReviews', {
    reviewId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'review_id'
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'teachers',
        key: 'teacher_id'
      },
      field: 'teacher_id'
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id'
      },
      field: 'student_id'
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'courses',
        key: 'course_id'
      },
      field: 'course_id',
      comment: "Course associated with this review (if applicable)"
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      },
      comment: "Rating from 1-5"
    },
    reviewText: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'review_text'
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_public'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    moderatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'moderated_by'
    },
    moderatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'moderated_at'
    },
    moderationNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'moderation_notes'
    },
    teacherResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'teacher_response',
      comment: "Teacher's response to the review"
    },
    teacherResponseAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'teacher_response_at'
    },
    helpfulCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'helpful_count',
      comment: "Number of users who found this review helpful"
    },
    reportCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'report_count',
      comment: "Number of users who reported this review"
    }
  }, {
    sequelize,
    tableName: 'teacher_reviews',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "teacher_reviews_pkey",
        unique: true,
        fields: [
          { name: "review_id" },
        ]
      },
      {
        name: "idx_teacher_reviews_teacher_id",
        fields: [
          { name: "teacher_id" },
        ]
      },
      {
        name: "idx_teacher_reviews_student_id",
        fields: [
          { name: "student_id" },
        ]
      },
      {
        name: "idx_teacher_reviews_course_id",
        fields: [
          { name: "course_id" },
        ]
      },
      {
        name: "idx_teacher_reviews_rating",
        fields: [
          { name: "rating" },
        ]
      },
      {
        name: "idx_teacher_reviews_status",
        fields: [
          { name: "status" },
        ]
      }
    ]
  });
};
