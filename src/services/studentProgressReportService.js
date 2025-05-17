const { Op, Sequelize } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');
const parentAccessSettingsService = require('./parentAccessSettingsService');

const models = initModels(sequelize);
const { 
  StudentProgressReports, 
  Students, 
  Users, 
  Teachers, 
  Courses, 
  Classes,
  Assignments,
  Submissions,
  Exams,
  StudentExamAttempts,
  Attendance
} = models;

const studentProgressReportService = {
  /**
   * Create a new student progress report
   * @param {Object} reportData - The report data
   * @returns {Promise<Object>} - The created report
   */
  async createReport(reportData) {
    try {
      // Check if student exists
      const student = await Students.findByPk(reportData.studentId);
      
      if (!student) {
        throw new AppError('Student not found', 404);
      }
      
      // Create the report
      const report = await StudentProgressReports.create(reportData);
      
      return this.getReportById(report.reportId);
    } catch (error) {
      throw new AppError(error.message, 400);
    }
  },

  /**
   * Get a report by ID
   * @param {number} reportId - The report ID
   * @returns {Promise<Object>} - The report
   */
  async getReportById(reportId) {
    const report = await StudentProgressReports.findByPk(reportId, {
      include: [
        {
          model: Students,
          as: 'student',
          include: [{ model: Users, as: 'user' }]
        },
        {
          model: Teachers,
          as: 'teacher',
          include: [{ model: Users, as: 'user' }]
        },
        {
          model: Courses,
          as: 'course'
        },
        {
          model: Classes,
          as: 'class'
        }
      ]
    });

    if (!report) {
      throw new AppError('Progress report not found', 404);
    }

    return report;
  },

  /**
   * Get all reports for a student
   * @param {number} studentId - The student ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of reports
   */
  async getStudentReports(studentId, filters = {}) {
    const { courseId, classId, teacherId, reportType, startDate, endDate } = filters;
    
    const whereClause = { studentId };
    
    if (courseId) {
      whereClause.courseId = courseId;
    }
    
    if (classId) {
      whereClause.classId = classId;
    }
    
    if (teacherId) {
      whereClause.teacherId = teacherId;
    }
    
    if (reportType) {
      whereClause.reportType = reportType;
    }
    
    if (startDate && endDate) {
      whereClause.reportDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.reportDate = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.reportDate = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    const reports = await StudentProgressReports.findAll({
      where: whereClause,
      include: [
        {
          model: Teachers,
          as: 'teacher',
          include: [{ model: Users, as: 'user' }]
        },
        {
          model: Courses,
          as: 'course'
        },
        {
          model: Classes,
          as: 'class'
        }
      ],
      order: [['reportDate', 'DESC']]
    });
    
    return reports;
  },

  /**
   * Get all reports created by a teacher
   * @param {number} teacherId - The teacher ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of reports
   */
  async getTeacherReports(teacherId, filters = {}) {
    const { studentId, courseId, classId, reportType, startDate, endDate } = filters;
    
    const whereClause = { teacherId };
    
    if (studentId) {
      whereClause.studentId = studentId;
    }
    
    if (courseId) {
      whereClause.courseId = courseId;
    }
    
    if (classId) {
      whereClause.classId = classId;
    }
    
    if (reportType) {
      whereClause.reportType = reportType;
    }
    
    if (startDate && endDate) {
      whereClause.reportDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.reportDate = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.reportDate = {
        [Op.lte]: new Date(endDate)
      };
    }
    
    const reports = await StudentProgressReports.findAll({
      where: whereClause,
      include: [
        {
          model: Students,
          as: 'student',
          include: [{ model: Users, as: 'user' }]
        },
        {
          model: Courses,
          as: 'course'
        },
        {
          model: Classes,
          as: 'class'
        }
      ],
      order: [['reportDate', 'DESC']]
    });
    
    return reports;
  },

  /**
   * Update a report
   * @param {number} reportId - The report ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated report
   */
  async updateReport(reportId, updateData) {
    const report = await StudentProgressReports.findByPk(reportId);
    
    if (!report) {
      throw new AppError('Progress report not found', 404);
    }
    
    await report.update(updateData);
    
    return this.getReportById(reportId);
  },

  /**
   * Delete a report
   * @param {number} reportId - The report ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteReport(reportId) {
    const report = await StudentProgressReports.findByPk(reportId);
    
    if (!report) {
      throw new AppError('Progress report not found', 404);
    }
    
    await report.destroy();
    
    return true;
  },

  /**
   * Generate a comprehensive progress report for a student
   * @param {number} studentId - The student ID
   * @param {Object} options - Report options
   * @returns {Promise<Object>} - The generated report data
   */
  async generateComprehensiveReport(studentId, options = {}) {
    const { courseId, classId, startDate, endDate, includeGrades, includeAttendance, includeBehavior } = options;
    
    // Check if student exists
    const student = await Students.findByPk(studentId, {
      include: [{ model: Users, as: 'user' }]
    });
    
    if (!student) {
      throw new AppError('Student not found', 404);
    }
    
    const reportData = {
      student: {
        studentId: student.studentId,
        name: `${student.user.firstName} ${student.user.lastName}`,
        email: student.user.email
      },
      period: {
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      },
      grades: [],
      attendance: {},
      behavior: []
    };
    
    // Date range for queries
    const dateRange = {};
    if (startDate && endDate) {
      dateRange[Op.between] = [new Date(startDate), new Date(endDate)];
    } else if (startDate) {
      dateRange[Op.gte] = new Date(startDate);
    } else if (endDate) {
      dateRange[Op.lte] = new Date(endDate);
    }
    
    // Get grades if requested
    if (includeGrades) {
      // Get assignment grades
      const assignmentWhere = { studentId };
      if (courseId) assignmentWhere.courseId = courseId;
      if (Object.keys(dateRange).length > 0) assignmentWhere.submittedAt = dateRange;
      
      const assignments = await Submissions.findAll({
        where: assignmentWhere,
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
          }
        ]
      });
      
      // Get exam grades
      const examWhere = { studentId };
      if (Object.keys(dateRange).length > 0) examWhere.submittedAt = dateRange;
      
      const exams = await StudentExamAttempts.findAll({
        where: examWhere,
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
      
      // Process assignment grades
      const assignmentGrades = assignments.map(submission => ({
        type: 'assignment',
        title: submission.assignment.title,
        courseId: submission.assignment.courseId,
        courseName: submission.assignment.course.name,
        score: submission.score,
        maxScore: submission.assignment.maxScore,
        percentage: submission.score / submission.assignment.maxScore * 100,
        submittedAt: submission.submittedAt,
        gradedAt: submission.gradedAt
      }));
      
      // Process exam grades
      const examGrades = exams.map(attempt => ({
        type: 'exam',
        title: attempt.exam.title,
        courseId: attempt.exam.courseId,
        courseName: attempt.exam.course.name,
        score: attempt.score,
        maxScore: attempt.exam.maxScore,
        percentage: attempt.score / attempt.exam.maxScore * 100,
        submittedAt: attempt.submittedAt,
        gradedAt: attempt.gradedAt
      }));
      
      // Combine and sort by date
      reportData.grades = [...assignmentGrades, ...examGrades].sort((a, b) => 
        new Date(b.submittedAt) - new Date(a.submittedAt)
      );
      
      // Calculate average grades by course
      const courseGrades = {};
      reportData.grades.forEach(grade => {
        if (!courseGrades[grade.courseId]) {
          courseGrades[grade.courseId] = {
            courseId: grade.courseId,
            courseName: grade.courseName,
            totalScore: 0,
            totalMaxScore: 0,
            items: 0
          };
        }
        
        courseGrades[grade.courseId].totalScore += grade.score;
        courseGrades[grade.courseId].totalMaxScore += grade.maxScore;
        courseGrades[grade.courseId].items += 1;
      });
      
      reportData.courseAverages = Object.values(courseGrades).map(course => ({
        courseId: course.courseId,
        courseName: course.courseName,
        average: course.totalScore / course.totalMaxScore * 100,
        items: course.items
      }));
    }
    
    // Get attendance if requested
    if (includeAttendance) {
      const attendanceWhere = { studentId };
      if (classId) attendanceWhere.classId = classId;
      if (Object.keys(dateRange).length > 0) attendanceWhere.date = dateRange;
      
      const attendance = await Attendance.findAll({
        where: attendanceWhere,
        include: [
          {
            model: Classes,
            as: 'class'
          }
        ]
      });
      
      // Group attendance by status
      const attendanceStats = {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: attendance.length
      };
      
      attendance.forEach(record => {
        attendanceStats[record.status]++;
      });
      
      // Calculate attendance rate
      attendanceStats.attendanceRate = attendanceStats.total > 0 
        ? (attendanceStats.present + attendanceStats.late) / attendanceStats.total * 100 
        : 0;
      
      reportData.attendance = {
        stats: attendanceStats,
        records: attendance.map(record => ({
          date: record.date,
          status: record.status,
          className: record.class.name,
          notes: record.notes
        }))
      };
    }
    
    // Get behavior records if requested
    if (includeBehavior) {
      // This would be implemented based on your behavior tracking system
      // For now, we'll return an empty array
      reportData.behavior = [];
    }
    
    return reportData;
  },

  /**
   * Check if a parent can access a student's progress report
   * @param {number} parentId - The parent ID
   * @param {number} studentId - The student ID
   * @param {number} reportId - The report ID
   * @returns {Promise<boolean>} - True if parent can access the report
   */
  async canParentAccessReport(parentId, studentId, reportId) {
    try {
      // First check if parent has access to student's reports in general
      const hasAccess = await parentAccessSettingsService.checkAccess(
        parentId,
        studentId,
        'canAccessProgressReports'
      );
      
      if (!hasAccess) {
        return false;
      }
      
      // Then check if the report belongs to the student
      const report = await StudentProgressReports.findByPk(reportId);
      
      if (!report || report.studentId !== studentId) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
};

module.exports = studentProgressReportService;
