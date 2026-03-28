import mongoose from 'mongoose';
import env from './env';

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(env.MONGODB_URI);

    isConnected = conn.connections[0].readyState === 1;

    console.log(`MongoDB connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

export default connectDB;