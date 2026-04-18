const express = require('express');
const router = express.Router();
const controller = require('../controllers/usersController');
const auth = require('../middleware/auth');

router.get('/', auth, controller.getUsers);

router.get('/', controller.getUsers);
router.get('/:id', controller.getUser);
router.post('/', controller.createUser);
router.put('/:id', controller.updateUser);
router.delete('/:id', controller.deleteUser);

module.exports = router;