const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.get('/status', protect, ctrl.providerStatus);

module.exports = router;
