var DataTypes = require("sequelize").DataTypes;
var _Admins = require("./admins");
var _Assignments = require("./assignments");
var _ContentBlocks = require("./contentBlocks");
var _Courses = require("./courses");
var _Enrollments = require("./enrollments");
var _Institutions = require("./institutions");
var _Lessons = require("./lessons");
var _Messages = require("./messages");
var _OtpCodes = require("./otpCodes");
var _ParentStudentLink = require("./parentStudentLink");
var _Parents = require("./parents");
var _QuizAnswers = require("./quizAnswers");
var _QuizQuestions = require("./quizQuestions");
var _Quizzes = require("./quizzes");
var _StudentQuizAttempts = require("./studentQuizAttempts");
var _StudentQuizResponses = require("./studentQuizResponses");
var _Students = require("./students");
var _Submissions = require("./submissions");
var _Teachers = require("./teachers");
var _TeacherInstitutions = require("./teacherInstitutions");
var _Users = require("./users");
var _Classes = require("./classes");
var _ClassEnrollments = require("./classEnrollments");

function initModels(sequelize) {
  var Admins = _Admins(sequelize, DataTypes);
  var Assignments = _Assignments(sequelize, DataTypes);
  var ContentBlocks = _ContentBlocks(sequelize, DataTypes);
  var Courses = _Courses(sequelize, DataTypes);
  var Enrollments = _Enrollments(sequelize, DataTypes);
  var Institutions = _Institutions(sequelize, DataTypes);
  var Lessons = _Lessons(sequelize, DataTypes);
  var Messages = _Messages(sequelize, DataTypes);
  var OtpCodes = _OtpCodes(sequelize, DataTypes);
  var ParentStudentLink = _ParentStudentLink(sequelize, DataTypes);
  var Parents = _Parents(sequelize, DataTypes);
  var QuizAnswers = _QuizAnswers(sequelize, DataTypes);
  var QuizQuestions = _QuizQuestions(sequelize, DataTypes);
  var Quizzes = _Quizzes(sequelize, DataTypes);
  var StudentQuizAttempts = _StudentQuizAttempts(sequelize, DataTypes);
  var StudentQuizResponses = _StudentQuizResponses(sequelize, DataTypes);
  var Students = _Students(sequelize, DataTypes);
  var Submissions = _Submissions(sequelize, DataTypes);
  var Teachers = _Teachers(sequelize, DataTypes);
  var TeacherInstitutions = _TeacherInstitutions(sequelize, DataTypes);
  var Users = _Users(sequelize, DataTypes);
  var Classes = _Classes(sequelize, DataTypes);
  var ClassEnrollments = _ClassEnrollments(sequelize, DataTypes);

  Parents.belongsToMany(Students, { as: 'studentIdStudents', through: ParentStudentLink, foreignKey: "parentId", otherKey: "studentId" });
  Students.belongsToMany(Parents, { as: 'parentIdParents', through: ParentStudentLink, foreignKey: "studentId", otherKey: "parentId" });
  Submissions.belongsTo(Assignments, { as: "assignment", foreignKey: "assignmentId"});
  Assignments.hasMany(Submissions, { as: "submissions", foreignKey: "assignmentId"});
  Assignments.belongsTo(Courses, { as: "course", foreignKey: "courseId"});
  Courses.hasMany(Assignments, { as: "assignments", foreignKey: "courseId"});
  Enrollments.belongsTo(Courses, { as: "course", foreignKey: "courseId"});
  Courses.hasMany(Enrollments, { as: "enrollments", foreignKey: "courseId"});
  Lessons.belongsTo(Courses, { as: "course", foreignKey: "courseId"});
  Courses.hasMany(Lessons, { as: "lessons", foreignKey: "courseId"});
  Quizzes.belongsTo(Courses, { as: "course", foreignKey: "courseId"});
  Courses.hasMany(Quizzes, { as: "quizzes", foreignKey: "courseId"});
  Admins.belongsTo(Institutions, { as: "institution", foreignKey: "institutionId"});
  Institutions.hasMany(Admins, { as: "admins", foreignKey: "institutionId"});
  Courses.belongsTo(Institutions, { as: "institution", foreignKey: "institutionId"});
  Institutions.hasMany(Courses, { as: "courses", foreignKey: "institutionId"});
  Students.belongsTo(Institutions, { as: "institution", foreignKey: "institutionId"});
  Institutions.hasMany(Students, { as: "students", foreignKey: "institutionId"});
  // Many-to-Many relationship between Teachers and Institutions
  Teachers.belongsToMany(Institutions, {
    through: TeacherInstitutions,
    as: 'institutions',
    foreignKey: 'teacherId',
    otherKey: 'institutionId'
  });
  Institutions.belongsTo(Users, { as: 'user', foreignKey: 'userId' });
Institutions.belongsToMany(Teachers, {
    through: TeacherInstitutions,
    as: 'teachers',
    foreignKey: 'institutionId',
    otherKey: 'teacherId'
  });

  // Direct associations with the junction table
  TeacherInstitutions.belongsTo(Teachers, { as: 'teacher', foreignKey: 'teacherId' });
  Teachers.hasMany(TeacherInstitutions, { as: 'teacherInstitutions', foreignKey: 'teacherId' });
  TeacherInstitutions.belongsTo(Institutions, { as: 'institution', foreignKey: 'institutionId' });
  Institutions.hasMany(TeacherInstitutions, { as: 'teacherInstitutions', foreignKey: 'institutionId' });
  Assignments.belongsTo(Lessons, { as: "lesson", foreignKey: "lessonId"});
  Lessons.hasMany(Assignments, { as: "assignments", foreignKey: "lessonId"});
  ContentBlocks.belongsTo(Lessons, { as: "lesson", foreignKey: "lessonId"});
  Lessons.hasMany(ContentBlocks, { as: "contentBlocks", foreignKey: "lessonId"});
  Quizzes.belongsTo(Lessons, { as: "lesson", foreignKey: "lessonId"});
  Lessons.hasMany(Quizzes, { as: "quizzes", foreignKey: "lessonId"});
  ParentStudentLink.belongsTo(Parents, { as: "parent", foreignKey: "parentId"});
  Parents.hasMany(ParentStudentLink, { as: "parentStudentLinks", foreignKey: "parentId"});
  StudentQuizResponses.belongsTo(QuizAnswers, { as: "chosenAnswer", foreignKey: "chosenAnswerId"});
  QuizAnswers.hasMany(StudentQuizResponses, { as: "studentQuizResponses", foreignKey: "chosenAnswerId"});
  QuizAnswers.belongsTo(QuizQuestions, { as: "question", foreignKey: "questionId"});
  QuizQuestions.hasMany(QuizAnswers, { as: "quizAnswers", foreignKey: "questionId"});
  StudentQuizResponses.belongsTo(QuizQuestions, { as: "question", foreignKey: "questionId"});
  QuizQuestions.hasMany(StudentQuizResponses, { as: "studentQuizResponses", foreignKey: "questionId"});
  QuizQuestions.belongsTo(Quizzes, { as: "quiz", foreignKey: "quizId"});
  Quizzes.hasMany(QuizQuestions, { as: "quizQuestions", foreignKey: "quizId"});
  StudentQuizAttempts.belongsTo(Quizzes, { as: "quiz", foreignKey: "quizId"});
  Quizzes.hasMany(StudentQuizAttempts, { as: "studentQuizAttempts", foreignKey: "quizId"});
  StudentQuizResponses.belongsTo(StudentQuizAttempts, { as: "attempt", foreignKey: "attemptId"});
  StudentQuizAttempts.hasMany(StudentQuizResponses, { as: "studentQuizResponses", foreignKey: "attemptId"});
  Enrollments.belongsTo(Students, { as: "student", foreignKey: "studentId"});
  Students.hasMany(Enrollments, { as: "enrollments", foreignKey: "studentId"});
  ParentStudentLink.belongsTo(Students, { as: "student", foreignKey: "studentId"});
  Students.hasMany(ParentStudentLink, { as: "parentStudentLinks", foreignKey: "studentId"});
  StudentQuizAttempts.belongsTo(Students, { as: "student", foreignKey: "studentId"});
  Students.hasMany(StudentQuizAttempts, { as: "studentQuizAttempts", foreignKey: "studentId"});
  Submissions.belongsTo(Students, { as: "student", foreignKey: "studentId"});
  Students.hasMany(Submissions, { as: "submissions", foreignKey: "studentId"});
  Courses.belongsTo(Teachers, { as: "teacher", foreignKey: "teacherId"});
  Teachers.hasMany(Courses, { as: "courses", foreignKey: "teacherId"});
  Admins.belongsTo(Users, { as: "user", foreignKey: "userId"});
  Users.hasOne(Admins, { as: "admin", foreignKey: "userId"});
  Messages.belongsTo(Users, { as: "receiver", foreignKey: "receiverId"});
  Users.hasMany(Messages, { as: "messages", foreignKey: "receiverId"});
  Messages.belongsTo(Users, { as: "sender", foreignKey: "senderId"});
  Users.hasMany(Messages, { as: "senderMessages", foreignKey: "senderId"});
  OtpCodes.belongsTo(Users, { as: "user", foreignKey: "userId"});
  Users.hasMany(OtpCodes, { as: "otpCodes", foreignKey: "userId"});
  Parents.belongsTo(Users, { as: "user", foreignKey: "userId"});
  Users.hasOne(Parents, { as: "parent", foreignKey: "userId"});
  Students.belongsTo(Users, { as: "user", foreignKey: "userId"});
  Users.hasOne(Students, { as: "student", foreignKey: "userId"});
  Submissions.belongsTo(Users, { as: "grader", foreignKey: "graderId"});
  Users.hasMany(Submissions, { as: "submissions", foreignKey: "graderId"});
  Teachers.belongsTo(Users, { as: "user", foreignKey: "userId"});
  Users.hasOne(Teachers, { as: "teacher", foreignKey: "userId"});

  return {
    Admins,
    Assignments,
    ContentBlocks,
    Courses,
    Enrollments,
    Institutions,
    Lessons,
    Messages,
    OtpCodes,
    ParentStudentLink,
    Parents,
    QuizAnswers,
    QuizQuestions,
    Quizzes,
    StudentQuizAttempts,
    StudentQuizResponses,
    Students,
    Submissions,
    Teachers,
    Users,
    TeacherInstitutions,
    Classes,
    ClassEnrollments
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
