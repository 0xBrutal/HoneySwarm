const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/intelligenceController');
const { protect } = require('../middleware/authMiddleware');

// Defender-only routes
router.get('/sessions', protect, ctrl.getAllSessions);
router.get('/sessions/:sessionId', protect, ctrl.getSessionIntelligence);

module.exports = router;
