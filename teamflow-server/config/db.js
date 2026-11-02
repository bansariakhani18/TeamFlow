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
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/teamflow';
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}:${conn.connection.port || '27017'}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
