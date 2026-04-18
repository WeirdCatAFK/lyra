const express = require('express');
const router = express.Router();
const controller = require('../controllers/sessionsController');

router.post('/start',              controller.startSession);
router.post('/',                   controller.startSession);
router.post('/end',                controller.endSession);
router.post('/:id/complete',       controller.completeSession);
router.get('/:id',                 controller.getSession);
router.get('/user/:user_id',       controller.getUserSessions);

module.exports = router;