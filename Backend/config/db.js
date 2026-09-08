import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryMongoServer = null;

export default async function connectDB() {
  const uri = process.env.MONGO_URI;

  try {
    if (uri) {
      await mongoose.connect(uri, {
        // options can be added here if needed
      });
      console.log('MongoDB connected');
      return;
    }

    throw new Error('MONGO_URI not defined');
  } catch (error) {
    console.warn('Primary MongoDB connection failed, attempting in-memory fallback...', error.message);

    try {
      if (!memoryMongoServer) {
        memoryMongoServer = await MongoMemoryServer.create();
      }

      await mongoose.connect(memoryMongoServer.getUri());
      console.log('MongoDB connected via in-memory fallback');
    } catch (fallbackError) {
      console.error('MongoDB fallback connection error:', fallbackError.message);
      throw fallbackError;
    }
  }
}
