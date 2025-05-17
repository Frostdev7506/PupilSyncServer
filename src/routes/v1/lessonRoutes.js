const express = require('express');
const router = express.Router();
const lessonController = require('../../controllers/lessonController');
const { protect, restrictTo } = require('../../middlewares/auth');

// All routes require authentication
router.use(protect);

// Get lesson by ID
router.get('/:id', lessonController.getLessonById);

// Update and delete lessons (authorization check in controller)
router.patch('/:id', lessonController.updateLesson);
router.delete('/:id', lessonController.deleteLesson);

// Learning objectives
router.post('/:id/objectives', lessonController.addLearningObjectives);

// Lesson order management
router.patch('/course/:courseId/order', restrictTo('teacher', 'admin'), lessonController.updateLessonOrder);

module.exports = router;
