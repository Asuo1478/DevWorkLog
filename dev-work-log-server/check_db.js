const { DevWorkLog, SysUser } = require('./src/models');

async function check() {
  const logs = await DevWorkLog.findAll({
    attributes: ['user_id'],
    group: ['user_id']
  });
  console.log('User IDs in Work Logs:', logs.map(l => l.user_id));
  
  const users = await SysUser.findAll();
  console.log('All Users:', users.map(u => ({ id: u.id, username: u.username })));

  process.exit();
}
check().catch(err => {
  console.error(err);
  process.exit(1);
});
