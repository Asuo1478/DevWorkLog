const { SysUser } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');

const md5 = (text) => crypto.createHash('md5').update(text).digest('hex');

// Extract User / Dictionary logic
const UserController = {
  // Get all active users (dictionary/dropdown use)
  getUsers: async (req, res, next) => {
    try {
      const users = await SysUser.findAll({
        where: { status: 1 },
        attributes: ['id', 'name', 'avatar_char', 'theme_color']
      });
      res.success(users);
    } catch (error) {
      next(error);
    }
  },

  // Get distinct group names for dropdown
  getGroups: async (req, res, next) => {
    try {
      const groups = await SysUser.findAll({
        attributes: [[require('sequelize').fn('DISTINCT', require('sequelize').col('group_name')), 'group_name']],
        where: { group_name: { [Op.ne]: null } },
        raw: true
      });
      res.success(groups.map(g => g.group_name).filter(Boolean));
    } catch (error) {
      next(error);
    }
  },

  // List users with pagination + conditional search
  listUsers: async (req, res, next) => {
    try {
      const { name, username, status, group_name, page = 1, pageSize = 10 } = req.query;
      const where = {};

      if (name) {
        where.name = { [Op.like]: `%${name}%` };
      }
      if (username) {
        where.username = { [Op.like]: `%${username}%` };
      }
      if (status !== undefined && status !== '' && status !== '全部') {
        where.status = Number(status);
      }
      if (group_name && group_name !== '全部') {
        where.group_name = group_name;
      }

      const offset = (Number(page) - 1) * Number(pageSize);
      const { count, rows } = await SysUser.findAndCountAll({
        where,
        attributes: { exclude: ['password'] },
        order: [['create_time', 'DESC'], ['id', 'DESC']],
        limit: Number(pageSize),
        offset
      });

      res.success({
        list: rows,
        total: count,
        page: Number(page),
        pageSize: Number(pageSize)
      });
    } catch (error) {
      next(error);
    }
  },

  // Create a new user
  createUser: async (req, res, next) => {
    try {
      const { name, username, password, group_name, job_desc } = req.body;

      if (!name || !username || !password) {
        return res.error('姓名、登录账号和密码为必填项', 400);
      }

      // Check if username already exists
      const existing = await SysUser.findOne({ where: { username } });
      if (existing) {
        return res.error('该登录账号已被使用', 400);
      }

      const user = await SysUser.create({
        name,
        username,
        password: password,
        group_name: group_name || null,
        job_desc: job_desc || null,
        avatar_char: name.charAt(0),
        theme_color: 'primary',
        status: 1,
        create_time: new Date(),
        update_time: new Date()
      });

      res.success({ id: user.id }, '账号创建成功');
    } catch (error) {
      next(error);
    }
  },

  // Toggle user status (1 <-> 0)
  toggleUserStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = await SysUser.findByPk(id);

      if (!user) return res.error('用户不存在', 404);

      user.status = user.status === 1 ? 0 : 1;
      user.update_time = new Date();
      await user.save();

      res.success({ status: user.status }, user.status === 1 ? '账号已启用' : '账号已禁用');
    } catch (error) {
      next(error);
    }
  },

  // Get single user detail
  getUserDetail: async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = await SysUser.findByPk(id, {
        attributes: { exclude: ['password'] }
      });
      if (!user) return res.error('用户不存在', 404);
      res.success(user);
    } catch (error) {
      next(error);
    }
  },

  // Update user
  updateUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, username, password, group_name, job_desc } = req.body;
      const user = await SysUser.findByPk(id);

      if (!user) return res.error('用户不存在', 404);

      if (!name || !username) {
        return res.error('姓名和登录账号为必填项', 400);
      }

      // Check username uniqueness (exclude self)
      if (username !== user.username) {
        const existing = await SysUser.findOne({ where: { username } });
        if (existing) return res.error('该登录账号已被使用', 400);
      }

      user.name = name;
      user.username = username;
      user.group_name = group_name || null;
      user.job_desc = job_desc || null;
      user.avatar_char = name.charAt(0);
      user.update_time = new Date();

      // Only update password if provided
      if (password) {
        user.password = password;
      }

      await user.save();
      res.success(null, '账号信息已更新');
    } catch (error) {
      next(error);
    }
  },

  // Delete user
  deleteUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = await SysUser.findByPk(id);
      if (!user) return res.error('用户不存在', 404);
      await user.destroy();
      res.success(null, '账号已删除');
    } catch (error) {
      next(error);
    }
  },

  // Login
  login: async (req, res, next) => {
    try {
      const { username, password } = req.body;
      const hashedPassword = password;
      
      const user = await SysUser.findOne({ 
        where: { username, password: hashedPassword },
        attributes: ['id', 'username', 'name', 'avatar_char', 'group_name', 'job_desc', 'theme_color']
      });
      if (user) {
        res.success(user, '登录成功');
      } else {
        res.error('账号或密码错误', 401);
      }
    } catch (error) {
      next(error);
    }
  },

  // Reset password
  resetPassword: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;
      const user = await SysUser.findByPk(id);
      
      if (!user) return res.error('用户不存在', 404);
      
      const hashedCurrent = currentPassword;
      if (user.password !== hashedCurrent) {
        return res.error('当前登录密码认证失败，请重新输入', 401);
      }
      
      user.password = newPassword;
      await user.save();
      
      res.success(null, '密码修改成功');
    } catch (error) {
      next(error);
    }
  },

  // Auto-init basic users if emtpy
  initMockUsers: async (req, res, next) => {
    try {
      const count = await SysUser.count();
      if (count === 0) {
        await SysUser.bulkCreate([
          { username: 'zhangwei', password: md5('password123'), name: '张伟', group_name: '研发一部', job_desc: '前端开发工程师', avatar_char: '张', theme_color: 'primary' },
          { username: 'lifang', password: md5('password123'), name: '李芳', group_name: '研发二部', job_desc: '后端开发工程师', avatar_char: '李', theme_color: 'secondary' },
          { username: 'wanglei', password: md5('password123'), name: '王磊', group_name: '测试部', job_desc: '软件测试工程师', avatar_char: '王', theme_color: 'tertiary' },
          { username: 'liuyang', password: md5('password123'), name: '刘洋', group_name: '产品部', job_desc: '产品经理', avatar_char: '刘', theme_color: 'primary' }
        ]);
        res.success(null, 'Mock users generated successfully');
      } else {
        res.success(null, 'Users already exist');
      }
    } catch (error) {
      next(error);
    }
  }
};

module.exports = UserController;
