const express = require('express');
const router = express.Router();
const goalDefineController = require('../controllers/goalDefineController');

router.get('/', goalDefineController.listGoalDefines);
router.get('/resource-plan', goalDefineController.getResourcePlan);
router.get('/current-month-overview', goalDefineController.getCurrentMonthGoalOverview);
router.get('/:id', goalDefineController.getGoalDefineDetail);
router.post('/', goalDefineController.createGoalDefine);
router.put('/:id', goalDefineController.updateGoalDefine);
router.put('/:id/toggle-status', goalDefineController.toggleGoalDefineStatus);
router.delete('/:id', goalDefineController.deleteGoalDefine);

module.exports = router;
