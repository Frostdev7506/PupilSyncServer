const express = require('express');
const router = express.Router();
const learningPathController = require('../../controllers/learningPathController');
const { protect } = require('../../middlewares/auth');

// All routes require authentication
router.use(protect);

// Learning path routes
router.get('/:id', learningPathController.getLearningPathById);
router.get('/student/:studentId', learningPathController.getStudentLearningPaths);
router.post('/student/:studentId/course/:courseId/generate', learningPathController.generateLearningPath);

// Recommendation routes
router.get('/student/:studentId/recommendations', learningPathController.getStudentRecommendations);
router.get('/student/:studentId/recommendations/courses', learningPathController.getCourseRecommendations);
router.get('/student/:studentId/course/:courseId/recommendations/content', learningPathController.getContentRecommendations);

module.exports = router;
