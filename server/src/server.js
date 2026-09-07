const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Catch synchronous uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[Process] UNCAUGHT EXCEPTION! Shutting down...', err.name, err.message);
  process.exit(1);
});

let server;

// Connect to Database and start listening
const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 Project Monitor Server Running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
      console.log(`=========================================`);
    });
  } catch (err) {
    console.error('[Server] Fatal Error during server initialization:', err.message);
    process.exit(1);
  }
};

startServer();

// Handle asynchronous unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('[Process] UNHANDLED REJECTION! Shutting down gracefully...', err.name, err.message);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle graceful shutdown signals
const gracefulShutdown = async (signal) => {
  console.log(`\n[Process] ${signal} signal received. Closing HTTP server and DB connections...`);
  if (server) {
    server.close(async () => {
      await disconnectDB();
      console.log('[Process] Server closed cleanly.');
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
