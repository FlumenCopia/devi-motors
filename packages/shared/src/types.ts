export type CustomerType = 'individual' | 'company';

export interface Customer {
  id?: string;
  _id?: string;
  name: string;
  customerType: CustomerType;
  contactPerson?: string;
  phone: string;
  email?: string;
  billingAddress: string;
  state: string;
  stateCode: string;
  pinCode?: string;
  gstin?: string;
  notes?: string;
  vehicleNumbers?: string[];
  purchaseOrders?: string[];
  totalInvoiced?: number;
  totalPaid?: number;
  outstandingBalance?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type InvoiceType = 'vehicle' | 'client';
export type InvoiceStatus = 'draft' | 'issued' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid';

export interface LineItem {
  slNo: number;
  description: string;
  hsnSac?: string;
  quantity: number;
  unit?: string;
  rate: number; // BEFORE GST (Unit rate)
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  taxableAmount: number; // (quantity * rate) - discount
  gstRate: number; // e.g. 18 for 18%
  cgstRate?: number; // e.g. 9
  cgstAmount?: number;
  sgstRate?: number; // e.g. 9
  sgstAmount?: number;
  igstRate?: number; // e.g. 18
  igstAmount?: number;
  totalGstAmount: number;
  totalAmount: number; // taxableAmount + totalGstAmount
}

export interface BankDetails {
  bankName: string;
  branch: string;
  accountNumber: string;
  ifscCode: string;
  gpay?: string;
  accountName?: string;
}

export interface InvoiceCustomerSnapshot {
  id?: string;
  name: string;
  customerType: CustomerType;
  billingAddress: string;
  state: string;
  stateCode: string;
  gstin?: string;
  phone?: string;
  email?: string;
}

export interface Invoice {
  id?: string;
  _id?: string;
  invoiceType: InvoiceType;
  invoiceNumber: string; // e.g. DM/07/26-27
  financialYear: string; // e.g. 2026-2027
  invoiceDate: string; // YYYY-MM-DD
  orderDate?: string; // YYYY-MM-DD
  vehicleNumber?: string; // Type A: Required or entered
  purchaseOrderNumber?: string; // Type B: Required or entered
  customer: InvoiceCustomerSnapshot;
  hsnCode?: string; // Default '998714'
  lineItems: LineItem[];
  subtotalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalGst: number;
  roundOff?: number;
  totalAmount: number;
  amountInWords: string;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  balanceDue: number;
  bankDetails: BankDetails;
  notes?: string;
  paymentTerms?: string;
  issuedAt?: string;
  issuedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type QuotationType = 'invoice_style' | 'proposal_style';
export type QuotationStatus =
  | 'draft'
  | 'sent'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'converted';

export interface Quotation {
  id?: string;
  _id?: string;
  quotationType: QuotationType;
  quotationNumber: string; // e.g. DQ/05/26-27
  financialYear: string;
  quotationDate: string; // YYYY-MM-DD
  validUntil?: string; // YYYY-MM-DD
  customer: InvoiceCustomerSnapshot;
  vehicleNumber?: string;
  purchaseOrderNumber?: string;
  
  // Specific to proposal_style (Contract)
  vehicleProjectName?: string; // e.g. "Lamborghini Urus Mirror Polishing"
  serviceTitle?: string; // e.g. "Premium Mirror Polishing for Lamborghini Urus"
  narrativeDescription?: string; // Long-form narrative
  serviceCharge?: number; // Rate before GST
  warranty?: string; // e.g. "We provide a 2-year warranty..."
  closingNote?: string; // e.g. "Thank you for choosing us..."

  // Line items for invoice_style
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
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id?: string;
  _id?: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: 'cash' | 'bank_transfer' | 'upi' | 'cheque' | 'card';
  transactionReference?: string;
  notes?: string;
  recordedBy?: string;
  createdAt?: string;
}

export interface CompanySettings {
  id?: string;
  _id?: string;
  companyName: string;
  tagline: string;
  addressLine1: string;
  addressLine2: string;
  state: string;
  stateCode: string;
  pinCode?: string;
  phone: string;
  email: string;
  gstin: string;
  defaultHsn: string;
  bankDetails: BankDetails;
  invoicePrefix: string; // DM
  quotationPrefix: string; // DQ
  defaultPaymentTerms: string;
  logoUrl?: string;
  stampUrl?: string;
  signatureUrl?: string;
  updatedAt?: string;
}

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'staff';
  createdAt?: string;
}

export interface DashboardMetrics {
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  quotationsPending: number;
  invoicedChangePercent?: number;
  paidChangePercent?: number;
  outstandingChangePercent?: number;
  quotationsChangePercent?: number;
  monthlySales: {
    month: string;
    invoiced: number;
    paid: number;
  }[];
  recentDocuments: {
    id: string;
    type: 'invoice' | 'quotation';
    documentNumber: string;
    customerName: string;
    date: string;
    amount: number;
    status: string;
  }[];
  recentCustomers: {
    id: string;
    name: string;
    customerType: CustomerType;
    gstin?: string;
    lastActivity?: string;
  }[];
}
