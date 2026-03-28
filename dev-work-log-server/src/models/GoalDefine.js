const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GoalDefine = sequelize.define('goal_define', {
  goal_id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键'
  },
  goal_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '目标名称'
  },
  goal_desc: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '目标说明'
  },
  sort_no: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: '排序'
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: true,
    defaultValue: 1,
    comment: '1启用 0停用'
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
  tableName: 'goal_define'
});

module.exports = GoalDefine;
