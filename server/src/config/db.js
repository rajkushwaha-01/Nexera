const mongoose = require('mongoose');

let mongod = null;

/**
 * Connect to MongoDB database
 * Attempts primary connection string; falls back to MongoMemoryServer for offline development/testing
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/project_monitor';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (primaryErr) {
    console.warn(`[Database] Could not connect to primary MongoDB at ${uri}: ${primaryErr.message}`);

    // Attempt MongoMemoryServer in development or test mode
    try {
      console.log('[Database] Starting in-memory MongoDB fallback server...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create({
        spawn: { timeout: 60000 }
      });
      const memUri = mongod.getUri();

      const conn = await mongoose.connect(memUri);
      console.log(`[Database] Connected to in-memory fallback MongoDB at ${memUri}`);
      return conn;
    } catch (memErr) {
      console.error('[Database] Failed to start in-memory MongoDB:', memErr.message);
      throw primaryErr;
    }
  }
};

/**
 * Disconnect from MongoDB and stop in-memory server if running
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
    console.log('[Database] MongoDB connection closed');
  } catch (err) {
    console.error('[Database] Error during disconnect:', err.message);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
