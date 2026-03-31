const express = require('express');
const router = express.Router();
const dictionaryController = require('../controllers/dictionaryController');

router.get('/list', dictionaryController.getListByType);
router.get('/all', dictionaryController.getAll);
router.post('/', dictionaryController.createItem);
router.put('/:id', dictionaryController.updateItem);
router.delete('/:id', dictionaryController.deleteItem);

module.exports = router;
