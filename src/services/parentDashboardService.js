const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');
const parentStudentUtil = require('../utils/parentStudentUtil');
const parentAccessSettingsService = require('./parentAccessSettingsService');

const models = initModels(sequelize);
const {
  Parents,
  Students,
  Users,
  Courses,
  Enrollments,
  Assignments,
  Submissions,
  Attendance,
  Exams,
  StudentExamAttempts,
  Quizzes,
  StudentQuizAttempts,
  StudentProgressReports,
  ParentNotifications,
  LearningAnalytics
} = models;

const parentDashboardService = {
  /**
   * Get dashboard overview for a parent
   * @param {number} parentId - The parent ID
   * @returns {Promise<Object>} - Dashboard overview data
   */
  async getDashboardOverview(parentId) {
    try {
      // Get parent with linked students
      const parent = await Parents.findByPk(parentId, {
        include: [
          {
            model: Students,
            as: 'studentIdStudents',
            through: { attributes: [] },
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImage']
              }
            ]
          },
          {
            model: Users,
            as: 'user',
            attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImage']
          }
        ]
      });

      if (!parent) {
        throw new AppError('Parent not found', 404);
      }

      // Get unread notification count
      const unreadNotifications = await ParentNotifications.count({
        where: {
          parentId,
          status: 'unread'
        }
      });

      // Get upcoming events and deadlines for all linked students
      const students = parent.studentIdStudents || [];
      const studentIds = students.map(student => student.studentId);

      // Get upcoming assignments
      const upcomingAssignments = await Assignments.findAll({
        where: {
          dueDate: {
            [Op.gte]: new Date()
          },
          visibleToStudents: true
        },
        include: [
          {
            model: Courses,
            as: 'course',
            include: [
              {
                model: Students,
                as: 'students',
                through: { attributes: [] },
                where: {
                  studentId: { [Op.in]: studentIds }
                },
                required: true
              }
            ]
          }
        ],
        order: [['dueDate', 'ASC']],
        limit: 5
      });

      // Get recent grades
      const recentSubmissions = await Submissions.findAll({
        where: {
          studentId: { [Op.in]: studentIds },
          grade: { [Op.ne]: null }
        },
        include: [
          {
            model: Assignments,
            as: 'assignment',
            include: [
              {
                model: Courses,
                as: 'course'
              }
            ]
          },
          {
            model: Students,
            as: 'student',
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName']
              }
            ]
          }
        ],
        order: [['gradedAt', 'DESC']],
        limit: 5
      });

      // Get recent attendance
      const recentAttendance = await Attendance.findAll({
        where: {
          studentId: { [Op.in]: studentIds },
          date: {
            [Op.gte]: new Date(new Date() - 14 * 24 * 60 * 60 * 1000) // Last 14 days
          }
        },
        include: [
          {
            model: Students,
            as: 'student',
            include: [
              {
                model: Users,
                as: 'user',
                attributes: ['userId', 'firstName', 'lastName']
              }
            ]
          },
          {
            model: Courses,
            as: 'course'
          }
        ],
        order: [['date', 'DESC']],
        limit: 10
      });

      return {
        parent,
        students,
        unreadNotifications,
        upcomingAssignments,
        recentSubmissions,
        recentAttendance
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving dashboard overview: ${error.message}`, 500);
    }
  },

  /**
   * Get academic performance for a student
   * @param {number} parentId - The parent ID
   * @param {number} studentId - The student ID
   * @returns {Promise<Object>} - Academic performance data
   */
  async getStudentAcademicPerformance(parentId, studentId) {
    try {
      // Check if parent is linked to student
      const isLinked = await parentStudentUtil.isParentLinkedToStudent(parentId, studentId);

      if (!isLinked) {
        throw new AppError('Parent is not linked to this student', 403);
      }

      // Check if parent has access to grades
      const hasAccess = await parentAccessSettingsService.checkAccess(parentId, studentId, 'canViewGrades');

      if (!hasAccess) {
        throw new AppError('You do not have permission to view this student\'s grades', 403);
      }

      // Get student with enrollments
      const student = await Students.findByPk(studentId, {
        include: [
          {
            model: Users,
            as: 'user',
            attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImage']
          },
          {
            model: Courses,
            as: 'courses',
            through: { attributes: [] }
          }
        ]
      });

      if (!student) {
        throw new AppError('Student not found', 404);
      }

      // Get course IDs the student is enrolled in
      const courseIds = student.courses.map(course => course.courseId);

      // Get assignments and submissions
      const assignments = await Assignments.findAll({
        where: {
          courseId: { [Op.in]: courseIds }
        },
        include: [
          {
            model: Courses,
            as: 'course'
          },
          {
            model: Submissions,
            as: 'submissions',
            where: {
              studentId
            },
            required: false
          }
        ]
      });

      // Get exam attempts
      const examAttempts = await StudentExamAttempts.findAll({
        where: {
          studentId
        },
        include: [
          {
            model: Exams,
            as: 'exam',
            include: [
              {
                model: Courses,
                as: 'course'
              }
            ]
          }
        ]
      });

      // Get quiz attempts
      const quizAttempts = await StudentQuizAttempts.findAll({
        where: {
          studentId
        },
        include: [
          {
            model: Quizzes,
            as: 'quiz',
            include: [
              {
                model: Courses,
                as: 'course'
              }
            ]
          }
        ]
      });

      // Get progress reports
      const progressReports = await StudentProgressReports.findAll({
        where: {
          studentId
        },
        order: [['createdAt', 'DESC']]
      });

      // Get learning analytics
      const learningAnalytics = await LearningAnalytics.findAll({
        where: {
          studentId,
          courseId: { [Op.in]: courseIds }
        },
        include: [
          {
            model: Courses,
            as: 'course'
          }
        ]
      });

      // Calculate performance metrics
      const coursePerformance = courseIds.map(courseId => {
        const courseAssignments = assignments.filter(a => a.courseId === courseId);
        const courseExams = examAttempts.filter(a => a.exam.courseId === courseId);
        const courseQuizzes = quizAttempts.filter(a => a.quiz.courseId === courseId);
        const courseAnalytics = learningAnalytics.find(la => la.courseId === courseId);

        // Calculate assignment completion rate
        const totalAssignments = courseAssignments.length;
        const completedAssignments = courseAssignments.filter(a =>
          a.submissions && a.submissions.length > 0
        ).length;
        const assignmentCompletionRate = totalAssignments > 0 ?
          (completedAssignments / totalAssignments) * 100 : 0;

        // Calculate average grade
        const gradedSubmissions = courseAssignments
          .flatMap(a => a.submissions)
          .filter(s => s && s.grade !== null);

        const averageGrade = gradedSubmissions.length > 0 ?
          gradedSubmissions.reduce((sum, s) => sum + s.grade, 0) / gradedSubmissions.length : 0;

        // Get course
        const course = student.courses.find(c => c.courseId === courseId);

        return {
          course,
          assignmentCompletionRate,
          averageGrade,
          examAttempts: courseExams.length,
          quizAttempts: courseQuizzes.length,
          analytics: courseAnalytics
        };
      });

      return {
        student,
        coursePerformance,
        progressReports
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving student academic performance: ${error.message}`, 500);
    }
  },

  /**
   * Get attendance records for a student
   * @param {number} parentId - The parent ID
   * @param {number} studentId - The student ID
   * @param {Object} filters - The filters to apply
   * @returns {Promise<Object>} - Attendance data
   */
  async getStudentAttendance(parentId, studentId, filters = {}) {
    try {
      // Check if parent is linked to student
      const isLinked = await parentStudentUtil.isParentLinkedToStudent(parentId, studentId);

      if (!isLinked) {
        throw new AppError('Parent is not linked to this student', 403);
      }

      // Check if parent has access to attendance
      const hasAccess = await parentAccessSettingsService.checkAccess(parentId, studentId, 'canViewAttendance');

      if (!hasAccess) {
        throw new AppError('You do not have permission to view this student\'s attendance', 403);
      }

      const { courseId, startDate, endDate } = filters;

      // Build the where clause
      const whereClause = { studentId };

      if (courseId) {
        whereClause.courseId = courseId;
      }

      if (startDate && endDate) {
        whereClause.date = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      } else if (startDate) {
        whereClause.date = {
          [Op.gte]: new Date(startDate)
        };
      } else if (endDate) {
        whereClause.date = {
          [Op.lte]: new Date(endDate)
        };
      }

      // Get attendance records
      const attendance = await Attendance.findAll({
        where: whereClause,
        include: [
          {
            model: Courses,
            as: 'course'
          }
        ],
        order: [['date', 'DESC']]
      });

      // Calculate attendance statistics
      const totalRecords = attendance.length;
      const presentCount = attendance.filter(a => a.status === 'present').length;
      const absentCount = attendance.filter(a => a.status === 'absent').length;
      const lateCount = attendance.filter(a => a.status === 'late').length;
      const excusedCount = attendance.filter(a => a.status === 'excused').length;

      const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

      // Group by course
      const courseAttendance = {};

      attendance.forEach(record => {
        const courseId = record.courseId;

        if (!courseAttendance[courseId]) {
          courseAttendance[courseId] = {
            course: record.course,
            records: [],
            stats: {
              total: 0,
              present: 0,
              absent: 0,
              late: 0,
              excused: 0,
              rate: 0
            }
          };
        }

        courseAttendance[courseId].records.push(record);
        courseAttendance[courseId].stats.total++;

        if (record.status === 'present') {
          courseAttendance[courseId].stats.present++;
        } else if (record.status === 'absent') {
          courseAttendance[courseId].stats.absent++;
        } else if (record.status === 'late') {
          courseAttendance[courseId].stats.late++;
        } else if (record.status === 'excused') {
          courseAttendance[courseId].stats.excused++;
        }
      });

      // Calculate attendance rate for each course
      Object.values(courseAttendance).forEach(course => {
        course.stats.rate = course.stats.total > 0 ?
          (course.stats.present / course.stats.total) * 100 : 0;
      });

      return {
        attendance,
        stats: {
          total: totalRecords,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          excused: excusedCount,
          rate: attendanceRate
        },
        courseAttendance: Object.values(courseAttendance)
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving student attendance: ${error.message}`, 500);
    }
  },

  /**
   * Get upcoming assignments and assessments for a student
   * @param {number} parentId - The parent ID
   * @param {number} studentId - The student ID
   * @returns {Promise<Object>} - Upcoming assignments and assessments
   */
  async getUpcomingAssignmentsAndAssessments(parentId, studentId) {
    try {
      // Check if parent is linked to student
      const isLinked = await parentStudentUtil.isParentLinkedToStudent(parentId, studentId);

      if (!isLinked) {
        throw new AppError('Parent is not linked to this student', 403);
      }

      // Check if parent has access to assignments
      const hasAccess = await parentAccessSettingsService.checkAccess(parentId, studentId, 'canViewAssignments');

      if (!hasAccess) {
        throw new AppError('You do not have permission to view this student\'s assignments', 403);
      }

      // Get student with enrollments
      const student = await Students.findByPk(studentId, {
        include: [
          {
            model: Users,
            as: 'user',
            attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImage']
          },
          {
            model: Courses,
            as: 'courses',
            through: { attributes: [] }
          }
        ]
      });

      if (!student) {
        throw new AppError('Student not found', 404);
      }

      // Get course IDs the student is enrolled in
      const courseIds = student.courses.map(course => course.courseId);

      // Get upcoming assignments
      const upcomingAssignments = await Assignments.findAll({
        where: {
          courseId: { [Op.in]: courseIds },
          dueDate: {
            [Op.gte]: new Date()
          },
          visibleToStudents: true
        },
        include: [
          {
            model: Courses,
            as: 'course'
          },
          {
            model: Submissions,
            as: 'submissions',
            where: {
              studentId
            },
            required: false
          }
        ],
        order: [['dueDate', 'ASC']]
      });

      // Get upcoming exams
      const upcomingExams = await Exams.findAll({
        where: {
          courseId: { [Op.in]: courseIds },
          scheduledDate: {
            [Op.gte]: new Date()
          },
          isPublished: true
        },
        include: [
          {
            model: Courses,
            as: 'course'
          }
        ],
        order: [['scheduledDate', 'ASC']]
      });

      // Get upcoming quizzes
      const upcomingQuizzes = await Quizzes.findAll({
        where: {
          courseId: { [Op.in]: courseIds },
          dueDate: {
            [Op.gte]: new Date()
          },
          isPublished: true
        },
        include: [
          {
            model: Courses,
            as: 'course'
          }
        ],
        order: [['dueDate', 'ASC']]
      });

      // Combine and sort all upcoming items by date
      const allUpcoming = [
        ...upcomingAssignments.map(a => ({
          type: 'assignment',
          id: a.assignmentId,
          title: a.title,
          description: a.description,
          dueDate: a.dueDate,
          course: a.course,
          isSubmitted: a.submissions && a.submissions.length > 0
        })),
        ...upcomingExams.map(e => ({
          type: 'exam',
          id: e.examId,
          title: e.title,
          description: e.description,
          dueDate: e.scheduledDate,
          course: e.course,
          isSubmitted: false
        })),
        ...upcomingQuizzes.map(q => ({
          type: 'quiz',
          id: q.quizId,
          title: q.title,
          description: q.description,
          dueDate: q.dueDate,
          course: q.course,
          isSubmitted: false
        }))
      ].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      // Group by course
      const byCourse = {};

      allUpcoming.forEach(item => {
        const courseId = item.course.courseId;

        if (!byCourse[courseId]) {
          byCourse[courseId] = {
            course: item.course,
            items: []
          };
        }

        byCourse[courseId].items.push(item);
      });

      // Group by week
      const byWeek = {};
      const now = new Date();

      allUpcoming.forEach(item => {
        const dueDate = new Date(item.dueDate);
        const diffDays = Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
        let weekKey;

        if (diffDays < 7) {
          weekKey = 'This Week';
        } else if (diffDays < 14) {
          weekKey = 'Next Week';
        } else if (diffDays < 30) {
          weekKey = 'This Month';
        } else {
          weekKey = 'Later';
        }

        if (!byWeek[weekKey]) {
          byWeek[weekKey] = [];
        }

        byWeek[weekKey].push(item);
      });

      return {
        student,
        allUpcoming,
        byCourse: Object.values(byCourse),
        byWeek
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving upcoming assignments and assessments: ${error.message}`, 500);
    }
  },

  /**
   * Get course enrollment and progress for a student
   * @param {number} parentId - The parent ID
   * @param {number} studentId - The student ID
   * @returns {Promise<Object>} - Course enrollment and progress data
   */
  async getStudentCourseProgress(parentId, studentId) {
    try {
      // Check if parent is linked to student
      const isLinked = await parentStudentUtil.isParentLinkedToStudent(parentId, studentId);

      if (!isLinked) {
        throw new AppError('Parent is not linked to this student', 403);
      }

      // Check if parent has access to course content
      const hasAccess = await parentAccessSettingsService.checkAccess(parentId, studentId, 'canViewCourseContent');

      if (!hasAccess) {
        throw new AppError('You do not have permission to view this student\'s course progress', 403);
      }

      // Get student with enrollments
      const student = await Students.findByPk(studentId, {
        include: [
          {
            model: Users,
            as: 'user',
            attributes: ['userId', 'firstName', 'lastName', 'email', 'profileImage']
          },
          {
            model: Courses,
            as: 'courses',
            through: {
              attributes: ['enrollmentId', 'enrollmentDate', 'status', 'completionPercentage']
            }
          }
        ]
      });

      if (!student) {
        throw new AppError('Student not found', 404);
      }

      // Get course IDs the student is enrolled in
      const courseIds = student.courses.map(course => course.courseId);

      // Get learning analytics for each course
      const learningAnalytics = await LearningAnalytics.findAll({
        where: {
          studentId,
          courseId: { [Op.in]: courseIds }
        },
        include: [
          {
            model: Courses,
            as: 'course'
          }
        ]
      });

      // Enhance course data with analytics
      const courseProgress = student.courses.map(course => {
        const analytics = learningAnalytics.find(la => la.courseId === course.courseId);
        const enrollment = course.Enrollments;

        return {
          course,
          enrollment,
          analytics,
          progress: enrollment.completionPercentage || 0
        };
      });

      return {
        student,
        courseProgress
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving student course progress: ${error.message}`, 500);
    }
  }
};

module.exports = parentDashboardService;
