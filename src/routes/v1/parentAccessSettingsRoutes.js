const express = require('express');
const router = express.Router();
const parentAccessSettingsController = require('../../controllers/parentAccessSettingsController');
const { protect, restrictTo } = require('../../middlewares/auth');

// All routes require authentication
router.use(protect);

// Routes for parents, students, teachers, and admins
router.get('/:id', parentAccessSettingsController.getSettingsById);
router.get('/parent/:parentId', parentAccessSettingsController.getSettingsByParent);
router.get('/student/:studentId', parentAccessSettingsController.getSettingsByStudent);
router.get('/parent/:parentId/student/:studentId', parentAccessSettingsController.getSettingsByParentAndStudent);
router.get('/check/:parentId/:studentId/:feature', parentAccessSettingsController.checkAccess);

// Routes for parents and admins
router.post('/', restrictTo('parent', 'admin'), parentAccessSettingsController.createOrUpdateSettings);
router.delete('/:id', restrictTo('parent', 'admin'), parentAccessSettingsController.deleteSettings);

module.exports = router;
