'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  Car,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Tag,
  Percent,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { api } from '../../../lib/api';
import {
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

export default function CreateQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId');
  const editId = searchParams.get('editId') || searchParams.get('id');

  const [existingQuotationNumber, setExistingQuotationNumber] = useState('');
  const [quotationType, setQuotationType] = useState<'proposal_style' | 'invoice_style'>('proposal_style');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Proposal-style fields
  const [vehicleProjectName, setVehicleProjectName] = useState('Lamborghini Urus Mirror Polishing');
  const [serviceTitle, setServiceTitle] = useState('Premium Mirror Polishing for Lamborghini Urus');
  const [narrativeDescription, setNarrativeDescription] = useState(
    'We are pleased to offer our professional mirror polishing service to restore the vehicle’s surface with a deep, glossy, mirror-like finish while maintaining the premium appearance of the Lamborghini Urus.'
  );
  const [serviceCharge, setServiceCharge] = useState<number>(25000); // BEFORE GST
  const [proposalHsn, setProposalHsn] = useState('998714');
  const [proposalCustomHsn, setProposalCustomHsn] = useState('');
  const [isProposalCustomHsn, setIsProposalCustomHsn] = useState(false);
  const [proposalGstRate, setProposalGstRate] = useState<number>(18);
  const [isProposalCustomGst, setIsProposalCustomGst] = useState(false);
  const [proposalCustomGstValue, setProposalCustomGstValue] = useState('18');
  const [warranty, setWarranty] = useState(
    'We provide a 2-year warranty on the mirror polishing finish, subject to proper maintenance and care.'
  );
  const [closingNote, setClosingNote] = useState(
    'Thank you for choosing us, we look forward to giving your Lamborghini Urus a flawless finish.'
  );

  // Shared metadata
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');

  // Primary Document HSN for Invoice Style
  const [primaryHsn, setPrimaryHsn] = useState('998714');
  const [isPrimaryCustomHsn, setIsPrimaryCustomHsn] = useState(false);
  const [primaryCustomHsn, setPrimaryCustomHsn] = useState('');

  // Invoice-style line items
  const [customHsnRows, setCustomHsnRows] = useState<{ [key: number]: boolean }>({});
  const [customGstRows, setCustomGstRows] = useState<{ [key: number]: boolean }>({});
  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    {
      slNo: 1,
      description: 'Fleet Detailing and Paint Protection',
      hsnSac: '998714',
      quantity: 1,
      unit: 'Nos',
      rate: 10000,
      discountType: 'fixed',
      discountValue: 0,
      gstRate: 18,
      taxableAmount: 10000,
      totalGstAmount: 1800,
      totalAmount: 11800
    }
  ]);

  const [totals, setTotals] = useState<any>({
    subtotalTaxable: 10000,
    totalCgst: 900,
    totalSgst: 900,
    totalIgst: 0,
    totalGst: 1800,
    totalAmount: 11800,
    amountInWords: '',
    taxBreakdown: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCustomers();
    if (editId) {
      loadExistingQuotation(editId);
    }
  }, [editId]);

  const loadExistingQuotation = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.getQuotation(id);
      if (res.success && res.quotation) {
        const q = res.quotation;
        setExistingQuotationNumber(q.quotationNumber);
        setQuotationType(q.quotationType || 'proposal_style');
        setSelectedCustomer(q.customer);
        if (q.vehicleProjectName) setVehicleProjectName(q.vehicleProjectName);
        if (q.serviceTitle) setServiceTitle(q.serviceTitle);
        if (q.narrativeDescription) setNarrativeDescription(q.narrativeDescription);
        if (q.serviceCharge !== undefined) setServiceCharge(q.serviceCharge);
        if (q.gstRate !== undefined) setProposalGstRate(q.gstRate);
        if (q.warranty) setWarranty(q.warranty);
        if (q.closingNote) setClosingNote(q.closingNote);
        if (q.quotationDate) setQuotationDate(q.quotationDate.split('T')[0]);
        if (q.validUntil) setValidUntil(q.validUntil.split('T')[0]);
        if (q.vehicleNumber) setVehicleNumber(q.vehicleNumber);
        if (q.lineItems && q.lineItems.length > 0) {
          setLineItems(q.lineItems);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load quotation for editing.');
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
          if (found) setSelectedCustomer(found);
        } else if (!editId && res.customers.length > 0) {
          setSelectedCustomer(res.customers[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Recalculate invoice-style totals when line items or customer changes
  useEffect(() => {
    if (quotationType === 'invoice_style') {
      recalculateInvoiceStyle();
    }
  }, [lineItems, selectedCustomer, quotationType]);

  const recalculateInvoiceStyle = () => {
    const isInterState = Boolean(selectedCustomer?.stateCode && selectedCustomer.stateCode !== '32');
    const calculated = lineItems.map((item, idx) =>
      calculateLineItem({
        slNo: idx + 1,
        description: item.description,
        hsnSac: item.hsnSac || primaryHsn || '998714',
        quantity: Number(item.quantity) || 1,
        unit: item.unit || 'Nos',
        rate: Number(item.rate) || 0,
        discountType: item.discountType || 'fixed',
        discountValue: Number(item.discountValue) || 0,
        gstRate: item.gstRate !== undefined && item.gstRate !== null && !isNaN(Number(item.gstRate)) ? Number(item.gstRate) : 18,
        isInterState
      })
    );
    const docTotals = calculateDocumentTotals(calculated, false, isInterState);
    setTotals(docTotals);
  };

  // Line item helpers
  const handleItemChange = (idx: number, field: keyof LineItemForm, value: any) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };

      // Realtime item math
      const qty = field === 'quantity' ? Number(value) : next[idx].quantity;
      const rate = field === 'rate' ? Number(value) : next[idx].rate;
      const gst = field === 'gstRate' ? Number(value) : next[idx].gstRate;
      const taxable = Math.round((qty * rate + Number.EPSILON) * 100) / 100;
      const gstAmt = Math.round((taxable * (gst / 100) + Number.EPSILON) * 100) / 100;

      next[idx].taxableAmount = taxable;
      next[idx].totalGstAmount = gstAmt;
      next[idx].totalAmount = Math.round((taxable + gstAmt + Number.EPSILON) * 100) / 100;

      return next;
    });
  };

  const handleAddItem = () => {
    const activeHsn = isPrimaryCustomHsn ? primaryCustomHsn || '998714' : primaryHsn;
    setLineItems((prev) => [
      ...prev,
      {
        slNo: prev.length + 1,
        description: '',
        hsnSac: activeHsn,
        quantity: 1,
        unit: 'Nos',
        rate: 0,
        discountType: 'fixed',
        discountValue: 0,
        gstRate: 18,
        taxableAmount: 0,
        totalGstAmount: 0,
        totalAmount: 0
      }
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== idx).map((it, i) => ({ ...it, slNo: i + 1 })));
  };

  const applyPrimaryHsnToAll = () => {
    const activeHsn = isPrimaryCustomHsn ? primaryCustomHsn : primaryHsn;
    if (!activeHsn) return;
    setLineItems((prev) =>
      prev.map((it) => ({
        ...it,
        hsnSac: activeHsn
      }))
    );
    setCustomHsnRows({});
  };

  const applyPresetGstToAll = (rate: number) => {
    setLineItems((prev) =>
      prev.map((item) => {
        const taxable = item.quantity * item.rate;
        const gstAmt = Math.round((taxable * (rate / 100) + Number.EPSILON) * 100) / 100;
        return {
          ...item,
          gstRate: rate,
          taxableAmount: taxable,
          totalGstAmount: gstAmt,
          totalAmount: Math.round((taxable + gstAmt + Number.EPSILON) * 100) / 100
        };
      })
    );
    setCustomGstRows({});
  };

  // Proposal calculations
  const effectiveProposalGst = isProposalCustomGst
    ? Number(proposalCustomGstValue) || 0
    : Number(proposalGstRate);
  const calculatedProposalGst =
    Math.round((Number(serviceCharge) * (effectiveProposalGst / 100) + Number.EPSILON) * 100) / 100;
  const calculatedProposalTotal = Number(serviceCharge) + calculatedProposalGst;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomer) {
      setError('Please select or add a customer.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        quotationType,
        quotationDate,
        validUntil: validUntil || undefined,
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
        vehicleNumber: vehicleNumber || undefined
      };

      if (quotationType === 'proposal_style') {
        const chosenHsn = isProposalCustomHsn ? proposalCustomHsn : proposalHsn;
        payload.vehicleProjectName = vehicleProjectName;
        payload.serviceTitle = serviceTitle;
        payload.narrativeDescription = narrativeDescription;
        payload.serviceCharge = Number(serviceCharge);
        payload.gstRate = effectiveProposalGst;
        payload.hsnSac = chosenHsn || '998714';
        payload.warranty = warranty;
        payload.closingNote = closingNote;
      } else {
        payload.lineItems = lineItems;
      }

      if (editId) {
        const res = await api.updateQuotation(editId, payload);
        if (res.success) {
          router.push(`/quotations/${editId}`);
          return;
        }
      } else {
        const res = await api.createQuotation(payload);
        if (res.success && res.quotation) {
          router.push(`/quotations/${res.quotation._id}`);
          return;
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save quotation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Quotations
        </button>

        <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
          {editId ? `Edit Quotation: ${existingQuotationNumber}` : 'Create Quotation'}
        </h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Quotation Style Toggle */}
      <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 rounded-2xl shadow-sm">
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Select Quotation Layout
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setQuotationType('proposal_style')}
            className={`p-3.5 text-xs font-bold rounded-xl border flex items-center gap-3 transition-all text-left ${
              quotationType === 'proposal_style'
                ? 'bg-[#F52B2B] text-white border-[#F52B2B] shadow-sm'
                : 'bg-gray-50 dark:bg-[#0E1522] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#233048]'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5 flex-shrink-0" />
            <div>
              <div className="font-bold">Proposal / Contract Style (Artech qo1.pdf)</div>
              <div
                className={`text-[11px] font-normal ${
                  quotationType === 'proposal_style' ? 'text-red-100' : 'text-gray-400'
                }`}
              >
                Narrative detailing scope, charges before GST, and warranty
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setQuotationType('invoice_style')}
            className={`p-3.5 text-xs font-bold rounded-xl border flex items-center gap-3 transition-all text-left ${
              quotationType === 'invoice_style'
                ? 'bg-[#F52B2B] text-white border-[#F52B2B] shadow-sm'
                : 'bg-gray-50 dark:bg-[#0E1522] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#233048]'
            }`}
          >
            <FileText className="w-5 h-5 flex-shrink-0" />
            <div>
              <div className="font-bold">Invoice-Style Quotation</div>
              <div
                className={`text-[11px] font-normal ${
                  quotationType === 'invoice_style' ? 'text-red-100' : 'text-gray-400'
                }`}
              >
                Standard tabular format with individual item rates & HSN
              </div>
            </div>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 2. Customer & Basic Dates */}
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 md:p-6 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
            Client & Dates
          </h2>

          {/* Smart Customer Selector (Search by name / phone, auto-fill & quick add) */}
          <SmartCustomerSelector
            customers={customers}
            selectedCustomer={selectedCustomer}
            onSelectCustomer={(cust) => {
              setSelectedCustomer(cust);
              if (cust.vehicleNumbers?.length > 0) {
                setVehicleNumber(cust.vehicleNumbers[0]);
              }
            }}
            onClearCustomer={() => {
              setSelectedCustomer(null);
              setVehicleNumber('');
            }}
            onCustomerCreated={(newCust) => {
              setCustomers((prev) => [newCust, ...prev]);
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Quotation Date *
              </label>
              <input
                type="date"
                required
                value={quotationDate}
                onChange={(e) => setQuotationDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Validity Period / Expiry Date
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Vehicle Registration No (Optional)
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                placeholder="e.g. KL 01CA 0001"
                className="w-full px-3.5 py-2 text-sm uppercase bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* 3. Proposal Details (Matching Artech qo1.pdf) */}
        {quotationType === 'proposal_style' ? (
          <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 md:p-6 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
              Service Scope & Narrative Content
            </h2>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Vehicle / Project Name *
              </label>
              <input
                type="text"
                required
                value={vehicleProjectName}
                onChange={(e) => setVehicleProjectName(e.target.value)}
                placeholder="e.g. Lamborghini Urus Mirror Polishing"
                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Service Title *
              </label>
              <input
                type="text"
                required
                value={serviceTitle}
                onChange={(e) => setServiceTitle(e.target.value)}
                placeholder="e.g. Premium Mirror Polishing for Lamborghini Urus"
                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
              />
            </div>

            {/* HSN / SAC Code Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#F52B2B]" />
                  Service HSN/SAC Code
                </label>
                <span className="text-[11px] text-gray-400">
                  Devi Motors Core: <strong>SAC 998714</strong> (Painting/Polishing) &amp; <strong>HSN 8708</strong> (Parts)
                </span>
              </div>

              {/* Quick Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsProposalCustomHsn(false);
                    setProposalHsn('998714');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                    proposalHsn === '998714' && !isProposalCustomHsn
                      ? 'bg-[#F52B2B] text-white border-[#F52B2B] shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#F52B2B]'
                  }`}
                >
                  🎨 SAC 998714 — Painting & Service
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsProposalCustomHsn(false);
                    setProposalHsn('8708');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                    proposalHsn === '8708' && !isProposalCustomHsn
                      ? 'bg-[#F52B2B] text-white border-[#F52B2B] shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#F52B2B]'
                  }`}
                >
                  🔧 HSN 8708 — Spare Parts & Accessories
                </button>
                <button
                  type="button"
                  onClick={() => setIsProposalCustomHsn(true)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                    isProposalCustomHsn
                      ? 'bg-[#F52B2B] text-white border-[#F52B2B] shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#F52B2B]'
                  }`}
                >
                  ✏️ Custom Code
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={isProposalCustomHsn ? 'custom' : proposalHsn}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsProposalCustomHsn(true);
                    } else {
                      setIsProposalCustomHsn(false);
                      setProposalHsn(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
                >
                  <optgroup label="Devi Motors Primary Codes">
                    {AUTOMOTIVE_HSN_CODES.filter((c) => c.isPrimary).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.label} ({c.type})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Related Automotive Codes">
                    {AUTOMOTIVE_HSN_CODES.filter((c) => !c.isPrimary).map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.label} ({c.type})
                      </option>
                    ))}
                  </optgroup>
                  <option value="custom">+ Custom HSN/SAC Code</option>
                </select>

                {isProposalCustomHsn && (
                  <input
                    type="text"
                    value={proposalCustomHsn}
                    onChange={(e) => setProposalCustomHsn(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter custom 4-8 digit code"
                    className="w-full px-3.5 py-2 text-xs font-mono bg-white dark:bg-[#0E1522] border border-red-300 dark:border-red-900/50 rounded-xl text-gray-900 dark:text-white"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Narrative Scope Description *
              </label>
              <textarea
                required
                rows={3}
                value={narrativeDescription}
                onChange={(e) => setNarrativeDescription(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
              />
            </div>

            {/* Financials (Rate Before GST) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Service Charges (Rate Before GST) (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={serviceCharge === 0 ? '' : serviceCharge}
                  placeholder="0"
                  onChange={(e) => {
                    const raw = e.target.value;
                    setServiceCharge(raw === '' ? 0 : parseFloat(raw));
                  }}
                  className="w-full px-3.5 py-2.5 text-sm font-bold bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#F52B2B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
                  <span>GST Rate (Optional / Configurable)</span>
                  <span className="text-[11px] text-gray-400">0% = Tax-Free</span>
                </label>
                <div className="flex gap-2">
                  <select
                    value={isProposalCustomGst ? 'custom' : proposalGstRate}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsProposalCustomGst(true);
                      } else {
                        setIsProposalCustomGst(false);
                        setProposalGstRate(Number(e.target.value));
                      }
                    }}
                    className="flex-1 px-3.5 py-2.5 text-sm font-bold bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
                  >
                    {STANDARD_GST_RATES.map((slab) => (
                      <option key={slab.rate} value={slab.rate}>
                        {slab.label}
                      </option>
                    ))}
                    <option value="custom">Custom %</option>
                  </select>

                  {isProposalCustomGst && (
                    <div className="relative w-24">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        value={proposalCustomGstValue}
                        onChange={(e) => setProposalCustomGstValue(e.target.value)}
                        placeholder="%"
                        className="w-full px-2.5 py-2.5 text-sm font-bold bg-white dark:bg-[#0E1522] border border-red-300 dark:border-red-900/50 rounded-xl text-gray-900 dark:text-white pr-6"
                      />
                      <span className="absolute right-2 top-2.5 text-xs text-gray-400 font-bold">%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Calculated Charges Display */}
            <div className="p-4 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl space-y-1.5 text-xs font-medium">
              <div className="flex justify-between">
                <span>Service charges (Taxable Before GST):</span>
                <span className="font-bold">₹ {serviceCharge?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>GST @{effectiveProposalGst}% {effectiveProposalGst === 0 ? '(Tax-Free / Exempt)' : ''}:</span>
                <span className="font-bold">₹ {calculatedProposalGst?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#F52B2B] pt-1.5 border-t border-gray-200 dark:border-gray-800">
                <span>Total Quotation Amount:</span>
                <span>₹ {calculatedProposalTotal?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Warranty Terms
              </label>
              <input
                type="text"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Closing Note
              </label>
              <input
                type="text"
                value={closingNote}
                onChange={(e) => setClosingNote(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
              />
            </div>
          </div>
        ) : (
          /* 4. Invoice Style Line Items Quotation */
          <div className="space-y-4">
            {/* Primary HSN Code Card */}
            <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[#F52B2B]" />
                  <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    Primary HSN/SAC Code
                  </span>
                </div>
                <button
                  type="button"
                  onClick={applyPrimaryHsnToAll}
                  className="text-xs font-semibold text-[#F52B2B] hover:underline"
                >
                  Apply to All Line Items
                </button>
              </div>

              {/* Quick Core Code Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPrimaryCustomHsn(false);
                    setPrimaryHsn('998714');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                    primaryHsn === '998714' && !isPrimaryCustomHsn
                      ? 'bg-[#F52B2B] text-white border-[#F52B2B] shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#F52B2B]'
                  }`}
                >
                  🎨 SAC 998714 — Painting & Service
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPrimaryCustomHsn(false);
                    setPrimaryHsn('8708');
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                    primaryHsn === '8708' && !isPrimaryCustomHsn
                      ? 'bg-[#F52B2B] text-white border-[#F52B2B] shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#F52B2B]'
                  }`}
                >
                  🔧 HSN 8708 — Spare Parts & Goods
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrimaryCustomHsn(true)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                    isPrimaryCustomHsn
                      ? 'bg-[#F52B2B] text-white border-[#F52B2B] shadow-sm'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#F52B2B]'
                  }`}
                >
                  ✏️ Custom Code
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <select
                    value={isPrimaryCustomHsn ? 'custom' : primaryHsn}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setIsPrimaryCustomHsn(true);
                      } else {
                        setIsPrimaryCustomHsn(false);
                        setPrimaryHsn(e.target.value);
                      }
                    }}
                    className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
                  >
                    <optgroup label="Devi Motors Primary Codes">
                      {AUTOMOTIVE_HSN_CODES.filter((c) => c.isPrimary).map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} — {c.label} ({c.type})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Related Automotive Codes">
                      {AUTOMOTIVE_HSN_CODES.filter((c) => !c.isPrimary).map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} — {c.label} ({c.type})
                        </option>
                      ))}
                    </optgroup>
                    <option value="custom">+ Custom HSN/SAC Code</option>
                  </select>
                </div>

                {isPrimaryCustomHsn && (
                  <div>
                    <input
                      type="text"
                      value={primaryCustomHsn}
                      onChange={(e) => setPrimaryCustomHsn(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter custom 4-8 digit HSN/SAC code"
                      className="w-full px-3.5 py-2 text-xs font-mono bg-white dark:bg-[#0E1522] border border-red-300 dark:border-red-900/50 rounded-xl text-gray-900 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* Quick GST Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-[#233048]/60">
                <span className="text-[11px] font-semibold text-gray-500">Quick Apply GST%:</span>
                <button
                  type="button"
                  onClick={() => applyPresetGstToAll(18)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
                >
                  18% (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetGstToAll(28)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
                >
                  28% (Goods/Parts)
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetGstToAll(12)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
                >
                  12%
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetGstToAll(5)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
                >
                  5%
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetGstToAll(0)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
                >
                  0% (Non-GST / Nil)
                </button>
              </div>
            </div>

            {/* Line Items List */}
            <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
                  Line Items (Rate Before GST)
                </h2>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F52B2B]/10 hover:bg-[#F52B2B]/20 text-[#F52B2B] text-xs font-semibold rounded-lg transition-colors"
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

              <div className="space-y-2">
                {lineItems.map((item, idx) => {
                  const isItemCustomHsn =
                    customHsnRows[idx] ||
                    (!AUTOMOTIVE_HSN_CODES.some((c) => c.code === item.hsnSac) && Boolean(item.hsnSac));
                  const isItemCustomGst =
                    customGstRows[idx] ||
                    (!STANDARD_GST_RATES.some((s) => s.rate === item.gstRate) &&
                      item.gstRate !== undefined);

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl flex flex-col md:grid md:grid-cols-[28px_1fr_130px_110px_65px_105px_95px_32px] gap-2.5 items-center text-xs transition-all"
                    >
                      {/* Sl No */}
                      <div className="hidden md:block text-center font-bold text-gray-400">
                        {idx + 1}
                      </div>

                      {/* Description */}
                      <div className="w-full">
                        <label className="block md:hidden text-[10px] font-semibold text-gray-500 mb-1">
                          Description of Goods / Service *
                        </label>
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          placeholder="e.g. Mirror Polishing / Bumper Paint"
                          className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#F52B2B]"
                        />
                      </div>

                      {/* HSN/SAC */}
                      <div className="w-full">
                        <label className="block md:hidden text-[10px] font-semibold text-gray-500 mb-1">
                          HSN/SAC
                        </label>
                        {isItemCustomHsn ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={item.hsnSac}
                              onChange={(e) =>
                                handleItemChange(idx, 'hsnSac', e.target.value.replace(/\D/g, ''))
                              }
                              placeholder="HSN"
                              className="w-full px-2 py-1.5 text-xs font-mono bg-white dark:bg-[#161E2E] border border-[#F52B2B] rounded-lg text-gray-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setCustomHsnRows((prev) => ({ ...prev, [idx]: false }));
                                handleItemChange(idx, 'hsnSac', primaryHsn);
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
                              if (e.target.value === 'custom') {
                                setCustomHsnRows((prev) => ({ ...prev, [idx]: true }));
                              } else {
                                handleItemChange(idx, 'hsnSac', e.target.value);
                              }
                            }}
                            className="w-full px-2 py-1.5 text-xs bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-lg text-gray-900 dark:text-white font-medium"
                          >
                            <optgroup label="Devi Motors Primary">
                              {AUTOMOTIVE_HSN_CODES.filter((c) => c.isPrimary).map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.code} ({c.type})
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Other Automotive">
                              {AUTOMOTIVE_HSN_CODES.filter((c) => !c.isPrimary).map((c) => (
                                <option key={c.code} value={c.code}>
                                  {c.code}
                                </option>
                              ))}
                            </optgroup>
                            <option value="custom">+ Custom</option>
                          </select>
                        )}
                      </div>

                      {/* Rate (Before GST) */}
                      <div className="w-full">
                        <label className="block md:hidden text-[10px] font-semibold text-gray-500 mb-1">
                          Rate (Before GST) *
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
                            handleItemChange(idx, 'rate', raw === '' ? 0 : parseFloat(raw));
                          }}
                          className="w-full px-2 py-1.5 text-xs bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-lg text-gray-900 dark:text-white font-semibold focus:outline-none focus:ring-1 focus:ring-[#F52B2B]"
                        />
                      </div>

                      {/* Qty */}
                      <div className="w-full">
                        <label className="block md:hidden text-[10px] font-semibold text-gray-500 mb-1">
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
                            handleItemChange(idx, 'quantity', raw === '' ? 0 : parseInt(raw, 10));
                          }}
                          className="w-full px-2 py-1.5 text-xs text-center bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-lg text-gray-900 dark:text-white"
                        />
                      </div>

                      {/* GST% */}
                      <div className="w-full">
                        <label className="block md:hidden text-[10px] font-semibold text-gray-500 mb-1">
                          GST%
                        </label>
                        {isItemCustomGst ? (
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
                                handleItemChange(idx, 'gstRate', raw === '' ? 0 : parseFloat(raw));
                              }}
                              className="w-full px-1.5 py-1.5 text-xs text-center font-semibold bg-white dark:bg-[#161E2E] border border-[#F52B2B] rounded-lg text-gray-900 dark:text-white"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setCustomGstRows((prev) => ({ ...prev, [idx]: false }));
                                handleItemChange(idx, 'gstRate', 18);
                              }}
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
                              if (e.target.value === 'custom') {
                                setCustomGstRows((prev) => ({ ...prev, [idx]: true }));
                              } else {
                                handleItemChange(idx, 'gstRate', Number(e.target.value));
                              }
                            }}
                            className="w-full px-1.5 py-1.5 text-xs font-medium bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#F52B2B]"
                          >
                            <option value={18}>18%</option>
                            <option value={28}>28%</option>
                            <option value={12}>12%</option>
                            <option value={5}>5%</option>
                            <option value={0}>0% (Nil)</option>
                            <option value="custom">Custom%</option>
                          </select>
                        )}
                      </div>

                      {/* Total */}
                      <div className="w-full text-right">
                        <label className="block md:hidden text-[10px] font-semibold text-gray-500 mb-1">
                          Total (₹)
                        </label>
                        <div className="py-1.5 font-bold text-gray-900 dark:text-white text-xs truncate">
                          ₹{item.totalAmount?.toLocaleString('en-IN')}
                        </div>
                      </div>

                      {/* Delete */}
                      <div className="text-center w-full md:w-auto">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={lineItems.length <= 1}
                          className="p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-20 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Totals Summary */}
            <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 rounded-2xl shadow-sm space-y-2.5">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>Subtotal (Taxable Value Before GST):</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ₹ {totals.subtotalTaxable?.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Dynamic Tax Breakdown */}
              {totals.taxBreakdown && totals.taxBreakdown.length > 0 ? (
                <div className="py-2 border-y border-gray-100 dark:border-[#233048] space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    GST Slabs Breakdown:
                  </div>
                  {totals.taxBreakdown.map((slab: any) => (
                    <div
                      key={slab.rate}
                      className="flex justify-between text-xs text-gray-600 dark:text-gray-400 pl-2"
                    >
                      <span>
                        GST @{slab.rate}% {slab.rate === 0 ? '(Tax-Free)' : `(Taxable ₹${slab.taxableAmount.toLocaleString('en-IN')})`}:
                      </span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {slab.isInterState ? (
                          `IGST ₹${slab.igstAmount.toLocaleString('en-IN')}`
                        ) : (
                          `CGST ₹${slab.cgstAmount.toLocaleString('en-IN')} + SGST ₹${slab.sgstAmount.toLocaleString('en-IN')}`
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>Central Tax (CGST):</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ₹ {totals.totalCgst?.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                    <span>State Tax (SGST):</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ₹ {totals.totalSgst?.toLocaleString('en-IN')}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-[#233048]">
                <span>Total Amount:</span>
                <span className="text-[#F52B2B]">
                  ₹ {totals.totalAmount?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-[#F52B2B] hover:bg-[#DC2626] text-white text-xs md:text-sm font-semibold rounded-xl shadow-md shadow-[#F52B2B]/20 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'Saving...' : editId ? 'Update Quotation' : 'Create Quotation'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
