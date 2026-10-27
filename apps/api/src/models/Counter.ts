import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter extends Document {
  documentType: string; // 'invoice' | 'quotation'
  financialYear: string; // '26-27'
  sequence: number;
}

const CounterSchema = new Schema<ICounter>({
  documentType: { type: String, required: true },
  financialYear: { type: String, required: true },
  sequence: { type: Number, default: 0 }
});

CounterSchema.index({ documentType: 1, financialYear: 1 }, { unique: true });

export const CounterModel = mongoose.model<ICounter>('Counter', CounterSchema);
