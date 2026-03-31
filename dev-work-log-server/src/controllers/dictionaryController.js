const { SysDictionary } = require('../models');
const { Op } = require('sequelize');

const DictionaryController = {
  // Get dictionary by type (Publicly available for dropdowns)
  getListByType: async (req, res, next) => {
    try {
      const { type } = req.query;
      if (!type) return res.error('Type is required', 400);

      const list = await SysDictionary.findAll({
        where: { dict_type: type, status: 1 },
        order: [['sort_no', 'ASC'], ['id', 'ASC']]
      });
      res.success(list);
    } catch (error) {
      next(error);
    }
  },

  // Get all dictionaries (Admin only)
  getAll: async (req, res, next) => {
    try {
      const username = req.headers['x-user-username'];
      if (username !== 'jhtadmin') {
        return res.error('无权该操作，仅限管理账号', 403);
      }

      const list = await SysDictionary.findAll({
        order: [['dict_type', 'ASC'], ['sort_no', 'ASC'], ['id', 'ASC']]
      });
      res.success(list);
    } catch (error) {
      next(error);
    }
  },

  // Create dictionary item (Admin only)
  createItem: async (req, res, next) => {
    try {
      const username = req.headers['x-user-username'];
      if (username !== 'jhtadmin') {
        return res.error('无权该操作，仅限管理账号', 403);
      }

      const { dict_type, dict_label, dict_value, sort_no, status } = req.body;
      if (!dict_type || !dict_label || !dict_value) {
        return res.error('Missing required fields', 400);
      }

      const item = await SysDictionary.create({
        dict_type,
        dict_label,
        dict_value,
        sort_no: sort_no || 0,
        status: status === undefined ? 1 : status
      });
      res.success(item, 'Item created');
    } catch (error) {
      next(error);
    }
  },

  // Update dictionary item (Admin only)
  updateItem: async (req, res, next) => {
    try {
      const username = req.headers['x-user-username'];
      if (username !== 'jhtadmin') {
        return res.error('无权该操作，仅限管理账号', 403);
      }

      const { id } = req.params;
      const item = await SysDictionary.findByPk(id);
      if (!item) return res.error('Item not found', 404);

      await item.update(req.body);
      res.success(item, 'Item updated');
    } catch (error) {
      next(error);
    }
  },

  // Delete dictionary item (Admin only)
  deleteItem: async (req, res, next) => {
    try {
      const username = req.headers['x-user-username'];
      if (username !== 'jhtadmin') {
        return res.error('无权该操作，仅限管理账号', 403);
      }

      const { id } = req.params;
      const item = await SysDictionary.findByPk(id);
      if (!item) return res.error('Item not found', 404);

      await item.destroy();
      res.success(null, 'Item deleted');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = DictionaryController;
