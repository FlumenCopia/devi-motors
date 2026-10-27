import mongoose, { Schema, Document } from 'mongoose';
import {
  InvoiceType,
  InvoiceStatus,
  PaymentStatus,
  LineItem,
  InvoiceCustomerSnapshot,
  BankDetails
} from '@devi-motors/shared';

export interface IInvoice extends Document {
  invoiceType: InvoiceType;
  invoiceNumber: string;
  financialYear: string;
  invoiceDate: string;
  orderDate?: string;
  vehicleNumber?: string;
  purchaseOrderNumber?: string;
  customer: InvoiceCustomerSnapshot;
  hsnCode: string;
  lineItems: LineItem[];
  subtotalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalGst: number;
  roundOff: number;
  totalAmount: number;
  amountInWords: string;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  balanceDue: number;
  bankDetails: BankDetails;
  notes?: string;
  paymentTerms?: string;
  isdelete?: {
    status: boolean;
    datetime?: Date | null;
  };
  issuedAt?: Date;
  issuedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LineItemSchema = new Schema(
  {
    slNo: { type: Number, required: true },
    description: { type: String, required: true },
    hsnSac: { type: String, default: '998714' },
    quantity: { type: Number, required: true, default: 1 },
    unit: { type: String, default: 'Nos' },
    rate: { type: Number, required: true }, // BEFORE GST
    discountType: { type: String, enum: ['percentage', 'fixed'], default: 'fixed' },
    discountValue: { type: Number, default: 0 },
    taxableAmount: { type: Number, required: true },
    gstRate: { type: Number, required: true, default: 18 },
    cgstRate: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstRate: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstRate: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    totalGstAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true }
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceType: {
      type: String,
      enum: ['vehicle', 'client'],
      required: true,
      index: true
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    financialYear: { type: String, required: true, index: true },
    invoiceDate: { type: String, required: true, index: true },
    orderDate: { type: String },
    vehicleNumber: { type: String, trim: true, uppercase: true, index: true },
    purchaseOrderNumber: { type: String, trim: true, index: true },
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
    hsnCode: { type: String, default: '998714' },
    lineItems: [LineItemSchema],
    subtotalTaxable: { type: Number, required: true, default: 0 },
    totalCgst: { type: Number, required: true, default: 0 },
    totalSgst: { type: Number, required: true, default: 0 },
    totalIgst: { type: Number, required: true, default: 0 },
    totalGst: { type: Number, required: true, default: 0 },
    roundOff: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    amountInWords: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'issued', 'cancelled'],
      default: 'draft',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partially_paid', 'paid'],
      default: 'unpaid',
      index: true
    },
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    bankDetails: {
      bankName: { type: String, default: 'IndusInd Bank' },
      branch: { type: String, default: 'Poojappura, Trivandrum Branch' },
      accountNumber: { type: String, default: '259447138617' },
      ifscCode: { type: String, default: 'INDB0001480' },
      gpay: { type: String, default: '9447138617' }
    },
    notes: { type: String },
    paymentTerms: { type: String, default: 'Immediate upon invoice submission' },
    isdelete: {
      status: { type: Boolean, default: false, index: true },
      datetime: { type: Date, default: null }
    },
    issuedAt: { type: Date },
    issuedBy: { type: String }
  },
  { timestamps: true }
);

InvoiceSchema.index({
  invoiceNumber: 'text',
  'customer.name': 'text',
  vehicleNumber: 'text',
  purchaseOrderNumber: 'text'
});

export const InvoiceModel = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
