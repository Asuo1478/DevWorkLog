CREATE DATABASE IF NOT EXISTS db_DevWorkLog DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

USE db_DevWorkLog;

-- 1. 员工用户基础表
CREATE TABLE IF NOT EXISTS sys_user (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  name VARCHAR(32) NOT NULL COMMENT '员工姓名',
  username VARCHAR(64) NOT NULL UNIQUE COMMENT '登录账号',
  password VARCHAR(128) NOT NULL COMMENT '登录密码',
  group_name VARCHAR(64) COMMENT '所属小组',
  job_desc VARCHAR(255) COMMENT '岗位描述',
  avatar_char VARCHAR(4) NOT NULL COMMENT '头像缩写文字',
  theme_color VARCHAR(32) DEFAULT 'primary' COMMENT 'UI配色标识',
  status TINYINT DEFAULT 1 COMMENT '状态：1=在职, 0=离职',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='员工用户基础表';

-- 2. 研发工作日志流水总表
CREATE TABLE IF NOT EXISTS dev_work_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  user_id BIGINT COMMENT '员工用户ID',
  tag_id BIGINT COMMENT '项目ID',
  log_date DATE NOT NULL COMMENT '登记日期',
  product_type VARCHAR(64) NOT NULL COMMENT '关联产品',
  task_category VARCHAR(64) NOT NULL COMMENT '任务类别',
  work_hours DECIMAL(4,1) NOT NULL COMMENT '投入工时(h)',
  description VARCHAR(500) COMMENT '工作详情描述',
  status VARCHAR(32) DEFAULT '进行中' COMMENT '日志状态',
  is_shortcut TINYINT DEFAULT 0 COMMENT '快捷登记引用：0=否, 1=是',
  shortcut_name VARCHAR(64) DEFAULT NULL COMMENT '快捷登记引用别名',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_date_product (log_date, product_type),
  INDEX idx_date_category (log_date, task_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='研发工作日志流水总表';

-- 3. 阻塞预警异常表
CREATE TABLE IF NOT EXISTS dev_blocking_alert (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  user_id BIGINT COMMENT '挂起人ID冗余',
  tag_id BIGINT COMMENT '项目TagID',
  log_id BIGINT COMMENT '异常引发关联日志ID',
  priority VARCHAR(16) NOT NULL DEFAULT 'WARNING' COMMENT '优先级',
  suspend_start_time DATETIME NOT NULL COMMENT '挂起起始时间',
  title VARCHAR(128) NOT NULL COMMENT '阻塞简述标题',
  reason VARCHAR(500) COMMENT '具体阻塞影响与原因',
  is_resolved TINYINT DEFAULT 0 COMMENT '1: 已解决, 0: 未解决',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='阻塞预警异常表';

-- goal_define: 团队目标分类定义表
CREATE TABLE `goal_define` (
  `goal_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `goal_name` varchar(100) NOT NULL COMMENT '目标名称',
  `goal_desc` varchar(500) DEFAULT NULL COMMENT '目标说明',
  `sort_no` int(11) DEFAULT '0' COMMENT '排序',
  `status` tinyint(4) DEFAULT '1' COMMENT '1启用 0停用',
  `create_by` bigint(20) DEFAULT NULL COMMENT '创建人',
  `update_by` bigint(20) DEFAULT NULL COMMENT '更新人',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`goal_id`),
  KEY `idx_status_sort` (`status`,`sort_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='团队目标分类定义表';

-- goal_config: 月度目标权重与预算配置表
CREATE TABLE `goal_config` (
  `config_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `goal_id` bigint(20) NOT NULL COMMENT '关联目标分类',
  `year` int(11) NOT NULL COMMENT '年份',
  `month` tinyint(4) NOT NULL COMMENT '月份',
  `weight` decimal(5,2) DEFAULT NULL COMMENT '权重百分比',
  `budget_days` decimal(8,2) DEFAULT NULL COMMENT '预算人天',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `create_by` bigint(20) DEFAULT NULL COMMENT '创建人',
  `update_by` bigint(20) DEFAULT NULL COMMENT '更新人',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`config_id`),
  UNIQUE KEY `uk_goal_month` (`goal_id`,`year`,`month`),
  KEY `idx_goal_id` (`goal_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='月度目标权重与预算配置表';

-- project_tag: 项目 Tag 生命周期管理表
CREATE TABLE `project_tag` (
  `tag_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `tag_name` varchar(200) NOT NULL COMMENT 'Tag名称',
  `goal_id` bigint(20) NOT NULL COMMENT '关联目标分类',
  `year` int(11) NOT NULL COMMENT '首次立项年份',
  `start_date` date DEFAULT NULL COMMENT '开始日期',
  `end_date` date DEFAULT NULL COMMENT '计划结束日期',
  `budget_days` decimal(8,2) DEFAULT NULL COMMENT '预算人天',
  `budget_hours` decimal(10,2) DEFAULT NULL COMMENT '预算工时',
  `priority` varchar(20) DEFAULT NULL COMMENT '优先级',
  `status` varchar(20) DEFAULT '待启动' COMMENT '待启动/进行中/已完成/已关闭',
  `progress_rate` decimal(5,2) DEFAULT '0.00' COMMENT '手工或系统计算进度',
  `last_log_date` date DEFAULT NULL COMMENT '最近日志日期',
  `tag_desc` varchar(500) DEFAULT NULL COMMENT '说明',
  `create_by` bigint(20) DEFAULT NULL COMMENT '创建人',
  `update_by` bigint(20) DEFAULT NULL COMMENT '更新人',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`tag_id`),
  KEY `idx_goal_status` (`goal_id`,`status`),
  KEY `idx_last_log_date` (`last_log_date`),
  KEY `idx_goal_id` (`goal_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目 Tag 生命周期管理表';

-- user_task: 个人周规划任务表
CREATE TABLE `user_task` (
  `task_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` bigint(20) NOT NULL COMMENT '用户ID',
  `tag_id` bigint(20) DEFAULT NULL COMMENT '项目Tag',
  `year` int(11) NOT NULL COMMENT '年份',
  `month` tinyint(4) NOT NULL COMMENT '月份',
  `week` tinyint(4) NOT NULL COMMENT '周序号',
  `week_start_date` date DEFAULT NULL COMMENT '周开始日期',
  `week_end_date` date DEFAULT NULL COMMENT '周结束日期',
  `p_hours` decimal(8,2) DEFAULT '0.00' COMMENT '计划工时',
  `task_content` varchar(500) DEFAULT NULL COMMENT '本周规划内容',
  `task_status` varchar(20) DEFAULT '待启动' COMMENT '待启动/进行中/已完成/已关闭',
  `completion_rate` decimal(5,2) DEFAULT '0.00' COMMENT '完成度',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`task_id`),
  KEY `idx_user_week` (`user_id`,`year`,`month`,`week`),
  KEY `idx_tag_week` (`tag_id`,`year`,`month`,`week`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_tag_id` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='个人周规划任务表';


-- 写入演示数据
INSERT IGNORE INTO sys_user (name, username, password, group_name, job_desc, avatar_char, theme_color) VALUES 
('张伟', md5('zhangwei'), '482c811da5d5b4bc6d497ffa98491e38', '研发一部', '前端开发工程师', '张', 'primary'),
('李芳', md5('lifang'), '482c811da5d5b4bc6d497ffa98491e38', '研发二部', '后端开发工程师', '李', 'secondary'),
('王磊', md5('wanglei'), '482c811da5d5b4bc6d497ffa98491e38', '测试部', '软件测试工程师', '王', 'tertiary'),
('刘洋', md5('liuyang'), '482c811da5d5b4bc6d497ffa98491e38', '产品部', '产品经理', '刘', 'primary');
