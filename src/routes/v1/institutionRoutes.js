const express = require('express');
const router = express.Router();
const institutionController = require('../../controllers/institutionController');
const { protect, restrictTo } = require('../../middlewares/auth');

// Public route
router.get('/:id', institutionController.getInstitutionDetails);

// Protected routes
router.use(protect);
router.post('/', restrictTo('admin'), institutionController.createInstitution);
router.patch('/:id', restrictTo('admin'), institutionController.updateInstitution);
router.delete('/:id', restrictTo('admin'), institutionController.deleteInstitution);
router.post('/:institutionId/teachers/:teacherId', restrictTo('admin'), institutionController.addTeacherToInstitution);

module.exports = router;