const express = require('express');
const router = express.Router();
const authController = require('../../controllers/authController');
const institutionController = require('../../controllers/institutionController');

// Get institution details
router.get('/:id', institutionController.getInstitutionDetails);

module.exports = router;