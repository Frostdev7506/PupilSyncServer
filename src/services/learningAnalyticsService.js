const { Op, Sequelize } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');

const models = initModels(sequelize);
const { 
  LearningAnalytics, 
  Students, 
  Users, 
  Courses, 
  Classes,
  Assignments,
  Submissions,
  Exams,
  StudentExamAttempts,
  Quizzes,
  StudentQuizAttempts,
  Attendance
} = models;

const learningAnalyticsService = {
  /**
   * Create or update learning analytics
   * @param {Object} analyticsData - The analytics data
   * @returns {Promise<Object>} - The created or updated analytics
   */
  async createOrUpdateAnalytics(analyticsData) {
    const transaction = await sequelize.transaction();
    
    try {
      // Check if student exists
      const student = await Students.findByPk(analyticsData.studentId, { transaction });
      
      if (!student) {
        await transaction.rollback();
        throw new AppError('Student not found', 404);
      }
      
      // Check if analytics already exist for this student and entity
      const existingAnalytics = await LearningAnalytics.findOne({
        where: {
          studentId: analyticsData.studentId,
          entityType: analyticsData.entityType,
          entityId: analyticsData.entityId
        },
        transaction
      });
      
      let analytics;
      
      if (existingAnalytics) {
        // Update existing analytics
        analytics = await existingAnalytics.update(analyticsData, { transaction });
      } else {
        // Create new analytics
        analytics = await LearningAnalytics.create(analyticsData, { transaction });
      }
      
      await transaction.commit();
      
      return this.getAnalyticsById(analytics.analyticsId);
    } catch (error) {
      await transaction.rollback();
      throw new AppError(error.message, 400);
    }
  },

  /**
   * Get analytics by ID
   * @param {number} analyticsId - The analytics ID
   * @returns {Promise<Object>} - The analytics
   */
  async getAnalyticsById(analyticsId) {
    const analytics = await LearningAnalytics.findByPk(analyticsId, {
      include: [
        {
          model: Students,
          as: 'student',
          include: [{ model: Users, as: 'user' }]
        }
      ]
    });

    if (!analytics) {
      throw new AppError('Learning analytics not found', 404);
    }

    return analytics;
  },

  /**
   * Get all analytics for a student
   * @param {number} studentId - The student ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of analytics
   */
  async getStudentAnalytics(studentId, filters = {}) {
    const { entityType, entityId, metricType } = filters;
    
    const whereClause = { studentId };
    
    if (entityType) {
      whereClause.entityType = entityType;
    }
    
    if (entityId) {
      whereClause.entityId = entityId;
    }
    
    if (metricType) {
      whereClause.metricType = metricType;
    }
    
    const analytics = await LearningAnalytics.findAll({
      where: whereClause,
      order: [['updatedAt', 'DESC']]
    });
    
    return analytics;
  },

  /**
   * Get all analytics for an entity
   * @param {string} entityType - The entity type
   * @param {number} entityId - The entity ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of analytics
   */
  async getEntityAnalytics(entityType, entityId, filters = {}) {
    const { studentId, metricType } = filters;
    
    const whereClause = {
      entityType,
      entityId
    };
    
    if (studentId) {
      whereClause.studentId = studentId;
    }
    
    if (metricType) {
      whereClause.metricType = metricType;
    }
    
    const analytics = await LearningAnalytics.findAll({
      where: whereClause,
      include: [
        {
          model: Students,
          as: 'student',
          include: [{ model: Users, as: 'user' }]
        }
      ],
      order: [['value', 'DESC']]
    });
    
    return analytics;
  },

  /**
   * Delete analytics
   * @param {number} analyticsId - The analytics ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteAnalytics(analyticsId) {
    const analytics = await LearningAnalytics.findByPk(analyticsId);
    
    if (!analytics) {
      throw new AppError('Learning analytics not found', 404);
    }
    
    await analytics.destroy();
    
    return true;
  },

  /**
   * Generate course performance analytics for a student
   * @param {number} studentId - The student ID
   * @param {number} courseId - The course ID
   * @returns {Promise<Object>} - The generated analytics
   */
  async generateCoursePerformanceAnalytics(studentId, courseId) {
    // Check if student exists
    const student = await Students.findByPk(studentId, {
      include: [{ model: Users, as: 'user' }]
    });
    
    if (!student) {
      throw new AppError('Student not found', 404);
    }
    
    // Check if course exists
    const course = await Courses.findByPk(courseId);
    
    if (!course) {
      throw new AppError('Course not found', 404);
    }
    
    // Get assignments for this course
    const assignments = await Assignments.findAll({
      where: { courseId },
      include: [
        {
          model: Submissions,
          as: 'submissions',
          where: { studentId },
          required: false
        }
      ]
    });
    
    // Get exams for this course
    const exams = await Exams.findAll({
      where: { courseId },
      include: [
        {
          model: StudentExamAttempts,
          as: 'attempts',
          where: { studentId },
          required: false
        }
      ]
    });
    
    // Get quizzes for this course
    const quizzes = await Quizzes.findAll({
      where: { courseId },
      include: [
        {
          model: StudentQuizAttempts,
          as: 'attempts',
          where: { studentId },
          required: false
        }
      ]
    });
    
    // Calculate assignment completion rate
    const totalAssignments = assignments.length;
    const completedAssignments = assignments.filter(assignment => 
      assignment.submissions && assignment.submissions.length > 0
    ).length;
    const assignmentCompletionRate = totalAssignments > 0 
      ? (completedAssignments / totalAssignments) * 100 
      : 0;
    
    // Calculate average assignment score
    let totalAssignmentScore = 0;
    let totalAssignmentMaxScore = 0;
    
    assignments.forEach(assignment => {
      if (assignment.submissions && assignment.submissions.length > 0) {
        const submission = assignment.submissions[0];
        totalAssignmentScore += submission.score || 0;
        totalAssignmentMaxScore += assignment.maxScore || 0;
      }
    });
    
    const averageAssignmentScore = totalAssignmentMaxScore > 0 
      ? (totalAssignmentScore / totalAssignmentMaxScore) * 100 
      : 0;
    
    // Calculate exam performance
    let totalExamScore = 0;
    let totalExamMaxScore = 0;
    
    exams.forEach(exam => {
      if (exam.attempts && exam.attempts.length > 0) {
        const bestAttempt = exam.attempts.reduce((best, current) => 
          (current.score > best.score) ? current : best, exam.attempts[0]
        );
        totalExamScore += bestAttempt.score || 0;
        totalExamMaxScore += exam.maxScore || 0;
      }
    });
    
    const averageExamScore = totalExamMaxScore > 0 
      ? (totalExamScore / totalExamMaxScore) * 100 
      : 0;
    
    // Calculate quiz performance
    let totalQuizScore = 0;
    let totalQuizMaxScore = 0;
    
    quizzes.forEach(quiz => {
      if (quiz.attempts && quiz.attempts.length > 0) {
        const bestAttempt = quiz.attempts.reduce((best, current) => 
          (current.score > best.score) ? current : best, quiz.attempts[0]
        );
        totalQuizScore += bestAttempt.score || 0;
        totalQuizMaxScore += quiz.maxScore || 0;
      }
    });
    
    const averageQuizScore = totalQuizMaxScore > 0 
      ? (totalQuizScore / totalQuizMaxScore) * 100 
      : 0;
    
    // Calculate overall performance
    const overallPerformance = (averageAssignmentScore + averageExamScore + averageQuizScore) / 3;
    
    // Create analytics records
    const analyticsRecords = [
      {
        studentId,
        entityType: 'course',
        entityId: courseId,
        metricType: 'assignment_completion_rate',
        value: assignmentCompletionRate,
        metadata: {
          totalAssignments,
          completedAssignments
        }
      },
      {
        studentId,
        entityType: 'course',
        entityId: courseId,
        metricType: 'average_assignment_score',
        value: averageAssignmentScore,
        metadata: {
          totalAssignmentScore,
          totalAssignmentMaxScore
        }
      },
      {
        studentId,
        entityType: 'course',
        entityId: courseId,
        metricType: 'average_exam_score',
        value: averageExamScore,
        metadata: {
          totalExamScore,
          totalExamMaxScore
        }
      },
      {
        studentId,
        entityType: 'course',
        entityId: courseId,
        metricType: 'average_quiz_score',
        value: averageQuizScore,
        metadata: {
          totalQuizScore,
          totalQuizMaxScore
        }
      },
      {
        studentId,
        entityType: 'course',
        entityId: courseId,
        metricType: 'overall_performance',
        value: overallPerformance,
        metadata: {
          averageAssignmentScore,
          averageExamScore,
          averageQuizScore
        }
      }
    ];
    
    // Save all analytics records
    for (const record of analyticsRecords) {
      await this.createOrUpdateAnalytics(record);
    }
    
    return {
      studentId,
      courseId,
      assignmentCompletionRate,
      averageAssignmentScore,
      averageExamScore,
      averageQuizScore,
      overallPerformance,
      analytics: analyticsRecords
    };
  },

  /**
   * Get class performance analytics
   * @param {number} classId - The class ID
   * @returns {Promise<Object>} - The class performance analytics
   */
  async getClassPerformanceAnalytics(classId) {
    // Check if class exists
    const classObj = await Classes.findByPk(classId, {
      include: [
        {
          model: Students,
          as: 'students',
          include: [{ model: Users, as: 'user' }]
        }
      ]
    });
    
    if (!classObj) {
      throw new AppError('Class not found', 404);
    }
    
    const studentIds = classObj.students.map(student => student.studentId);
    
    // Get all analytics for students in this class
    const analytics = await LearningAnalytics.findAll({
      where: {
        studentId: {
          [Op.in]: studentIds
        },
        entityType: 'course',
        metricType: 'overall_performance'
      },
      include: [
        {
          model: Students,
          as: 'student',
          include: [{ model: Users, as: 'user' }]
        }
      ]
    });
    
    // Calculate class averages
    const totalPerformance = analytics.reduce((sum, record) => sum + record.value, 0);
    const averagePerformance = analytics.length > 0 ? totalPerformance / analytics.length : 0;
    
    // Get performance distribution
    const performanceRanges = {
      excellent: 0, // 90-100
      good: 0,      // 80-89
      average: 0,   // 70-79
      fair: 0,      // 60-69
      poor: 0       // 0-59
    };
    
    analytics.forEach(record => {
      if (record.value >= 90) {
        performanceRanges.excellent++;
      } else if (record.value >= 80) {
        performanceRanges.good++;
      } else if (record.value >= 70) {
        performanceRanges.average++;
      } else if (record.value >= 60) {
        performanceRanges.fair++;
      } else {
        performanceRanges.poor++;
      }
    });
    
    // Get top performers
    const topPerformers = analytics
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(record => ({
        studentId: record.studentId,
        name: `${record.student.user.firstName} ${record.student.user.lastName}`,
        performance: record.value
      }));
    
    // Get students at risk (performance below 60%)
    const studentsAtRisk = analytics
      .filter(record => record.value < 60)
      .map(record => ({
        studentId: record.studentId,
        name: `${record.student.user.firstName} ${record.student.user.lastName}`,
        performance: record.value
      }));
    
    return {
      classId,
      className: classObj.name,
      totalStudents: studentIds.length,
      studentsWithAnalytics: analytics.length,
      averagePerformance,
      performanceDistribution: performanceRanges,
      topPerformers,
      studentsAtRisk
    };
  }
};

module.exports = learningAnalyticsService;
