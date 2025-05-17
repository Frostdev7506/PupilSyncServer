const express = require('express');
const router = express.Router();
const learningAnalyticsController = require('../../controllers/learningAnalyticsController');
const { protect, restrictTo } = require('../../middlewares/auth');

// All routes require authentication
router.use(protect);

// Routes for viewing analytics
router.get('/:id', learningAnalyticsController.getAnalyticsById);
router.get('/student/:studentId', learningAnalyticsController.getStudentAnalytics);
router.get('/entity/:entityType/:entityId', restrictTo('admin', 'teacher'), learningAnalyticsController.getEntityAnalytics);

// Routes for generating analytics
router.post('/student/:studentId/course/:courseId/generate', learningAnalyticsController.generateCoursePerformanceAnalytics);
router.get('/class/:classId/performance', restrictTo('admin', 'teacher'), learningAnalyticsController.getClassPerformanceAnalytics);

// Routes for managing analytics (teachers and admins only)
router.post('/', restrictTo('admin', 'teacher'), learningAnalyticsController.createOrUpdateAnalytics);
router.delete('/:id', restrictTo('admin', 'teacher'), learningAnalyticsController.deleteAnalytics);

module.exports = router;
