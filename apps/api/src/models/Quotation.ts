import mongoose, { Schema, Document } from 'mongoose';
import {
  QuotationType,
  QuotationStatus,
  LineItem,
  InvoiceCustomerSnapshot
} from '@devi-motors/shared';

export interface IQuotation extends Document {
  quotationType: QuotationType;
  quotationNumber: string;
  financialYear: string;
  quotationDate: string;
  validUntil?: string;
  customer: InvoiceCustomerSnapshot;
  vehicleNumber?: string;
  purchaseOrderNumber?: string;
  vehicleProjectName?: string;
  serviceTitle?: string;
  narrativeDescription?: string;
  serviceCharge?: number;
  warranty?: string;
  closingNote?: string;
  lineItems?: LineItem[];
  subtotalTaxable: number;
  gstRate?: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalGst: number;
  totalAmount: number;
  amountInWords?: string;
  status: QuotationStatus;
  convertedInvoiceId?: string;
  convertedInvoiceNumber?: string;
  isdelete?: {
    status: boolean;
    datetime?: Date | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

const QuotationSchema = new Schema<IQuotation>(
  {
    quotationType: {
      type: String,
      enum: ['invoice_style', 'proposal_style'],
      required: true,
      index: true
    },
    quotationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    financialYear: { type: String, required: true, index: true },
    quotationDate: { type: String, required: true, index: true },
    validUntil: { type: String },
    customer: {
      id: { type: String },
      name: { type: String, required: true, index: true },
      customerType: { type: String, enum: ['individual', 'company'], default: 'individual' },
      billingAddress: { type: String, required: true },
      state: { type: String, default: 'Kerala' },
      stateCode: { type: String, default: '32' },
      gstin: { type: String, trim: true, uppercase: true },
      phone: { type: String },
      email: { type: String }
    },
    vehicleNumber: { type: String, trim: true, uppercase: true },
    purchaseOrderNumber: { type: String, trim: true },
    vehicleProjectName: { type: String, trim: true },
    serviceTitle: { type: String, trim: true },
    narrativeDescription: { type: String },
    serviceCharge: { type: Number, default: 0 },
    warranty: { type: String },
    closingNote: { type: String },
    lineItems: [
      {
        slNo: Number,
        description: String,
        hsnSac: String,
        quantity: Number,
        unit: String,
        rate: Number,
        discountType: String,
        discountValue: Number,
        taxableAmount: Number,
        gstRate: Number,
        cgstRate: Number,
        cgstAmount: Number,
        sgstRate: Number,
        sgstAmount: Number,
        igstRate: Number,
        igstAmount: Number,
        totalGstAmount: Number,
        totalAmount: Number
      }
    ],
    subtotalTaxable: { type: Number, required: true, default: 0 },
    gstRate: { type: Number, default: 18 },
    totalCgst: { type: Number, default: 0 },
    totalSgst: { type: Number, default: 0 },
    totalIgst: { type: Number, default: 0 },
    totalGst: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    amountInWords: { type: String },
    status: {
      type: String,
      enum: ['draft', 'sent', 'pending', 'approved', 'rejected', 'expired', 'converted'],
      default: 'draft',
      index: true
    },
    convertedInvoiceId: { type: String },
    convertedInvoiceNumber: { type: String },
    isdelete: {
      status: { type: Boolean, default: false, index: true },
      datetime: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

QuotationSchema.index({
  quotationNumber: 'text',
  'customer.name': 'text',
  vehicleNumber: 'text',
  serviceTitle: 'text'
});

export const QuotationModel = mongoose.model<IQuotation>('Quotation', QuotationSchema);
