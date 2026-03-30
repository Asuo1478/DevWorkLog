const { UserTask, ProjectTag, SysUser, sequelize } = require('../models');

const STATUS_OPTIONS = ['待启动', '进行中', '已完成', '已关闭'];

const getMonthByDate = (dateString) => new Date(dateString).getMonth() + 1;

const getWeekNumberByDate = (dateString) => {
  const date = new Date(dateString);
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDays = Math.floor((date - firstDay) / 86400000);
  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
};

const normalizePayload = (body = {}) => {
  const startDate = body.week_start_date ? String(body.week_start_date).trim() : null;

  return {
    user_id: body.user_id ? Number(body.user_id) : null,
    tag_id: body.tag_id ? Number(body.tag_id) : null,
    year: body.year ? Number(body.year) : (startDate ? new Date(startDate).getFullYear() : new Date().getFullYear()),
    month: body.month ? Number(body.month) : (startDate ? getMonthByDate(startDate) : null),
    week: body.week ? Number(body.week) : (startDate ? getWeekNumberByDate(startDate) : null),
    week_start_date: startDate,
    week_end_date: body.week_end_date ? String(body.week_end_date).trim() : null,
    p_hours: body.p_hours === '' || body.p_hours === undefined ? null : Number(body.p_hours),
    task_name: body.task_name ? String(body.task_name).trim() : '',
    task_content: body.task_content ? String(body.task_content).trim() : '',
    task_status: body.task_status ? String(body.task_status).trim() : '待启动',
    completion_rate: body.completion_rate === '' || body.completion_rate === undefined ? 0 : Number(body.completion_rate)
  };
};

const validatePayload = (payload) => {
  if (!payload.user_id) return 'user_id 不能为空';
  if (!payload.tag_id) return 'tag_id 不能为空';
  if (!payload.task_name) return '计划名称不能为空';
  if (!payload.task_content) return '计划内容不能为空';
  if (!payload.week_start_date) return '开始时间不能为空';
  if (!payload.week_end_date) return '结束时间不能为空';
  if (payload.p_hours === null || Number.isNaN(payload.p_hours)) return '预算工时不能为空';
  if (!STATUS_OPTIONS.includes(payload.task_status)) return '状态值不合法';
  if (new Date(payload.week_start_date) > new Date(payload.week_end_date)) return '开始时间不能晚于结束时间';
  return null;
};

const buildListSql = () => `
  SELECT
    ut.task_id,
    ut.user_id,
    ut.tag_id,
    ut.year,
    ut.month,
    ut.week,
    ut.week_start_date,
    ut.week_end_date,
    ut.p_hours,
    ut.task_name,
    ut.task_content,
    ut.task_status,
    ut.completion_rate,
    ut.create_time,
    ut.update_time,
    pt.tag_name,
    pt.budget_hours,
    COALESCE(w.actual_hours, 0) AS actual_hours,
    su.name AS user_name
  FROM user_task ut
  LEFT JOIN project_tag pt
    ON ut.tag_id = pt.tag_id
  LEFT JOIN sys_user su
    ON ut.user_id = su.id
  LEFT JOIN (
    SELECT
      tag_id,
      SUM(work_hours) AS actual_hours
    FROM dev_work_log
    WHERE tag_id IS NOT NULL
    GROUP BY tag_id
  ) w
    ON ut.tag_id = w.tag_id
  WHERE 1 = 1
    AND (:user_id IS NULL OR ut.user_id = :user_id)
    AND (:status IS NULL OR ut.task_status = :status)
    AND (
      :start_date IS NULL
      OR :end_date IS NULL
      OR ut.week_start_date <= :end_date AND ut.week_end_date >= :start_date
    )
  ORDER BY ut.year DESC, ut.month DESC, ut.week DESC, ut.task_id DESC
`;

const formatTaskItem = (item) => ({
  ...item,
  p_hours: Number(item.p_hours || 0),
  completion_rate: Number(item.completion_rate || 0),
  actual_hours: Number(item.actual_hours || 0),
  budget_hours: Number(item.budget_hours || 0)
});

const UserTaskController = {
  getUserTaskList: async (req, res, next) => {
    try {
      const keyword = req.query.keyword ? String(req.query.keyword).trim().toLowerCase() : '';
      const status = req.query.status ? String(req.query.status).trim() : null;
      const userId = req.query.user_id ? Number(req.query.user_id) : null;
      const startDate = req.query.start_date ? String(req.query.start_date).trim() : null;
      const endDate = req.query.end_date ? String(req.query.end_date).trim() : null;

      const list = await sequelize.query(buildListSql(), {
        replacements: {
          user_id: userId || null,
          status: status && status !== '全部状态' ? status : null,
          start_date: startDate || null,
          end_date: endDate || null
        },
        type: sequelize.QueryTypes.SELECT
      });

      const mappedList = list.map(formatTaskItem).filter((item) => {
        if (!keyword) return true;
        return [item.task_name, item.task_content, item.tag_name, item.user_name]
          .some((field) => String(field || '').toLowerCase().includes(keyword));
      });

      res.success(mappedList, '周计划列表获取成功');
    } catch (error) {
      next(error);
    }
  },

  getUserTaskDetail: async (req, res, next) => {
    try {
      const { id } = req.params;
      const item = await UserTask.findByPk(id, {
        include: [
          {
            model: ProjectTag,
            attributes: ['tag_id', 'tag_name', 'budget_hours']
          },
          {
            model: SysUser,
            attributes: ['id', 'name']
          }
        ]
      });

      if (!item) {
        return res.error('周计划记录不存在', 404);
      }

      const actualHours = item.project_tag
        ? Number(await sequelize.query(
          `
            SELECT COALESCE(SUM(work_hours), 0) AS actual_hours
            FROM dev_work_log
            WHERE tag_id = :tagId
          `,
          {
            replacements: { tagId: item.project_tag.tag_id },
            type: sequelize.QueryTypes.SELECT
          }
        ).then((rows) => rows[0]?.actual_hours || 0))
        : 0;

      res.success({
        ...item.toJSON(),
        budget_hours: Number(item.project_tag?.budget_hours || 0),
        actual_hours: actualHours,
        tag_name: item.project_tag?.tag_name || '',
        user_name: item.sys_user?.name || ''
      }, '周计划详情获取成功');
    } catch (error) {
      next(error);
    }
  },

  createUserTask: async (req, res, next) => {
    try {
      const payload = normalizePayload(req.body);
      const validationError = validatePayload(payload);

      if (validationError) {
        return res.error(validationError, 400);
      }

      const created = await UserTask.create(payload);
      res.success(created, '周计划创建成功');
    } catch (error) {
      next(error);
    }
  },

  updateUserTask: async (req, res, next) => {
    try {
      const { id } = req.params;
      const item = await UserTask.findByPk(id);

      if (!item) {
        return res.error('周计划记录不存在', 404);
      }

      const payload = normalizePayload(req.body);
      const validationError = validatePayload(payload);

      if (validationError) {
        return res.error(validationError, 400);
      }

      await item.update(payload);
      res.success(item, '周计划更新成功');
    } catch (error) {
      next(error);
    }
  },

  updateUserTaskStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { task_status } = req.body;
      const item = await UserTask.findByPk(id);

      if (!item) {
        return res.error('周计划记录不存在', 404);
      }

      const nextStatus = String(task_status || '').trim();
      if (!STATUS_OPTIONS.includes(nextStatus)) {
        return res.error('状态值不合法', 400);
      }

      item.task_status = nextStatus;
      await item.save();

      res.success(item, '周计划状态更新成功');
    } catch (error) {
      next(error);
    }
  },

  deleteUserTask: async (req, res, next) => {
    try {
      const { id } = req.params;
      const item = await UserTask.findByPk(id);

      if (!item) {
        return res.error('周计划记录不存在', 404);
      }

      await item.destroy();
      res.success(null, '周计划删除成功');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = UserTaskController;
