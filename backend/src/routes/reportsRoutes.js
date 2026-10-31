const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // defender-only

router.get('/:sessionId/pdf', ctrl.pdfReport);
router.get('/:sessionId/json', ctrl.jsonReport);
router.get('/:sessionId/csv', ctrl.csvReport);

module.exports = router;
