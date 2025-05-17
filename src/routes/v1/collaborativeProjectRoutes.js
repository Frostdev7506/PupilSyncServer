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
router.patch('/:id', collaborativeProjectController.updateProject);
router.delete('/:id', restrictTo('admin', 'teacher'), collaborativeProjectController.deleteProject);

// Team routes
router.get('/:projectId/teams', collaborativeProjectController.getProjectTeams);
router.get('/teams/:id', collaborativeProjectController.getTeamById);
router.post('/teams', collaborativeProjectController.createTeam);
router.patch('/teams/:id', collaborativeProjectController.updateTeam);
router.delete('/teams/:id', collaborativeProjectController.deleteTeam);

// Team member routes
router.post('/teams/members', collaborativeProjectController.addTeamMember);
router.patch('/teams/members/:id', collaborativeProjectController.updateTeamMember);
router.delete('/teams/members/:id', collaborativeProjectController.removeTeamMember);

// Team submission routes
router.post('/teams/:id/submit', collaborativeProjectController.submitTeamProject);
router.post('/teams/:id/grade', restrictTo('admin', 'teacher'), collaborativeProjectController.gradeTeamSubmission);

module.exports = router;
