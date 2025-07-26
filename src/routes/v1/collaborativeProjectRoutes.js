const express = require('express');
const router = express.Router();
const collaborativeProjectController = require('../../controllers/collaborativeProjectController');
const { protect, restrictTo } = require('../../middlewares/auth');

// All routes require authentication
router.use(protect);

// Project routes
router.get('/', collaborativeProjectController.getAllProjects);
router.get('/:id', collaborativeProjectController.getProjectById);
router.post('/', restrictTo('admin', 'teacher'), collaborativeProjectController.createProject);
router.patch('/:id', restrictTo('admin', 'teacher'), collaborativeProjectController.updateProject);
router.delete('/:id', restrictTo('admin', 'teacher'), collaborativeProjectController.deleteProject);

// Team routes
router.get('/:projectId/teams', collaborativeProjectController.getProjectTeams);
router.get('/teams/:id', collaborativeProjectController.getTeamById);
router.post('/teams', restrictTo('student', 'teacher', 'admin'), collaborativeProjectController.createTeam);
router.patch('/teams/:id', restrictTo('student', 'teacher', 'admin'), collaborativeProjectController.updateTeam);
router.delete('/teams/:id', restrictTo('student', 'teacher', 'admin'), collaborativeProjectController.deleteTeam);

// Team member routes
router.post('/teams/members', restrictTo('student', 'teacher', 'admin'), collaborativeProjectController.addTeamMember);
router.patch('/teams/members/:id', restrictTo('student', 'teacher', 'admin'), collaborativeProjectController.updateTeamMember);
router.delete('/teams/members/:id', restrictTo('student', 'teacher', 'admin'), collaborativeProjectController.removeTeamMember);

// Team submission routes
router.post('/teams/:id/submit', restrictTo('student', 'teacher', 'admin'), collaborativeProjectController.submitTeamProject);
router.post('/teams/:id/grade', restrictTo('admin', 'teacher'), collaborativeProjectController.gradeTeamSubmission);

module.exports = router;
