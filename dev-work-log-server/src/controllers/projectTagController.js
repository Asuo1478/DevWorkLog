const { ProjectTag, GoalDefine, DevWorkLog, sequelize } = require('../models');

const STATUS_OPTIONS = ['待启动', '进行中', '已完成', '已关闭'];

const getCurrentYear = () => new Date().getFullYear();

const getActualHoursByTagId = async (tagId) => {
  const [row] = await sequelize.query(
    `
      SELECT COALESCE(SUM(work_hours), 0) AS actual_hours
      FROM dev_work_log
      WHERE tag_id = :tagId
    `,
    {
      replacements: { tagId },
      type: sequelize.QueryTypes.SELECT
    }
  );

  return Number(row?.actual_hours || 0);
};

const getDeleteCheckResult = async (id) => {
  const relatedLogCount = await DevWorkLog.count({
    where: { tag_id: id }
  });

  if (relatedLogCount > 0) {
    return {
      can_delete: false,
      message: '该项目&任务已经实际启动，不允许删除。'
    };
  }

  return {
    can_delete: true,
    message: ''
  };
};

const normalizePayload = (body = {}) => {
  const startDate = body.start_date ? String(body.start_date).trim() : null;
  const budgetDays = body.budget_days === '' || body.budget_days === undefined ? null : Number(body.budget_days);
  const budgetHours = body.budget_hours === '' || body.budget_hours === undefined ? null : Number(body.budget_hours);

  return {
    tag_name: body.tag_name ? String(body.tag_name).trim() : '',
    tag_desc: body.tag_desc ? String(body.tag_desc).trim() : null,
    goal_id: body.goal_id ? Number(body.goal_id) : null,
    year: body.year ? Number(body.year) : (startDate ? new Date(startDate).getFullYear() : getCurrentYear()),
    start_date: startDate,
    end_date: body.end_date ? String(body.end_date).trim() : null,
    budget_days: budgetDays,
    budget_hours: budgetHours,
    priority: body.priority === '' || body.priority === undefined ? null : String(body.priority).trim(),
    status: body.status ? String(body.status).trim() : '待启动',
    progress_rate: body.progress_rate === '' || body.progress_rate === undefined ? 0 : Number(body.progress_rate),
    create_by: body.create_by || null,
    update_by: body.update_by || null
  };
};

const validatePayload = (payload) => {
  if (!payload.tag_name) return '项目&计划名称不能为空';
  if (!payload.goal_id) return 'goal_id 不能为空';
  if (!payload.start_date) return '开始时间不能为空';
  if (!payload.end_date) return '结束时间不能为空';
  if (payload.budget_days === null || Number.isNaN(payload.budget_days)) return '预算人天不能为空';
  if (payload.budget_hours === null || Number.isNaN(payload.budget_hours)) return '预算工时不能为空';
  if (payload.priority !== null && !/^\d+$/.test(String(payload.priority))) return '优先级只能录入数字';
  if (!STATUS_OPTIONS.includes(payload.status)) return '状态值不合法';
  if (new Date(payload.start_date) > new Date(payload.end_date)) return '开始时间不能晚于结束时间';
  return null;
};

const buildPlanningListSql = () => `
  SELECT
    p.tag_id,
    p.tag_name,
    p.tag_desc,
    p.goal_id,
    p.year,
    g.goal_name,
    g.goal_desc,
    p.start_date,
    p.end_date,
    p.budget_days,
    p.budget_hours,
    p.priority,
    p.status,
    p.progress_rate,
    p.create_time,
    COALESCE(w.actual_hours, 0) AS actual_hours
  FROM project_tag p
  LEFT JOIN goal_define g
    ON p.goal_id = g.goal_id
  LEFT JOIN (
    SELECT
      tag_id,
      SUM(work_hours) AS actual_hours
    FROM dev_work_log
    WHERE tag_id IS NOT NULL
    GROUP BY tag_id
  ) w
    ON p.tag_id = w.tag_id
  WHERE 1 = 1
    AND (:keyword IS NULL OR p.tag_name LIKE CONCAT('%', :keyword, '%'))
    AND (:status IS NULL OR p.status = :status)
    AND (
      :start_date IS NULL
      OR :end_date IS NULL
      OR p.create_time BETWEEN :start_date AND :end_date
    )
  ORDER BY
    CAST(COALESCE(p.priority, '0') AS SIGNED) DESC,
    p.tag_id DESC
`;

const ProjectTagController = {
  getActiveTags: async (req, res, next) => {
    try {
      const tags = await ProjectTag.findAll({
        where: { status: '进行中' },
        attributes: ['tag_id', 'tag_name', 'status', 'priority', 'goal_id', 'progress_rate'],
        order: [
          [sequelize.literal('CAST(priority AS SIGNED)'), 'DESC'],
          ['tag_id', 'DESC']
        ]
      });

      res.success(tags, 'Project tags fetched successfully');
    } catch (error) {
      next(error);
    }
  },

  getPlanningList: async (req, res, next) => {
    try {
      const keyword = req.query.keyword ? String(req.query.keyword).trim() : null;
      const status = req.query.status ? String(req.query.status).trim() : null;
      const startDate = req.query.start_date ? String(req.query.start_date).trim() : null;
      const endDate = req.query.end_date ? String(req.query.end_date).trim() : null;

      const list = await sequelize.query(buildPlanningListSql(), {
        replacements: {
          keyword: keyword || null,
          status: status && status !== '全部状态' ? status : null,
          start_date: startDate || null,
          end_date: endDate ? `${endDate} 23:59:59` : null
        },
        type: sequelize.QueryTypes.SELECT
      });

      res.success(list, '项目&任务管理列表获取成功');
    } catch (error) {
      next(error);
    }
  },

  getProjectTagDetail: async (req, res, next) => {
    try {
      const { id } = req.params;
      const item = await ProjectTag.findByPk(id, {
        include: [
          {
            model: GoalDefine,
            attributes: ['goal_id', 'goal_name', 'goal_desc']
          }
        ]
      });

      if (!item) {
        return res.error('项目&任务记录不存在', 404);
      }

      const actualHours = await getActualHoursByTagId(id);

      res.success(
        {
          ...item.toJSON(),
          goal_name: item.goal_define?.goal_name || '',
          goal_desc: item.goal_define?.goal_desc || '',
          actual_hours: actualHours
        },
        '项目&任务详情获取成功'
      );
    } catch (error) {
      next(error);
    }
  },

  createProjectTag: async (req, res, next) => {
    try {
      const payload = normalizePayload(req.body);
      const validationError = validatePayload(payload);

      if (validationError) {
        return res.error(validationError, 400);
      }

      const created = await ProjectTag.create(payload);
      res.success(created, '项目&任务创建成功');
    } catch (error) {
      next(error);
    }
  },

  updateProjectTag: async (req, res, next) => {
    try {
      const { id } = req.params;
      const item = await ProjectTag.findByPk(id);

      if (!item) {
        return res.error('项目&任务记录不存在', 404);
      }

      const payload = normalizePayload(req.body);
      const validationError = validatePayload(payload);

      if (validationError) {
        return res.error(validationError, 400);
      }

      await item.update(payload);
      res.success(item, '项目&任务更新成功');
    } catch (error) {
      next(error);
    }
  },

  updateProjectTagStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, update_by } = req.body;
      const item = await ProjectTag.findByPk(id);

      if (!item) {
        return res.error('项目&任务记录不存在', 404);
      }

      const nextStatus = String(status || '').trim();

      if (!STATUS_OPTIONS.includes(nextStatus)) {
        return res.error('状态值不合法', 400);
      }

      item.status = nextStatus;
      item.update_by = update_by || item.update_by;
      await item.save();

      res.success(item, '项目&任务状态更新成功');
    } catch (error) {
      next(error);
    }
  },

  checkProjectTagDelete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const item = await ProjectTag.findByPk(id);

      if (!item) {
        return res.error('项目&任务记录不存在', 404);
      }

      const result = await getDeleteCheckResult(id);
      res.success(result, '项目&任务删除校验完成');
    } catch (error) {
      next(error);
    }
  },

  deleteProjectTag: async (req, res, next) => {
    try {
      const { id } = req.params;
      const item = await ProjectTag.findByPk(id);

      if (!item) {
        return res.error('项目&任务记录不存在', 404);
      }

      const deleteCheck = await getDeleteCheckResult(id);
      if (!deleteCheck.can_delete) {
        return res.error(deleteCheck.message, 400);
      }

      await item.destroy();
      res.success(null, '项目&任务删除成功');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = ProjectTagController;
