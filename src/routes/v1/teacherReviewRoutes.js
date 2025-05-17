const express = require('express');
const router = express.Router();
const teacherReviewController = require('../../controllers/teacherReviewController');
const { protect, restrictTo } = require('../../middlewares/auth');

// Public routes
router.get('/teacher/:teacherId', teacherReviewController.getTeacherReviews);
router.get('/:id', teacherReviewController.getReviewById);

// Protected routes
router.use(protect);

// Student routes
router.post('/', restrictTo('student'), teacherReviewController.createReview);
router.get('/student/:studentId', teacherReviewController.getStudentReviews);
router.patch('/:id', teacherReviewController.updateReview);
router.delete('/:id', teacherReviewController.deleteReview);

// Teacher routes
router.post('/:id/response', restrictTo('teacher'), teacherReviewController.addTeacherResponse);

// Admin routes
router.patch('/:id/moderate', restrictTo('admin'), teacherReviewController.moderateReview);

module.exports = router;
