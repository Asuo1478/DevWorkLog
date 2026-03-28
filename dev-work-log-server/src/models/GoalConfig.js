const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GoalConfig = sequelize.define('goal_config', {
  config_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键'
  },
  goal_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '关联目标分类'
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '年份'
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '月份'
  },
  weight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: '权重百分比'
  },
  budget_days: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    comment: '预算人天'
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注'
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
  tableName: 'goal_config'
});

module.exports = GoalConfig;
