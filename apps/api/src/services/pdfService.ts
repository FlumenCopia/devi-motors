import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { IInvoice } from '../models/Invoice';
import { IQuotation } from '../models/Quotation';
import { ICompanySettings } from '../models/CompanySettings';
import { formatDateDDMMYYYY, getTaxBreakdownByRate } from '@devi-motors/shared';

// Helper to get base64 data URI for local image
function getBase64Image(filePath: string): string {
  try {
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
      const b64 = fs.readFileSync(filePath, 'base64');
      return `data:${mime};base64,${b64}`;
    }
  } catch (e) {
    console.error(`Failed to read image at ${filePath}`, e);
  }
  return '';
}

function resolveAsset(filename: string): string {
  const candidates = [
    path.join(__dirname, '../../../../assets', filename),
    path.join(process.cwd(), 'assets', filename),
    path.join(process.cwd(), '../../assets', filename),
    path.resolve('d:/flumenx/devi motors/assets', filename)
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return '';
}

const logoB64 = getBase64Image(resolveAsset('logo.png'));
// Default to transparent badge PNG for clean digital badging
const stampB64 =
  getBase64Image(resolveAsset('stamp_transparent.png')) ||
  getBase64Image(resolveAsset('stamp.jpg'));
const signatureB64 =
  getBase64Image(resolveAsset('signature_transparent.png')) ||
  getBase64Image(resolveAsset('signature.jpg'));

export interface PdfRenderOptions {
  withSignature?: boolean;
}

export function generateInvoiceHtml(
  invoice: IInvoice,
  settings: ICompanySettings,
  options?: PdfRenderOptions
): string {
  const withSignature = options?.withSignature === true;
  const isInterState = invoice.customer.stateCode && invoice.customer.stateCode !== '32';
  const logoSrc = logoB64 || settings.logoUrl || '';
  const stampSrc = stampB64 || settings.stampUrl || '';
  const signatureSrc = signatureB64 || settings.signatureUrl || '';

  const formattedInvoiceDate = formatDateDDMMYYYY(invoice.invoiceDate);
  const formattedOrderDate = invoice.orderDate ? formatDateDDMMYYYY(invoice.orderDate) : '';

  // Determine HSN codes used
  const itemHsns = Array.from(new Set(invoice.lineItems.map(it => it.hsnSac).filter(Boolean)));
  const displayHsn = invoice.hsnCode || (itemHsns.length > 0 ? itemHsns.join(' / ') : '998714');
  const taxSlabs = getTaxBreakdownByRate(invoice.lineItems, Boolean(isInterState));

  // Render empty rows to maintain fixed table height if items < 8
  const emptyRowsCount = Math.max(0, 7 - invoice.lineItems.length);
  const emptyRowsHtml = Array.from({ length: emptyRowsCount })
    .map(
      () => `
      <tr class="empty-row">
        <td>&nbsp;</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 10mm 14mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
      background: #fff;
      font-size: 13px;
      line-height: 1.3;
    }
    .header-container {
      text-align: center;
      margin-bottom: 8px;
    }
    .logo-img {
      max-height: 70px;
      max-width: 280px;
      object-fit: contain;
      margin-bottom: 4px;
    }
    .header-address {
      font-size: 12px;
      font-weight: bold;
      color: #111;
      line-height: 1.4;
    }
    .header-contact-bar {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      margin-bottom: 8px;
      font-weight: bold;
      font-size: 13px;
    }
    
    /* Main Grid Box */
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #000;
    }
    .meta-table td {
      border: 1.5px solid #000;
      padding: 6px 8px;
      vertical-align: top;
    }
    .bill-to-cell {
      width: 60%;
    }
    .bill-to-title {
      font-weight: bold;
      margin-bottom: 4px;
      font-size: 12px;
    }
    .cust-name {
      font-weight: bold;
      font-size: 13px;
      margin-bottom: 3px;
    }
    .cust-address {
      white-space: pre-line;
      line-height: 1.35;
      font-size: 12px;
      margin-bottom: 4px;
    }
    .cust-gstin {
      font-weight: bold;
      font-size: 12px;
    }
    
    .meta-details-cell {
      width: 40%;
      padding: 0 !important;
    }
    .meta-inner-table {
      width: 100%;
      border-collapse: collapse;
    }
    .meta-inner-table td {
      border: none;
      border-bottom: 1.5px solid #000;
      padding: 5px 8px;
      font-size: 12px;
    }
    .meta-inner-table tr:last-child td {
      border-bottom: none;
    }
    .meta-label {
      font-weight: bold;
      width: 42%;
    }
    .meta-val {
      font-weight: bold;
    }

    /* HSN Banner */
    .hsn-banner {
      border: 1.5px solid #000;
      border-top: none;
      display: flex;
      font-weight: bold;
      font-size: 12px;
    }
    .hsn-label {
      width: 68%;
      padding: 5px 8px;
      text-align: right;
      border-right: 1.5px solid #000;
    }
    .hsn-val {
      width: 32%;
      padding: 5px 8px;
      text-align: center;
    }

    /* Line Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #000;
      border-top: none;
    }
    .items-table th, .items-table td {
      border-right: 1.5px solid #000;
      padding: 6px 6px;
      font-size: 12px;
    }
    .items-table th:last-child, .items-table td:last-child {
      border-right: none;
    }
    .items-table th {
      border-bottom: 1.5px solid #000;
      background: #fafafa;
      font-weight: bold;
      text-align: center;
      padding: 6px 4px;
    }
    .items-table td.col-sl { text-align: center; width: 6%; }
    .items-table td.col-desc { text-align: left; width: 44%; font-weight: 500; }
    .items-table td.col-gstp { text-align: center; width: 9%; }
    .items-table td.col-rate { text-align: center; width: 11%; }
    .items-table td.col-qty { text-align: center; width: 7%; }
    .items-table td.col-gst { text-align: center; width: 10%; }
    .items-table td.col-amt { text-align: right; width: 13%; padding-right: 8px; }
    
    .empty-row td {
      height: 22px;
      border-top: none;
      border-bottom: none;
    }

    .total-row td {
      border-top: 1.5px solid #000;
      border-bottom: 1.5px solid #000;
      font-weight: bold;
      font-size: 12px;
      padding: 6px 6px;
    }

    /* Words Banner */
    .words-banner {
      border: 1.5px solid #000;
      border-top: none;
      padding: 6px 8px;
      font-weight: bold;
      font-size: 11.5px;
    }

    /* Tax Summary Table */
    .tax-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #000;
      border-top: none;
      font-size: 12px;
      text-align: center;
    }
    .tax-table th, .tax-table td {
      border: 1.5px solid #000;
      padding: 5px 6px;
    }
    .tax-table th {
      font-weight: bold;
    }
    .tax-total-cell {
      font-weight: bold;
      font-size: 13px;
    }

    /* Footer Details */
    .footer-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #000;
      border-top: none;
      font-size: 11.5px;
    }
    .footer-table td {
      vertical-align: top;
      padding: 8px 10px;
    }
    .bank-box {
      width: 58%;
      border-right: 1.5px solid #000;
      line-height: 1.45;
    }
    .bank-title {
      font-weight: bold;
      text-decoration: underline;
      margin-bottom: 4px;
    }
    .sign-box {
      width: 42%;
      text-align: center;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 100px;
    }
    .for-company {
      font-weight: bold;
      font-size: 13px;
      text-align: right;
      padding-right: 15px;
      white-space: nowrap;
    }
    .signature-area {
      height: 65px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 25px;
    }
    .stamp-badge {
      width: 65px;
      height: 65px;
      object-fit: contain;
      display: block;
      margin-right: 15px;
    }
    .sig-overlay {
      position: absolute;
      right: 15px;
      top: 8px;
      width: 90px;
      height: 48px;
      object-fit: contain;
    }
    .auth-title {
      font-weight: bold;
      font-size: 12px;
      text-align: right;
      padding-right: 15px;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="header-container">
    ${logoSrc ? `<img src="${logoSrc}" class="logo-img" alt="DEVI MOTORS">` : `<h1 style="color:#F52B2B;">DEVI MOTORS</h1>`}
    <div class="header-address">
      ${settings.addressLine1}<br>
      ${settings.addressLine2}
    </div>
  </div>

  <div class="header-contact-bar">
    <div>Phone : ${settings.phone}</div>
    <div>GST No: ${settings.gstin}</div>
  </div>

  <!-- Meta Table -->
  <table class="meta-table">
    <tr>
      <td class="bill-to-cell">
        <div class="bill-to-title">BILL TO</div>
        <div class="cust-name">${invoice.customer.name}</div>
        <div class="cust-address">${invoice.customer.billingAddress}</div>
        ${invoice.customer.gstin ? `<div class="cust-gstin">GSTIN ${invoice.customer.gstin}</div>` : ''}
      </td>
      <td class="meta-details-cell">
        <table class="meta-inner-table">
          <tr>
            <td class="meta-label">Bill No</td>
            <td class="meta-val">${invoice.invoiceNumber}</td>
          </tr>
          <tr>
            <td class="meta-label">Bill Date</td>
            <td class="meta-val">${formattedInvoiceDate}</td>
          </tr>
          <tr>
            <td class="meta-label">${invoice.invoiceType === 'client' ? 'Purchase order no' : 'Vehicle no'}</td>
            <td class="meta-val">${invoice.invoiceType === 'client' ? (invoice.purchaseOrderNumber || '') : (invoice.vehicleNumber || '')}</td>
          </tr>
          <tr>
            <td class="meta-label">Order Date</td>
            <td class="meta-val">${formattedOrderDate}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- HSN Banner -->
  <div class="hsn-banner">
    <div class="hsn-label">HSN CODE</div>
    <div class="hsn-val">${displayHsn}</div>
  </div>

  <!-- Items Table -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:6%">Sl No</th>
        <th style="width:44%">Description of Goods</th>
        <th style="width:11%">Rate</th>
        <th style="width:7%">Qty</th>
        <th style="width:9%">GST%</th>
        <th style="width:10%">GST</th>
        <th style="width:13%">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${invoice.lineItems
        .map(
          (item) => `
        <tr>
          <td class="col-sl">${item.slNo}.</td>
          <td class="col-desc">${item.description}</td>
          <td class="col-rate">${item.rate}</td>
          <td class="col-qty">${item.quantity || 1}</td>
          <td class="col-gstp">${item.gstRate}%</td>
          <td class="col-gst">${item.totalGstAmount}</td>
          <td class="col-amt">${item.totalAmount.toLocaleString('en-IN')}</td>
        </tr>
      `
        )
        .join('')}
      ${emptyRowsHtml}
      <tr class="total-row">
        <td></td>
        <td style="text-align:center; font-weight:bold;">Total</td>
        <td style="text-align:center;">${invoice.subtotalTaxable}</td>
        <td></td>
        <td></td>
        <td style="text-align:center;">${invoice.totalGst}</td>
        <td style="text-align:right; padding-right:8px;">${invoice.totalAmount.toLocaleString('en-IN')}</td>
      </tr>
    </tbody>
  </table>

  <!-- Words Banner -->
  <div class="words-banner">
    RUPEES ${invoice.amountInWords.replace(/^RUPEES\s+/i, '').toUpperCase()}
  </div>

  <!-- Tax Table -->
  <table class="tax-table">
    <tr>
      <th rowspan="2" style="width:38%;">Taxable Value</th>
      ${
        isInterState
          ? `<th colspan="2" style="width:38%;">Integrated Tax</th>`
          : `
          <th colspan="2" style="width:20%;">Central Tax</th>
          <th colspan="2" style="width:20%;">State Tax</th>
        `
      }
      <th rowspan="2" style="width:22%;">Total</th>
    </tr>
    <tr>
      ${
        isInterState
          ? `
          <th style="width:18%;">Rate</th>
          <th style="width:20%;">Amount</th>
        `
          : `
          <th style="width:10%;">Rate</th>
          <th style="width:10%;">Amount</th>
          <th style="width:10%;">Rate</th>
          <th style="width:10%;">Amount</th>
        `
      }
    </tr>
    ${
      taxSlabs.length <= 1
        ? `
      <tr>
        <td style="height:26px;">${(taxSlabs[0]?.taxableAmount || invoice.subtotalTaxable).toLocaleString('en-IN')}</td>
        ${
          isInterState
            ? `
            <td>${taxSlabs[0]?.igstRate ?? 18}%</td>
            <td>${(taxSlabs[0]?.igstAmount ?? invoice.totalIgst).toFixed(1)}</td>
          `
            : `
            <td>${taxSlabs[0]?.cgstRate ?? 9}%</td>
            <td>${(taxSlabs[0]?.cgstAmount ?? invoice.totalCgst).toFixed(1)}</td>
            <td>${taxSlabs[0]?.sgstRate ?? 9}%</td>
            <td>${(taxSlabs[0]?.sgstAmount ?? invoice.totalSgst).toFixed(1)}</td>
          `
        }
        <td class="tax-total-cell">${invoice.totalAmount.toLocaleString('en-IN')}</td>
      </tr>
    `
        : `
      ${taxSlabs
        .map(
          slab => `
        <tr>
          <td style="height:22px;">${slab.taxableAmount.toLocaleString('en-IN')}</td>
          ${
            isInterState
              ? `
              <td>${slab.igstRate}%</td>
              <td>${slab.igstAmount.toFixed(1)}</td>
            `
              : `
              <td>${slab.cgstRate}%</td>
              <td>${slab.cgstAmount.toFixed(1)}</td>
              <td>${slab.sgstRate}%</td>
              <td>${slab.sgstAmount.toFixed(1)}</td>
            `
          }
          <td>${slab.totalAmount.toLocaleString('en-IN')}</td>
        </tr>
      `
        )
        .join('')}
      <tr style="background:#fafafa; font-weight:bold;">
        <td>Total: ${invoice.subtotalTaxable.toLocaleString('en-IN')}</td>
        ${
          isInterState
            ? `
            <td>-</td>
            <td>${invoice.totalIgst.toFixed(1)}</td>
          `
            : `
            <td>-</td>
            <td>${invoice.totalCgst.toFixed(1)}</td>
            <td>-</td>
            <td>${invoice.totalSgst.toFixed(1)}</td>
          `
        }
        <td class="tax-total-cell">${invoice.totalAmount.toLocaleString('en-IN')}</td>
      </tr>
    `
    }
  </table>

  <!-- Footer Table -->
  <table class="footer-table">
    <tr>
      <td class="bank-box">
        <div class="bank-title">Our Bank Details</div>
        <div>${invoice.bankDetails.bankName || settings.bankDetails.bankName} ${invoice.bankDetails.branch || settings.bankDetails.branch}</div>
        <div>Account Number- ${invoice.bankDetails.accountNumber || settings.bankDetails.accountNumber}</div>
        <div>IFSC Code - ${invoice.bankDetails.ifscCode || settings.bankDetails.ifscCode}</div>
        <div>GPay - ${invoice.bankDetails.gpay || settings.bankDetails.gpay}</div>
      </td>
      <td class="sign-box">
        <div class="for-company">For Devi Motors</div>
        <div class="signature-area">
          ${stampSrc ? `<img src="${stampSrc}" class="stamp-badge" alt="Digital Stamp Badge">` : ''}
          ${withSignature && signatureSrc ? `<img src="${signatureSrc}" class="sig-overlay" alt="Authorized Signature">` : ''}
        </div>
        <div class="auth-title">Authorized Signatory</div>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

export function generateQuotationHtml(
  quotation: IQuotation,
  settings: ICompanySettings,
  options?: PdfRenderOptions
): string {
  const withSignature = options?.withSignature === true;
  const logoSrc = logoB64 || settings.logoUrl || '';
  const stampSrc = stampB64 || settings.stampUrl || '';
  const signatureSrc = signatureB64 || settings.signatureUrl || '';
  const formattedDate = formatDateDDMMYYYY(quotation.quotationDate);

  if (quotation.quotationType === 'proposal_style') {
    // Narrative Contract/Proposal Style (Artech qo1.pdf match)
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Quotation ${quotation.quotationNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 20mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #000;
      background: #fff;
      font-size: 13.5px;
      line-height: 1.5;
    }
    .header-container {
      text-align: center;
      margin-bottom: 8px;
    }
    .logo-img {
      max-height: 75px;
      max-width: 290px;
      object-fit: contain;
      margin-bottom: 4px;
    }
    .header-address {
      font-size: 12px;
      font-weight: bold;
      color: #111;
      line-height: 1.4;
    }
    .header-contact-bar {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      margin-bottom: 24px;
      font-weight: bold;
      font-size: 13px;
    }
    .doc-title {
      font-size: 15px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 24px;
      text-transform: uppercase;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      font-size: 13.5px;
    }
    .to-client {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    .section-heading {
      font-size: 14px;
      font-weight: bold;
      margin-top: 16px;
      margin-bottom: 6px;
    }
    .service-title {
      font-size: 13.5px;
      font-weight: bold;
      margin-bottom: 12px;
    }
    .narrative-p {
      text-align: justify;
      line-height: 1.6;
      margin-bottom: 22px;
    }
    .charges-block {
      margin: 22px 0;
      line-height: 1.8;
      font-size: 13.5px;
    }
    .charges-line {
      font-weight: bold;
    }
    .total-line {
      font-size: 14.5px;
      font-weight: bold;
      margin-top: 4px;
    }
    .warranty-block {
      margin: 22px 0;
      line-height: 1.6;
    }
    .thankyou-p {
      margin: 20px 0 35px 0;
      line-height: 1.6;
    }
    .footer-sign-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 30px;
    }
    .company-sig-block {
      line-height: 1.4;
    }
    .company-name {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 3px;
    }
    .company-tag {
      font-size: 12.5px;
      color: #333;
    }
    .sig-stamp-container {
      position: relative;
      width: 140px;
      height: 70px;
      margin-top: 10px;
      display: flex;
      align-items: center;
    }
    .stamp-badge {
      width: 65px;
      height: 65px;
      object-fit: contain;
    }
    .sig-img {
      position: absolute;
      left: 35px;
      top: 12px;
      width: 85px;
      height: 45px;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div class="header-container">
    ${logoSrc ? `<img src="${logoSrc}" class="logo-img" alt="DEVI MOTORS">` : `<h1 style="color:#F52B2B;">DEVI MOTORS</h1>`}
    <div class="header-address">
      ${settings.addressLine1}<br>
      ${settings.addressLine2}
    </div>
  </div>

  <div class="header-contact-bar">
    <div>Phone: ${settings.phone}</div>
    <div>GST No: ${settings.gstin}</div>
  </div>

  <div class="doc-title">
    QUOTATION – ${quotation.vehicleProjectName || quotation.serviceTitle || 'SERVICE PROPOSAL'}
  </div>

  <div class="meta-row">
    <div class="to-client">To: ${quotation.customer.name}</div>
    <div style="text-align: right; font-weight: bold;">
      <div>Quotation No: ${quotation.quotationNumber}</div>
      <div>Date: ${formattedDate}</div>
    </div>
  </div>

  <div class="section-heading">Service</div>
  <div class="service-title">${quotation.serviceTitle || quotation.vehicleProjectName}</div>

  <p class="narrative-p">
    ${quotation.narrativeDescription || 'We are pleased to offer our professional mirror polishing service to restore the vehicle’s surface with a deep, glossy, mirror-like finish while maintaining the premium appearance.'}
  </p>

  <div class="charges-block">
    <div class="charges-line">Service charges: Rs ${(quotation.serviceCharge || quotation.subtotalTaxable).toLocaleString('en-IN')}</div>
    <div class="charges-line">GST @${quotation.gstRate !== undefined && quotation.gstRate !== null ? quotation.gstRate : 18}%: Rs ${(quotation.totalGst).toLocaleString('en-IN')}</div>
    <div class="total-line">Total Quotation: Rs ${(quotation.totalAmount).toLocaleString('en-IN')}</div>
  </div>

  <div class="warranty-block">
    <strong>Warranty:</strong> ${quotation.warranty || 'We provide a 2-year warranty on the mirror polishing finish, subject to proper maintenance and care.'}
  </div>

  <p class="thankyou-p">
    ${quotation.closingNote || 'Thank you for choosing us, we look forward to giving your vehicle a flawless finish.'}
  </p>

  <div class="footer-sign-section">
    <div class="company-sig-block">
      <div class="company-name">Devi Motors</div>
      <div class="company-tag">Professional Car Painting,<br>Polishing & Detailing</div>
      <div class="sig-stamp-container">
        ${stampSrc ? `<img src="${stampSrc}" class="stamp-badge" alt="Digital Stamp Badge">` : ''}
        ${withSignature && signatureSrc ? `<img src="${signatureSrc}" class="sig-img" alt="Authorized Signature">` : ''}
      </div>
    </div>
  </div>
</body>
</html>
`;
  }

  // Invoice Style Quotation (Type A)
  // Reuses the exact structured grid but titled QUOTATION
  const pseudoInvoice = {
    ...quotation,
    invoiceType: quotation.vehicleNumber ? 'vehicle' : 'client',
    invoiceNumber: quotation.quotationNumber,
    invoiceDate: quotation.quotationDate,
    orderDate: quotation.validUntil,
    hsnCode: (quotation.lineItems && quotation.lineItems.length > 0 && quotation.lineItems[0].hsnSac) || '998714',
    lineItems: quotation.lineItems || [],
    bankDetails: settings.bankDetails,
    amountInWords: quotation.amountInWords || ''
  } as unknown as IInvoice;

  const invoiceHtml = generateInvoiceHtml(pseudoInvoice, settings, options);
  // Replace "Bill No" with "Quotation No", "Bill Date" with "Quotation Date", and "TAX INVOICE" references
  return invoiceHtml
    .replace('Bill No', 'Quotation No')
    .replace('Bill Date', 'Quotation Date')
    .replace('BILL TO', 'QUOTATION TO');
}

export async function renderPdfBuffer(html: string): Promise<Buffer> {
  const chromePath =
    process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

  const launchOptions: any = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  };

  if (fs.existsSync(chromePath)) {
    launchOptions.executablePath = chromePath;
  }

  const browser = await puppeteer.launch(launchOptions);
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '12mm',
        right: '12mm',
        bottom: '12mm',
        left: '12mm'
      }
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
