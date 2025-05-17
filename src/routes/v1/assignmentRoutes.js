const express = require('express');
const router = express.Router();
const assignmentController = require('../../controllers/assignmentController');
const submissionController = require('../../controllers/submissionController');
const { protect, restrictTo } = require('../../middlewares/auth');

// All routes require authentication
router.use(protect);

// Assignment routes
router.post('/', restrictTo('teacher', 'admin'), assignmentController.createAssignment);
router.get('/student', restrictTo('student'), assignmentController.getStudentAssignments);
router.get('/course/:courseId', assignmentController.getAssignmentsByCourse);
router.get('/:id', assignmentController.getAssignmentById);
router.patch('/:id', restrictTo('teacher', 'admin'), assignmentController.updateAssignment);
router.delete('/:id', restrictTo('teacher', 'admin'), assignmentController.deleteAssignment);

// Submission routes
router.post('/:assignmentId/submit', restrictTo('student'), submissionController.submitAssignment);
router.get('/:assignmentId/submissions', submissionController.getSubmissionsByAssignment);
router.get('/submissions/:id', submissionController.getSubmissionById);
router.get('/submissions', restrictTo('student'), submissionController.getStudentSubmissions);
router.post('/submissions/:id/grade', restrictTo('teacher', 'admin'), submissionController.gradeSubmission);

module.exports = router;
