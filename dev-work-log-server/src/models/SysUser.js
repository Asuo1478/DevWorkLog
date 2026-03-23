const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SysUser = sequelize.define('sys_user', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID'
  },
  name: {
    type: DataTypes.STRING(32),
    allowNull: false,
    comment: '员工姓名'
  },
  username: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
    comment: '登录账号'
  },
  password: {
    type: DataTypes.STRING(128),
    allowNull: false,
    comment: '登录密码'
  },
  group_name: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '所属小组'
  },
  job_desc: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '岗位描述'
  },
  create_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '创建时间'
  },
  update_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '更新时间'
  },
  avatar_char: {
    type: DataTypes.STRING(4),
    allowNull: false,
    comment: '头像缩写文字'
  },
  theme_color: {
    type: DataTypes.STRING(32),
    defaultValue: 'primary',
    comment: 'UI配色标识'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1=在职, 0=离职'
  }
}, {
  tableName: 'sys_user',
  comment: '员工用户基础表'
});

module.exports = SysUser;
