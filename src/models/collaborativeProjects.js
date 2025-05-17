const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('CollaborativeProjects', {
    projectId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'project_id'
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'courses',
        key: 'course_id'
      },
      field: 'course_id',
      comment: "Course this project belongs to (if applicable)"
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'classes',
        key: 'class_id'
      },
      field: 'class_id',
      comment: "Class this project belongs to (if applicable)"
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    objectives: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Array of project objectives"
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'created_by'
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'start_date'
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'due_date'
    },
    maxTeamSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'max_team_size',
      comment: "Maximum number of students per team"
    },
    minTeamSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'min_team_size',
      comment: "Minimum number of students per team"
    },
    allowTeamFormation: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'allow_team_formation',
      comment: "Whether students can form their own teams"
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'completed', 'archived'),
      allowNull: false,
      defaultValue: 'draft'
    },
    gradingRubric: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'grading_rubric',
      comment: "Rubric criteria for grading"
    },
    totalPoints: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'total_points'
    },
    resources: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Array of resource links and materials"
    },
    attachments: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Array of attachment objects with URLs and metadata"
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'collaborative_projects',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "collaborative_projects_pkey",
        unique: true,
        fields: [
          { name: "project_id" },
        ]
      },
      {
        name: "idx_collaborative_projects_course_id",
        fields: [
          { name: "course_id" },
        ]
      },
      {
        name: "idx_collaborative_projects_class_id",
        fields: [
          { name: "class_id" },
        ]
      },
      {
        name: "idx_collaborative_projects_created_by",
        fields: [
          { name: "created_by" },
        ]
      },
      {
        name: "idx_collaborative_projects_status",
        fields: [
          { name: "status" },
        ]
      },
      {
        name: "idx_collaborative_projects_due_date",
        fields: [
          { name: "due_date" },
        ]
      }
    ]
  });
};
