const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserTask = sequelize.define('user_task', {
  task_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键'
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '用户ID'
  },
  tag_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '项目Tag'
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '年份'
  },
  month: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '月份'
  },
  week: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '周序号'
  },
  week_start_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  week_end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  p_hours: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    comment: '计划工时'
  },
  task_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '规划名称'
  },
  task_content: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '本周规划内容'
  },
  task_status: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '任务状态'
  },
  completion_rate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: '完成度'
  }
}, {
  tableName: 'user_task',
  timestamps: false
});

module.exports = UserTask;
