import { LineItem } from './types';
import { numberToIndianWords } from './words';

export function roundToTwoDecimals(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export interface CalculateLineItemInput {
  slNo?: number;
  description: string;
  hsnSac?: string;
  quantity: number;
  unit?: string;
  rate: number; // Unit rate BEFORE GST
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  gstRate: number; // e.g. 18
  isInterState?: boolean;
}

export function calculateLineItem(input: CalculateLineItemInput): LineItem {
  const quantity = Math.max(0, input.quantity || 1);
  const rate = Math.max(0, input.rate || 0);
  const gross = roundToTwoDecimals(quantity * rate);

  let discount = 0;
  if (input.discountValue && input.discountValue > 0) {
    if (input.discountType === 'percentage') {
      discount = roundToTwoDecimals((gross * input.discountValue) / 100);
    } else {
      discount = roundToTwoDecimals(input.discountValue);
    }
  }

  // Taxable value cannot be negative
  const taxableAmount = Math.max(0, roundToTwoDecimals(gross - discount));
  const gstRate = Math.max(0, input.gstRate || 0);

  let cgstRate = 0;
  let cgstAmount = 0;
  let sgstRate = 0;
  let sgstAmount = 0;
  let igstRate = 0;
  let igstAmount = 0;
  let totalGstAmount = 0;

  if (input.isInterState) {
    igstRate = gstRate;
    igstAmount = roundToTwoDecimals((taxableAmount * igstRate) / 100);
    totalGstAmount = igstAmount;
  } else {
    cgstRate = gstRate / 2;
    cgstAmount = roundToTwoDecimals((taxableAmount * cgstRate) / 100);
    sgstRate = gstRate / 2;
    sgstAmount = roundToTwoDecimals((taxableAmount * sgstRate) / 100);
    totalGstAmount = roundToTwoDecimals(cgstAmount + sgstAmount);
  }

  const totalAmount = roundToTwoDecimals(taxableAmount + totalGstAmount);

  return {
    slNo: input.slNo || 1,
    description: input.description,
    hsnSac: input.hsnSac || '998714',
    quantity,
    unit: input.unit || 'Nos',
    rate,
    discountType: input.discountType,
    discountValue: input.discountValue,
    taxableAmount,
    gstRate,
    cgstRate: input.isInterState ? 0 : cgstRate,
    cgstAmount: input.isInterState ? 0 : cgstAmount,
    sgstRate: input.isInterState ? 0 : sgstRate,
    sgstAmount: input.isInterState ? 0 : sgstAmount,
    igstRate: input.isInterState ? igstRate : 0,
    igstAmount: input.isInterState ? igstAmount : 0,
    totalGstAmount,
    totalAmount
  };
}

export interface DocumentCalculations {
  subtotalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalGst: number;
  roundOff: number;
  totalAmount: number;
  amountInWords: string;
}

export function calculateDocumentTotals(
  items: LineItem[],
  applyRoundOff: boolean = false
): DocumentCalculations {
  let subtotalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalGst = 0;

  for (const item of items) {
    subtotalTaxable += item.taxableAmount || 0;
    totalCgst += item.cgstAmount || 0;
    totalSgst += item.sgstAmount || 0;
    totalIgst += item.igstAmount || 0;
    totalGst += item.totalGstAmount || 0;
  }

  subtotalTaxable = roundToTwoDecimals(subtotalTaxable);
  totalCgst = roundToTwoDecimals(totalCgst);
  totalSgst = roundToTwoDecimals(totalSgst);
  totalIgst = roundToTwoDecimals(totalIgst);
  totalGst = roundToTwoDecimals(totalGst);

  let exactTotal = roundToTwoDecimals(subtotalTaxable + totalGst);
  let roundOff = 0;
  let totalAmount = exactTotal;

  if (applyRoundOff) {
    totalAmount = Math.round(exactTotal);
    roundOff = roundToTwoDecimals(totalAmount - exactTotal);
  }

  const amountInWords = numberToIndianWords(totalAmount);

  return {
    subtotalTaxable,
    totalCgst,
    totalSgst,
    totalIgst,
    totalGst,
    roundOff,
    totalAmount,
    amountInWords
  };
}
