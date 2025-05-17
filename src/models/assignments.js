const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Assignments', {
    assignmentId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'assignment_id'
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'course_id'
      },
      field: 'course_id'
    },
    lessonId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'lessons',
        key: 'lesson_id'
      },
      field: 'lesson_id'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_date'
    },
    availableFrom: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'available_from'
    },
    availableUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'available_until'
    },
    maxPoints: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      field: 'max_points'
    },
    submissionType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'file',
      field: 'submission_type'
    },
    allowLateSubmissions: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'allow_late_submissions'
    },
    latePenalty: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      field: 'late_penalty'
    },
    visibleToStudents: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'visible_to_students'
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'assignments',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "assignments_pkey",
        unique: true,
        fields: [
          { name: "assignment_id" },
        ]
      },
      {
        name: "idx_assignments_course_id",
        fields: [
          { name: "course_id" },
        ]
      },
      {
        name: "idx_assignments_lesson_id",
        fields: [
          { name: "lesson_id" },
        ]
      },
    ]
  });
};
