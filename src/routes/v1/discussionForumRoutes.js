const express = require('express');
const router = express.Router();
const discussionForumController = require('../../controllers/discussionForumController');
const discussionTopicController = require('../../controllers/discussionTopicController');
const discussionReplyController = require('../../controllers/discussionReplyController');
const { protect, restrictTo } = require('../../middlewares/auth');

// Public routes for forums
router.get('/', discussionForumController.getAllForums);
router.get('/:id', discussionForumController.getForumById);
router.get('/:id/topics', discussionForumController.getForumTopics);

// Public routes for topics
router.get('/topics/:id', discussionTopicController.getTopicById);

// Public routes for replies
router.get('/topics/:topicId/replies', discussionReplyController.getTopicReplies);
router.get('/replies/:id', discussionReplyController.getReplyById);

// Protected routes - require authentication
router.use(protect);

// Forum routes
router.post('/', restrictTo('admin', 'teacher'), discussionForumController.createForum);
router.patch('/:id', restrictTo('admin', 'teacher'), discussionForumController.updateForum);
router.delete('/:id', restrictTo('admin', 'teacher'), discussionForumController.deleteForum);
router.patch('/:id/stats', restrictTo('admin', 'teacher'), discussionForumController.updateForumStats);

// Topic routes
router.post('/topics', discussionTopicController.createTopic);
router.patch('/topics/:id', discussionTopicController.updateTopic);
router.delete('/topics/:id', discussionTopicController.deleteTopic);
router.patch('/topics/:id/moderate', restrictTo('admin', 'teacher'), discussionTopicController.moderateTopic);
router.patch('/topics/:id/pin', restrictTo('admin', 'teacher'), discussionTopicController.togglePinStatus);
router.patch('/topics/:id/lock', restrictTo('admin', 'teacher'), discussionTopicController.toggleLockStatus);

// Reply routes
router.post('/replies', discussionReplyController.createReply);
router.patch('/replies/:id', discussionReplyController.updateReply);
router.delete('/replies/:id', discussionReplyController.deleteReply);
router.patch('/replies/:id/moderate', restrictTo('admin', 'teacher'), discussionReplyController.moderateReply);
router.patch('/replies/:id/accept', discussionReplyController.markAsAcceptedAnswer);
router.post('/replies/:id/vote', discussionReplyController.voteOnReply);

module.exports = router;
