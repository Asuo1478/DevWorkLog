const { DevWorkLog, DevBlockingAlert, SysUser, ProjectTag, sequelize } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');
const quarterOfYear = require('dayjs/plugin/quarterOfYear');
const isoWeek = require('dayjs/plugin/isoWeek');
dayjs.extend(quarterOfYear);
dayjs.extend(isoWeek);

const buildDateWhereClause = (startDate, endDate) => {
  const where = {};
  if (startDate && endDate) {
    where.log_date = { [Op.between]: [startDate, endDate] };
  } else if (startDate) {
    where.log_date = { [Op.gte]: startDate };
  } else if (endDate) {
    where.log_date = { [Op.lte]: endDate };
  }
  return where;
};

const getDateRange = (period, startDate, endDate) => {
  const today = dayjs();
  switch (period) {
    case 'today':
      return { start: today.format('YYYY-MM-DD'), end: today.format('YYYY-MM-DD') };
    case 'week':
      return { 
        start: today.startOf('isoWeek').format('YYYY-MM-DD'), 
        end: today.endOf('isoWeek').format('YYYY-MM-DD') 
      };
    case 'month':
      return { 
        start: today.startOf('month').format('YYYY-MM-DD'), 
        end: today.endOf('month').format('YYYY-MM-DD') 
      };
    case 'quarter':
      return { 
        start: today.startOf('quarter').format('YYYY-MM-DD'), 
        end: today.endOf('quarter').format('YYYY-MM-DD') 
      };
    case 'year':
      return { 
        start: today.startOf('year').format('YYYY-MM-DD'), 
        end: today.endOf('year').format('YYYY-MM-DD') 
      };
    case 'custom':
      return { start: startDate, end: endDate };
    default:
      return { start: today.format('YYYY-MM-DD'), end: today.format('YYYY-MM-DD') };
  }
};

const DashboardController = {
  // Get main 4 metrics
  getMetrics: async (req, res, next) => {
    try {
      const { period, startDate, endDate, username, userId } = req.query;
      const { start, end } = getDateRange(period, startDate, endDate);
      
      const whereClause = {
        log_date: { [Op.between]: [start, end] }
      };

      if (username !== 'jhtadmin' && userId) {
        whereClause.user_id = userId;
      }

      // 1. Total cumulative hours
      const totalHoursResult = await DevWorkLog.sum('work_hours', { where: whereClause }) || 0;

      // 2. Business hours ratio
      const businessLogsResult = await DevWorkLog.sum('work_hours', {
        where: {
          ...whereClause,
          task_category: { [Op.in]: ['需求开发', 'Bug修复', '测试部署'] }
        }
      }) || 0;
      const businessRatio = totalHoursResult > 0 ? ((businessLogsResult / totalHoursResult) * 100).toFixed(1) : 0;

      // 3. Bug fix ratio
      const bugLogsResult = await DevWorkLog.sum('work_hours', {
        where: {
          ...whereClause,
          task_category: 'Bug修复'
        }
      }) || 0;
      const bugRatio = totalHoursResult > 0 ? ((bugLogsResult / totalHoursResult) * 100).toFixed(1) : 0;

      // 4. Total interrupted tasks count
      const interruptedCount = await DevWorkLog.count({
        where: {
          ...whereClause,
          status: '已中断'
        }
      });

      res.success({
        totalHours: Number(totalHoursResult),
        businessRatio: Number(businessRatio),
        bugRatio: Number(bugRatio),
        interruptedCount: interruptedCount
      });
    } catch (error) {
      next(error);
    }
  },

  // Get product or category distribution
  getDistribution: async (req, res, next) => {
    try {
      const { period, startDate, endDate, groupBy = 'product_type', userId, username } = req.query; // 'product_type' or 'task_category'
      const { start, end } = getDateRange(period, startDate, endDate);
      
      const whereClause = {
        log_date: { [Op.between]: [start, end] }
      };

      if (username !== 'jhtadmin' && userId) {
        whereClause.user_id = userId;
      }

      const distribution = await DevWorkLog.findAll({
        attributes: [
          [groupBy, 'name'],
          [sequelize.fn('SUM', sequelize.col('work_hours')), 'value']
        ],
        where: whereClause,
        group: [groupBy],
        raw: true
      });

      res.success(distribution);
    } catch (error) {
      next(error);
    }
  },

  // Get weekly trend (Line chart)
  getWeeklyTrend: async (req, res, next) => {
    try {
      const { period, startDate, endDate, userId, username } = req.query;
      const { start, end } = getDateRange(period, startDate, endDate);

      const whereClause = {
        log_date: { [Op.between]: [start, end] }
      };

      if (username !== 'jhtadmin' && userId) {
        whereClause.user_id = userId;
      }

      const logs = await DevWorkLog.findAll({
        attributes: [
          'log_date',
          [sequelize.fn('SUM', sequelize.col('work_hours')), 'total_hours']
        ],
        where: whereClause,
        group: ['log_date'],
        raw: true
      });

      const weeklyData = [0, 0, 0, 0, 0, 0, 0];
      let total = 0;

      logs.forEach(log => {
        const dayIdx = dayjs(log.log_date).day(); // 0(Sun) - 6(Sat)
        const hours = Number(log.total_hours || 0);
        weeklyData[dayIdx] += hours;
        total += hours;
      });

      res.success({
        period: period || 'week',
        trend: weeklyData,
        total: Number(total.toFixed(1))
      });
    } catch (error) {
      next(error);
    }
  },

  // Get blocking alerts (Dashboard list and modal)
  getAlerts: async (req, res, next) => {
    try {
      const { period, startDate, endDate, userId, username, resolved } = req.query;
      const { start, end } = getDateRange(period, startDate, endDate);
      
      const whereClause = {
        suspend_start_time: { [Op.between]: [start, dayjs(end).endOf('day').toDate()] }
      };

      if (username !== 'jhtadmin' && userId) {
        whereClause[Op.or] = [
          { user_id: userId },
          { user_id: null }
        ];
      }

      if (resolved !== undefined) {
        if (resolved === '0') whereClause.is_resolved = 0;
        else if (resolved === '1') whereClause.is_resolved = 1;
      }

      const alerts = await DevBlockingAlert.findAll({
        where: whereClause,
        include: [{
          model: SysUser,
          attributes: ['name']
        }],
        order: [['suspend_start_time', 'DESC']]
      });

      // Calculate suspended days
      const enrichedAlerts = alerts.map(alert => {
        const dto = alert.toJSON();
        dto.suspend_days = dayjs().diff(dayjs(dto.suspend_start_time), 'day');
        return dto;
      });

      res.success(enrichedAlerts);
    } catch (error) {
      next(error);
    }
  },

  // Resolve an alert
  resolveAlert: async (req, res, next) => {
    try {
      const { id } = req.params;
      const alert = await DevBlockingAlert.findByPk(id);
      if (!alert) {
        return res.error('Alert not found', 404);
      }
      
      await alert.update({ is_resolved: 1 });
      res.success(alert, 'Alert has been marked as resolved');
    } catch (error) {
      next(error);
    }
  },

  // Get employee work log details for dashboard
  getWorkLogDetail: async (req, res, next) => {
    try {
      const { period = 'today', startDate, endDate, userId, username, page = 1, pageSize = 15 } = req.query;
      
      const range = getDateRange(period, startDate, endDate);
      const whereClause = buildDateWhereClause(range.start, range.end);
      
      // Role-based filtering
      if (username !== 'jhtadmin' && userId) {
        whereClause.user_id = userId;
      }

      const offset = (Number(page) - 1) * Number(pageSize);
      const { count, rows } = await DevWorkLog.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: SysUser,
            attributes: ['name', 'avatar_char', 'theme_color']
          },
          {
            model: ProjectTag,
            attributes: ['tag_id', 'tag_name'],
            required: false
          }
        ],
        order: [['id', 'DESC']],
        limit: Number(pageSize),
        offset
      });

      res.success({
        list: rows,
        total: count,
        page: Number(page),
        pageSize: Number(pageSize),
        appliedRange: range
      });
    } catch (error) {
      next(error);
    }
  },

  // Export employee work log details to CSV
  exportWorkLogDetail: async (req, res, next) => {
    try {
      const { period = 'today', startDate, endDate, userId, username } = req.query;
      
      const range = getDateRange(period, startDate, endDate);
      const whereClause = buildDateWhereClause(range.start, range.end);
      
      // Role-based filtering
      if (username !== 'jhtadmin' && userId) {
        whereClause.user_id = userId;
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
        order: [['id', 'DESC']]
      });

      // Simple CSV generation
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=work_log_detail_${dayjs().format('YYYYMMDDHHmmss')}.csv`);

      const headers = ['员工姓名', '登记日期', '所属项目', '关联产品', '任务类别', '投入工时(h)', '工作描述', '状态'];
      const csvRows = [headers.join(',')];

      for (const log of (logs || [])) {
        const user = log.sys_user || log.SysUser || null;
        const projectTag = log.project_tag || log.ProjectTag || null;
        const row = [
          user?.name || '未知',
          log.log_date,
          projectTag?.tag_name || '',
          log.product_type,
          log.task_category,
          log.work_hours,
          `"${(log.description || '').replace(/"/g, '""')}"`, // escape quotes for CSV
          log.status
        ];
        csvRows.push(row.join(','));
      }

      res.status(200).send('\uFEFF' + csvRows.join('\n')); // BOM for excel utf-8
    } catch (error) {
      console.error('Export Error:', error);
      next(error);
    }
  },

  // Get employees with abnormal (insufficient) hours for a specific day
  getAbnormalHours: async (req, res, next) => {
    try {
      const { threshold = 5, date = dayjs().format('YYYY-MM-DD') } = req.query;
      
      const sql = `
        SELECT 
          u.id, 
          u.name, 
          COALESCE(stat.total_hours, 0) as total_hours
        FROM sys_user u
        LEFT JOIN (
          SELECT user_id, SUM(work_hours) as total_hours
          FROM dev_work_log
          WHERE log_date = :date
          GROUP BY user_id
        ) stat ON u.id = stat.user_id
        WHERE u.status = 1 AND u.username != 'jhtadmin'
        HAVING total_hours < :threshold
        ORDER BY total_hours ASC;
      `;

      const list = await sequelize.query(sql, {
        replacements: { 
          date, 
          threshold: Number(threshold) 
        },
        type: sequelize.QueryTypes.SELECT
      });

      res.success(list);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = DashboardController;

