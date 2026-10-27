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
  Users,
  Tag,
  Percent,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { api } from '../../../lib/api';
import {
  validateOrderInvoiceDates,
  AUTOMOTIVE_HSN_CODES,
  STANDARD_GST_RATES,
  calculateLineItem,
  calculateDocumentTotals
} from '@devi-motors/shared';
import { SmartCustomerSelector } from '../../../components/SmartCustomerSelector';

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
  const editId = searchParams.get('editId') || searchParams.get('id');

  const [existingInvoiceNumber, setExistingInvoiceNumber] = useState('');
  const [invoiceType, setInvoiceType] = useState<'vehicle' | 'client'>('vehicle');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // References
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [orderDate, setOrderDate] = useState('');

  // Primary Document HSN/SAC Code
  const [hsnCode, setHsnCode] = useState('998714');
  const [isCustomHsn, setIsCustomHsn] = useState(false);
  const [customHsn, setCustomHsn] = useState('');

  // Row-level custom tracking
  const [customHsnRows, setCustomHsnRows] = useState<{ [key: number]: boolean }>({});
  const [customGstRows, setCustomGstRows] = useState<{ [key: number]: boolean }>({});

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
    amountInWords: 'RUPEES NINE THOUSAND SIX HUNDRED AND SEVENTY SIX ONLY',
    taxBreakdown: []
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
    if (editId) {
      loadExistingInvoice(editId);
    }
  }, [editId]);

  const loadExistingInvoice = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.getInvoice(id);
      if (res.success && res.invoice) {
        const inv = res.invoice;
        setExistingInvoiceNumber(inv.invoiceNumber);
        setInvoiceType(inv.invoiceType);
        setSelectedCustomer(inv.customer);
        if (inv.vehicleNumber) setVehicleNumber(inv.vehicleNumber);
        if (inv.purchaseOrderNumber) setPurchaseOrderNumber(inv.purchaseOrderNumber);
        if (inv.invoiceDate) setInvoiceDate(inv.invoiceDate.split('T')[0]);
        if (inv.orderDate) setOrderDate(inv.orderDate.split('T')[0]);
        if (inv.hsnCode) {
          const isStandard = AUTOMOTIVE_HSN_CODES.some((h) => h.code === inv.hsnCode);
          if (isStandard) {
            setHsnCode(inv.hsnCode);
            setIsCustomHsn(false);
          } else {
            setIsCustomHsn(true);
            setCustomHsn(inv.hsnCode);
          }
        }
        if (inv.lineItems && inv.lineItems.length > 0) {
          setLineItems(inv.lineItems);
        }
        if (inv.notes) setNotes(inv.notes);
        if (inv.paymentTerms) setPaymentTerms(inv.paymentTerms);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice for editing.');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await api.listCustomers({ limit: 100 });
      if (res.success) {
        setCustomers(res.customers || []);
        if (preselectedCustomerId) {
          const found = res.customers.find((c: any) => c._id === preselectedCustomerId);
          if (found) handleSelectCustomer(found);
        } else if (!editId && res.customers.length > 0) {
          handleSelectCustomer(res.customers[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const recalculateSync = (items: LineItemForm[], stateCode?: string) => {
    const isInterState = (stateCode || selectedCustomer?.stateCode || '32') !== '32';
    const calculatedItems = items.map((item, idx) => {
      const calc = calculateLineItem({
        slNo: idx + 1,
        description: item.description || '',
        hsnSac: item.hsnSac || '998714',
        quantity: Math.max(0, Number(item.quantity) || 0),
        rate: Math.max(0, Number(item.rate) || 0),
        unit: item.unit || 'Nos',
        discountType: item.discountType,
        discountValue: item.discountValue,
        gstRate: Math.max(0, Number(item.gstRate) || 0),
        isInterState
      });
      return {
        ...item,
        slNo: idx + 1,
        taxableAmount: calc.taxableAmount,
        totalGstAmount: calc.totalGstAmount,
        totalAmount: calc.totalAmount
      };
    });

    const docTotals = calculateDocumentTotals(calculatedItems, isInterState);
    setTotals(docTotals);
    return calculatedItems;
  };

  const handleSelectCustomer = (cust: any) => {
    setSelectedCustomer(cust);
    if (cust.customerType === 'corporate' || cust.customerType === 'company' || cust.customerType === 'insurance') {
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
    const updated = recalculateSync(lineItems, cust.stateCode);
    setLineItems(updated);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...lineItems];
    (updated[index] as any)[field] = value;

    const isInterState = (selectedCustomer?.stateCode || '32') !== '32';
    const calc = calculateLineItem({
      slNo: index + 1,
      description: updated[index].description || '',
      hsnSac: updated[index].hsnSac || '998714',
      quantity: Math.max(0, Number(updated[index].quantity) || 0),
      rate: Math.max(0, Number(updated[index].rate) || 0),
      unit: updated[index].unit || 'Nos',
      discountType: updated[index].discountType,
      discountValue: updated[index].discountValue,
      gstRate: Math.max(0, Number(updated[index].gstRate) || 0),
      isInterState
    });

    updated[index] = {
      ...updated[index],
      taxableAmount: calc.taxableAmount,
      totalGstAmount: calc.totalGstAmount,
      totalAmount: calc.totalAmount
    };

    setLineItems(updated);
    const docTotals = calculateDocumentTotals(updated, isInterState);
    setTotals(docTotals);
  };

  const handleDocumentHsnChange = (code: string) => {
    if (code === '__custom__') {
      setIsCustomHsn(true);
    } else {
      setIsCustomHsn(false);
      setHsnCode(code);
    }
  };

  const applyDocumentHsnToAll = () => {
    const codeToApply = isCustomHsn ? customHsn.trim() || '998714' : hsnCode;
    const updated = lineItems.map((item) => ({
      ...item,
      hsnSac: codeToApply
    }));
    const calculated = recalculateSync(updated);
    setLineItems(calculated);
  };

  const applyGstPresetToAll = (rate: number) => {
    const updated = lineItems.map((item) => ({
      ...item,
      gstRate: rate
    }));
    setCustomGstRows({});
    const calculated = recalculateSync(updated);
    setLineItems(calculated);
  };

  const addItem = () => {
    const defaultCode = isCustomHsn ? customHsn.trim() || '998714' : hsnCode;
    const matched = AUTOMOTIVE_HSN_CODES.find((c) => c.code === defaultCode);
    const newItem: LineItemForm = {
      slNo: lineItems.length + 1,
      description: '',
      hsnSac: defaultCode || '998714',
      quantity: 1,
      unit: 'Nos',
      rate: 0,
      discountType: 'fixed',
      discountValue: 0,
      gstRate: matched ? matched.defaultGstRate : 18,
      taxableAmount: 0,
      totalGstAmount: 0,
      totalAmount: 0
    };
    const updated = [...lineItems, newItem];
    const calculated = recalculateSync(updated);
    setLineItems(calculated);
  };

  const removeItem = (index: number) => {
    if (lineItems.length === 1) return;
    const updated = lineItems
      .filter((_, i) => i !== index)
      .map((item, i) => ({
        ...item,
        slNo: i + 1
      }));
    const calculated = recalculateSync(updated);
    setLineItems(calculated);
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

  const handleSubmit = async (status: 'draft' | 'issued') => {
    setError('');
    setDateError('');

    if (!selectedCustomer) {
      setError('Please select or add a customer.');
      return;
    }

    if (invoiceType === 'vehicle' && !vehicleNumber.trim()) {
      setError('Vehicle registration number is required for vehicle customer invoice.');
      return;
    }

    if (invoiceType === 'client' && !purchaseOrderNumber.trim()) {
      setError('Purchase order number is required for business/client invoice.');
      return;
    }

    if (orderDate && invoiceDate) {
      const dateCheck = validateOrderInvoiceDates(orderDate, invoiceDate);
      if (!dateCheck.valid) {
        setDateError(dateCheck.error || '');
        return;
      }
    }

    setLoading(true);
    try {
      const finalHsn = isCustomHsn ? customHsn.trim() || '998714' : hsnCode;

      const payload = {
        invoiceType,
        invoiceDate,
        orderDate: orderDate || undefined,
        vehicleNumber: invoiceType === 'vehicle' ? vehicleNumber.trim() : undefined,
        purchaseOrderNumber: invoiceType === 'client' ? purchaseOrderNumber.trim() : undefined,
        customer: {
          id: selectedCustomer._id,
          name: selectedCustomer.name,
          customerType: selectedCustomer.customerType,
          billingAddress: selectedCustomer.billingAddress,
          state: selectedCustomer.state || 'Kerala',
          stateCode: selectedCustomer.stateCode || '32',
          gstin: selectedCustomer.gstin,
          phone: selectedCustomer.phone,
          email: selectedCustomer.email
        },
        hsnCode: finalHsn,
        lineItems,
        notes,
        paymentTerms
      };

      if (editId) {
        const res = await api.updateInvoice(editId, payload);
        if (res.success) {
          router.push(`/invoices/${editId}`);
          return;
        }
      } else {
        const res = await api.createInvoiceDraft(payload);
        if (res.success && res.invoice) {
          if (status === 'issued') {
            const issueRes = await api.issueInvoice(res.invoice._id);
            if (issueRes.success) {
              router.push(`/invoices/${res.invoice._id}`);
              return;
            }
          }
          router.push(`/invoices/${res.invoice._id}`);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save invoice.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPreview = async () => {
    try {
      const finalHsn = isCustomHsn ? customHsn.trim() || '998714' : hsnCode;
      const previewInvoiceObj = {
        _id: 'preview',
        invoiceType,
        invoiceNumber: 'PREVIEW-DRAFT',
        financialYear: '2026-2027',
        invoiceDate,
        orderDate,
        vehicleNumber,
        purchaseOrderNumber,
        customer: selectedCustomer || {
          name: 'Preview Customer',
          billingAddress: 'Trivandrum',
          stateCode: '32'
        },
        hsnCode: finalHsn,
        lineItems,
        subtotalTaxable: totals.subtotalTaxable,
        totalCgst: totals.totalCgst,
        totalSgst: totals.totalSgst,
        totalIgst: totals.totalIgst,
        totalGst: totals.totalGst,
        totalAmount: totals.totalAmount,
        amountInWords: totals.amountInWords,
        bankDetails: {
          bankName: 'IndusInd Bank',
          branch: 'Poojappura, Trivandrum Branch',
          accountNumber: '259447138617',
          ifscCode: 'INDB0001480',
          gpay: '9447138617'
        }
      };

      const res = await fetch('http://localhost:5000/api/invoices/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(previewInvoiceObj)
      });
      if (res.ok) {
        const html = await res.text();
        setPreviewHtml(html);
      } else {
        alert('Live preview is available directly after saving draft.');
      }
    } catch (e) {
      alert('Live preview is available directly on the saved invoice page.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </button>

        <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
          {editId ? `Edit Invoice: ${existingInvoiceNumber}` : 'Create New Tax Invoice'}
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Invoice Type Selector */}
      <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 md:p-6 rounded-2xl shadow-sm space-y-3">
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
          Invoice Type *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <span>Vehicle Customer (Individual)</span>
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
            <span>Client / Business (Corporate / Insurance)</span>
          </button>
        </div>
      </div>

      {/* 2. Customer & Reference Details */}
      <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 md:p-6 rounded-2xl shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
          Customer &amp; Reference Information
        </h2>

        {/* Smart Customer Selector (Name or Phone Search, Auto-fill & Quick Add) */}
        <SmartCustomerSelector
          customers={customers}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={handleSelectCustomer}
          onClearCustomer={() => {
            setSelectedCustomer(null);
            setVehicleNumber('');
            setPurchaseOrderNumber('');
          }}
          onCustomerCreated={(newCust) => {
            setCustomers((prev) => [newCust, ...prev]);
          }}
        />

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

      {/* 3. Primary HSN/SAC Code & Quick GST Controls */}
      <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 md:p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#F52B2B]" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Primary HSN / SAC Code
              </h2>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Devi Motors 2 core codes: <strong>SAC 998714</strong> (Services / Body Repair / Painting / Polishing) &amp; <strong>HSN 8708</strong> (Spare Parts &amp; Accessories).
            </p>
          </div>

          <button
            type="button"
            onClick={applyDocumentHsnToAll}
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
          >
            Apply to All Line Items
          </button>
        </div>

        {/* Quick Core Code Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleDocumentHsnChange('998714')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              hsnCode === '998714' && !isCustomHsn
                ? 'bg-[#F52B2B] text-white border-[#F52B2B] shadow-sm'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#F52B2B]'
            }`}
          >
            🎨 SAC 998714 — Painting & Service
          </button>
          <button
            type="button"
            onClick={() => handleDocumentHsnChange('8708')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              hsnCode === '8708' && !isCustomHsn
                ? 'bg-[#F52B2B] text-white border-[#F52B2B] shadow-sm'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#F52B2B]'
            }`}
          >
            🔧 HSN 8708 — Spare Parts & Goods
          </button>
          <button
            type="button"
            onClick={() => handleDocumentHsnChange('__custom__')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              isCustomHsn
                ? 'bg-[#F52B2B] text-white border-[#F52B2B] shadow-sm'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#F52B2B]'
            }`}
          >
            ✏️ Custom Code
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className={isCustomHsn ? 'sm:col-span-7' : 'sm:col-span-12'}>
            <select
              value={isCustomHsn ? '__custom__' : hsnCode}
              onChange={(e) => handleDocumentHsnChange(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20"
            >
              <optgroup label="Devi Motors Primary HSN / SAC Codes">
                <option value="998714">SAC 998714 — Painting, Body Repair & Polishing Services (18%)</option>
                <option value="8708">HSN 8708 — Motor Vehicle Spare Parts & Accessories (18%/28%)</option>
              </optgroup>
              <optgroup label="Related Automotive Codes">
                <option value="8512">HSN 8512 — Headlights, Tail Lamps & Electrical Lighting (18%)</option>
                <option value="3208">HSN 3208 — Automotive Paints, Clear Coats & Thinners (18%)</option>
                <option value="3405">HSN 3405 — Polishes, Wax & Detailing Compounds (18%)</option>
                <option value="998719">SAC 998719 — Other Motor Vehicle Services & Inspections (18%)</option>
              </optgroup>
              <option value="__custom__">+ Enter Unique / Custom HSN Code...</option>
            </select>
          </div>

          {isCustomHsn && (
            <div className="sm:col-span-5 flex items-center gap-2">
              <input
                type="text"
                value={customHsn}
                onChange={(e) => setCustomHsn(e.target.value.trim())}
                placeholder="Enter unique HSN (e.g. 87082900)"
                className="w-full px-3 py-2 text-xs md:text-sm bg-gray-50 dark:bg-[#0E1522] border border-[#F52B2B] rounded-xl text-gray-900 dark:text-white font-mono"
              />
            </div>
          )}
        </div>

        {/* Quick GST Presets Bar */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Percent className="w-3.5 h-3.5 text-[#F52B2B]" />
            <span className="font-semibold text-xs">Quick GST Presets:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => applyGstPresetToAll(18)}
              className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 transition-all"
              title="Set all line items to 18% standard GST"
            >
              18% (Standard)
            </button>
            <button
              type="button"
              onClick={() => applyGstPresetToAll(28)}
              className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 transition-all"
              title="Set all line items to 28% auto parts GST"
            >
              28% (Auto Goods)
            </button>
            <button
              type="button"
              onClick={() => applyGstPresetToAll(12)}
              className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 transition-all"
              title="Set all line items to 12% GST"
            >
              12%
            </button>
            <button
              type="button"
              onClick={() => applyGstPresetToAll(5)}
              className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 transition-all"
              title="Set all line items to 5% GST"
            >
              5%
            </button>
            <button
              type="button"
              onClick={() => applyGstPresetToAll(0)}
              className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 transition-all"
              title="Generate tax-free / non-GST invoice with 0% GST"
            >
              0% (Non-GST / Nil)
            </button>
          </div>
        </div>
      </div>

      {/* 4. Line Items Table */}
      <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 md:p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
              Line Items (Rate Before GST)
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Each item supports individual HSN code, custom rates &amp; optional GST percentage.
            </p>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-[#F52B2B] dark:bg-red-950/40 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>

        {/* Table Header (Desktop) */}
        <div className="hidden md:grid md:grid-cols-[28px_1fr_130px_110px_65px_105px_95px_32px] gap-2.5 px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100/70 dark:bg-[#0E1522] rounded-xl border border-gray-200/60 dark:border-[#233048]">
          <div className="text-center">#</div>
          <div>Description of Goods / Service</div>
          <div>HSN/SAC</div>
          <div>Rate (₹)</div>
          <div className="text-center">Qty</div>
          <div>GST%</div>
          <div className="text-right">Total</div>
          <div></div>
        </div>

        {/* Items Container */}
        <div className="space-y-2">
          {lineItems.map((item, index) => {
            const isRowCustomHsn = customHsnRows[index] || !AUTOMOTIVE_HSN_CODES.some((c) => c.code === item.hsnSac);
            const isRowCustomGst = customGstRows[index];

            return (
              <div
                key={index}
                className="p-3 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl flex flex-col md:grid md:grid-cols-[28px_1fr_130px_110px_65px_105px_95px_32px] gap-2.5 items-center text-xs transition-all"
              >
                {/* Sl */}
                <div className="hidden md:block text-center font-bold text-gray-400">
                  {index + 1}
                </div>

                {/* Description */}
                <div className="w-full">
                  <label className="block md:hidden text-[10px] font-semibold text-gray-400 mb-1">
                    Description of Goods / Service *
                  </label>
                  <input
                    type="text"
                    required
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="e.g. RH Front headlight or Body Polishing"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#F52B2B]"
                  />
                </div>

                {/* HSN/SAC Code */}
                <div className="w-full">
                  <label className="block md:hidden text-[10px] font-semibold text-gray-400 mb-1">
                    HSN/SAC Code
                  </label>
                  {isRowCustomHsn ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={item.hsnSac}
                        onChange={(e) => handleItemChange(index, 'hsnSac', e.target.value.trim())}
                        placeholder="HSN"
                        className="w-full px-2 py-1.5 text-xs font-mono bg-white dark:bg-[#161E2E] border border-[#F52B2B] rounded-lg text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCustomHsnRows((prev) => ({ ...prev, [index]: false }));
                          handleItemChange(index, 'hsnSac', hsnCode || '998714');
                        }}
                        className="text-[10px] text-gray-400 hover:text-gray-600 px-1"
                        title="Back to dropdown"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <select
                      value={item.hsnSac}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setCustomHsnRows((prev) => ({ ...prev, [index]: true }));
                        } else {
                          handleItemChange(index, 'hsnSac', e.target.value);
                          const matched = AUTOMOTIVE_HSN_CODES.find((c) => c.code === e.target.value);
                          if (matched && item.gstRate === 18 && matched.defaultGstRate !== 18) {
                            handleItemChange(index, 'gstRate', matched.defaultGstRate);
                          }
                        }
                      }}
                      className="w-full px-2 py-1.5 text-xs bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-lg text-gray-900 dark:text-white font-medium"
                    >
                      <option value="998714">998714 (Service)</option>
                      <option value="8708">8708 (Parts)</option>
                      <option value="8512">8512 (Lighting)</option>
                      <option value="3208">3208 (Paints)</option>
                      <option value="3405">3405 (Polishes)</option>
                      <option value="998719">998719 (Other)</option>
                      <option value="__custom__">+ Custom</option>
                    </select>
                  )}
                </div>

                {/* Rate BEFORE GST */}
                <div className="w-full">
                  <label className="block md:hidden text-[10px] font-semibold text-gray-400 mb-1">
                    Rate (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={item.rate === 0 ? '' : item.rate}
                    placeholder="0"
                    onChange={(e) => {
                      const raw = e.target.value;
                      handleItemChange(index, 'rate', raw === '' ? 0 : parseFloat(raw));
                    }}
                    className="w-full px-2 py-1.5 text-xs bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-lg text-gray-900 dark:text-white font-semibold focus:outline-none focus:ring-1 focus:ring-[#F52B2B]"
                  />
                </div>

                {/* Quantity */}
                <div className="w-full">
                  <label className="block md:hidden text-[10px] font-semibold text-gray-400 mb-1">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={item.quantity === 0 ? '' : item.quantity}
                    placeholder="1"
                    onChange={(e) => {
                      const raw = e.target.value;
                      handleItemChange(index, 'quantity', raw === '' ? 0 : parseInt(raw, 10));
                    }}
                    className="w-full px-2 py-1.5 text-xs text-center bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-lg text-gray-900 dark:text-white"
                  />
                </div>

                {/* GST Rate */}
                <div className="w-full">
                  <label className="block md:hidden text-[10px] font-semibold text-gray-400 mb-1">
                    GST%
                  </label>
                  {isRowCustomGst ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        inputMode="decimal"
                        value={item.gstRate === 0 ? '' : item.gstRate}
                        placeholder="0"
                        onChange={(e) => {
                          const raw = e.target.value;
                          handleItemChange(index, 'gstRate', raw === '' ? 0 : parseFloat(raw));
                        }}
                        className="w-full px-1.5 py-1.5 text-xs bg-white dark:bg-[#161E2E] border border-[#F52B2B] rounded-lg text-gray-900 dark:text-white font-semibold text-center"
                      />
                      <button
                        type="button"
                        onClick={() => setCustomGstRows((prev) => ({ ...prev, [index]: false }))}
                        className="text-[10px] text-gray-400 hover:text-gray-600 px-0.5"
                        title="Back to presets"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <select
                      value={item.gstRate}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setCustomGstRows((prev) => ({ ...prev, [index]: true }));
                        } else {
                          handleItemChange(index, 'gstRate', Number(e.target.value));
                        }
                      }}
                      className="w-full px-1.5 py-1.5 text-xs bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-lg text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-[#F52B2B]"
                    >
                      <option value={18}>18%</option>
                      <option value={28}>28%</option>
                      <option value={12}>12%</option>
                      <option value={5}>5%</option>
                      <option value={0}>0% (Nil)</option>
                      <option value="__custom__">Custom%</option>
                    </select>
                  )}
                </div>

                {/* Line Amount */}
                <div className="w-full text-right">
                  <label className="block md:hidden text-[10px] font-semibold text-gray-400 mb-1">
                    Total (₹)
                  </label>
                  <div className="py-1.5 font-bold text-gray-900 dark:text-white text-xs truncate">
                    ₹{item.totalAmount?.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Remove */}
                <div className="text-center w-full md:w-auto">
                  <button
                    type="button"
                    disabled={lineItems.length === 1}
                    onClick={() => removeItem(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Financial Totals & Itemized Tax Breakdown */}
      <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 md:p-6 rounded-2xl shadow-sm space-y-3">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Subtotal (Taxable Value Before GST):</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            ₹ {totals.subtotalTaxable?.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Dynamic Multi-Slab Tax Breakdown */}
        {totals.taxBreakdown && totals.taxBreakdown.length > 0 ? (
          <div className="py-2 border-y border-gray-100 dark:border-gray-800 space-y-1.5">
            {totals.taxBreakdown.map((slab: any) => (
              <div key={slab.gstRate} className="flex justify-between text-xs">
                {slab.gstRate === 0 ? (
                  <>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      0% Non-GST / Tax-Free Items (₹{slab.taxableAmount?.toLocaleString('en-IN')}):
                    </span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      ₹ 0 (Tax-Free)
                    </span>
                  </>
                ) : totals.totalIgst > 0 ? (
                  <>
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                      IGST @ {slab.gstRate}% on ₹{slab.taxableAmount?.toLocaleString('en-IN')}:
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ₹ {slab.igstAmount?.toFixed(1)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                      GST @ {slab.gstRate}% on ₹{slab.taxableAmount?.toLocaleString('en-IN')} (CGST {slab.cgstRate}% + SGST {slab.sgstRate}%):
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ₹ {slab.totalGstAmount?.toFixed(1)}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          totals.totalGst > 0 && (
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Total GST:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ₹ {totals.totalGst?.toFixed(1)}
              </span>
            </div>
          )
        )}

        <div className="pt-2 flex justify-between items-center text-sm md:text-base font-bold text-gray-900 dark:text-white">
          <span>Total Amount Payable:</span>
          <span className="text-xl text-[#F52B2B]">
            ₹ {totals.totalAmount?.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="pt-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
          {totals.amountInWords}
        </div>
      </div>

      {/* 6. Action Buttons (Draft / Issue / Update) */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
        <button
          type="button"
          disabled={loading || !!dateError}
          onClick={() => handleSubmit('draft')}
          className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 text-xs md:text-sm font-semibold rounded-xl transition-all"
        >
          {editId ? 'Save Changes' : 'Save as Draft'}
        </button>

        <button
          type="button"
          disabled={loading || !!dateError}
          onClick={() => handleSubmit('issued')}
          className="w-full sm:w-auto px-6 py-2.5 bg-[#F52B2B] hover:bg-[#DC2626] text-white text-xs md:text-sm font-semibold rounded-xl shadow-md shadow-[#F52B2B]/20 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{editId ? 'Update & View Invoice' : 'Issue & Generate Invoice'}</span>
        </button>
      </div>
    </div>
  );
}
