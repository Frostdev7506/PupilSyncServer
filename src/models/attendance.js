const Sequelize = require('sequelize');

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Attendance', {
    attendanceId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'attendance_id'
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
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'classes',
        key: 'class_id'
      },
      field: 'class_id'
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('present', 'absent', 'late', 'excused'),
      allowNull: false,
      defaultValue: 'present'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    markedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      },
      field: 'marked_by_id'
    },
    markedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.Sequelize.fn('now'),
      field: 'marked_at'
    }
  }, {
    sequelize,
    tableName: 'attendance',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "attendance_pkey",
        unique: true,
        fields: [
          { name: "attendance_id" },
        ]
      },
      {
        name: "idx_attendance_student_id",
        fields: [
          { name: "student_id" },
        ]
      },
      {
        name: "idx_attendance_class_id",
        fields: [
          { name: "class_id" },
        ]
      },
      {
        name: "idx_attendance_date",
        fields: [
          { name: "date" },
        ]
      },
      {
        name: "idx_attendance_student_date",
        fields: [
          { name: "student_id" },
          { name: "date" },
        ]
      }
    ]
  });
};
