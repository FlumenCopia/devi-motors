'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  Car,
  FileText,
  Eye,
  AlertCircle,
  CheckCircle2,
  Users
} from 'lucide-react';
import { api } from '../../../lib/api';
import { validateOrderInvoiceDates } from '@devi-motors/shared';

interface LineItemForm {
  slNo: number;
  description: string;
  hsnSac: string;
  quantity: number;
  unit: string;
  rate: number; // BEFORE GST
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  gstRate: number;
  taxableAmount: number;
  totalGstAmount: number;
  totalAmount: number;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId');

  const [invoiceType, setInvoiceType] = useState<'vehicle' | 'client'>('vehicle');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // References
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderDate, setOrderDate] = useState('');
  const [hsnCode, setHsnCode] = useState('998714');

  // Line items
  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    {
      slNo: 1,
      description: 'RH Front headlight',
      hsnSac: '998714',
      quantity: 1,
      unit: 'Nos',
      rate: 8200,
      discountType: 'fixed',
      discountValue: 0,
      gstRate: 18,
      taxableAmount: 8200,
      totalGstAmount: 1476,
      totalAmount: 9676
    }
  ]);

  // Totals
  const [totals, setTotals] = useState<any>({
    subtotalTaxable: 8200,
    totalCgst: 738,
    totalSgst: 738,
    totalIgst: 0,
    totalGst: 1476,
    totalAmount: 9676,
    amountInWords: 'RUPEES NINE THOUSAND SIX HUNDRED AND SEVENTY SIX ONLY'
  });

  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Immediate upon invoice submission');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateError, setDateError] = useState('');

  // PDF Preview Modal
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const res = await api.listCustomers({ limit: 100 });
      if (res.success) {
        setCustomers(res.customers || []);
        if (preselectedCustomerId) {
          const found = res.customers.find((c: any) => c._id === preselectedCustomerId);
          if (found) {
            handleSelectCustomer(found);
          }
        } else if (res.customers.length > 0) {
          handleSelectCustomer(res.customers[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectCustomer = (cust: any) => {
    setSelectedCustomer(cust);
    if (cust.customerType === 'company') {
      setInvoiceType('client');
      if (cust.purchaseOrders?.length > 0) {
        setPurchaseOrderNumber(cust.purchaseOrders[0]);
      }
    } else {
      setInvoiceType('vehicle');
      if (cust.vehicleNumbers?.length > 0) {
        setVehicleNumber(cust.vehicleNumbers[0]);
      }
    }
    recalculate(lineItems, cust.stateCode);
  };

  const recalculate = async (items: LineItemForm[], stateCode?: string) => {
    try {
      const res = await api.calculateInvoice({
        lineItems: items,
        customerStateCode: stateCode || selectedCustomer?.stateCode || '32'
      });
      if (res.success) {
        setLineItems(res.lineItems);
        setTotals(res.totals);
      }
    } catch (err) {
      console.error('Calculation error', err);
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    (updated[index] as any)[field] = value;
    recalculate(updated);
  };

  const addItem = () => {
    const newItem: LineItemForm = {
      slNo: lineItems.length + 1,
      description: '',
      hsnSac: hsnCode || '998714',
      quantity: 1,
      unit: 'Nos',
      rate: 0,
      discountType: 'fixed',
      discountValue: 0,
      gstRate: 18,
      taxableAmount: 0,
      totalGstAmount: 0,
      totalAmount: 0
    };
    const updated = [...lineItems, newItem];
    setLineItems(updated);
    recalculate(updated);
  };

  const removeItem = (index: number) => {
    if (lineItems.length === 1) return;
    const updated = lineItems.filter((_, i) => i !== index).map((item, i) => ({
      ...item,
      slNo: i + 1
    }));
    setLineItems(updated);
    recalculate(updated);
  };

  const handleDateChange = (type: 'order' | 'invoice', value: string) => {
    if (type === 'order') {
      setOrderDate(value);
      if (value && invoiceDate) {
        const check = validateOrderInvoiceDates(value, invoiceDate);
        setDateError(check.valid ? '' : check.error || '');
      } else {
        setDateError('');
      }
    } else {
      setInvoiceDate(value);
      if (orderDate && value) {
        const check = validateOrderInvoiceDates(orderDate, value);
        setDateError(check.valid ? '' : check.error || '');
      } else {
        setDateError('');
      }
    }
  };

  const handleSubmit = async (issueNow: boolean) => {
    setError('');
    if (!selectedCustomer) {
      setError('Please select or add a customer.');
      return;
    }

    if (orderDate && invoiceDate) {
      const check = validateOrderInvoiceDates(orderDate, invoiceDate);
      if (!check.valid) {
        setDateError(check.error || '');
        setError(check.error || '');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        invoiceType,
        invoiceDate,
        orderDate: orderDate || undefined,
        vehicleNumber: invoiceType === 'vehicle' ? vehicleNumber : undefined,
        purchaseOrderNumber: invoiceType === 'client' ? purchaseOrderNumber : undefined,
        customer: {
          id: selectedCustomer._id,
          name: selectedCustomer.name,
          customerType: selectedCustomer.customerType,
          billingAddress: selectedCustomer.billingAddress,
          state: selectedCustomer.state || 'Kerala',
          stateCode: selectedCustomer.stateCode || '32',
          gstin: selectedCustomer.gstin,
          phone: selectedCustomer.phone
        },
        hsnCode,
        lineItems,
        notes,
        paymentTerms
      };

      const res = await api.createInvoiceDraft(payload);
      if (res.success && res.invoice) {
        if (issueNow) {
          // Immediately finalize and issue official invoice number
          const issueRes = await api.issueInvoice(res.invoice._id);
          if (issueRes.success) {
            router.push(`/invoices/${issueRes.invoice._id}`);
            return;
          }
        }
        router.push(`/invoices/${res.invoice._id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save invoice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </button>

        <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
          Create Invoice
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Invoice Type Tabs (Matching Mobile Screen 4 & Desktop) */}
      <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 rounded-2xl shadow-sm">
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Select Invoice Type
        </label>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <button
            type="button"
            onClick={() => setInvoiceType('vehicle')}
            className={`py-2.5 px-4 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 transition-all ${
              invoiceType === 'vehicle'
                ? 'bg-[#F52B2B] text-white border-[#F52B2B] shadow-sm'
                : 'bg-gray-50 dark:bg-[#0E1522] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#233048]'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Vehicle Customer</span>
          </button>
          <button
            type="button"
            onClick={() => setInvoiceType('client')}
            className={`py-2.5 px-4 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 transition-all ${
              invoiceType === 'client'
                ? 'bg-[#F52B2B] text-white border-[#F52B2B] shadow-sm'
                : 'bg-gray-50 dark:bg-[#0E1522] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#233048]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Client / Business</span>
          </button>
        </div>
      </div>

      {/* 2. Customer & Reference Details */}
      <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 md:p-6 rounded-2xl shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
          Customer & Reference Information
        </h2>

        {/* Customer Select */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Select Customer *
            </label>
            <Link
              href="/customers?action=new"
              className="text-xs font-bold text-[#F52B2B] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Customer
            </Link>
          </div>
          <select
            value={selectedCustomer?._id || ''}
            onChange={(e) => {
              const cust = customers.find((c) => c._id === e.target.value);
              if (cust) handleSelectCustomer(cust);
            }}
            className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20 focus:border-[#F52B2B]"
          >
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.customerType}) — {c.phone}
              </option>
            ))}
          </select>
        </div>

        {/* Conditional Reference (Vehicle vs PO) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {invoiceType === 'vehicle' ? (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Vehicle Registration Number *
              </label>
              <input
                type="text"
                required
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="KL 01DD 6151"
                className="w-full px-3.5 py-2.5 text-sm uppercase bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20 focus:border-[#F52B2B]"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Purchase Order (PO) Number *
              </label>
              <input
                type="text"
                required
                value={purchaseOrderNumber}
                onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                placeholder="MPUR2627-000296"
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20 focus:border-[#F52B2B]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Order Date (Must be &le; Invoice Date)
            </label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => handleDateChange('order', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20 focus:border-[#F52B2B]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Invoice Date *
            </label>
            <input
              type="date"
              required
              value={invoiceDate}
              onChange={(e) => handleDateChange('invoice', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20 focus:border-[#F52B2B]"
            />
          </div>
        </div>

        {dateError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{dateError}</span>
          </div>
        )}
      </div>

      {/* 3. Line Items Table */}
      <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 md:p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
            Line Items (Rate Before GST)
          </h2>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-[#F52B2B] dark:bg-red-950/40 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>

        {/* Items Container */}
        <div className="space-y-3">
          {lineItems.map((item, index) => (
            <div
              key={index}
              className="p-3.5 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl grid grid-cols-12 gap-2.5 items-end text-xs"
            >
              {/* Sl */}
              <div className="col-span-1 text-center font-bold text-gray-400 pb-2">
                #{index + 1}
              </div>

              {/* Description */}
              <div className="col-span-11 sm:col-span-4">
                <label className="block text-[10px] font-semibold text-gray-400 mb-1">
                  Description of Goods / Service *
                </label>
                <input
                  type="text"
                  required
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  placeholder="e.g. RH Front headlight"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              {/* Quantity */}
              <div className="col-span-3 sm:col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 mb-1">Qty</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs text-center bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              {/* Rate BEFORE GST */}
              <div className="col-span-5 sm:col-span-2">
                <label className="block text-[10px] font-semibold text-gray-400 mb-1">
                  Rate (Before GST) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={item.rate}
                  onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-lg text-gray-900 dark:text-white font-semibold"
                />
              </div>

              {/* GST Rate */}
              <div className="col-span-4 sm:col-span-1">
                <label className="block text-[10px] font-semibold text-gray-400 mb-1">GST%</label>
                <select
                  value={item.gstRate}
                  onChange={(e) => handleItemChange(index, 'gstRate', Number(e.target.value))}
                  className="w-full px-1.5 py-1.5 text-xs bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-lg text-gray-900 dark:text-white font-semibold"
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>

              {/* Line Amount */}
              <div className="col-span-10 sm:col-span-2 text-right">
                <label className="block text-[10px] font-semibold text-gray-400 mb-1">Total</label>
                <div className="py-1.5 font-bold text-gray-900 dark:text-white text-xs">
                  ₹ {item.totalAmount?.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Remove */}
              <div className="col-span-2 sm:col-span-1 text-right pb-1">
                <button
                  type="button"
                  disabled={lineItems.length === 1}
                  onClick={() => removeItem(index)}
                  className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Financial Totals & Summary */}
      <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 md:p-6 rounded-2xl shadow-sm space-y-3">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Subtotal (Taxable Value Before GST):</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            ₹ {totals.subtotalTaxable?.toLocaleString('en-IN')}
          </span>
        </div>

        {totals.totalIgst > 0 ? (
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Integrated Tax (IGST):</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              ₹ {totals.totalIgst?.toLocaleString('en-IN')}
            </span>
          </div>
        ) : (
          <>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Central Tax (CGST):</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ₹ {totals.totalCgst?.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>State Tax (SGST):</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ₹ {totals.totalSgst?.toLocaleString('en-IN')}
              </span>
            </div>
          </>
        )}

        <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center text-sm md:text-base font-bold text-gray-900 dark:text-white">
          <span>Total Amount Payable:</span>
          <span className="text-xl text-[#F52B2B]">
            ₹ {totals.totalAmount?.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="pt-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
          {totals.amountInWords}
        </div>
      </div>

      {/* 5. Action Buttons (Draft / Issue / Preview) */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
        <button
          type="button"
          disabled={loading || !!dateError}
          onClick={() => handleSubmit(false)}
          className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 text-xs md:text-sm font-semibold rounded-xl transition-all"
        >
          Save as Draft
        </button>

        <button
          type="button"
          disabled={loading || !!dateError}
          onClick={() => handleSubmit(true)}
          className="w-full sm:w-auto px-6 py-2.5 bg-[#F52B2B] hover:bg-[#DC2626] text-white text-xs md:text-sm font-semibold rounded-xl shadow-md shadow-[#F52B2B]/20 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Issue & Generate Invoice</span>
        </button>
      </div>
    </div>
  );
}
