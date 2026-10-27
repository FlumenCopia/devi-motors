import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/devi_motors';
  try {
    await mongoose.connect(uri);
    console.log(`[MongoDB] Connected successfully to: ${uri}`);
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    process.exit(1);
  }
}
