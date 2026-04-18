const express = require('express');
const router = express.Router();
const controller = require('../controllers/metricsController');

router.post('/', controller.saveMetrics);
router.get('/user/:user_id', controller.getUserMetrics);
router.get('/session/:session_id', controller.getSessionMetrics);

module.exports = router;