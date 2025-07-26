const express = require('express');
const router = express.Router();
const courseController = require('../../controllers/courseController');
const lessonController = require('../../controllers/lessonController');
const { protect, restrictTo } = require('../../middlewares/auth');

// Public routes for browsing courses
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

// Protected routes - require authentication
router.use(protect);

// Routes for teachers and admins
router.post('/', restrictTo('teacher', 'admin'), courseController.createCourse);
router.patch('/:id', restrictTo('teacher', 'admin'), courseController.updateCourse);
router.delete('/:id', restrictTo('teacher', 'admin'), courseController.deleteCourse);

// Course syllabus management
router.patch('/:id/syllabus', restrictTo('teacher', 'admin'), courseController.updateCourseSyllabus);

// Course format management
router.patch('/:id/format', restrictTo('teacher', 'admin'), courseController.updateCourseFormat);

// Lesson management within courses
router.get('/:courseId/lessons', lessonController.getLessonsByCourse);
router.post('/:courseId/lessons', restrictTo('teacher', 'admin'), lessonController.createLesson);

module.exports = router;
