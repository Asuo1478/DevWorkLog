const express = require('express');
const router = express.Router();
const projectTagController = require('../controllers/projectTagController');

router.get('/planning', projectTagController.getPlanningList);
router.get('/active', projectTagController.getActiveTags);

module.exports = router;
