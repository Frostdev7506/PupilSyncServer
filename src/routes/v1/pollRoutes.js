const express = require('express');
const router = express.Router();
const pollController = require('../../controllers/pollController');
const { protect, restrictTo } = require('../../middlewares/auth');

// All routes require authentication
router.use(protect);

// Poll routes
router.post('/', restrictTo('teacher', 'admin'), pollController.createPoll);
router.get('/teacher', restrictTo('teacher', 'admin'), pollController.getTeacherPolls);
router.get('/active', pollController.getActivePolls);
router.get('/:id', pollController.getPollById);
router.patch('/:id', restrictTo('teacher', 'admin'), pollController.updatePoll);
router.delete('/:id', restrictTo('teacher', 'admin'), pollController.deletePoll);

// Poll response routes
router.post('/:id/responses', restrictTo('student'), pollController.submitPollResponse);
router.get('/:id/results', restrictTo('teacher', 'admin'), pollController.getPollResults);

module.exports = router;
