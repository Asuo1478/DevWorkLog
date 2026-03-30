const express = require('express');
const router = express.Router();
const userTaskController = require('../controllers/userTaskController');

router.get('/', userTaskController.getUserTaskList);
router.get('/:id', userTaskController.getUserTaskDetail);
router.post('/', userTaskController.createUserTask);
router.put('/:id', userTaskController.updateUserTask);
router.put('/:id/status', userTaskController.updateUserTaskStatus);
router.delete('/:id', userTaskController.deleteUserTask);

module.exports = router;
