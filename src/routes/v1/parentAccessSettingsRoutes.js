const express = require('express');
const router = express.Router();
const parentAccessSettingsController = require('../../controllers/parentAccessSettingsController');
const { protect, restrictTo } = require('../../middlewares/auth');

// All routes require authentication
router.use(protect);

// Routes for parents, students, teachers, and admins
router.get('/:id', restrictTo('parent', 'student', 'teacher', 'admin'), parentAccessSettingsController.getSettingsById);
router.get('/parent/:parentId', restrictTo('parent', 'teacher', 'admin'), parentAccessSettingsController.getSettingsByParent);
router.get('/student/:studentId', restrictTo('student', 'teacher', 'admin'), parentAccessSettingsController.getSettingsByStudent);
router.get('/parent/:parentId/student/:studentId', restrictTo('parent', 'teacher', 'admin'), parentAccessSettingsController.getSettingsByParentAndStudent);
router.get('/check/:parentId/:studentId/:feature', restrictTo('parent', 'teacher', 'admin'), parentAccessSettingsController.checkAccess);

// Routes for parents and admins
router.post('/', restrictTo('parent', 'admin'), parentAccessSettingsController.createOrUpdateSettings);
router.delete('/:id', restrictTo('parent', 'admin'), parentAccessSettingsController.deleteSettings);

module.exports = router;
