const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  const Institutions = sequelize.define('Institutions', {
    institutionId: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: 'institution_id'
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    contactEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: "institutions_contact_email_key",
      field: 'contact_email'
    },
    teacherIds: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: [],
      allowNull: false,
      field: 'teacher_ids'
    },
    studentIds: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: [],
      allowNull: false,
      field: 'student_ids'
    },
    // Virtual fields that will be populated by associations
    teacherCount: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.teacherIds ? this.teacherIds.length : 0;
      }
    },
    studentCount: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.studentIds ? this.studentIds.length : 0;
      }
    }
  }, {
    sequelize,
    tableName: 'institutions',
    schema: 'public',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        name: "institutions_contact_email_key",
        unique: true,
        fields: [
          { name: "contact_email" },
        ]
      },
      {
        name: "institutions_pkey",
        unique: true,
        fields: [
          { name: "institution_id" },
        ]
      },
    ]
  });

  // Instance method to get all members with details
  Institutions.prototype.getAllMembers = async function() {
    const teachers = await sequelize.models.Teachers.findAll({
      where: {
        teacherId: this.teacherIds
      },
      include: [{
        model: sequelize.models.Users,
        as: 'user',
        attributes: ['firstName', 'lastName', 'email']
      }]
    });

    const students = await sequelize.models.Students.findAll({
      where: {
        studentId: this.studentIds
      },
      include: [{
        model: sequelize.models.Users,
        as: 'user',
        attributes: ['firstName', 'lastName', 'email']
      }]
    });

    return {
      teachers,
      students,
      counts: {
        teachers: this.teacherCount,
        students: this.studentCount
      }
    };
  };

  // Instance method to add a teacher
  Institutions.prototype.addTeacher = async function(teacherId) {
    if (!this.teacherIds.includes(teacherId)) {
      this.teacherIds = [...this.teacherIds, teacherId];
      await this.save();
    }
  };

  // Instance method to add a student
  Institutions.prototype.addStudent = async function(studentId) {
    if (!this.studentIds.includes(studentId)) {
      this.studentIds = [...this.studentIds, studentId];
      await this.save();
    }
  };

  // Instance method to remove a teacher
  Institutions.prototype.removeTeacher = async function(teacherId) {
    this.teacherIds = this.teacherIds.filter(id => id !== teacherId);
    await this.save();
  };

  // Instance method to remove a student
  Institutions.prototype.removeStudent = async function(studentId) {
    this.studentIds = this.studentIds.filter(id => id !== studentId);
    await this.save();
  };

  return Institutions;
};

