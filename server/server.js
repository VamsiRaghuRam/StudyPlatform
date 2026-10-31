require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/database');
const seedAdminAndData = require('./scripts/createAdmin');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Auto-seed predefined admin account and initial data
    await seedAdminAndData();

    // Start Express server
    const server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 Study Platform Server running on port ${PORT}`);
      console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]:', reason);
});

startServer();
