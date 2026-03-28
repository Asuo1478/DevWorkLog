const sequelize = require('../config/database');
const SysUser = require('./SysUser');
const DevWorkLog = require('./DevWorkLog');
const DevBlockingAlert = require('./DevBlockingAlert');
const ProjectTag = require('./ProjectTag');
const GoalDefine = require('./GoalDefine');
const GoalConfig = require('./GoalConfig');

SysUser.hasMany(DevWorkLog, { foreignKey: 'user_id' });
DevWorkLog.belongsTo(SysUser, { foreignKey: 'user_id' });

SysUser.hasMany(DevBlockingAlert, { foreignKey: 'user_id' });
DevBlockingAlert.belongsTo(SysUser, { foreignKey: 'user_id' });

DevWorkLog.hasMany(DevBlockingAlert, { foreignKey: 'log_id' });
DevBlockingAlert.belongsTo(DevWorkLog, { foreignKey: 'log_id' });

ProjectTag.hasMany(DevWorkLog, { foreignKey: 'tag_id', sourceKey: 'tag_id' });
DevWorkLog.belongsTo(ProjectTag, { foreignKey: 'tag_id', targetKey: 'tag_id' });

GoalDefine.hasMany(GoalConfig, { foreignKey: 'goal_id', sourceKey: 'goal_id' });
GoalConfig.belongsTo(GoalDefine, { foreignKey: 'goal_id', targetKey: 'goal_id' });

GoalDefine.hasMany(ProjectTag, { foreignKey: 'goal_id', sourceKey: 'goal_id' });
ProjectTag.belongsTo(GoalDefine, { foreignKey: 'goal_id', targetKey: 'goal_id' });

module.exports = {
  sequelize,
  SysUser,
  DevWorkLog,
  DevBlockingAlert,
  ProjectTag,
  GoalDefine,
  GoalConfig
};
