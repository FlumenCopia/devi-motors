import { CounterModel } from '../models/Counter';
import { CompanySettingsModel } from '../models/CompanySettings';
import { getFinancialYear } from '../shared';

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

  // Atomic increment in MongoDB
  const counter = await CounterModel.findOneAndUpdate(
    { documentType: type, financialYear: fyCode },
    { $inc: { sequence: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const seq = counter.sequence;
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

  const counter = await CounterModel.findOne({
    documentType: type,
    financialYear: fyCode
  });
  const nextSeq = (counter?.sequence || 0) + 1;
  const seqPadded = String(nextSeq).padStart(2, '0');
  return `${prefix}/${seqPadded}/${fyCode}`;
}
