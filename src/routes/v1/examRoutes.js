const express = require('express');
const router = express.Router();
const examController = require('../../controllers/examController');
const { protect, restrictTo } = require('../../middlewares/auth');

// All exam routes require authentication
router.use(protect);

// Exam management routes (teacher/admin only)
router.post('/', restrictTo('teacher', 'admin'), examController.createExam);
router.get('/', restrictTo('teacher', 'admin'), examController.getAllExams);
router.get('/:id', restrictTo('teacher', 'admin'), examController.getExamById);
router.patch('/:id', restrictTo('teacher', 'admin'), examController.updateExam);
router.delete('/:id', restrictTo('teacher', 'admin'), examController.deleteExam);

// Question management routes
router.post('/:examId/questions', restrictTo('teacher', 'admin'), examController.addQuestionToExam);
router.patch('/questions/:questionId', restrictTo('teacher', 'admin'), examController.updateQuestion);
router.delete('/questions/:questionId', restrictTo('teacher', 'admin'), examController.deleteQuestion);

// Exam assignment routes
router.post('/:examId/assign', restrictTo('teacher', 'admin'), examController.assignExamToStudents);
router.get('/student/:studentId/assignments', examController.getStudentAssignedExams);

// Exam attempt routes
router.post('/assignments/:assignmentId/start', restrictTo('student'), examController.startExamAttempt);
router.post('/attempts/:attemptId/questions/:questionId/response', restrictTo('student'), examController.submitExamResponse);
router.post('/attempts/:attemptId/complete', restrictTo('student'), examController.completeExamAttempt);

module.exports = router;
