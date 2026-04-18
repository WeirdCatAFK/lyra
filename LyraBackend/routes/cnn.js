const express = require('express');
const router = express.Router();
const controller = require('../controllers/cnnController');

router.post('/',                    controller.saveTrainingData);
router.get('/',                     controller.getTrainingData);
router.get('/user/:user_id',        controller.getUserTrainingData);

module.exports = router;