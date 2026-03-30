const { ProjectTag, GoalDefine, sequelize } = require('../models');

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

      const sql = `
        SELECT
          p.tag_id,
          p.tag_name,
          p.tag_desc,
          p.goal_id,
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
          p.priority DESC
      `;

      const list = await sequelize.query(sql, {
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
  }
};

module.exports = ProjectTagController;
