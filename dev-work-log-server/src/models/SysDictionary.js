const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SysDictionary = sequelize.define('SysDictionary', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键'
  },
  dict_type: {
    type: DataTypes.STRING(32),
    allowNull: false,
    comment: '字典类型 (如: PRODUCT_TYPE, TASK_CATEGORY)'
  },
  dict_label: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '显示标签'
  },
  dict_value: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '对应值'
  },
  sort_no: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序编号 (越小越靠前)'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态 (1:启用, 0:禁用)'
  },
  create_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  update_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'sys_dictionary',
  underscored: true,
  timestamps: true,
  createdAt: 'create_time',
  updatedAt: 'update_time'
});

module.exports = SysDictionary;
