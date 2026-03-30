const { Op } = require('sequelize');
const { GoalDefine, GoalConfig, ProjectTag } = require('../models');

const parseMonth = (month) => {
  const [year, monthValue] = String(month || '').split('-').map(Number);
  return {
    year: Number.isInteger(year) ? year : null,
    month: Number.isInteger(monthValue) ? monthValue : null
  };
};

const getCurrentYearMonth = () => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1
  };
};

const buildResourcePlanPayload = (config, relatedTags) => {
  const occupiedDays = relatedTags.reduce((sum, tag) => sum + Number(tag.budget_days || 0), 0);
  const budgetDays = Number(config.budget_days || 0);

  return {
    config_id: config.config_id,
    goal_id: config.goal_id,
    goal_name: config.goal_define?.goal_name || '-',
    goal_desc: config.goal_define?.goal_desc || '',
    weight: Number(config.weight || 0),
    budget_days: budgetDays,
    remark: config.remark || '',
    tag_count: relatedTags.length,
    occupied_days: Number(occupiedDays.toFixed(2)),
    remaining_days: Number((budgetDays - occupiedDays).toFixed(2)),
    related_tag_names: relatedTags.map((tag) => tag.tag_name)
  };
};

const GoalDefineController = {
  listGoalDefines: async (req, res, next) => {
    try {
      const list = await GoalDefine.findAll({
        order: [['sort_no', 'ASC'], ['goal_id', 'ASC']]
      });

      res.success(list, 'Goal defines fetched successfully');
    } catch (error) {
      next(error);
    }
  },

  getGoalDefineDetail: async (req, res, next) => {
    try {
      const { id } = req.params;
      const item = await GoalDefine.findByPk(id);

      if (!item) {
        return res.error('目标分类不存在', 404);
      }

      res.success(item, 'Goal define detail fetched successfully');
    } catch (error) {
      next(error);
    }
  },

  createGoalDefine: async (req, res, next) => {
    try {
      const { goal_name, goal_desc, sort_no, status, user_id } = req.body;

      if (!goal_name || !String(goal_name).trim()) {
        return res.error('目标名称不能为空', 400);
      }

      const exists = await GoalDefine.findOne({
        where: {
          goal_name: String(goal_name).trim()
        }
      });

      if (exists) {
        return res.error('目标名称已存在', 400);
      }

      const item = await GoalDefine.create({
        goal_name: String(goal_name).trim(),
        goal_desc: goal_desc ? String(goal_desc).trim() : null,
        sort_no: Number(sort_no || 0),
        status: Number(status ?? 1),
        create_by: user_id || null,
        update_by: user_id || null
      });

      res.success(item, '目标分类新增成功');
    } catch (error) {
      next(error);
    }
  },

  updateGoalDefine: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { goal_name, goal_desc, sort_no, status, user_id } = req.body;
      const item = await GoalDefine.findByPk(id);

      if (!item) {
        return res.error('目标分类不存在', 404);
      }

      if (!goal_name || !String(goal_name).trim()) {
        return res.error('目标名称不能为空', 400);
      }

      const exists = await GoalDefine.findOne({
        where: {
          goal_name: String(goal_name).trim(),
          goal_id: { [Op.ne]: id }
        }
      });

      if (exists) {
        return res.error('目标名称已存在', 400);
      }

      item.goal_name = String(goal_name).trim();
      item.goal_desc = goal_desc ? String(goal_desc).trim() : null;
      item.sort_no = Number(sort_no || 0);
      item.status = Number(status ?? item.status);
      item.update_by = user_id || item.update_by;
      await item.save();

      res.success(item, '目标分类更新成功');
    } catch (error) {
      next(error);
    }
  },

  toggleGoalDefineStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, user_id } = req.body;
      const item = await GoalDefine.findByPk(id);

      if (!item) {
        return res.error('目标分类不存在', 404);
      }

      item.status = Number(status === undefined ? (item.status === 1 ? 0 : 1) : status);
      item.update_by = user_id || item.update_by;
      await item.save();

      res.success(item, '目标分类状态更新成功');
    } catch (error) {
      next(error);
    }
  },

  deleteGoalDefine: async (req, res, next) => {
    try {
      const { id } = req.params;
      const item = await GoalDefine.findByPk(id);

      if (!item) {
        return res.error('目标分类不存在', 404);
      }

      const [configCount, tagCount] = await Promise.all([
        GoalConfig.count({ where: { goal_id: id } }),
        ProjectTag.count({ where: { goal_id: id } })
      ]);

      if (configCount > 0 || tagCount > 0) {
        return res.error('该目标分类已被月度资源规划或项目Tag引用，暂不允许删除', 400);
      }

      await item.destroy();
      res.success(null, '目标分类删除成功');
    } catch (error) {
      next(error);
    }
  },

  getResourcePlan: async (req, res, next) => {
    try {
      const currentMonth = req.query.month || new Date().toISOString().slice(0, 7);
      const { year, month } = parseMonth(currentMonth);

      if (!year || !month) {
        return res.error('月份格式错误，请使用 YYYY-MM', 400);
      }

      const configs = await GoalConfig.findAll({
        where: { year, month },
        include: [
          {
            model: GoalDefine,
            attributes: ['goal_id', 'goal_name', 'goal_desc', 'sort_no', 'status']
          }
        ],
        order: [
          [GoalDefine, 'sort_no', 'ASC'],
          ['config_id', 'ASC']
        ]
      });

      const goalIds = configs.map((item) => item.goal_id);
      const tags = goalIds.length
        ? await ProjectTag.findAll({
            where: { goal_id: goalIds },
            attributes: ['tag_id', 'tag_name', 'goal_id', 'budget_days']
          })
        : [];

      const list = configs.map((config) => {
        const relatedTags = tags.filter((tag) => String(tag.goal_id) === String(config.goal_id));
        return buildResourcePlanPayload(config, relatedTags);
      });

      const summary = {
        total_weight: Number(list.reduce((sum, item) => sum + Number(item.weight || 0), 0).toFixed(2)),
        total_budget_days: Number(list.reduce((sum, item) => sum + Number(item.budget_days || 0), 0).toFixed(2)),
        total_occupied_days: Number(list.reduce((sum, item) => sum + Number(item.occupied_days || 0), 0).toFixed(2))
      };

      res.success({
        month: `${year}-${String(month).padStart(2, '0')}`,
        list,
        summary
      }, '月度资源规划获取成功');
    } catch (error) {
      next(error);
    }
  },

  getCurrentMonthResourcePlanStatus: async (req, res, next) => {
    try {
      const { year, month } = getCurrentYearMonth();
      const count = await GoalConfig.count({ where: { year, month } });

      res.success({
        year,
        month,
        has_config: count > 0,
        count
      }, '当前月资源规划状态获取成功');
    } catch (error) {
      next(error);
    }
  },

  initCurrentMonthResourcePlan: async (req, res, next) => {
    try {
      const { year, month } = getCurrentYearMonth();
      const currentCount = await GoalConfig.count({ where: { year, month } });

      if (currentCount > 0) {
        return res.success({
          year,
          month,
          has_config: true,
          created_count: 0
        }, '当前月已存在月度资源规划');
      }

      const previousConfig = await GoalConfig.findOne({
        where: {
          [Op.or]: [
            { year: { [Op.lt]: year } },
            { year, month: { [Op.lt]: month } }
          ]
        },
        order: [['year', 'DESC'], ['month', 'DESC'], ['config_id', 'ASC']]
      });

      if (!previousConfig) {
        return res.error('未找到最近一个月的资源规划，无法初始化当前月', 400);
      }

      const sourceConfigs = await GoalConfig.findAll({
        where: {
          year: previousConfig.year,
          month: previousConfig.month
        },
        order: [['config_id', 'ASC']]
      });

      if (!sourceConfigs.length) {
        return res.error('未找到最近一个月的资源规划，无法初始化当前月', 400);
      }

      const payload = sourceConfigs.map((item) => ({
        goal_id: item.goal_id,
        year,
        month,
        weight: item.weight,
        budget_days: item.budget_days,
        remark: item.remark,
        create_by: req.body.user_id || null,
        update_by: req.body.user_id || null
      }));

      await GoalConfig.bulkCreate(payload, {
        ignoreDuplicates: true
      });

      res.success({
        year,
        month,
        has_config: true,
        source_year: previousConfig.year,
        source_month: previousConfig.month,
        created_count: payload.length
      }, '当前月月度资源规划初始化成功');
    } catch (error) {
      next(error);
    }
  },

  updateResourcePlanItem: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { weight, budget_days, user_id } = req.body;
      const item = await GoalConfig.findByPk(id, {
        include: [
          {
            model: GoalDefine,
            attributes: ['goal_id', 'goal_name', 'goal_desc']
          }
        ]
      });

      if (!item) {
        return res.error('月度资源规划不存在', 404);
      }

      if (weight !== undefined && weight !== null && weight !== '') {
        item.weight = Number(weight);
      }

      if (budget_days !== undefined && budget_days !== null && budget_days !== '') {
        item.budget_days = Number(budget_days);
      }

      item.update_by = user_id || item.update_by;
      await item.save();

      res.success({
        config_id: item.config_id,
        goal_id: item.goal_id,
        goal_name: item.goal_define?.goal_name || '',
        goal_desc: item.goal_define?.goal_desc || '',
        weight: Number(item.weight || 0),
        budget_days: Number(item.budget_days || 0),
        year: item.year,
        month: item.month,
        remark: item.remark || ''
      }, '月度资源规划更新成功');
    } catch (error) {
      next(error);
    }
  },

  getCurrentMonthGoalOverview: async (req, res, next) => {
    try {
      const now = new Date();
      const year = Number(req.query.year || now.getFullYear());
      const month = Number(req.query.month || (now.getMonth() + 1));

      if (!year || !month) {
        return res.error('年月参数错误', 400);
      }

      const configs = await GoalConfig.findAll({
        where: { year, month },
        include: [
          {
            model: GoalDefine,
            attributes: ['goal_id', 'goal_name', 'goal_desc', 'sort_no']
          }
        ],
        order: [
          [GoalDefine, 'sort_no', 'ASC'],
          ['config_id', 'ASC']
        ]
      });

      const list = configs.map((config) => ({
        goal_id: config.goal_id,
        goal_name: config.goal_define?.goal_name || '-',
        goal_desc: config.goal_define?.goal_desc || '',
        weight: Number(config.weight || 0),
        budget_days: Number(config.budget_days || 0)
      }));

      res.success({
        year,
        month,
        list
      }, '当前月目标概览获取成功');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = GoalDefineController;
