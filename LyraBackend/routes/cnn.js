const express = require('express');
const router = express.Router();
const controller = require('../controllers/cnnController');

router.post('/', controller.saveTrainingData);
router.get('/', controller.getTrainingData);

module.exports = router;