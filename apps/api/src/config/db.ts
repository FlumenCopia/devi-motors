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
      const invoiceCollection = mongoose.connection.collection('invoices');
      const counterCollection = mongoose.connection.collection('counters');

      // 1. If an invoice DM/01/26-27 exists, migrate it to DM/08/26-27 as requested
      const inv01 = await invoiceCollection.findOne({ invoiceNumber: 'DM/01/26-27' });
      if (inv01) {
        await invoiceCollection.updateOne(
          { invoiceNumber: 'DM/01/26-27' },
          { $set: { invoiceNumber: 'DM/08/26-27' } }
        );
        const paymentCollection = mongoose.connection.collection('payments');
        await paymentCollection.updateMany(
          { invoiceNumber: 'DM/01/26-27' },
          { $set: { invoiceNumber: 'DM/08/26-27' } }
        );
        // Ensure counter is at least 8 since DM/08/26-27 is now taken
        const existing = await counterCollection.findOne({ documentType: 'invoice', financialYear: '26-27' });
        if (!existing || existing.sequence < 8) {
          await counterCollection.updateOne(
            { documentType: 'invoice', financialYear: '26-27' },
            { $set: { sequence: 8 } },
            { upsert: true }
          );
        }
        console.log('[Migration] Migrated DM/01/26-27 to DM/08/26-27 and counter set to 8');
      } else {
        const existing = await counterCollection.findOne({ documentType: 'invoice', financialYear: '26-27' });
        if (!existing || existing.sequence < 7) {
          await counterCollection.updateOne(
            { documentType: 'invoice', financialYear: '26-27' },
            { $set: { sequence: 7 } },
            { upsert: true }
          );
          console.log('[Counter] Invoice sequence initialized to 7 (next: DM/08/26-27)');
        }
      }

      // Automatically rename any existing draft from 02 to 08
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
