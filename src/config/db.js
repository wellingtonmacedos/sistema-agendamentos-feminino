const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const connectDB = async () => {
  try {
    console.log('Attempting to connect to Local MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/agendamentos', {
      serverSelectionTimeoutMS: 2000 // Short timeout to fail fast
    });
    console.log('MongoDB Connected (Local)');
    return 'local';
  } catch (err) {
    console.log('Local MongoDB not found. Starting In-Memory Database for testing...');
    try {
        const mongoServer = await MongoMemoryServer.create();
        // Keep reference to prevent GC (though usually not needed for the process)
        global.__MONGO_SERVER__ = mongoServer;
        
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        console.log('MongoDB Connected (In-Memory)');
        console.log('NOTE: Data will be reset when server restarts.');
        return 'memory';
    } catch (memErr) {
        console.error('Fatal: Could not start any database.', memErr);
        process.exit(1);
    }
  }
};

module.exports = connectDB;