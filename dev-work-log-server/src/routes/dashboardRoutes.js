const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/metrics', dashboardController.getMetrics);
router.get('/distribution', dashboardController.getDistribution);
router.get('/weekly-trend', dashboardController.getWeeklyTrend);
router.get('/work-log-detail', dashboardController.getWorkLogDetail);
router.get('/work-log-export', dashboardController.exportWorkLogDetail);
router.get('/alerts', dashboardController.getAlerts);
router.get('/abnormal-hours', dashboardController.getAbnormalHours);
router.put('/alerts/:id/resolve', dashboardController.resolveAlert);

module.exports = router;
