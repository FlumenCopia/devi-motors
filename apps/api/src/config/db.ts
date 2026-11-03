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

    // Ensure invoice counter sequence starts from 7 so the next invoice is DM/08/26-27
    try {
      const counterCollection = mongoose.connection.collection('counters');
      const existing = await counterCollection.findOne({ documentType: 'invoice', financialYear: '26-27' });
      if (!existing || existing.sequence < 7) {
        await counterCollection.updateOne(
          { documentType: 'invoice', financialYear: '26-27' },
          { $set: { sequence: 7 } },
          { upsert: true }
        );
        console.log('[Counter] Invoice sequence initialized to 7 (next: DM/08/26-27)');
      }

      // Automatically rename any existing draft from 02 to 08
      const invoiceCollection = mongoose.connection.collection('invoices');
      await invoiceCollection.updateMany(
        { status: 'draft', invoiceNumber: 'DRAFT-DM/02/26-27' },
        { $set: { invoiceNumber: 'DRAFT-DM/08/26-27' } }
      );
    } catch (initErr) {
      console.warn('[Counter] Initialization warning:', initErr);
    }
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    process.exit(1);
  }
}
