const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ExamQuestionAssignments', {
    assignmentId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'assignment_id'
    },
    examStudentAssignmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'exam_student_assignments',
        key: 'assignment_id'
      },
      field: 'exam_student_assignment_id'
    },
    questionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'exam_questions',
        key: 'question_id'
      },
      field: 'question_id'
    },
    orderNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'order_number'
    },
    customPoints: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      field: 'custom_points',
      comment: 'Custom points for this student, overrides question points'
    }
  }, {
    sequelize,
    tableName: 'exam_question_assignments',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "exam_question_assignments_pkey",
        unique: true,
        fields: [
          { name: "assignment_id" },
        ]
      },
      {
        name: "idx_exam_question_assignments_exam_student_assignment_id",
        fields: [
          { name: "exam_student_assignment_id" },
        ]
      },
      {
        name: "idx_exam_question_assignments_question_id",
        fields: [
          { name: "question_id" },
        ]
      },
      {
        name: "idx_exam_question_assignments_unique",
        unique: true,
        fields: [
          { name: "exam_student_assignment_id" },
          { name: "question_id" },
        ]
      }
    ]
  });
};
