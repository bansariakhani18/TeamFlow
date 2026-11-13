import dns from 'node:dns';
import mongoose from 'mongoose';

// Ensure Google DNS is used for MongoDB Atlas SRV resolution
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch {
  // Graceful fallback
}
dns.setDefaultResultOrder('ipv4first');

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/teamflow';
  try {
    const conn = await mongoose.connect(primaryUri);
    console.log(`MongoDB Connected: ${conn.connection.host}:${conn.connection.port || '27017'}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`Primary MongoDB connection notice: ${error.message}`);
    // If remote connection fails (e.g. IP whitelist / network boundary), connect to local MongoDB
    if (!primaryUri.includes('127.0.0.1') && !primaryUri.includes('localhost')) {
      console.log('Attempting local MongoDB connection (mongodb://127.0.0.1:27017/teamflow)...');
      try {
        const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/teamflow');
        console.log(`MongoDB Connected (local instance): ${localConn.connection.host}/${localConn.connection.name}`);
        return localConn;
      } catch (localErr) {
        console.error(`MongoDB connection error: ${localErr.message}`);
      }
    }
    process.exit(1);
  }
};

export default connectDB;
