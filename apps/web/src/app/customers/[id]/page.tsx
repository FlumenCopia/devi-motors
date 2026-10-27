'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Car,
  FileText,
  FileSpreadsheet,
  Plus,
  AlertCircle
} from 'lucide-react';
import { api } from '../../../lib/api';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadCustomerDetails();
    }
  }, [id]);

  const loadCustomerDetails = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomer(id);
      if (res.success) {
        setCustomer(res.customer);
        setInvoices(res.invoices || []);
        setQuotations(res.quotations || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load customer details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-gray-400">Loading customer profile...</div>;
  }

  if (error || !customer) {
    return (
      <div className="p-8 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-red-600 dark:text-red-400">{error || 'Customer not found.'}</p>
        <Link
          href="/customers"
          className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-center gap-2">
          <Link
            href={`/invoices/create?customerId=${customer._id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#F52B2B] hover:bg-[#DC2626] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Invoice</span>
          </Link>
          <Link
            href={`/quotations/create?customerId=${customer._id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Quotation</span>
          </Link>
        </div>
      </div>

      {/* Customer Profile Header Card */}
      <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                {customer.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {customer.customerType}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.gstin && (
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-bold">GSTIN:</span>
                  <span>{customer.gstin}</span>
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="whitespace-pre-line">{customer.billingAddress}</span>
            </div>
          </div>

          {/* 3 Metric Mini Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-center">
              <span className="block text-[10px] uppercase font-bold text-gray-400">Invoiced</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white mt-0.5 block">
                ₹ {customer.totalInvoiced?.toLocaleString('en-IN') || 0}
              </span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-center">
              <span className="block text-[10px] uppercase font-bold text-gray-400">Paid</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                ₹ {customer.totalPaid?.toLocaleString('en-IN') || 0}
              </span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-center">
              <span className="block text-[10px] uppercase font-bold text-gray-400">Outstanding</span>
              <span
                className={`text-sm font-bold mt-0.5 block ${
                  customer.outstandingBalance > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'
                }`}
              >
                ₹ {customer.outstandingBalance?.toLocaleString('en-IN') || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Associated Vehicles & POs */}
        {(customer.vehicleNumbers?.length > 0 || customer.purchaseOrders?.length > 0) && (
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-4 text-xs">
            {customer.vehicleNumbers?.length > 0 && (
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-red-500" />
                <span className="text-gray-400">Vehicles:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {customer.vehicleNumbers.join(', ')}
                </span>
              </div>
            )}
            {customer.purchaseOrders?.length > 0 && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="text-gray-400">Purchase Orders:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {customer.purchaseOrders.join(', ')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document History Tabs / Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Previous Invoices */}
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#F52B2B]" /> Invoices ({invoices.length})
            </h2>
          </div>

          {invoices.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No invoices issued yet.</p>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <Link
                  key={inv._id}
                  href={`/invoices/${inv._id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#0E1522] hover:bg-red-50 dark:hover:bg-red-950/20 transition-all border border-gray-100 dark:border-gray-800 group"
                >
                  <div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-[#F52B2B] transition-colors">
                      {inv.invoiceNumber}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {inv.invoiceDate} {inv.vehicleNumber ? `• ${inv.vehicleNumber}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-gray-900 dark:text-white">
                      ₹ {inv.totalAmount?.toLocaleString('en-IN')}
                    </div>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inv.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : inv.paymentStatus === 'partially_paid'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                      }`}
                    >
                      {inv.paymentStatus}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Previous Quotations */}
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-500" /> Quotations ({quotations.length})
            </h2>
          </div>

          {quotations.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No quotations created yet.</p>
          ) : (
            <div className="space-y-3">
              {quotations.map((q) => (
                <Link
                  key={q._id}
                  href={`/quotations/${q._id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#0E1522] hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all border border-gray-100 dark:border-gray-800 group"
                >
                  <div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                      {q.quotationNumber}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {q.quotationDate} • {q.serviceTitle || q.vehicleProjectName || 'Quotation'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-gray-900 dark:text-white">
                      ₹ {q.totalAmount?.toLocaleString('en-IN')}
                    </div>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                      {q.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
