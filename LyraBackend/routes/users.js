const express = require('express');
const router = express.Router();
const controller = require('../controllers/usersController');
const auth = require('../middleware/auth');

router.get('/',              auth, controller.getUsers);
router.get('/:id',                controller.getUser);
router.get('/:id/next-exercise',  controller.nextExercise);
router.get('/:id/progress',       controller.getProgress);
router.post('/',                  controller.createUser);
router.put('/:id',           auth, controller.updateUser);
router.delete('/:id',        auth, controller.deleteUser);

module.exports = router;