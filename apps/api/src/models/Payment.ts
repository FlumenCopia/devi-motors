import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  invoiceId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'card';
  transactionReference?: string;
  notes?: string;
  recordedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    invoiceNumber: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentDate: { type: String, required: true, index: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'upi', 'cheque', 'card'],
      default: 'bank_transfer'
    },
    transactionReference: { type: String, trim: true },
    notes: { type: String },
    recordedBy: { type: String }
  },
  { timestamps: true }
);

export const PaymentModel = mongoose.model<IPayment>('Payment', PaymentSchema);
