const { DevWorkLog, DevBlockingAlert, SysUser, sequelize } = require('../models');
const { Op } = require('sequelize');

const WorkLogController = {
  // Create new log
  createLog: async (req, res, next) => {
    try {
      const { user_id, log_date, product_type, task_category, work_hours, description, status } = req.body;
      const log = await DevWorkLog.create({
        user_id,
        log_date,
        product_type,
        task_category,
        work_hours,
        description,
        status: status || '已审核'
      });

      if (log.status === '已挂起') {
        await DevBlockingAlert.create({
          log_id: log.id,
          user_id: log.user_id,
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

  // Get log list (with filters and pagination)
  getLogs: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, startDate, endDate, userName, userId, productType, taskCategory } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (startDate && endDate) {
        whereClause.log_date = { [Op.between]: [startDate, endDate] };
      }
      if (userId) whereClause.user_id = userId;
      if (productType) whereClause.product_type = productType;
      if (taskCategory) whereClause.task_category = taskCategory;

      const includeClause = [{
        model: SysUser,
        attributes: ['name', 'avatar_char', 'theme_color']
      }];

      if (userName) {
        // Find users matching name
        const users = await SysUser.findAll({ where: { name: { [Op.like]: `%${userName}%` } }});
        const userIds = users.map(u => u.id);
        if (userIds.length > 0) {
          whereClause.user_id = { [Op.in]: userIds };
        } else {
          // If no user matches, return empty
          return res.success({ total: 0, list: [] });
        }
      }

      const { count, rows } = await DevWorkLog.findAndCountAll({
        where: whereClause,
        include: includeClause,
        order: [['log_date', 'DESC'], ['create_time', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.success({
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        list: rows
      });
    } catch (error) {
      next(error);
    }
  },

  // Export log list to CSV
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

      const includeClause = [{
        model: SysUser,
        attributes: ['name']
      }];

      if (userName) {
        const users = await SysUser.findAll({ where: { name: { [Op.like]: `%${userName}%` } }});
        const userIds = users.map(u => u.id);
        if (userIds.length > 0) {
          whereClause.user_id = { [Op.in]: userIds };
        } else {
          whereClause.id = null; // Forces empty result if user name doesn't match
        }
      }

      const logs = await DevWorkLog.findAll({
        where: whereClause,
        include: includeClause,
        order: [['log_date', 'DESC'], ['create_time', 'DESC']]
      });

      const dayjs = require('dayjs');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=work_logs_${dayjs().format('YYYYMMDDHHmmss')}.csv`);
      res.write('\ufeff');

      const headers = ['员工姓名', '登记日期', '关联产品', '任务类别', '投入工时(h)', '工作描述', '状态'];
      const csvRows = [headers.join(',')];

      for (const log of logs) {
        const userObj = log.SysUser || log.sys_user || {};
        const row = [
          userObj.name || '未知',
          log.log_date,
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

  // Update existing log
  updateLog: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const log = await DevWorkLog.findByPk(id);
      if (!log) {
        return res.error('Work log not found', 404);
      }
      
      await log.update(updateData);

      if (log.status === '已挂起') {
        const alert = await DevBlockingAlert.findOne({ where: { log_id: log.id } });
        if (alert) {
          await alert.update({
            user_id: log.user_id,
            title: `${log.product_type || ''}-${log.task_category || ''}`.substring(0, 128),
            reason: log.description,
            priority: '一般',
            is_resolved: 0
          });
        } else {
          await DevBlockingAlert.create({
            log_id: log.id,
            user_id: log.user_id,
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
          await alert.update({
            is_resolved: 1
          });
        }
      }

      res.success(log, 'Work log updated');
    } catch (error) {
      next(error);
    }
  },

  // Delete log
  deleteLog: async (req, res, next) => {
    try {
      const { id } = req.params;
      const log = await DevWorkLog.findByPk(id);
      if (log) {
        // 联动删除：先删除从表关联的预警记录，防止外键约束触发 SET NULL 导致删空
        await DevBlockingAlert.destroy({ where: { log_id: id } });
        await log.destroy();
        res.success(null, 'Work log deleted');
      } else {
        res.error('Work log not found', 404);
      }
    } catch (error) {
      next(error);
    }
  },

  /**
   * 统一汇总接口 - 支持三种统计模式
   * 参数:
   *   groupBy: 'product_type' | 'task_category' | 'daily'
   *   startDate: 起始日期 (必须)
   *   endDate: 结束日期 (可选)
   *   userId: 用户ID (非管理员时必须传)
   *   isAdmin: 'true' | 'false' 是否管理员
   *   page, limit: 分页
   */
  getSummary: async (req, res, next) => {
    try {
      const { 
        groupBy = 'product_type', 
        startDate, endDate, 
        userId, isAdmin = 'false',
        userName, productType, taskCategory,
        page = 1, limit = 20 
      } = req.query;
      const offset = (page - 1) * parseInt(limit);
      const admin = isAdmin === 'true';

      // ===== 1. 构建 WHERE =====
      const whereClause = {};

      // 日期过滤：有 endDate 用 BETWEEN，否则用 >=
      if (startDate && endDate) {
        whereClause.log_date = { [Op.between]: [startDate, endDate] };
      } else if (startDate) {
        whereClause.log_date = { [Op.gte]: startDate };
      }

      // 非管理员 → 强制加 user_id 过滤
      if (!admin && userId) {
        whereClause.user_id = userId;
      }

      // 关联产品精确过滤
      if (productType) {
        whereClause.product_type = productType;
      }

      // 任务类别精确过滤
      if (taskCategory) {
        whereClause.task_category = taskCategory;
      }

      // 员工姓名前缀模糊匹配 (b.name LIKE 'x%')
      const includeWhere = {};
      if (userName) {
        includeWhere.name = { [Op.like]: `${userName}%` };
      }

      // ===== 2. 构建 SELECT attributes =====
      const attributes = [
        'user_id',
        'log_date',
        [sequelize.fn('SUM', sequelize.col('work_hours')), 'total_hours']
      ];

      // 按关联产品 / 按任务类别 → 额外 SELECT 对应字段
      if (groupBy === 'product_type') {
        attributes.push('product_type');
      } else if (groupBy === 'task_category') {
        attributes.push('task_category');
      }
      // daily 模式不需要额外字段

      // ===== 3. 构建 GROUP BY =====
      const groupClause = [];

      // 管理员 → GROUP BY 包含 user_id
      if (admin) {
        groupClause.push('user_id');
      }

      groupClause.push('log_date');

      // 按关联产品 / 按任务类别 → GROUP BY 包含对应字段
      if (groupBy === 'product_type') {
        groupClause.push('product_type');
      } else if (groupBy === 'task_category') {
        groupClause.push('task_category');
      }

      // Sequelize 要求 include 的主键也加入 group
      groupClause.push('sys_user.id');

      // ===== 4. 构建 ORDER BY =====
      // 非管理员: ORDER BY log_date DESC
      // 管理员:   ORDER BY log_date DESC, user_id
      const orderClause = [['log_date', 'DESC']];
      if (admin) {
        orderClause.push(['user_id', 'DESC']);
      }

      // ===== 5. 执行查询 =====
      const { count, rows } = await DevWorkLog.findAndCountAll({
        attributes,
        where: whereClause,
        include: [{
          model: SysUser,
          attributes: ['name', 'avatar_char', 'theme_color'],
          where: Object.keys(includeWhere).length > 0 ? includeWhere : undefined
        }],
        group: groupClause,
        order: orderClause,
        limit: parseInt(limit),
        offset,
        subQuery: false
      });

      res.success({
        total: Array.isArray(count) ? count.length : (count || 0),
        page: parseInt(page),
        limit: parseInt(limit),
        list: rows
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = WorkLogController;
