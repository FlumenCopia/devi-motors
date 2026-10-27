import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import dns from 'dns';
import { UserModel } from '../models/User';
import { CustomerModel } from '../models/Customer';
import { InvoiceModel } from '../models/Invoice';
import { QuotationModel } from '../models/Quotation';
import { PaymentModel } from '../models/Payment';
import { CompanySettingsModel } from '../models/CompanySettings';
import { CounterModel } from '../models/Counter';

dotenv.config();

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore in sandboxed environments
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/devi_motors';

export async function runSeed(): Promise<void> {
  console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
  await mongoose.connect(MONGODB_URI);

  // Clear transactional data so owner can enter all real customers, invoices, orders manually
  console.log('Clearing all transactional data (customers, invoices, quotations, payments, counters)...');
  await Promise.all([
    CustomerModel.deleteMany({}),
    InvoiceModel.deleteMany({}),
    QuotationModel.deleteMany({}),
    PaymentModel.deleteMany({}),
    CounterModel.deleteMany({})
  ]);

  console.log('1. Ensuring Super Admin User...');
  const existingAdmin = await UserModel.findOne({ email: 'admin@devimotors.in' });
  if (!existingAdmin) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    await UserModel.create({
      name: 'Admin',
      email: 'admin@devimotors.in',
      passwordHash,
      role: 'super_admin'
    });
    console.log('   Admin created: admin@devimotors.in / admin123');
  } else {
    console.log('   Admin already exists: admin@devimotors.in');
  }

  console.log('2. Seeding Official DEVI MOTORS Company Settings...');
  await CompanySettingsModel.deleteMany({});
  await CompanySettingsModel.create({
    companyName: 'DEVI MOTORS',
    tagline: 'Professional Car Painting, Polishing & Detailing',
    addressLine1: 'T.C 17/2456-1, Opp.Rajiv Gandhi Centre for Bio Technology',
    addressLine2: 'Jagathy, Thycaud P.O, Thiruvananthapuram',
    state: 'Kerala',
    stateCode: '32',
    pinCode: '695014',
    phone: '9447138617',
    email: 'devi.motors.tvm@gmail.com',
    gstin: '32BAAPJ2054E1ZG',
    defaultHsn: '998714',
    bankDetails: {
      bankName: 'IndusInd Bank',
      branch: 'Poojappura, Trivandrum Branch',
      accountNumber: '259447138617',
      ifscCode: 'INDB0001480',
      gpay: '9447138617'
    },
    invoicePrefix: 'DM',
    quotationPrefix: 'DQ',
    defaultPaymentTerms: 'Immediate upon invoice submission',
    logoUrl: '/assets/logo.png',
    stampUrl: '/assets/stamp.jpg',
    signatureUrl: '/assets/signature.jpg'
  });
  console.log('   Official Company profile seeded successfully.');

  console.log('=====================================================');
  console.log('CLEAN SEED COMPLETE:');
  console.log('- 0 Customers (Clean for manual entry)');
  console.log('- 0 Invoices (Clean for manual entry)');
  console.log('- 0 Quotations (Clean for manual entry)');
  console.log('- 0 Payments (Clean for manual entry)');
  console.log('- Counters reset to 0');
  console.log('- Official DEVI MOTORS company data preserved');
  console.log('- Admin user ready: admin@devimotors.in / admin123');
  console.log('=====================================================');
}

if (require.main === module) {
  runSeed()
    .then(() => {
      console.log('Seed script finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed script failed:', err);
      process.exit(1);
    });
}
