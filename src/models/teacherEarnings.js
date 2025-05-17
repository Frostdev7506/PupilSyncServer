const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('TeacherEarnings', {
    earningId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'earning_id'
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
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'courses',
        key: 'course_id'
      },
      field: 'course_id',
      comment: "Course associated with this earning (if applicable)"
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'students',
        key: 'student_id'
      },
      field: 'student_id',
      comment: "Student associated with this earning (if applicable)"
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Amount earned"
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: 'USD'
    },
    earningType: {
      type: DataTypes.ENUM('course_enrollment', 'private_session', 'subscription', 'bonus', 'other'),
      allowNull: false,
      field: 'earning_type'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'available', 'paid', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    earnedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now'),
      field: 'earned_at'
    },
    availableAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'available_at',
      comment: "When the earning becomes available for withdrawal"
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'paid_at',
      comment: "When the earning was paid out"
    },
    paymentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'payment_id',
      comment: "Reference to payment record when paid"
    },
    platformFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'platform_fee',
      comment: "Platform fee deducted from this earning"
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'tax_amount',
      comment: "Tax amount withheld if applicable"
    }
  }, {
    sequelize,
    tableName: 'teacher_earnings',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "teacher_earnings_pkey",
        unique: true,
        fields: [
          { name: "earning_id" },
        ]
      },
      {
        name: "idx_teacher_earnings_teacher_id",
        fields: [
          { name: "teacher_id" },
        ]
      },
      {
        name: "idx_teacher_earnings_course_id",
        fields: [
          { name: "course_id" },
        ]
      },
      {
        name: "idx_teacher_earnings_status",
        fields: [
          { name: "status" },
        ]
      },
      {
        name: "idx_teacher_earnings_earned_at",
        fields: [
          { name: "earned_at" },
        ]
      }
    ]
  });
};
