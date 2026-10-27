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
  AlertCircle
} from 'lucide-react';
import { api } from '../../../lib/api';

export default function CreateQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId');

  const [quotationType, setQuotationType] = useState<'proposal_style' | 'invoice_style'>('proposal_style');
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Proposal-style fields
  const [vehicleProjectName, setVehicleProjectName] = useState('Lamborghini Urus Mirror Polishing');
  const [serviceTitle, setServiceTitle] = useState('Premium Mirror Polishing for Lamborghini Urus');
  const [narrativeDescription, setNarrativeDescription] = useState(
    'We are pleased to offer our professional mirror polishing service to restore the vechicle’s surface with a deep, glossy, mirror -like finish while maintaining the premium appearance of the Lamborghini Urus.'
  );
  const [serviceCharge, setServiceCharge] = useState<number>(25000); // BEFORE GST
  const [gstRate, setGstRate] = useState<number>(18);
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

  // Invoice-style line items
  const [lineItems, setLineItems] = useState<any[]>([
    {
      slNo: 1,
      description: 'Fleet Detailing and Paint Protection',
      hsnSac: '998714',
      quantity: 1,
      rate: 10000,
      gstRate: 18,
      taxableAmount: 10000,
      totalGstAmount: 1800,
      totalAmount: 11800
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          if (found) setSelectedCustomer(found);
        } else if (res.customers.length > 0) {
          setSelectedCustomer(res.customers[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const calculatedProposalGst = Math.round((Number(serviceCharge) * (Number(gstRate) / 100) + Number.EPSILON) * 100) / 100;
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
        payload.vehicleProjectName = vehicleProjectName;
        payload.serviceTitle = serviceTitle;
        payload.narrativeDescription = narrativeDescription;
        payload.serviceCharge = Number(serviceCharge);
        payload.gstRate = Number(gstRate);
        payload.warranty = warranty;
        payload.closingNote = closingNote;
      } else {
        payload.lineItems = lineItems;
      }

      const res = await api.createQuotation(payload);
      if (res.success && res.quotation) {
        router.push(`/quotations/${res.quotation._id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create quotation.');
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
          Create Quotation
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
              <div className={`text-[11px] font-normal ${quotationType === 'proposal_style' ? 'text-red-100' : 'text-gray-400'}`}>
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
              <div className={`text-[11px] font-normal ${quotationType === 'invoice_style' ? 'text-red-100' : 'text-gray-400'}`}>
                Standard tabular format with line items
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

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Select Client / Customer *
            </label>
            <select
              value={selectedCustomer?._id || ''}
              onChange={(e) => {
                const found = customers.find((c) => c._id === e.target.value);
                if (found) setSelectedCustomer(found);
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
                  value={serviceCharge}
                  onChange={(e) => setServiceCharge(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm font-bold bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  GST Rate
                </label>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm font-bold bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                  <option value={28}>28%</option>
                </select>
              </div>
            </div>

            {/* Calculated Charges Display */}
            <div className="p-4 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl space-y-1.5 text-xs font-medium">
              <div className="flex justify-between">
                <span>Service charges:</span>
                <span className="font-bold">Rs {serviceCharge?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>GST @{gstRate}%:</span>
                <span className="font-bold">Rs {calculatedProposalGst?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#F52B2B] pt-1.5 border-t border-gray-200 dark:border-gray-800">
                <span>Total Quotation:</span>
                <span>Rs {calculatedProposalTotal?.toLocaleString('en-IN')}</span>
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
          <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 rounded-2xl shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
              Line Items
            </h2>
            <p className="text-xs text-gray-400">
              Line item calculation uses the standard itemized rates before GST.
            </p>
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
            <span>{loading ? 'Creating...' : 'Create Quotation'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
