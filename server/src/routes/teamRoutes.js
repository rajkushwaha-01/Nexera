const express = require('express');
const router = express.Router();
const { getAllTeamMembers } = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/members', getAllTeamMembers);

module.exports = router;
