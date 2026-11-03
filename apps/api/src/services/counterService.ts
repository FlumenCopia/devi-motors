import { CounterModel } from '../models/Counter';
import { CompanySettingsModel } from '../models/CompanySettings';
import { getFinancialYear } from '../shared';

// For FY 26-27, invoices 1 to 7 were already issued in physical records.
// Therefore, the sequence must always begin from 8 onwards.
const INVOICE_BASE_OFFSET_26_27 = 7;

export async function getNextDocumentNumber(
  type: 'invoice' | 'quotation',
  dateInput?: string | Date
): Promise<{ documentNumber: string; financialYear: string; sequence: number }> {
  const fy = getFinancialYear(dateInput || new Date());
  const fyCode = fy.code; // '26-27'

  const settings = await CompanySettingsModel.findOne();
  const prefix =
    type === 'invoice'
      ? settings?.invoicePrefix || 'DM'
      : settings?.quotationPrefix || 'DQ';

  const baseSequence = type === 'invoice' && fyCode === '26-27' ? INVOICE_BASE_OFFSET_26_27 : 0;

  // Atomic increment in MongoDB
  const counter = await CounterModel.findOneAndUpdate(
    { documentType: type, financialYear: fyCode },
    { $inc: { sequence: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  let seq = counter?.sequence || 1;

  // If counter is empty or was below the starting offset, initialize to baseSequence + 1
  if (seq <= baseSequence) {
    const adjusted = await CounterModel.findOneAndUpdate(
      { documentType: type, financialYear: fyCode },
      { $set: { sequence: baseSequence + 1 } },
      { new: true, upsert: true }
    );
    seq = adjusted?.sequence || baseSequence + 1;
  }

  const seqPadded = String(seq).padStart(2, '0');
  const documentNumber = `${prefix}/${seqPadded}/${fyCode}`;

  return {
    documentNumber,
    financialYear: fy.full,
    sequence: seq
  };
}

export async function peekNextDocumentNumber(
  type: 'invoice' | 'quotation',
  dateInput?: string | Date
): Promise<string> {
  const fy = getFinancialYear(dateInput || new Date());
  const fyCode = fy.code;

  const settings = await CompanySettingsModel.findOne();
  const prefix =
    type === 'invoice'
      ? settings?.invoicePrefix || 'DM'
      : settings?.quotationPrefix || 'DQ';

  const baseSequence = type === 'invoice' && fyCode === '26-27' ? INVOICE_BASE_OFFSET_26_27 : 0;

  const counter = await CounterModel.findOne({
    documentType: type,
    financialYear: fyCode
  });

  const currentSeq = counter ? counter.sequence : baseSequence;
  const nextSeq = Math.max(baseSequence + 1, currentSeq + 1);
  const seqPadded = String(nextSeq).padStart(2, '0');
  return `${prefix}/${seqPadded}/${fyCode}`;
}
