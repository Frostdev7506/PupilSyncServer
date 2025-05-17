const { Op } = require('sequelize');
const AppError = require('../utils/errors/AppError');
const { sequelize } = require('../config/db.js');
const initModels = require('../models/init-models');

const models = initModels(sequelize);
const { 
  LearningAnalytics, 
  Students, 
  Courses, 
  Lessons, 
  ContentBlocks, 
  ContentEngagements,
  StudentQuizAttempts,
  StudentExamAttempts,
  Submissions,
  LearningPaths,
  LearningPathItems,
  LearningRecommendations
} = models;

const recommendationService = {
  /**
   * Generate course recommendations for a student
   * @param {number} studentId - The student ID
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} - The recommended courses
   */
  async generateCourseRecommendations(studentId, options = {}) {
    try {
      const { limit = 5, categoryId, level } = options;
      
      // Get student's enrolled courses
      const student = await Students.findByPk(studentId, {
        include: [
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
      
      const enrolledCourseIds = student.courses.map(course => course.courseId);
      
      // Get student's learning analytics
      const analytics = await LearningAnalytics.findAll({
        where: { studentId }
      });
      
      // Extract student's strengths and weaknesses
      const strengths = [];
      const weaknesses = [];
      
      analytics.forEach(record => {
        if (record.performanceData && record.performanceData.skills) {
          Object.entries(record.performanceData.skills).forEach(([skill, score]) => {
            if (score >= 80) {
              strengths.push(skill);
            } else if (score <= 50) {
              weaknesses.push(skill);
            }
          });
        }
      });
      
      // Build query for course recommendations
      const whereClause = {
        courseId: { [Op.notIn]: enrolledCourseIds },
        isPublished: true
      };
      
      if (categoryId) {
        whereClause.categoryId = categoryId;
      }
      
      if (level) {
        whereClause.level = level;
      }
      
      // Get courses that address student's weaknesses
      const recommendedCourses = await Courses.findAll({
        where: whereClause,
        include: [
          {
            model: CourseCategories,
            as: 'categories',
            through: { attributes: ['isPrimary'] }
          }
        ],
        limit
      });
      
      // Store recommendations in the database
      const recommendations = recommendedCourses.map(course => ({
        studentId,
        entityType: 'course',
        entityId: course.courseId,
        reason: 'Based on your learning profile and areas for improvement',
        score: this._calculateRecommendationScore(course, strengths, weaknesses),
        metadata: {
          strengths,
          weaknesses,
          courseLevel: course.level,
          courseCategories: course.categories.map(cat => cat.name)
        }
      }));
      
      await LearningRecommendations.bulkCreate(recommendations);
      
      return recommendedCourses;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error generating course recommendations: ${error.message}`, 500);
    }
  },
  
  /**
   * Generate content recommendations for a student
   * @param {number} studentId - The student ID
   * @param {number} courseId - The course ID
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} - The recommended content blocks
   */
  async generateContentRecommendations(studentId, courseId, options = {}) {
    try {
      const { limit = 5 } = options;
      
      // Get student's quiz and exam performance in the course
      const quizAttempts = await StudentQuizAttempts.findAll({
        include: [
          {
            model: Quizzes,
            as: 'quiz',
            where: { courseId },
            include: [
              {
                model: QuizQuestions,
                as: 'questions'
              }
            ]
          }
        ],
        where: { studentId }
      });
      
      const examAttempts = await StudentExamAttempts.findAll({
        include: [
          {
            model: Exams,
            as: 'exam',
            where: { courseId },
            include: [
              {
                model: ExamQuestions,
                as: 'questions'
              }
            ]
          }
        ],
        where: { studentId }
      });
      
      // Identify topics where the student is struggling
      const strugglingTopics = this._identifyStrugglingTopics(quizAttempts, examAttempts);
      
      // Get content blocks that address struggling topics
      const recommendedContent = await ContentBlocks.findAll({
        include: [
          {
            model: Lessons,
            as: 'lesson',
            where: { courseId },
            include: [
              {
                model: Courses,
                as: 'course'
              }
            ]
          }
        ],
        where: {
          [Op.or]: strugglingTopics.map(topic => ({
            [Op.or]: [
              { title: { [Op.iLike]: `%${topic}%` } },
              { content: { [Op.iLike]: `%${topic}%` } }
            ]
          }))
        },
        limit
      });
      
      // Store recommendations in the database
      const recommendations = recommendedContent.map(content => ({
        studentId,
        entityType: 'contentBlock',
        entityId: content.contentBlockId,
        reason: 'Based on topics you may need additional help with',
        score: this._calculateContentRecommendationScore(content, strugglingTopics),
        metadata: {
          strugglingTopics,
          lessonId: content.lessonId,
          courseId
        }
      }));
      
      await LearningRecommendations.bulkCreate(recommendations);
      
      return recommendedContent;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error generating content recommendations: ${error.message}`, 500);
    }
  },
  
  /**
   * Generate a personalized learning path for a student
   * @param {number} studentId - The student ID
   * @param {number} courseId - The course ID
   * @returns {Promise<Object>} - The personalized learning path
   */
  async generatePersonalizedLearningPath(studentId, courseId) {
    const transaction = await sequelize.transaction();
    
    try {
      // Get student's learning analytics
      const analytics = await LearningAnalytics.findOne({
        where: { 
          studentId,
          courseId
        }
      });
      
      if (!analytics) {
        await transaction.rollback();
        throw new AppError('Learning analytics not found for this student and course', 404);
      }
      
      // Get course lessons
      const lessons = await Lessons.findAll({
        where: { courseId },
        include: [
          {
            model: ContentBlocks,
            as: 'contentBlocks',
            separate: true,
            order: [['order', 'ASC']]
          }
        ],
        order: [['order', 'ASC']]
      });
      
      // Get student's content engagements
      const engagements = await ContentEngagements.findAll({
        include: [
          {
            model: ContentBlocks,
            as: 'contentBlock',
            include: [
              {
                model: Lessons,
                as: 'lesson',
                where: { courseId }
              }
            ]
          }
        ],
        where: { userId: studentId }
      });
      
      // Create a personalized learning path
      const learningPath = await LearningPaths.create({
        studentId,
        courseId,
        title: `Personalized path for Course #${courseId}`,
        description: 'Automatically generated based on your learning profile',
        isActive: true
      }, { transaction });
      
      // Generate path items based on student's performance and engagement
      const pathItems = [];
      let order = 1;
      
      // Add required lessons first
      for (const lesson of lessons) {
        // Check if student has completed this lesson
        const lessonCompleted = lesson.contentBlocks.every(block => {
          const engagement = engagements.find(e => e.contentBlockId === block.contentBlockId);
          return engagement && engagement.progress >= 100;
        });
        
        if (!lessonCompleted) {
          // Add lesson to path
          pathItems.push({
            learningPathId: learningPath.pathId,
            entityType: 'lesson',
            entityId: lesson.lessonId,
            order: order++,
            isRequired: true,
            completionCriteria: {
              requiredProgress: 100
            }
          });
          
          // Add content blocks that need attention
          for (const block of lesson.contentBlocks) {
            const engagement = engagements.find(e => e.contentBlockId === block.contentBlockId);
            
            if (!engagement || engagement.progress < 100) {
              pathItems.push({
                learningPathId: learningPath.pathId,
                entityType: 'contentBlock',
                entityId: block.contentBlockId,
                order: order++,
                isRequired: block.isRequired,
                completionCriteria: {
                  requiredProgress: 100
                }
              });
            }
          }
        }
      }
      
      // Add recommended content based on struggling topics
      const recommendedContent = await this.generateContentRecommendations(studentId, courseId, { transaction });
      
      for (const content of recommendedContent) {
        // Check if content is already in path
        const alreadyInPath = pathItems.some(item => 
          item.entityType === 'contentBlock' && item.entityId === content.contentBlockId
        );
        
        if (!alreadyInPath) {
          pathItems.push({
            learningPathId: learningPath.pathId,
            entityType: 'contentBlock',
            entityId: content.contentBlockId,
            order: order++,
            isRequired: false,
            completionCriteria: {
              requiredProgress: 100
            }
          });
        }
      }
      
      // Create path items
      await LearningPathItems.bulkCreate(pathItems, { transaction });
      
      await transaction.commit();
      
      // Return the complete learning path with items
      return this.getLearningPathById(learningPath.pathId);
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error generating personalized learning path: ${error.message}`, 500);
    }
  },
  
  /**
   * Get a learning path by ID
   * @param {number} pathId - The learning path ID
   * @returns {Promise<Object>} - The learning path
   */
  async getLearningPathById(pathId) {
    try {
      const learningPath = await LearningPaths.findByPk(pathId, {
        include: [
          {
            model: LearningPathItems,
            as: 'items',
            separate: true,
            order: [['order', 'ASC']]
          },
          {
            model: Students,
            as: 'student'
          },
          {
            model: Courses,
            as: 'course'
          }
        ]
      });
      
      if (!learningPath) {
        throw new AppError('Learning path not found', 404);
      }
      
      return learningPath;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Error retrieving learning path: ${error.message}`, 500);
    }
  },
  
  /**
   * Get all learning paths for a student
   * @param {number} studentId - The student ID
   * @returns {Promise<Array>} - The learning paths
   */
  async getStudentLearningPaths(studentId) {
    try {
      const learningPaths = await LearningPaths.findAll({
        where: { 
          studentId,
          isActive: true
        },
        include: [
          {
            model: Courses,
            as: 'course'
          }
        ],
        order: [['createdAt', 'DESC']]
      });
      
      return learningPaths;
    } catch (error) {
      throw new AppError(`Error retrieving learning paths: ${error.message}`, 500);
    }
  },
  
  /**
   * Get all recommendations for a student
   * @param {number} studentId - The student ID
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} - The recommendations
   */
  async getStudentRecommendations(studentId, options = {}) {
    try {
      const { entityType, limit = 10 } = options;
      
      // Build the where clause
      const where = { studentId };
      
      if (entityType) {
        where.entityType = entityType;
      }
      
      const recommendations = await LearningRecommendations.findAll({
        where,
        order: [['score', 'DESC']],
        limit
      });
      
      return recommendations;
    } catch (error) {
      throw new AppError(`Error retrieving recommendations: ${error.message}`, 500);
    }
  },
  
  /**
   * Calculate recommendation score for a course
   * @param {Object} course - The course
   * @param {Array} strengths - The student's strengths
   * @param {Array} weaknesses - The student's weaknesses
   * @returns {number} - The recommendation score
   * @private
   */
  _calculateRecommendationScore(course, strengths, weaknesses) {
    let score = 50; // Base score
    
    // Adjust score based on course level
    if (course.level === 'beginner' && weaknesses.length > strengths.length) {
      score += 10;
    } else if (course.level === 'intermediate' && 
               weaknesses.length === strengths.length) {
      score += 10;
    } else if (course.level === 'advanced' && 
               strengths.length > weaknesses.length) {
      score += 10;
    }
    
    // Adjust score based on course categories
    if (course.categories) {
      course.categories.forEach(category => {
        if (category.isPrimary) {
          score += 5;
        }
      });
    }
    
    return Math.min(100, score);
  },
  
  /**
   * Calculate recommendation score for a content block
   * @param {Object} contentBlock - The content block
   * @param {Array} strugglingTopics - The topics the student is struggling with
   * @returns {number} - The recommendation score
   * @private
   */
  _calculateContentRecommendationScore(contentBlock, strugglingTopics) {
    let score = 50; // Base score
    
    // Check if content block addresses struggling topics
    strugglingTopics.forEach(topic => {
      if (contentBlock.title.toLowerCase().includes(topic.toLowerCase())) {
        score += 10;
      }
      
      if (contentBlock.content && 
          contentBlock.content.toLowerCase().includes(topic.toLowerCase())) {
        score += 5;
      }
    });
    
    // Adjust score based on content type
    if (contentBlock.type === 'interactive' || 
        contentBlock.type === 'video' || 
        contentBlock.type === 'h5p') {
      score += 10; // Interactive content is more engaging
    }
    
    return Math.min(100, score);
  },
  
  /**
   * Identify topics where the student is struggling
   * @param {Array} quizAttempts - The student's quiz attempts
   * @param {Array} examAttempts - The student's exam attempts
   * @returns {Array} - The topics the student is struggling with
   * @private
   */
  _identifyStrugglingTopics(quizAttempts, examAttempts) {
    const topicScores = {};
    
    // Process quiz attempts
    quizAttempts.forEach(attempt => {
      attempt.quiz.questions.forEach(question => {
        const topic = question.topic || 'general';
        
        if (!topicScores[topic]) {
          topicScores[topic] = { correct: 0, total: 0 };
        }
        
        // Check if student answered this question correctly
        const response = attempt.responses.find(r => r.questionId === question.questionId);
        
        if (response) {
          topicScores[topic].total++;
          
          if (response.isCorrect) {
            topicScores[topic].correct++;
          }
        }
      });
    });
    
    // Process exam attempts
    examAttempts.forEach(attempt => {
      attempt.exam.questions.forEach(question => {
        const topic = question.topic || 'general';
        
        if (!topicScores[topic]) {
          topicScores[topic] = { correct: 0, total: 0 };
        }
        
        // Check if student answered this question correctly
        const response = attempt.responses.find(r => r.questionId === question.questionId);
        
        if (response) {
          topicScores[topic].total++;
          
          if (response.isCorrect) {
            topicScores[topic].correct++;
          }
        }
      });
    });
    
    // Identify topics with score below 70%
    const strugglingTopics = [];
    
    Object.entries(topicScores).forEach(([topic, scores]) => {
      if (scores.total > 0) {
        const percentage = (scores.correct / scores.total) * 100;
        
        if (percentage < 70) {
          strugglingTopics.push(topic);
        }
      }
    });
    
    return strugglingTopics;
  }
};

module.exports = recommendationService;
