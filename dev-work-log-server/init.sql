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
  log_date DATE NOT NULL COMMENT '登记日期',
  product_type VARCHAR(64) NOT NULL COMMENT '关联产品',
  task_category VARCHAR(64) NOT NULL COMMENT '任务类别',
  work_hours DECIMAL(4,1) NOT NULL COMMENT '投入工时(h)',
  description VARCHAR(500) COMMENT '工作详情描述',
  status VARCHAR(32) DEFAULT '进行中' COMMENT '日志状态',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_date_product (log_date, product_type),
  INDEX idx_date_category (log_date, task_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='研发工作日志流水总表';

-- 3. 阻塞预警异常表
CREATE TABLE IF NOT EXISTS dev_blocking_alert (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
  user_id BIGINT COMMENT '挂起人ID冗余',
  log_id BIGINT COMMENT '异常引发关联日志ID',
  priority VARCHAR(16) NOT NULL DEFAULT 'WARNING' COMMENT '优先级',
  suspend_start_time DATETIME NOT NULL COMMENT '挂起起始时间',
  title VARCHAR(128) NOT NULL COMMENT '阻塞简述标题',
  reason VARCHAR(500) COMMENT '具体阻塞影响与原因',
  is_resolved TINYINT DEFAULT 0 COMMENT '1: 已解决, 0: 未解决',
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='阻塞预警异常表';

-- 写入演示数据
INSERT IGNORE INTO sys_user (name, username, password, group_name, job_desc, avatar_char, theme_color) VALUES 
('张伟', md5('zhangwei'), '482c811da5d5b4bc6d497ffa98491e38', '研发一部', '前端开发工程师', '张', 'primary'),
('李芳', md5('lifang'), '482c811da5d5b4bc6d497ffa98491e38', '研发二部', '后端开发工程师', '李', 'secondary'),
('王磊', md5('wanglei'), '482c811da5d5b4bc6d497ffa98491e38', '测试部', '软件测试工程师', '王', 'tertiary'),
('刘洋', md5('liuyang'), '482c811da5d5b4bc6d497ffa98491e38', '产品部', '产品经理', '刘', 'primary');
