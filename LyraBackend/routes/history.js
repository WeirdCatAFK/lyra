const express = require('express');
const router = express.Router();
const controller = require('../controllers/historyController');

router.post('/', controller.saveEvent);
router.get('/user/:user_id', controller.getUserHistory);

module.exports = router;