import mongoose from 'mongoose';
import dns from 'dns';

// Ensure SRV records resolve smoothly across Windows / local ISP DNS
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore in sandboxed environments
}

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/devi_motors';
  try {
    await mongoose.connect(uri);
    console.log(`[MongoDB] Connected successfully to: ${uri.replace(/:[^:]*@/, ':****@')}`);
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    process.exit(1);
  }
}
