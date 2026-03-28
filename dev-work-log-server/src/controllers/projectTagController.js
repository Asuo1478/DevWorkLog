const { ProjectTag, sequelize } = require('../models');

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
  }
};

module.exports = ProjectTagController;
