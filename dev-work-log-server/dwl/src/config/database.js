const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false, // Turn off SQL logging for cleaner terminal output
    timezone: '+08:00',
    define: {
      underscored: true, // Use snake_case for columns
      freezeTableName: true, // Don't pluralize table names
      timestamps: true, // Add createdAt and updatedAt
      createdAt: 'create_time',
      updatedAt: 'update_time'
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
