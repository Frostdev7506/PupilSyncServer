const express = require('express');
const router = express.Router();
const studentProgressReportController = require('../../controllers/studentProgressReportController');
const { protect, restrictTo } = require('../../middlewares/auth');

// All routes require authentication
router.use(protect);

// Routes for viewing reports
router.get('/:id', studentProgressReportController.getReportById);
router.get('/student/:studentId', studentProgressReportController.getStudentReports);
router.get('/teacher/:teacherId', studentProgressReportController.getTeacherReports);
router.get('/student/:studentId/comprehensive', studentProgressReportController.generateComprehensiveReport);

// Routes for managing reports (teachers and admins only)
router.post('/', restrictTo('teacher', 'admin'), studentProgressReportController.createReport);
router.patch('/:id', restrictTo('teacher', 'admin'), studentProgressReportController.updateReport);
router.delete('/:id', restrictTo('teacher', 'admin'), studentProgressReportController.deleteReport);

module.exports = router;
