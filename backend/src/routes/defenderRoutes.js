const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/defenderController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // ALL defender routes require authentication

router.post('/scenario/start', ctrl.startScenario);
router.post('/scenario/pause', ctrl.pauseScenario);
router.post('/scenario/resume', ctrl.resumeScenario);
router.post('/scenario/stop', ctrl.stopScenario);
router.get('/scenario/status', ctrl.scenarioStatus);

module.exports = router;
