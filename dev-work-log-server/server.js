require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./src/models');
const responseHandler = require('./src/middlewares/responseHandler');
const errorHandler = require('./src/middlewares/errorHandler');

// Route Imports
const userRoutes = require('./src/routes/userRoutes');
const workLogRoutes = require('./src/routes/workLogRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseHandler);

// Basic Route
app.get('/', (req, res) => {
  res.success(null, 'DevWorkLog API is running');
});

// Register Business API Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/work-logs', workLogRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Error Handling (should be the last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Initialize Database & Start Server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connection to the database has been established successfully.');
    
    // Sync database (in production, use migrations)
    // await sequelize.sync({ alter: true });
    // console.log('✅ Database models synchronized.');

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

startServer();
