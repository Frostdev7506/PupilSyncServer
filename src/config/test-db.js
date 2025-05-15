const { Sequelize, DataTypes } = require('sequelize');
const logger = require('../utils/logger');

// Configure SQLite for testing
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false,
  define: {
    timestamps: true,
    paranoid: true,
    underscored: true
  },
  // Handle SQLite-specific configuration
  dialectOptions: {
    // Enable foreign keys in SQLite
    pragma: {
      'foreign_keys': 'ON'
    }
  }
});

// Define models directly for SQLite compatibility
// This approach ensures we have full control over the model definitions
// and can adapt them for SQLite's limitations

// Users model
const Users = sequelize.define('Users', {
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'user_id'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_hash'
  },
  firstName: {
    type: DataTypes.STRING,
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING,
    field: 'last_name'
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified'
  },
  verificationToken: {
    type: DataTypes.STRING,
    field: 'verification_token'
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login'
  }
}, {
  tableName: 'users',
  timestamps: true,
  paranoid: true,
  underscored: true
});

// Institutions model
const Institutions = sequelize.define('Institutions', {
  institutionId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'institution_id'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.TEXT
  },
  contactEmail: {
    type: DataTypes.STRING,
    field: 'contact_email'
  }
}, {
  tableName: 'institutions',
  timestamps: true,
  paranoid: true,
  underscored: true
});

// Students model
const Students = sequelize.define('Students', {
  studentId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'student_id'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  institutionId: {
    type: DataTypes.INTEGER,
    field: 'institution_id',
    references: {
      model: 'institutions',
      key: 'institution_id'
    }
  },
  gradeLevel: {
    type: DataTypes.STRING,
    field: 'grade_level'
  }
}, {
  tableName: 'students',
  timestamps: true,
  paranoid: true,
  underscored: true
});

// Teachers model
const Teachers = sequelize.define('Teachers', {
  teacherId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'teacher_id'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  subjectExpertise: {
    type: DataTypes.STRING,
    field: 'subject_expertise'
  },
  bio: {
    type: DataTypes.TEXT
  },
  profilePictureUrl: {
    type: DataTypes.STRING,
    field: 'profile_picture_url'
  }
}, {
  tableName: 'teachers',
  timestamps: true,
  paranoid: true,
  underscored: true
});

// Courses model
const Courses = sequelize.define('Courses', {
  courseId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'course_id'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'courses',
  timestamps: true,
  paranoid: true,
  underscored: true
});

// Classes model
const Classes = sequelize.define('Classes', {
  classId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'class_id'
  },
  courseId: {
    type: DataTypes.INTEGER,
    field: 'course_id',
    references: {
      model: 'courses',
      key: 'course_id'
    }
  },
  institutionId: {
    type: DataTypes.INTEGER,
    field: 'institution_id',
    references: {
      model: 'institutions',
      key: 'institution_id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'classes',
  timestamps: true,
  paranoid: true,
  underscored: true
});

// TeacherInstitutions model (junction table)
const TeacherInstitutions = sequelize.define('TeacherInstitutions', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'teacher_id',
    references: {
      model: 'teachers',
      key: 'teacher_id'
    }
  },
  institutionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'institution_id',
    references: {
      model: 'institutions',
      key: 'institution_id'
    }
  },
  isPrimary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_primary'
  }
}, {
  tableName: 'teacher_institutions',
  timestamps: true,
  paranoid: true,
  underscored: true
});

// Define associations
Institutions.belongsTo(Users, { foreignKey: 'userId', as: 'user' });
Users.hasOne(Institutions, { foreignKey: 'userId' });

Students.belongsTo(Users, { foreignKey: 'userId', as: 'user' });
Users.hasOne(Students, { foreignKey: 'userId' });

Students.belongsTo(Institutions, { foreignKey: 'institutionId' });
Institutions.hasMany(Students, { foreignKey: 'institutionId', as: 'Students' });

Teachers.belongsTo(Users, { foreignKey: 'userId', as: 'user' });
Users.hasOne(Teachers, { foreignKey: 'userId' });

Classes.belongsTo(Courses, { foreignKey: 'courseId', as: 'Course' });
Courses.hasMany(Classes, { foreignKey: 'courseId' });

Classes.belongsTo(Institutions, { foreignKey: 'institutionId' });
Institutions.hasMany(Classes, { foreignKey: 'institutionId', as: 'Classes' });

// Many-to-many relationship between Teachers and Institutions
TeacherInstitutions.belongsTo(Teachers, { foreignKey: 'teacherId', as: 'Teacher' });
Teachers.hasMany(TeacherInstitutions, { foreignKey: 'teacherId', as: 'TeacherLinks' });

TeacherInstitutions.belongsTo(Institutions, { foreignKey: 'institutionId', as: 'Institution' });
Institutions.hasMany(TeacherInstitutions, { foreignKey: 'institutionId', as: 'InstitutionLinks' });

// Define the many-to-many relationships with unique aliases
Teachers.belongsToMany(Institutions, {
  through: TeacherInstitutions,
  foreignKey: 'teacherId',
  otherKey: 'institutionId',
  as: 'InstitutionsList'
});

Institutions.belongsToMany(Teachers, {
  through: TeacherInstitutions,
  foreignKey: 'institutionId',
  otherKey: 'teacherId',
  as: 'Teachers'
});

// Connect to the database and sync all models
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('SQLite in-memory connection established for testing');

    // Force sync all models to create tables
    await sequelize.sync({ force: true });
    logger.info('Database schema synchronized successfully');

    return sequelize;
  } catch (err) {
    logger.error(`SQLite connection failed: ${err.message}`);
    throw err;
  }
};

// Create a models object to export
const models = {
  Users,
  Institutions,
  Students,
  Teachers,
  Classes,
  Courses,
  TeacherInstitutions
};

module.exports = {
  sequelize,
  connectDB,
  models
};
