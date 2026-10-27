import mongoose, { Schema, Document } from 'mongoose';
import { CustomerType } from '../shared';

export interface ICustomer extends Document {
  name: string;
  customerType: CustomerType;
  contactPerson?: string;
  phone: string;
  email?: string;
  billingAddress: string;
  state: string;
  stateCode: string;
  pinCode?: string;
  gstin?: string;
  notes?: string;
  vehicleNumbers: string[];
  purchaseOrders: string[];
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  isArchived: boolean;
  isdelete?: {
    status: boolean;
    datetime?: Date | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true, index: true },
    customerType: {
      type: String,
      enum: ['individual', 'company'],
      default: 'individual',
      index: true
    },
    contactPerson: { type: String, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    billingAddress: { type: String, required: true },
    state: { type: String, default: 'Kerala' },
    stateCode: { type: String, default: '32' },
    pinCode: { type: String, trim: true },
    gstin: { type: String, trim: true, uppercase: true, index: true },
    notes: { type: String },
    vehicleNumbers: [{ type: String, trim: true, uppercase: true }],
    purchaseOrders: [{ type: String, trim: true }],
    totalInvoiced: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    isArchived: { type: Boolean, default: false },
    isdelete: {
      status: { type: Boolean, default: false, index: true },
      datetime: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

CustomerSchema.index({ name: 'text', phone: 'text', gstin: 'text' });

export const CustomerModel = mongoose.model<ICustomer>('Customer', CustomerSchema);
