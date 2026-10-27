import assert from 'node:assert';
import test from 'node:test';
import {
  calculateLineItem,
  calculateDocumentTotals,
  numberToIndianWords,
  validateOrderInvoiceDates,
  getFinancialYear
} from './index';

test('Invoice 07 Reference File Calculation Match', () => {
  // 1. RH Front headlight 18% Rate 8200 Qty 1 -> GST 1476, Amount 9676
  const item1 = calculateLineItem({
    slNo: 1,
    description: 'RH Front headlight',
    quantity: 1,
    rate: 8200,
    gstRate: 18,
    isInterState: false
  });
  assert.strictEqual(item1.taxableAmount, 8200);
  assert.strictEqual(item1.cgstAmount, 738);
  assert.strictEqual(item1.sgstAmount, 738);
  assert.strictEqual(item1.totalGstAmount, 1476);
  assert.strictEqual(item1.totalAmount, 9676);

  // 2. RH Fronter Denting and Painting 18% Rate 2800 Qty 1 -> GST 504, Amount 3304
  const item2 = calculateLineItem({
    slNo: 2,
    description: 'RH Fronter Denting and Painting',
    quantity: 1,
    rate: 2800,
    gstRate: 18,
    isInterState: false
  });
  assert.strictEqual(item2.totalGstAmount, 504);
  assert.strictEqual(item2.totalAmount, 3304);

  // 3. Front Bumper Denting and Painting 18% Rate 2800 Qty 1 -> GST 504, Amount 3304
  const item3 = calculateLineItem({
    slNo: 3,
    description: 'Front Bumper Denting and Painting',
    quantity: 1,
    rate: 2800,
    gstRate: 18,
    isInterState: false
  });
  assert.strictEqual(item3.totalGstAmount, 504);
  assert.strictEqual(item3.totalAmount, 3304);

  // Totals
  const totals = calculateDocumentTotals([item1, item2, item3]);
  assert.strictEqual(totals.subtotalTaxable, 13800);
  assert.strictEqual(totals.totalCgst, 1242);
  assert.strictEqual(totals.totalSgst, 1242);
  assert.strictEqual(totals.totalGst, 2484);
  assert.strictEqual(totals.totalAmount, 16284);
  assert.strictEqual(
    totals.amountInWords,
    'RUPEES SIXTEEN THOUSAND TWO HUNDRED AND EIGHTY FOUR ONLY'
  );
});

test('Invoice 02 Reference File Calculation Match', () => {
  // BR 128: Rate 1800, Qty 1, 18% -> 2124
  const item1 = calculateLineItem({
    slNo: 1,
    description: 'BR 128',
    quantity: 1,
    rate: 1800,
    gstRate: 18
  });
  assert.strictEqual(item1.taxableAmount, 1800);
  assert.strictEqual(item1.totalGstAmount, 324);
  assert.strictEqual(item1.totalAmount, 2124);

  // Donner coach handle: Rate 1000, Qty 6, 18% -> 7080
  const item2 = calculateLineItem({
    slNo: 2,
    description: 'Donner coach handle',
    quantity: 6,
    rate: 1000,
    gstRate: 18
  });
  assert.strictEqual(item2.taxableAmount, 6000);
  assert.strictEqual(item2.totalGstAmount, 1080);
  assert.strictEqual(item2.totalAmount, 7080);

  const totals = calculateDocumentTotals([item1, item2]);
  assert.strictEqual(totals.subtotalTaxable, 7800);
  assert.strictEqual(totals.totalCgst, 702);
  assert.strictEqual(totals.totalSgst, 702);
  assert.strictEqual(totals.totalGst, 1404);
  assert.strictEqual(totals.totalAmount, 9204);
  assert.strictEqual(
    totals.amountInWords,
    'RUPEES NINE THOUSAND TWO HUNDRED AND FOUR ONLY'
  );
});

test('Quotation Proposal Calculation Match', () => {
  // Service charges: 25,000 + 18% GST = 29,500
  const item = calculateLineItem({
    description: 'Premium Mirror Polishing for Lamborghini Urus',
    quantity: 1,
    rate: 25000,
    gstRate: 18
  });
  assert.strictEqual(item.taxableAmount, 25000);
  assert.strictEqual(item.totalGstAmount, 4500);
  assert.strictEqual(item.totalAmount, 29500);
  assert.strictEqual(
    numberToIndianWords(29500),
    'RUPEES TWENTY NINE THOUSAND FIVE HUNDRED ONLY'
  );
});

test('Date validation rules', () => {
  // Order date <= Invoice date
  assert.strictEqual(validateOrderInvoiceDates('2026-06-17', '2026-07-09').valid, true);
  assert.strictEqual(validateOrderInvoiceDates('2026-07-09', '2026-07-09').valid, true);
  // Order date later than invoice date -> should fail
  assert.strictEqual(validateOrderInvoiceDates('2026-07-10', '2026-07-09').valid, false);
});

test('Indian Financial Year detection', () => {
  const fy1 = getFinancialYear('2026-10-15');
  assert.strictEqual(fy1.full, '2026-2027');
  assert.strictEqual(fy1.code, '26-27');

  const fy2 = getFinancialYear('2027-02-10');
  assert.strictEqual(fy2.full, '2026-2027');
  assert.strictEqual(fy2.code, '26-27');

  const fy3 = getFinancialYear('2027-04-01');
  assert.strictEqual(fy3.full, '2027-2028');
  assert.strictEqual(fy3.code, '27-28');
});
