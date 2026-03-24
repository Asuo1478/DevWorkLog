const sequelize = require('../config/database');
const SysUser = require('./SysUser');
const DevWorkLog = require('./DevWorkLog');
const DevBlockingAlert = require('./DevBlockingAlert');

// Associations
SysUser.hasMany(DevWorkLog, { foreignKey: 'user_id' });
DevWorkLog.belongsTo(SysUser, { foreignKey: 'user_id' });

SysUser.hasMany(DevBlockingAlert, { foreignKey: 'user_id' });
DevBlockingAlert.belongsTo(SysUser, { foreignKey: 'user_id' });

DevWorkLog.hasMany(DevBlockingAlert, { foreignKey: 'log_id' });
DevBlockingAlert.belongsTo(DevWorkLog, { foreignKey: 'log_id' });

module.exports = {
  sequelize,
  SysUser,
  DevWorkLog,
  DevBlockingAlert
};
