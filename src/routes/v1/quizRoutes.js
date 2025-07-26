const express = require('express');
const router = express.Router();
const quizController = require('../../controllers/quizController');
const { protect, restrictTo } = require('../../middlewares/auth');

// All routes require authentication
router.use(protect);

// Quiz routes
router.post('/', restrictTo('teacher', 'admin'), quizController.createQuiz);
router.get('/course/:courseId', restrictTo('teacher', 'admin'), quizController.getQuizzesByCourse);
router.get('/:id', restrictTo('teacher', 'admin'), quizController.getQuizById);
router.patch('/:id', restrictTo('teacher', 'admin'), quizController.updateQuiz);
router.delete('/:id', restrictTo('teacher', 'admin'), quizController.deleteQuiz);

// Question routes
router.post('/:id/questions', restrictTo('teacher', 'admin'), quizController.addQuestionToQuiz);
router.get('/questions/:questionId', restrictTo('teacher', 'admin'), quizController.getQuestionById);
router.patch('/questions/:questionId', restrictTo('teacher', 'admin'), quizController.updateQuestion);
router.delete('/questions/:questionId', restrictTo('teacher', 'admin'), quizController.deleteQuestion);

module.exports = router;
