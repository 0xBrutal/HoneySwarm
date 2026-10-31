const express = require('express');
const router = express.Router();
const defenderCtrl = require('../controllers/defenderController');
const reportCtrl = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // ALL defender routes require authentication

// Scenario Controls
router.post('/scenario/start', defenderCtrl.startScenario);
router.post('/scenario/pause', defenderCtrl.pauseScenario);
router.post('/scenario/resume', defenderCtrl.resumeScenario);
router.post('/scenario/stop', defenderCtrl.stopScenario);
router.get('/scenario/status', defenderCtrl.scenarioStatus);

// Management Controls
router.post('/session/:sessionId/reset', defenderCtrl.resetSession);
router.post('/sessions/reset-all', defenderCtrl.resetAllSessions);
router.post('/emergency-stop', defenderCtrl.emergencyStop);

// Reports
router.get('/report/:sessionId/json', reportCtrl.exportJSON);
router.get('/report/:sessionId/pdf', reportCtrl.exportPDF);

module.exports = router;