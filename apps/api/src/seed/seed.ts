import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { UserModel } from '../models/User';
import { CustomerModel } from '../models/Customer';
import { InvoiceModel } from '../models/Invoice';
import { QuotationModel } from '../models/Quotation';
import { PaymentModel } from '../models/Payment';
import { CompanySettingsModel } from '../models/CompanySettings';
import { CounterModel } from '../models/Counter';
import { calculateLineItem, calculateDocumentTotals, numberToIndianWords } from '@devi-motors/shared';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/devi_motors';

export async function runSeed(): Promise<void> {
  console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
  await mongoose.connect(MONGODB_URI);

  // Clear existing collections for a clean, deterministic seed
  console.log('Clearing existing records...');
  await Promise.all([
    UserModel.deleteMany({}),
    CustomerModel.deleteMany({}),
    InvoiceModel.deleteMany({}),
    QuotationModel.deleteMany({}),
    PaymentModel.deleteMany({}),
    CompanySettingsModel.deleteMany({}),
    CounterModel.deleteMany({})
  ]);

  console.log('1. Creating Default Admin User...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);
  await UserModel.create({
    name: 'Admin',
    email: 'admin@devimotors.in',
    passwordHash,
    role: 'super_admin'
  });

  console.log('2. Creating Company Settings...');
  const settings = await CompanySettingsModel.create({
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

  console.log('3. Creating Seed Customers...');
  const cust1 = await CustomerModel.create({
    name: 'Net vision Solar power solution',
    customerType: 'individual',
    phone: '9447123456',
    email: 'netvision.solar@example.com',
    billingAddress: 'TC 8/1125(2) nandhanam B49/2\nMythri nagar Thirumala\nThiruvananthapuram 695006',
    state: 'Kerala',
    stateCode: '32',
    pinCode: '695006',
    gstin: '32AKJPB9235H1ZC',
    vehicleNumbers: ['KL 01DD 6151'],
    totalInvoiced: 16284,
    totalPaid: 16284,
    outstandingBalance: 0
  });

  const cust2 = await CustomerModel.create({
    name: 'Terumo Penpol Private Limited',
    customerType: 'company',
    contactPerson: 'Procurement Officer',
    phone: '04712345678',
    email: 'purchase@terumopenpol.com',
    billingAddress: 'T.C 27/373 Andoor Buildings,\nGeneral Hospital Road Thiruvananthapuram',
    state: 'Kerala',
    stateCode: '32',
    gstin: '32AABCT2319K1ZK',
    purchaseOrders: ['MPUR2627-000296'],
    totalInvoiced: 9204,
    totalPaid: 5000,
    outstandingBalance: 4204
  });

  const cust3 = await CustomerModel.create({
    name: 'Artech Realters',
    customerType: 'individual',
    phone: '9895012345',
    email: 'contact@artechrealters.com',
    billingAddress: 'Artech Towers, Vellayambalam, Thiruvananthapuram',
    state: 'Kerala',
    stateCode: '32',
    vehicleNumbers: ['KL 01CA 0001'],
    totalInvoiced: 0,
    totalPaid: 0,
    outstandingBalance: 0
  });

  const cust4 = await CustomerModel.create({
    name: 'Kumar Motors',
    customerType: 'company',
    phone: '9447888999',
    billingAddress: 'Main Road, Attingal, Thiruvananthapuram',
    state: 'Kerala',
    stateCode: '32',
    totalInvoiced: 8750,
    totalPaid: 0,
    outstandingBalance: 8750
  });

  const cust5 = await CustomerModel.create({
    name: 'Bright Solutions Pvt Ltd',
    customerType: 'company',
    phone: '9744111222',
    billingAddress: 'Technopark Phase 1, Thiruvananthapuram 695581',
    state: 'Kerala',
    stateCode: '32',
    totalInvoiced: 12600,
    totalPaid: 12600,
    outstandingBalance: 0
  });

  console.log('4. Creating Invoices...');
  // Invoice DM/07/26-27 (Vehicle Invoice matching INVOICE 07 26-27.pdf)
  const inv07Items = [
    calculateLineItem({
      slNo: 1,
      description: 'RH Front headlight',
      quantity: 1,
      rate: 8200,
      gstRate: 18
    }),
    calculateLineItem({
      slNo: 2,
      description: 'RH Fronter Denting and Painting',
      quantity: 1,
      rate: 2800,
      gstRate: 18
    }),
    calculateLineItem({
      slNo: 3,
      description: 'Front Bumper Denting and Painting',
      quantity: 1,
      rate: 2800,
      gstRate: 18
    })
  ];
  const inv07Totals = calculateDocumentTotals(inv07Items);

  const inv07 = await InvoiceModel.create({
    invoiceType: 'vehicle',
    invoiceNumber: 'DM/07/26-27',
    financialYear: '2026-2027',
    invoiceDate: '2026-10-15',
    orderDate: '2026-10-10',
    vehicleNumber: 'KL 01DD 6151',
    customer: {
      id: cust1._id.toString(),
      name: cust1.name,
      customerType: cust1.customerType,
      billingAddress: cust1.billingAddress,
      state: cust1.state,
      stateCode: cust1.stateCode,
      gstin: cust1.gstin,
      phone: cust1.phone
    },
    hsnCode: '998714',
    lineItems: inv07Items,
    subtotalTaxable: inv07Totals.subtotalTaxable,
    totalCgst: inv07Totals.totalCgst,
    totalSgst: inv07Totals.totalSgst,
    totalIgst: inv07Totals.totalIgst,
    totalGst: inv07Totals.totalGst,
    roundOff: inv07Totals.roundOff,
    totalAmount: inv07Totals.totalAmount,
    amountInWords: inv07Totals.amountInWords,
    status: 'issued',
    paymentStatus: 'paid',
    amountPaid: 16284,
    balanceDue: 0,
    bankDetails: settings.bankDetails,
    issuedAt: new Date('2026-10-15T10:00:00Z'),
    issuedBy: 'Admin'
  });

  // Payment for DM/07/26-27
  await PaymentModel.create({
    invoiceId: inv07._id,
    invoiceNumber: inv07.invoiceNumber,
    amount: 16284,
    paymentDate: '2026-10-16',
    paymentMethod: 'upi',
    transactionReference: 'UPI-7744118899',
    notes: 'Full payment received via GPay'
  });

  // Invoice DM/06/26-27 (Client Invoice matching INVOICE 02 26-27.pdf structure)
  const inv06Items = [
    calculateLineItem({
      slNo: 1,
      description: 'BR 128',
      quantity: 1,
      rate: 1800,
      gstRate: 18
    }),
    calculateLineItem({
      slNo: 2,
      description: 'Donner coach handle',
      quantity: 6,
      rate: 1000,
      gstRate: 18
    })
  ];
  const inv06Totals = calculateDocumentTotals(inv06Items);

  const inv06 = await InvoiceModel.create({
    invoiceType: 'client',
    invoiceNumber: 'DM/06/26-27',
    financialYear: '2026-2027',
    invoiceDate: '2026-07-09',
    orderDate: '2026-06-17',
    purchaseOrderNumber: 'MPUR2627-000296',
    customer: {
      id: cust2._id.toString(),
      name: cust2.name,
      customerType: cust2.customerType,
      billingAddress: cust2.billingAddress,
      state: cust2.state,
      stateCode: cust2.stateCode,
      gstin: cust2.gstin,
      phone: cust2.phone
    },
    hsnCode: '998714',
    lineItems: inv06Items,
    subtotalTaxable: inv06Totals.subtotalTaxable,
    totalCgst: inv06Totals.totalCgst,
    totalSgst: inv06Totals.totalSgst,
    totalIgst: inv06Totals.totalIgst,
    totalGst: inv06Totals.totalGst,
    roundOff: inv06Totals.roundOff,
    totalAmount: inv06Totals.totalAmount,
    amountInWords: inv06Totals.amountInWords,
    status: 'issued',
    paymentStatus: 'partially_paid',
    amountPaid: 5000,
    balanceDue: 4204,
    bankDetails: settings.bankDetails,
    issuedAt: new Date('2026-07-09T10:00:00Z'),
    issuedBy: 'Admin'
  });

  await PaymentModel.create({
    invoiceId: inv06._id,
    invoiceNumber: inv06.invoiceNumber,
    amount: 5000,
    paymentDate: '2026-07-20',
    paymentMethod: 'bank_transfer',
    transactionReference: 'NEFT-5511223344',
    notes: 'Advance part payment'
  });

  // Invoice DM/04/26-27
  const inv04Items = [
    calculateLineItem({
      slNo: 1,
      description: 'Body Polishing and Ceramic Coating Maintenance',
      quantity: 1,
      rate: 7415.25,
      gstRate: 18
    })
  ];
  const inv04Totals = calculateDocumentTotals(inv04Items, true);

  await InvoiceModel.create({
    invoiceType: 'client',
    invoiceNumber: 'DM/04/26-27',
    financialYear: '2026-2027',
    invoiceDate: '2026-06-28',
    customer: {
      id: cust4._id.toString(),
      name: cust4.name,
      customerType: cust4.customerType,
      billingAddress: cust4.billingAddress,
      state: cust4.state,
      stateCode: cust4.stateCode,
      phone: cust4.phone
    },
    hsnCode: '998714',
    lineItems: inv04Items,
    subtotalTaxable: inv04Totals.subtotalTaxable,
    totalCgst: inv04Totals.totalCgst,
    totalSgst: inv04Totals.totalSgst,
    totalIgst: inv04Totals.totalIgst,
    totalGst: inv04Totals.totalGst,
    roundOff: inv04Totals.roundOff,
    totalAmount: 8750,
    amountInWords: numberToIndianWords(8750),
    status: 'issued',
    paymentStatus: 'unpaid',
    amountPaid: 0,
    balanceDue: 8750,
    bankDetails: settings.bankDetails,
    issuedAt: new Date('2026-06-28T10:00:00Z'),
    issuedBy: 'Admin'
  });

  console.log('5. Creating Seed Quotations...');
  // Quotation DQ/05/26-27 (Contract / Proposal Style matching Artech qo1.pdf)
  await QuotationModel.create({
    quotationType: 'proposal_style',
    quotationNumber: 'DQ/05/26-27',
    financialYear: '2026-2027',
    quotationDate: '2026-07-05',
    validUntil: '2026-08-05',
    customer: {
      id: cust3._id.toString(),
      name: cust3.name,
      customerType: cust3.customerType,
      billingAddress: cust3.billingAddress,
      state: cust3.state,
      stateCode: cust3.stateCode,
      phone: cust3.phone
    },
    vehicleProjectName: 'Lamborghini Urus Mirror Polishing',
    serviceTitle: 'Premium Mirror Polishing for Lamborghini Urus',
    narrativeDescription:
      'We are pleased to offer our professional mirror polishing service to restore the vechicle’s surface with a deep, glossy, mirror -like finish while maintaining the premium appearance of the Lamborghini Urus.',
    serviceCharge: 25000,
    gstRate: 18,
    totalCgst: 2250,
    totalSgst: 2250,
    totalIgst: 0,
    totalGst: 4500,
    subtotalTaxable: 25000,
    totalAmount: 29500,
    amountInWords: 'RUPEES TWENTY NINE THOUSAND FIVE HUNDRED ONLY',
    warranty:
      'We provide a 2-year warranty on the mirror polishing finish, subject to proper maintenance and care.',
    closingNote:
      'Thank you for choosing us, we look forward to giving your Lamborghini Urus a flawless finish.',
    status: 'pending'
  });

  // Quotation DQ/03/26-27 (Invoice Style)
  const q03Items = [
    calculateLineItem({
      slNo: 1,
      description: 'Fleet Vehicle Detailing & Interior Sanitization',
      quantity: 1,
      rate: 10677.97,
      gstRate: 18
    })
  ];
  const q03Totals = calculateDocumentTotals(q03Items, true);

  await QuotationModel.create({
    quotationType: 'invoice_style',
    quotationNumber: 'DQ/03/26-27',
    financialYear: '2026-2027',
    quotationDate: '2026-06-20',
    validUntil: '2026-07-20',
    customer: {
      id: cust5._id.toString(),
      name: cust5.name,
      customerType: cust5.customerType,
      billingAddress: cust5.billingAddress,
      state: cust5.state,
      stateCode: cust5.stateCode,
      phone: cust5.phone
    },
    lineItems: q03Items,
    subtotalTaxable: q03Totals.subtotalTaxable,
    totalCgst: q03Totals.totalCgst,
    totalSgst: q03Totals.totalSgst,
    totalIgst: 0,
    totalGst: q03Totals.totalGst,
    totalAmount: 12600,
    amountInWords: numberToIndianWords(12600),
    status: 'approved'
  });

  console.log('6. Initializing Counters...');
  await CounterModel.create({
    documentType: 'invoice',
    financialYear: '26-27',
    sequence: 7
  });

  await CounterModel.create({
    documentType: 'quotation',
    financialYear: '26-27',
    sequence: 5
  });

  console.log('Seed completed successfully!');
  await mongoose.disconnect();
}

if (require.main === module) {
  runSeed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
