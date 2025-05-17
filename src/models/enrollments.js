const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Enrollments', {
    enrollmentId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'enrollment_id'
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id'
      },
      unique: "enrollments_student_id_course_id_key",
      field: 'student_id'
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'course_id'
      },
      unique: "enrollments_student_id_course_id_key",
      field: 'course_id'
    },
    enrollmentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now'),
      field: 'enrollment_date'
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'completed', 'dropped', 'suspended'),
      allowNull: false,
      defaultValue: 'active'
    },
    enrolledBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'enrolled_by',
      comment: "User who created this enrollment (if not self-enrolled)"
    },
    completionDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completion_date'
    },
    completionPercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
      field: 'completion_percentage'
    },
    lastAccessDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_access_date'
    },
    certificateIssued: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'certificate_issued'
    },
    certificateIssuedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'certificate_issued_date'
    },
    certificateUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: 'certificate_url'
    },
    finalGrade: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'final_grade'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    paymentStatus: {
      type: DataTypes.ENUM('not_required', 'pending', 'paid', 'refunded', 'failed'),
      allowNull: false,
      defaultValue: 'not_required',
      field: 'payment_status'
    },
    paymentAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'payment_amount'
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'payment_date'
    },
    paymentMethod: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'payment_method'
    },
    transactionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'transaction_id'
    }
  }, {
    sequelize,
    tableName: 'enrollments',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "enrollments_pkey",
        unique: true,
        fields: [
          { name: "enrollment_id" },
        ]
      },
      {
        name: "enrollments_student_id_course_id_key",
        unique: true,
        fields: [
          { name: "student_id" },
          { name: "course_id" },
        ]
      },
      {
        name: "idx_enrollments_course_id",
        fields: [
          { name: "course_id" },
        ]
      },
      {
        name: "idx_enrollments_student_id",
        fields: [
          { name: "student_id" },
        ]
      },
      {
        name: "idx_enrollments_status",
        fields: [
          { name: "status" },
        ]
      },
      {
        name: "idx_enrollments_enrollment_date",
        fields: [
          { name: "enrollment_date" },
        ]
      },
      {
        name: "idx_enrollments_completion_date",
        fields: [
          { name: "completion_date" },
        ]
      },
      {
        name: "idx_enrollments_payment_status",
        fields: [
          { name: "payment_status" },
        ]
      }
    ]
  });
};
