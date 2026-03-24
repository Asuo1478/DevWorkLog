const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DevWorkLog = sequelize.define('dev_work_log', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID'
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '员工用户ID'
  },
  log_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '登记日期'
  },
  product_type: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '关联产品'
  },
  task_category: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '任务类别'
  },
  work_hours: {
    type: DataTypes.DECIMAL(4, 1),
    allowNull: false,
    comment: '投入工时(h)'
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '工作详情描述'
  },
  status: {
    type: DataTypes.STRING(32),
    defaultValue: '进行中',
    comment: '日志状态'
  }
}, {
  tableName: 'dev_work_log',
  comment: '研发工作日志流水总表',
  indexes: [
    {
      name: 'idx_date_product',
      fields: ['log_date', 'product_type']
    },
    {
      name: 'idx_date_category',
      fields: ['log_date', 'task_category']
    }
  ]
});

module.exports = DevWorkLog;
