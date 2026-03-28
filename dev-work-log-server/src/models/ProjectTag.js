const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProjectTag = sequelize.define('project_tag', {
  tag_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键'
  },
  tag_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Tag名称'
  },
  goal_id: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  budget_days: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true
  },
  budget_hours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  priority: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  progress_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  last_log_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  tag_desc: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  create_by: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  update_by: {
    type: DataTypes.BIGINT,
    allowNull: true
  }
}, {
  tableName: 'project_tag',
  timestamps: false
});

module.exports = ProjectTag;
