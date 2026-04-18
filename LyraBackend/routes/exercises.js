const express = require('express');
const router = express.Router();
const controller = require('../controllers/exercisesController');

router.get('/', controller.getExercises);
router.get('/:id', controller.getExercise);
router.post('/', controller.createExercise);
router.put('/:id', controller.updateExercise);
router.delete('/:id', controller.deleteExercise);

module.exports = router;