var DataTypes = require("sequelize").DataTypes;
var _SequelizeMeta = require("./sequelizeMeta");
var _Users = require("./users");
var _Institutions = require("./institutions");
var _CourseCategories = require("./courseCategories");
var _Teachers = require("./teachers");
var _Students = require("./students");
var _Admins = require("./admins");
var _Parents = require("./parents");
var _ParentStudentLink = require("./parentStudentLink");
var _ParentNotifications = require("./parentNotifications"); // Moved ParentNotifications import
var _Courses = require("./courses");
var _Lessons = require("./lessons");
var _ContentBlocks = require("./contentBlocks");
var _Quizzes = require("./quizzes");
var _QuizQuestions = require("./quizQuestions");
var _QuizAnswers = require("./quizAnswers");
var _Classes = require("./classes");
var _Exams = require("./exams");
var _ExamQuestions = require("./examQuestions");
var _ExamAnswers = require("./examAnswers");
var _ExamStudentAssignments = require("./examStudentAssignments");
var _ExamQuestionAssignments = require("./examQuestionAssignments");
var _StudentExamAttempts = require("./studentExamAttempts");
var _StudentExamResponses = require("./studentExamResponses");
var _Messages = require("./messages");
var _Assignments = require("./assignments"); // Moved Assignment import
var _Submissions = require("./submissions"); // Moved Submission import
var _AssignmentRubrics = require("./assignmentRubrics"); // Moved AssignmentRubrics import
var _RubricCriteria = require("./rubricCriteria"); // Moved RubricCriteria import
var _RubricScores = require("./rubricScores"); // Moved RubricScores import
var _StudentQuizAttempts = require("./studentQuizAttempts");
var _StudentQuizResponses = require("./studentQuizResponses");
var _LearningAnalytics = require("./learningAnalytics");
var _CollaborativeProjects = require("./collaborativeProjects");
var _ProjectTeams = require("./projectTeams");
var _AnalyticsEvents = require("./analyticsEvents"); // Moved AnalyticsEvents import
var _Attendance = require("./attendance"); // Moved Attendance import
var _ChatRooms = require("./ChatRooms"); // Moved ChatRooms import
var _ChatParticipants = require("./ChatParticipants"); // Moved ChatParticipants import
var _ChatMessages = require("./ChatMessages"); // Moved ChatMessages import
var _ClassEnrollments = require("./classEnrollments"); // Moved ClassEnrollments import
var _ContentEngagements = require("./contentEngagements"); // Moved ContentEngagements import
var _CourseCategoryMappings = require("./courseCategoryMappings"); // Moved CourseCategoryMappings import
var _CourseReviews = require("./courseReviews"); // Moved CourseReviews import
var _DiscussionForums = require("./discussionForums"); // Moved DiscussionForums import
var _DiscussionTopics = require("./discussionTopics"); // Moved DiscussionTopics import
var _DiscussionReplies = require("./discussionReplies"); // Moved DiscussionReplies import
var _Enrollments = require("./enrollments"); // Moved Enrollments import
var _OtpCodes = require("./otpCodes"); // Moved OtpCodes import
var _ParentAccessSettings = require("./parentAccessSettings"); // Moved ParentAccessSettings import
var _ProjectTeamMembers = require("./projectTeamMembers"); // Moved ProjectTeamMembers import
var _StudentProgressReports = require("./studentProgressReports"); // Moved StudentProgressReports import
var _SubmissionAttachments = require("./submissionAttachments"); // Moved SubmissionAttachments import
var _TeacherEarnings = require("./teacherEarnings"); // Moved TeacherEarnings import
var _TeacherInstitutions = require("./teacherInstitutions"); // Moved TeacherInstitutions import
var _TeacherProfiles = require("./teacherProfiles"); // Moved TeacherProfiles import
var _TeacherReviews = require("./teacherReviews"); // Moved TeacherReviews import


function initModels(sequelize) {
  var SequelizeMeta = _SequelizeMeta(sequelize, DataTypes);
  var Users = _Users(sequelize, DataTypes);
  var Institutions = _Institutions(sequelize, DataTypes);
  var CourseCategories = _CourseCategories(sequelize, DataTypes);
  var Teachers = _Teachers(sequelize, DataTypes);
  var Students = _Students(sequelize, DataTypes);
  var Admins = _Admins(sequelize, DataTypes);
  var Parents = _Parents(sequelize, DataTypes);
  var ParentStudentLink = _ParentStudentLink(sequelize, DataTypes);
  var ParentNotifications = _ParentNotifications(sequelize, DataTypes); // Moved ParentNotifications initialization
  var Courses = _Courses(sequelize, DataTypes);
  var Lessons = _Lessons(sequelize, DataTypes);
  var ContentBlocks = _ContentBlocks(sequelize, DataTypes);
  var Quizzes = _Quizzes(sequelize, DataTypes);
  var QuizQuestions = _QuizQuestions(sequelize, DataTypes);
  var QuizAnswers = _QuizAnswers(sequelize, DataTypes);
  var Classes = _Classes(sequelize, DataTypes);
  var Exams = _Exams(sequelize, DataTypes);
  var ExamQuestions = _ExamQuestions(sequelize, DataTypes);
  var ExamAnswers = _ExamAnswers(sequelize, DataTypes);
  var ExamStudentAssignments = _ExamStudentAssignments(sequelize, DataTypes);
  var ExamQuestionAssignments = _ExamQuestionAssignments(sequelize, DataTypes);
  var StudentExamAttempts = _StudentExamAttempts(sequelize, DataTypes);
  var StudentExamResponses = _StudentExamResponses(sequelize, DataTypes);
  var Messages = _Messages(sequelize, DataTypes);
  var Assignments = _Assignments(sequelize, DataTypes); // Moved Assignment initialization
  var Submissions = _Submissions(sequelize, DataTypes); // Moved Submission initialization
  var AssignmentRubrics = _AssignmentRubrics(sequelize, DataTypes); // Moved AssignmentRubrics initialization
  var RubricCriteria = _RubricCriteria(sequelize, DataTypes); // Moved RubricCriteria initialization
  var RubricScores = _RubricScores(sequelize, DataTypes); // Moved RubricScores initialization
  var StudentQuizAttempts = _StudentQuizAttempts(sequelize, DataTypes);
  var StudentQuizResponses = _StudentQuizResponses(sequelize, DataTypes);
  var LearningAnalytics = _LearningAnalytics(sequelize, DataTypes);
  var CollaborativeProjects = _CollaborativeProjects(sequelize, DataTypes);
  var ProjectTeams = _ProjectTeams(sequelize, DataTypes);
  var AnalyticsEvents = _AnalyticsEvents(sequelize, DataTypes); // Moved AnalyticsEvents initialization
  var Attendance = _Attendance(sequelize, DataTypes); // Moved Attendance initialization
  var ChatRooms = _ChatRooms(sequelize, DataTypes); // Moved ChatRooms initialization
  var ChatParticipants = _ChatParticipants(sequelize, DataTypes); // Moved ChatParticipants initialization
  var ChatMessages = _ChatMessages(sequelize, DataTypes); // Moved ChatMessages initialization
  var ClassEnrollments = _ClassEnrollments(sequelize, DataTypes); // Moved ClassEnrollments initialization
  var ContentEngagements = _ContentEngagements(sequelize, DataTypes); // Moved ContentEngagements initialization
  var CourseCategoryMappings = _CourseCategoryMappings(sequelize, DataTypes); // Moved CourseCategoryMappings initialization
  var CourseReviews = _CourseReviews(sequelize, DataTypes); // Moved CourseReviews initialization
  var DiscussionForums = _DiscussionForums(sequelize, DataTypes); // Moved DiscussionForums initialization
  var DiscussionTopics = _DiscussionTopics(sequelize, DataTypes); // Moved DiscussionTopics initialization
  var DiscussionReplies = _DiscussionReplies(sequelize, DataTypes); // Moved DiscussionReplies initialization
  var Enrollments = _Enrollments(sequelize, DataTypes); // Moved Enrollments initialization
  var OtpCodes = _OtpCodes(sequelize, DataTypes); // Moved OtpCodes initialization
  var ParentAccessSettings = _ParentAccessSettings(sequelize, DataTypes); // Moved ParentAccessSettings initialization
  var ProjectTeamMembers = _ProjectTeamMembers(sequelize, DataTypes); // Moved ProjectTeamMembers initialization
  var StudentProgressReports = _StudentProgressReports(sequelize, DataTypes); // Moved StudentProgressReports initialization
  var SubmissionAttachments = _SubmissionAttachments(sequelize, DataTypes); // Moved SubmissionAttachments initialization
  var TeacherEarnings = _TeacherEarnings(sequelize, DataTypes); // Moved TeacherEarnings initialization
  var TeacherInstitutions = _TeacherInstitutions(sequelize, DataTypes); // Moved TeacherInstitutions initialization
  var TeacherProfiles = _TeacherProfiles(sequelize, DataTypes); // Moved TeacherProfiles initialization
  var TeacherReviews = _TeacherReviews(sequelize, DataTypes); // Moved TeacherReviews initialization


  // Quiz System Associations
  Quizzes.hasMany(QuizQuestions, { foreignKey: 'quizId', as: 'questions' });
  QuizQuestions.belongsTo(Quizzes, { foreignKey: 'quizId', as: 'quiz' });

  QuizQuestions.hasMany(QuizAnswers, { foreignKey: 'questionId', as: 'answers' });
  QuizAnswers.belongsTo(QuizQuestions, { foreignKey: 'questionId', as: 'question' });

  Quizzes.hasMany(StudentQuizAttempts, { foreignKey: 'quizId', as: 'attempts' });
  StudentQuizAttempts.belongsTo(Quizzes, { foreignKey: 'quizId', as: 'quiz' });

  StudentQuizAttempts.hasMany(StudentQuizResponses, { foreignKey: 'attemptId', as: 'responses' });
  StudentQuizResponses.belongsTo(StudentQuizAttempts, { foreignKey: 'attemptId', as: 'attempt' });

  QuizQuestions.hasMany(StudentQuizResponses, { foreignKey: 'questionId', as: 'responses' });
  StudentQuizResponses.belongsTo(QuizQuestions, { foreignKey: 'questionId', as: 'question' });

  QuizAnswers.hasMany(StudentQuizResponses, { foreignKey: 'chosenAnswerId', as: 'responses' });
  StudentQuizResponses.belongsTo(QuizAnswers, { foreignKey: 'chosenAnswerId', as: 'chosenAnswer' });

  // Course System Associations
  Courses.hasMany(Lessons, { foreignKey: 'courseId', as: 'lessons' });
  Lessons.belongsTo(Courses, { foreignKey: 'courseId', as: 'course' });

  Courses.hasMany(Quizzes, { foreignKey: 'courseId', as: 'quizzes' });
  Quizzes.belongsTo(Courses, { foreignKey: 'courseId', as: 'course' });

  Lessons.hasMany(Quizzes, { foreignKey: 'lessonId', as: 'quizzes' });
  Quizzes.belongsTo(Lessons, { foreignKey: 'lessonId', as: 'lesson' });

  // Institution and Teacher Associations
  Teachers.belongsTo(Institutions, { foreignKey: 'institutionId', as: 'institution' });
  Institutions.hasMany(Teachers, { foreignKey: 'institutionId', as: 'teachers' });

  // Course-Teacher-Institution Associations
  Courses.belongsTo(Teachers, { foreignKey: 'teacherId', as: 'teacher' });
  Teachers.hasMany(Courses, { foreignKey: 'teacherId', as: 'courses' });

  Courses.belongsTo(Institutions, { foreignKey: 'institutionId', as: 'institution' });
  Institutions.hasMany(Courses, { foreignKey: 'institutionId', as: 'courses' });

  // Exam Student Assignment Associations
  ExamStudentAssignments.belongsTo(Exams, { foreignKey: 'examId', as: 'exam' });
  Exams.hasMany(ExamStudentAssignments, { foreignKey: 'examId', as: 'studentAssignments' });

  ExamStudentAssignments.belongsTo(Students, { foreignKey: 'studentId', as: 'student' });
  Students.hasMany(ExamStudentAssignments, { foreignKey: 'studentId', as: 'examAssignments' });

  // Exam Student Assignment to User (assignedBy)
  ExamStudentAssignments.belongsTo(Users, { foreignKey: 'assignedById', as: 'assignedBy' });
  Users.hasMany(ExamStudentAssignments, { foreignKey: 'assignedById', as: 'assignedExamAssignments' });

  // Student Exam Responses Associations
  StudentExamResponses.belongsTo(ExamStudentAssignments, { foreignKey: 'attemptId', as: 'attempt' });
  ExamStudentAssignments.hasMany(StudentExamResponses, { foreignKey: 'attemptId', as: 'responses' });

  StudentExamResponses.belongsTo(ExamQuestions, { foreignKey: 'questionId', as: 'question' });
  ExamQuestions.hasMany(StudentExamResponses, { foreignKey: 'questionId', as: 'responses' });

  // Add associations for newly added models (inferred)
  Students.hasMany(Attendance, { foreignKey: 'studentId', as: 'attendanceRecords' });
  Attendance.belongsTo(Students, { foreignKey: 'studentId', as: 'student' });
  Classes.hasMany(Attendance, { foreignKey: 'classId', as: 'attendanceRecords' });
  Attendance.belongsTo(Classes, { foreignKey: 'classId', as: 'class' });
  Courses.hasMany(Attendance, { foreignKey: 'courseId', as: 'attendanceRecords' });
  Attendance.belongsTo(Courses, { foreignKey: 'courseId', as: 'course' });

  Students.hasMany(ClassEnrollments, { foreignKey: 'studentId', as: 'classEnrollments' });
  ClassEnrollments.belongsTo(Students, { foreignKey: 'studentId', as: 'student' });
  Classes.hasMany(ClassEnrollments, { foreignKey: 'classId', as: 'enrollments' });
  ClassEnrollments.belongsTo(Classes, { foreignKey: 'classId', as: 'class' });

  ContentBlocks.hasMany(ContentEngagements, { foreignKey: 'contentBlockId', as: 'engagements' });
  ContentEngagements.belongsTo(ContentBlocks, { foreignKey: 'contentBlockId', as: 'contentBlock' });
  Students.hasMany(ContentEngagements, { foreignKey: 'studentId', as: 'contentEngagements' });
  ContentEngagements.belongsTo(Students, { foreignKey: 'studentId', as: 'student' });

  Courses.hasMany(CourseReviews, { foreignKey: 'courseId', as: 'reviews' });
  CourseReviews.belongsTo(Courses, { foreignKey: 'courseId', as: 'course' });
  Students.hasMany(CourseReviews, { foreignKey: 'studentId', as: 'courseReviews' });
  CourseReviews.belongsTo(Students, { foreignKey: 'studentId', as: 'student' });

  Courses.hasMany(DiscussionForums, { foreignKey: 'courseId', as: 'discussionForums' });
  DiscussionForums.belongsTo(Courses, { foreignKey: 'courseId', as: 'course' });
  DiscussionForums.hasMany(DiscussionTopics, { foreignKey: 'forumId', as: 'topics' });
  DiscussionTopics.belongsTo(DiscussionForums, { foreignKey: 'forumId', as: 'forum' });
  DiscussionTopics.hasMany(DiscussionReplies, { foreignKey: 'topicId', as: 'replies' });
  DiscussionReplies.belongsTo(DiscussionTopics, { foreignKey: 'topicId', as: 'topic' });
  Users.hasMany(DiscussionTopics, { foreignKey: 'authorId', as: 'discussionTopics' });
  DiscussionTopics.belongsTo(Users, { foreignKey: 'authorId', as: 'author' });
  Users.hasMany(DiscussionReplies, { foreignKey: 'authorId', as: 'discussionReplies' });
  DiscussionReplies.belongsTo(Users, { foreignKey: 'authorId', as: 'author' });

  Courses.hasMany(Enrollments, { foreignKey: 'courseId', as: 'enrollments' });
  Enrollments.belongsTo(Courses, { foreignKey: 'courseId', as: 'course' });
  Students.hasMany(Enrollments, { foreignKey: 'studentId', as: 'enrollments' });
  Enrollments.belongsTo(Students, { foreignKey: 'studentId', as: 'student' });

  Users.hasMany(OtpCodes, { foreignKey: 'userId', as: 'otpCodes' });
  OtpCodes.belongsTo(Users, { foreignKey: 'userId', as: 'user' });

  Parents.hasMany(ParentAccessSettings, { foreignKey: 'parentId', as: 'accessSettings' });
  ParentAccessSettings.belongsTo(Parents, { foreignKey: 'parentId', as: 'parent' });
  Students.hasMany(ParentAccessSettings, { foreignKey: 'studentId', as: 'parentAccessSettings' });
  ParentAccessSettings.belongsTo(Students, { foreignKey: 'studentId', as: 'student' });

  CollaborativeProjects.hasMany(ProjectTeams, { foreignKey: 'projectId', as: 'teams' });
  ProjectTeams.belongsTo(CollaborativeProjects, { foreignKey: 'projectId', as: 'project' });
  ProjectTeams.hasMany(ProjectTeamMembers, { foreignKey: 'teamId', as: 'members' });
  ProjectTeamMembers.belongsTo(ProjectTeams, { foreignKey: 'teamId', as: 'team' });
  Students.hasMany(ProjectTeamMembers, { foreignKey: 'studentId', as: 'projectTeamMembers' });
  ProjectTeamMembers.belongsTo(Students, { foreignKey: 'studentId', as: 'student' });

  Assignments.hasMany(AssignmentRubrics, { foreignKey: 'assignmentId', as: 'rubrics' });
  AssignmentRubrics.belongsTo(Assignments, { foreignKey: 'assignmentId', as: 'assignment' });
  AssignmentRubrics.hasMany(RubricCriteria, { foreignKey: 'rubricId', as: 'criteria' });
  RubricCriteria.belongsTo(AssignmentRubrics, { foreignKey: 'rubricId', as: 'rubric' });
  RubricCriteria.hasMany(RubricScores, { foreignKey: 'criteriaId', as: 'scores' });
  RubricScores.belongsTo(RubricCriteria, { foreignKey: 'criteriaId', as: 'criteria' });
  Submissions.hasMany(RubricScores, { foreignKey: 'submissionId', as: 'rubricScores' });
  RubricScores.belongsTo(Submissions, { foreignKey: 'submissionId', as: 'submission' });

  Students.hasMany(StudentProgressReports, { foreignKey: 'studentId', as: 'progressReports' });
  StudentProgressReports.belongsTo(Students, { foreignKey: 'studentId', as: 'student' });
  Teachers.hasMany(StudentProgressReports, { foreignKey: 'teacherId', as: 'authoredProgressReports' });
  StudentProgressReports.belongsTo(Teachers, { foreignKey: 'teacherId', as: 'teacher' });
  Courses.hasMany(StudentProgressReports, { foreignKey: 'courseId', as: 'progressReports' });
  StudentProgressReports.belongsTo(Courses, { foreignKey: 'courseId', as: 'course' });
  Classes.hasMany(StudentProgressReports, { foreignKey: 'classId', as: 'progressReports' });
  StudentProgressReports.belongsTo(Classes, { foreignKey: 'classId', as: 'class' });

  Submissions.hasMany(SubmissionAttachments, { foreignKey: 'submissionId', as: 'attachments' });
  SubmissionAttachments.belongsTo(Submissions, { foreignKey: 'submissionId', as: 'submission' });
  Assignments.hasMany(Submissions, { foreignKey: 'assignmentId', as: 'submissions' });
  Submissions.belongsTo(Assignments, { foreignKey: 'assignmentId', as: 'assignment' });
  Students.hasMany(Submissions, { foreignKey: 'studentId', as: 'submissions' });
  Submissions.belongsTo(Students, { foreignKey: 'studentId', as: 'student' });

  Teachers.hasMany(TeacherEarnings, { foreignKey: 'teacherId', as: 'earnings' });
  TeacherEarnings.belongsTo(Teachers, { foreignKey: 'teacherId', as: 'teacher' });
  Courses.hasMany(TeacherEarnings, { foreignKey: 'courseId', as: 'teacherEarnings' });
  TeacherEarnings.belongsTo(Courses, { foreignKey: 'courseId', as: 'course' });

  Teachers.hasMany(TeacherInstitutions, { foreignKey: 'teacherId', as: 'institutionLinks' });
  TeacherInstitutions.belongsTo(Teachers, { foreignKey: 'teacherId', as: 'teacher' });
  Institutions.hasMany(TeacherInstitutions, { foreignKey: 'institutionId', as: 'teacherLinks' });
  TeacherInstitutions.belongsTo(Institutions, { foreignKey: 'institutionId', as: 'institution' });

  Teachers.hasOne(TeacherProfiles, { foreignKey: 'teacherId', as: 'profile' });
  TeacherProfiles.belongsTo(Teachers, { foreignKey: 'teacherId', as: 'teacher' });

  Teachers.hasMany(TeacherReviews, { foreignKey: 'teacherId', as: 'reviews' });
  TeacherReviews.belongsTo(Teachers, { foreignKey: 'teacherId', as: 'teacher' });
  Students.hasMany(TeacherReviews, { foreignKey: 'studentId', as: 'teacherReviews' });
  TeacherReviews.belongsTo(Students, { foreignKey: 'studentId', as: 'student' });
  Courses.hasMany(TeacherReviews, { foreignKey: 'courseId', as: 'teacherReviews' });
  TeacherReviews.belongsTo(Courses, { foreignKey: 'courseId', as: 'course' });

  // User associations (inferred)
  Users.hasOne(Students, { foreignKey: 'userId', as: 'student' });
  Students.belongsTo(Users, { foreignKey: 'userId', as: 'user' });
  Users.hasOne(Teachers, { foreignKey: 'userId', as: 'teacher' });
  Teachers.belongsTo(Users, { foreignKey: 'userId', as: 'user' });
  Users.hasOne(Admins, { foreignKey: 'userId', as: 'admin' });
  Admins.belongsTo(Users, { foreignKey: 'userId', as: 'user' });
  Users.hasOne(Parents, { foreignKey: 'userId', as: 'parent' });
  Parents.belongsTo(Users, { foreignKey: 'userId', as: 'user' });
  Users.hasOne(Institutions, { foreignKey: 'userId', as: 'institution' });
  Institutions.belongsTo(Users, { foreignKey: 'userId', as: 'user' });


  return {
    SequelizeMeta,
    Users,
    Students,
    Teachers,
    Institutions,
    Courses,
    Lessons,
    Quizzes,
    QuizQuestions,
    QuizAnswers,
    StudentQuizAttempts,
    ContentBlocks,
    StudentQuizResponses,
    Assignments,
    Admins,
    LearningAnalytics,
    Classes,
    Parents, // Add this line

    Exams,
    ExamStudentAssignments,
    ExamQuestions, // Ensure ExamQuestions is listed before ExamQuestionAssignments in the return object as well
    ExamQuestionAssignments,
    ParentNotifications,
    CourseCategories,
    Messages,
    StudentExamAttempts,
    ExamAnswers,
    StudentExamResponses,
    ParentStudentLink,
    CollaborativeProjects,
    ProjectTeams,

    // Add new models to the return object
    AnalyticsEvents,
    AssignmentRubrics,
    Attendance,
    ChatRooms,
    ChatParticipants,
    ChatMessages,
    ClassEnrollments,
    ContentEngagements,
    CourseCategoryMappings,
    CourseReviews,
    DiscussionForums,
    DiscussionTopics,
    DiscussionReplies,
    Enrollments,
    OtpCodes,
    ParentAccessSettings,
    ProjectTeamMembers,
    RubricCriteria,
    RubricScores,
    StudentProgressReports,
    SubmissionAttachments,
    Submissions,
    TeacherEarnings,
    TeacherInstitutions,
    TeacherProfiles,
    TeacherReviews,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
