import React from 'react';

/**
 * Formats an Indian or international phone number for WhatsApp wa.me links.
 * E.g. "9447138617" -> "919447138617", "+91 9447-138617" -> "919447138617"
 */
export function formatWhatsAppPhone(phone?: string | null): string {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return '91' + clean;
  }
  return clean;
}

/**
 * Generates formatted text message for an Invoice.
 */
export function getInvoiceWhatsAppMessage(invoice: any): string {
  const customerName = invoice.customer?.name || 'Valued Customer';
  const invoiceNo = invoice.invoiceNumber || '';
  const date = invoice.invoiceDate || '';
  const vehicle = invoice.vehicleNumber ? `\n🚗 *Vehicle:* ${invoice.vehicleNumber}` : (invoice.purchaseOrderNumber ? `\n📄 *PO No:* ${invoice.purchaseOrderNumber}` : '');
  const totalAmount = invoice.totalAmount ? `₹ ${invoice.totalAmount.toLocaleString('en-IN')}` : '₹ 0';
  const balance =
    invoice.balanceDue !== undefined && invoice.balanceDue > 0
      ? `\n💳 *Balance Due:* ₹ ${invoice.balanceDue.toLocaleString('en-IN')}`
      : `\n✅ *Status:* ${invoice.paymentStatus ? invoice.paymentStatus.toUpperCase() : 'ISSUED'}`;

  return `*DEVI MOTORS — TAX INVOICE*
----------------------------------------
Hello *${customerName}*,

Here are the details for your tax invoice:

📋 *Invoice No:* ${invoiceNo}
📅 *Date:* ${date}${vehicle}
💰 *Total Amount:* ${totalAmount}${balance}

📍 *DEVI MOTORS*
T.C 17/2456-1, Opp. Rajiv Gandhi Centre for Bio Technology,
Jagathy, Thycaud P.O, Thiruvananthapuram
📞 Phone: 9447138617 | GST: 32BAAPJ2054E1ZG

Thank you for your business!`;
}

/**
 * Returns the wa.me link for an invoice.
 */
export function getInvoiceWhatsAppUrl(invoice: any): string {
  const phone = formatWhatsAppPhone(invoice.customer?.phone || '');
  const message = getInvoiceWhatsAppMessage(invoice);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates formatted text message for a Quotation.
 */
export function getQuotationWhatsAppMessage(quotation: any): string {
  const customerName = quotation.customer?.name || 'Valued Customer';
  const quotationNo = quotation.quotationNumber || '';
  const date = quotation.quotationDate || '';
  const service = quotation.vehicleProjectName || quotation.serviceTitle || 'Automotive Service Proposal';
  const totalAmount = quotation.totalAmount ? `₹ ${quotation.totalAmount.toLocaleString('en-IN')}` : '₹ 0';

  return `*DEVI MOTORS — SERVICE QUOTATION*
----------------------------------------
Hello *${customerName}*,

Please find the details for your quotation:

📋 *Quotation No:* ${quotationNo}
📅 *Date:* ${date}
🚗 *Service / Vehicle:* ${service}
💰 *Estimated Total:* ${totalAmount}

📍 *DEVI MOTORS*
Jagathy, Thycaud P.O, Thiruvananthapuram
📞 Phone: 9447138617

Thank you for choosing Devi Motors!`;
}

/**
 * Returns the wa.me link for a quotation.
 */
export function getQuotationWhatsAppUrl(quotation: any): string {
  const phone = formatWhatsAppPhone(quotation.customer?.phone || '');
  const message = getQuotationWhatsAppMessage(quotation);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * WhatsApp Brand Icon Component
 */
export function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="0"
      fill="currentColor"
      className={className}
    >
      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}
