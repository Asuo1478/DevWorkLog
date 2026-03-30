const express = require('express');
const router = express.Router();
const projectTagController = require('../controllers/projectTagController');

router.get('/planning', projectTagController.getPlanningList);
router.get('/active', projectTagController.getActiveTags);
router.get('/:id/delete-check', projectTagController.checkProjectTagDelete);
router.get('/:id', projectTagController.getProjectTagDetail);
router.post('/', projectTagController.createProjectTag);
router.put('/:id', projectTagController.updateProjectTag);
router.put('/:id/status', projectTagController.updateProjectTagStatus);
router.delete('/:id', projectTagController.deleteProjectTag);

module.exports = router;
