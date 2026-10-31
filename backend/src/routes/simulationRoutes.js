const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/simulationController');
const { loadSession } = require('../middleware/sessionMiddleware');

router.post('/session', ctrl.createSession);
router.get('/session', loadSession, ctrl.getSessionInfo);
router.post('/terminal', loadSession, ctrl.terminal);
router.post('/chat', loadSession, ctrl.chat);
router.get('/files', loadSession, ctrl.listFiles);
router.get('/file-content', loadSession, ctrl.fileContent);
router.get('/directory', loadSession, ctrl.directory);
router.get('/admin', loadSession, ctrl.adminPanel);

module.exports = router;
