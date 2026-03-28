const { DevWorkLog, DevBlockingAlert, SysUser, ProjectTag, sequelize } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

const WorkLogController = {
  createLog: async (req, res, next) => {
    try {
      const {
        user_id,
        tag_id,
        log_date,
        product_type,
        task_category,
        work_hours,
        description,
        status,
        is_shortcut,
        shortcut_name
      } = req.body;

      const log = await DevWorkLog.create({
        user_id,
        tag_id: tag_id || null,
        log_date,
        product_type,
        task_category,
        work_hours,
        description,
        status: status || '进行中',
        is_shortcut: is_shortcut || 0,
        shortcut_name: shortcut_name || null
      });

      if (log.status === '已挂起') {
        await DevBlockingAlert.create({
          log_id: log.id,
          user_id: log.user_id,
          tag_id: log.tag_id,
          title: `${log.product_type || ''}-${log.task_category || ''}`.substring(0, 128),
          reason: log.description,
          priority: '一般',
          is_resolved: 0,
          suspend_start_time: new Date()
        });
      }

      res.success(log, 'Work log created successfully');
    } catch (error) {
      next(error);
    }
  },

  getLogs: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, startDate, endDate, userName, userId, productType, taskCategory, isShortcut } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const whereClause = {};
      if (startDate && endDate) {
        whereClause.log_date = { [Op.between]: [startDate, endDate] };
      }
      if (userId) whereClause.user_id = userId;
      if (productType) whereClause.product_type = productType;
      if (taskCategory) whereClause.task_category = taskCategory;
      if (typeof isShortcut !== 'undefined') whereClause.is_shortcut = Number(isShortcut);

      if (userName) {
        const users = await SysUser.findAll({ where: { name: { [Op.like]: `%${userName}%` } } });
        const userIds = users.map(user => user.id);
        if (userIds.length === 0) {
          return res.success({ total: 0, page: Number(page), limit: Number(limit), list: [] });
        }
        whereClause.user_id = { [Op.in]: userIds };
      }

      const { count, rows } = await DevWorkLog.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: SysUser,
            attributes: ['name', 'avatar_char', 'theme_color']
          },
          {
            model: ProjectTag,
            attributes: ['tag_id', 'tag_name', 'status'],
            required: false
          }
        ],
        order: [['log_date', 'DESC'], ['create_time', 'DESC']],
        limit: Number(limit),
        offset
      });

      res.success({
        total: count,
        page: Number(page),
        limit: Number(limit),
        list: rows
      });
    } catch (error) {
      next(error);
    }
  },

  exportLogs: async (req, res, next) => {
    try {
      const { startDate, endDate, userName, userId, productType, taskCategory } = req.query;

      const whereClause = {};
      if (startDate && endDate) {
        whereClause.log_date = { [Op.between]: [startDate, endDate] };
      }
      if (userId) whereClause.user_id = userId;
      if (productType) whereClause.product_type = productType;
      if (taskCategory) whereClause.task_category = taskCategory;

      if (userName) {
        const users = await SysUser.findAll({ where: { name: { [Op.like]: `%${userName}%` } } });
        const userIds = users.map(user => user.id);
        if (userIds.length === 0) {
          whereClause.id = null;
        } else {
          whereClause.user_id = { [Op.in]: userIds };
        }
      }

      const logs = await DevWorkLog.findAll({
        where: whereClause,
        include: [
          {
            model: SysUser,
            attributes: ['name']
          },
          {
            model: ProjectTag,
            attributes: ['tag_name'],
            required: false
          }
        ],
        order: [['log_date', 'DESC'], ['create_time', 'DESC']]
      });

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=work_logs_${dayjs().format('YYYYMMDDHHmmss')}.csv`);
      res.write('\ufeff');

      const headers = ['员工姓名', '登记日期', '所属项目Tag', '关联产品', '任务类别', '投入工时(h)', '工作描述', '状态'];
      const csvRows = [headers.join(',')];

      for (const log of logs) {
        const user = log.sys_user || log.SysUser || null;
        const projectTag = log.project_tag || log.ProjectTag || null;
        const row = [
          user?.name || '未知',
          log.log_date,
          projectTag?.tag_name || '',
          log.product_type,
          log.task_category,
          log.work_hours,
          `"${(log.description || '').replace(/"/g, '""')}"`,
          log.status
        ];
        csvRows.push(row.join(','));
      }

      res.end(csvRows.join('\n'));
    } catch (error) {
      next(error);
    }
  },

  updateLog: async (req, res, next) => {
    try {
      const { id } = req.params;
      const log = await DevWorkLog.findByPk(id);

      if (!log) {
        return res.error('Work log not found', 404);
      }

      await log.update(req.body);

      if (log.status === '已挂起') {
        const alert = await DevBlockingAlert.findOne({ where: { log_id: log.id } });
        if (alert) {
          await alert.update({
            user_id: log.user_id,
            tag_id: log.tag_id,
            title: `${log.product_type || ''}-${log.task_category || ''}`.substring(0, 128),
            reason: log.description,
            priority: '一般',
            is_resolved: 0
          });
        } else {
          await DevBlockingAlert.create({
            log_id: log.id,
            user_id: log.user_id,
            tag_id: log.tag_id,
            title: `${log.product_type || ''}-${log.task_category || ''}`.substring(0, 128),
            reason: log.description,
            priority: '一般',
            is_resolved: 0,
            suspend_start_time: new Date()
          });
        }
      } else {
        const alert = await DevBlockingAlert.findOne({ where: { log_id: log.id } });
        if (alert && alert.is_resolved === 0) {
          await alert.update({ is_resolved: 1 });
        }
      }

      res.success(log, 'Work log updated');
    } catch (error) {
      next(error);
    }
  },

  deleteLog: async (req, res, next) => {
    try {
      const { id } = req.params;
      const log = await DevWorkLog.findByPk(id);

      if (!log) {
        return res.error('Work log not found', 404);
      }

      await DevBlockingAlert.destroy({ where: { log_id: id } });
      await log.destroy();
      res.success(null, 'Work log deleted');
    } catch (error) {
      next(error);
    }
  },

  getSummary: async (req, res, next) => {
    try {
      const {
        groupBy = 'product_type',
        startDate,
        endDate,
        userId,
        isAdmin = 'false',
        userName,
        productType,
        taskCategory,
        page = 1,
        limit = 20
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const admin = isAdmin === 'true';

      // ── 动态构建 WHERE 条件 ──────────────────────────────────────
      const conditions = [];
      const replacements = {};

      if (startDate && endDate) {
        conditions.push('w.log_date BETWEEN :startDate AND :endDate');
        replacements.startDate = startDate;
        replacements.endDate = endDate;
      } else if (startDate) {
        conditions.push('w.log_date >= :startDate');
        replacements.startDate = startDate;
      }

      if (!admin && userId) {
        conditions.push('w.user_id = :userId');
        replacements.userId = userId;
      }

      if (productType) {
        conditions.push('w.product_type = :productType');
        replacements.productType = productType;
      }

      if (taskCategory) {
        conditions.push('w.task_category = :taskCategory');
        replacements.taskCategory = taskCategory;
      }

      if (userName) {
        conditions.push('u.name LIKE :userName');
        replacements.userName = `${userName}%`;
      }

      const whereSQL = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // ── 动态 GROUP BY / SELECT 维度字段 ─────────────────────────
      let dimSelect = '';
      let dimGroup  = '';
      let joinSQL   = '';

      if (groupBy === 'tag_id') {
        dimSelect = ', w.tag_id, pt.tag_id AS pt_tag_id, pt.tag_name';
        dimGroup  = ', w.tag_id, pt.tag_id, pt.tag_name';
        joinSQL   = 'LEFT JOIN project_tag pt ON w.tag_id = pt.tag_id';
      } else if (groupBy === 'product_type') {
        dimSelect = ', w.product_type';
        dimGroup  = ', w.product_type';
      } else if (groupBy === 'task_category') {
        dimSelect = ', w.task_category';
        dimGroup  = ', w.task_category';
      }

      const adminGroup = admin ? 'w.user_id, ' : '';

      // ── COUNT 查询（分页总数）───────────────────────────────────
      const countSQL = `
        SELECT COUNT(*) AS total FROM (
          SELECT 1
          FROM dev_work_log w
          LEFT JOIN sys_user u ON w.user_id = u.id
          ${joinSQL}
          ${whereSQL}
          GROUP BY w.user_id, w.log_date${dimGroup}, u.id, u.name, u.avatar_char, u.theme_color
        ) t
      `;

      // ── 数据查询 ─────────────────────────────────────────────────
      const orderBySQL = admin
        ? 'ORDER BY w.log_date DESC, w.user_id DESC'
        : 'ORDER BY w.log_date DESC';

      const dataSQL = `
        SELECT
          w.user_id,
          w.log_date,
          SUM(w.work_hours) AS total_hours
          ${dimSelect},
          u.id   AS \`sys_user.id\`,
          u.name AS \`sys_user.name\`,
          u.avatar_char  AS \`sys_user.avatar_char\`,
          u.theme_color  AS \`sys_user.theme_color\`
        FROM dev_work_log w
        LEFT JOIN sys_user u ON w.user_id = u.id
        ${joinSQL}
        ${whereSQL}
        GROUP BY w.user_id, w.log_date${dimGroup}, u.id, u.name, u.avatar_char, u.theme_color
        ${orderBySQL}
        LIMIT :limit OFFSET :offset
      `;

      replacements.limit  = Number(limit);
      replacements.offset = offset;

      const [[{ total }], rows] = await Promise.all([
        sequelize.query(countSQL, { replacements, type: sequelize.QueryTypes.SELECT }),
        sequelize.query(dataSQL,  { replacements, type: sequelize.QueryTypes.SELECT, nest: true })
      ]);

      // ── 格式化为前端期望的结构 ───────────────────────────────────
      const list = rows.map(row => ({
        user_id:      row.user_id,
        log_date:     row.log_date,
        total_hours:  row.total_hours,
        product_type: row.product_type || null,
        task_category:row.task_category || null,
        tag_id:       row.tag_id || null,
        sys_user: {
          name:        row.sys_user?.name        || null,
          avatar_char: row.sys_user?.avatar_char || null,
          theme_color: row.sys_user?.theme_color || null
        },
        ProjectTag: row.pt_tag_id ? {
          tag_id:   row.pt_tag_id,
          tag_name: row.tag_name || null
        } : null
      }));

      res.success({
        total: Number(total) || 0,
        page:  Number(page),
        limit: Number(limit),
        list
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = WorkLogController;
