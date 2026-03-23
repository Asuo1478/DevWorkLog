const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getUsers);
router.get('/list', userController.listUsers);
router.get('/groups', userController.getGroups);
router.get('/:id', userController.getUserDetail);
router.post('/init-mock', userController.initMockUsers);
router.post('/login', userController.login);
router.post('/create', userController.createUser);
router.put('/:id', userController.updateUser);
router.put('/:id/password', userController.resetPassword);
router.put('/:id/toggle-status', userController.toggleUserStatus);
router.delete('/:id', userController.deleteUser);

module.exports = router;

