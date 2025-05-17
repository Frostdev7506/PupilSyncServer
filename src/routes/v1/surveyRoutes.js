const express = require('express');
const router = express.Router();
const surveyController = require('../../controllers/surveyController');
const { protect, restrictTo } = require('../../middlewares/auth');

// All routes require authentication
router.use(protect);

// Survey routes
router.post('/', restrictTo('teacher', 'admin'), surveyController.createSurvey);
router.get('/teacher', restrictTo('teacher', 'admin'), surveyController.getTeacherSurveys);
router.get('/active', surveyController.getActiveSurveys);
router.get('/:id', surveyController.getSurveyById);
router.patch('/:id', restrictTo('teacher', 'admin'), surveyController.updateSurvey);
router.delete('/:id', restrictTo('teacher', 'admin'), surveyController.deleteSurvey);

// Survey response routes
router.post('/:id/responses', restrictTo('student'), surveyController.submitSurveyResponse);
router.get('/:id/results', restrictTo('teacher', 'admin'), surveyController.getSurveyResults);

module.exports = router;
