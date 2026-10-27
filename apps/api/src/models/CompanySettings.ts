import mongoose, { Schema, Document } from 'mongoose';
import { BankDetails } from '../shared';

export interface ICompanySettings extends Document {
  companyName: string;
  tagline: string;
  addressLine1: string;
  addressLine2: string;
  state: string;
  stateCode: string;
  pinCode?: string;
  phone: string;
  email: string;
  gstin: string;
  defaultHsn: string;
  bankDetails: BankDetails;
  invoicePrefix: string;
  quotationPrefix: string;
  defaultPaymentTerms: string;
  logoUrl?: string;
  stampUrl?: string;
  signatureUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySettingsSchema = new Schema<ICompanySettings>(
  {
    companyName: { type: String, default: 'DEVI MOTORS' },
    tagline: { type: String, default: 'Professional Car Painting, Polishing & Detailing' },
    addressLine1: {
      type: String,
      default: 'T.C 17/2456-1, Opp.Rajiv Gandhi Centre for Bio Technology'
    },
    addressLine2: {
      type: String,
      default: 'Jagathy, Thycaud P.O, Thiruvananthapuram'
    },
    state: { type: String, default: 'Kerala' },
    stateCode: { type: String, default: '32' },
    pinCode: { type: String, default: '695014' },
    phone: { type: String, default: '9447138617' },
    email: { type: String, default: 'devi.motors.tvm@gmail.com' },
    gstin: { type: String, default: '32BAAPJ2054E1ZG' },
    defaultHsn: { type: String, default: '998714' },
    bankDetails: {
      bankName: { type: String, default: 'IndusInd Bank' },
      branch: { type: String, default: 'Poojappura, Trivandrum Branch' },
      accountNumber: { type: String, default: '259447138617' },
      ifscCode: { type: String, default: 'INDB0001480' },
      gpay: { type: String, default: '9447138617' }
    },
    invoicePrefix: { type: String, default: 'DM' },
    quotationPrefix: { type: String, default: 'DQ' },
    defaultPaymentTerms: { type: String, default: 'Immediate upon invoice submission' },
    logoUrl: { type: String, default: '/assets/logo.png' },
    stampUrl: { type: String, default: '/assets/stamp.jpg' },
    signatureUrl: { type: String, default: '/assets/signature.jpg' }
  },
  { timestamps: true }
);

export const CompanySettingsModel = mongoose.model<ICompanySettings>(
  'CompanySettings',
  CompanySettingsSchema
);
