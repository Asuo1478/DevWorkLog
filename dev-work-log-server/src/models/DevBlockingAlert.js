const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DevBlockingAlert = sequelize.define('dev_blocking_alert', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID'
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '挂起员工ID'
  },
  tag_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '项目TagID'
  },
  log_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '异常关联日志ID'
  },
  priority: {
    type: DataTypes.STRING(16),
    allowNull: false,
    defaultValue: 'WARNING',
    comment: '优先级'
  },
  suspend_start_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '挂起开始时间'
  },
  title: {
    type: DataTypes.STRING(128),
    allowNull: false,
    comment: '阻塞简述标题'
  },
  reason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '具体阻塞影响与原因'
  },
  is_resolved: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '1=已解决 0=未解决'
  }
}, {
  tableName: 'dev_blocking_alert',
  comment: '阻塞预警异常表'
});

module.exports = DevBlockingAlert;
