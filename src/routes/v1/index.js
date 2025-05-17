const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const testRoutes = require('./testRoutes');
const institutionRoutes = require('./institutionRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const examRoutes = require('./examRoutes');
const quizRoutes = require('./quizRoutes');
const pollRoutes = require('./pollRoutes');
const surveyRoutes = require('./surveyRoutes');
const assignmentRoutes = require('./assignmentRoutes');

// Teacher features
const teacherProfileRoutes = require('./teacherProfileRoutes');
const teacherEarningRoutes = require('./teacherEarningRoutes');
const teacherReviewRoutes = require('./teacherReviewRoutes');
const marketplaceRoutes = require('./marketplaceRoutes');

// Course features
const courseRoutes = require('./courseRoutes');
const lessonRoutes = require('./lessonRoutes');
const contentBlockRoutes = require('./contentBlockRoutes');
const courseCategoryRoutes = require('./courseCategoryRoutes');
const courseCategoryMappingRoutes = require('./courseCategoryMappingRoutes');

// Discussion and collaboration features
const discussionForumRoutes = require('./discussionForumRoutes');
const collaborativeProjectRoutes = require('./collaborativeProjectRoutes');
const chatRoutes = require('./chatRoutes');

// Parent monitoring features
const parentAccessSettingsRoutes = require('./parentAccessSettingsRoutes');
const parentNotificationRoutes = require('./parentNotificationRoutes');
const studentProgressReportRoutes = require('./studentProgressReportRoutes');

// Analytics and reporting features
const analyticsEventRoutes = require('./analyticsEventRoutes');
const learningAnalyticsRoutes = require('./learningAnalyticsRoutes');
const learningPathRoutes = require('./learningPathRoutes');

// Core routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/test', testRoutes);
router.use('/institutions', institutionRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/exams', examRoutes);
router.use('/quizzes', quizRoutes);
router.use('/polls', pollRoutes);
router.use('/surveys', surveyRoutes);
router.use('/assignments', assignmentRoutes);

// Teacher routes
router.use('/teacher-profiles', teacherProfileRoutes);
router.use('/teacher-earnings', teacherEarningRoutes);
router.use('/teacher-reviews', teacherReviewRoutes);
router.use('/marketplace', marketplaceRoutes);

// Course routes
router.use('/courses', courseRoutes);
router.use('/lessons', lessonRoutes);
router.use('/content-blocks', contentBlockRoutes);
router.use('/course-categories', courseCategoryRoutes);
router.use('/course-category-mappings', courseCategoryMappingRoutes);

// Discussion and collaboration routes
router.use('/discussion-forums', discussionForumRoutes);
router.use('/collaborative-projects', collaborativeProjectRoutes);
router.use('/chats', chatRoutes);

// Parent monitoring routes
router.use('/parent-access-settings', parentAccessSettingsRoutes);
router.use('/parent-notifications', parentNotificationRoutes);
router.use('/student-progress-reports', studentProgressReportRoutes);

// Analytics and reporting routes
router.use('/analytics-events', analyticsEventRoutes);
router.use('/learning-analytics', learningAnalyticsRoutes);
router.use('/learning-paths', learningPathRoutes);

module.exports = router;