const express = require('express');
const router = express.Router();
const workLogController = require('../controllers/workLogController');

router.post('/', workLogController.createLog);
router.get('/', workLogController.getLogs);
router.get('/export', workLogController.exportLogs);
router.put('/:id', workLogController.updateLog);
router.delete('/:id', workLogController.deleteLog);
router.get('/summary', workLogController.getSummary);

module.exports = router;
