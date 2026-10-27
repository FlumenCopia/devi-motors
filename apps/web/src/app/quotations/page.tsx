'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileSpreadsheet,
  Search,
  Plus,
  Download,
  ArrowRight,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../../lib/api';

export default function QuotationsPage() {
  const router = useRouter();

  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [convertingId, setConvertingId] = useState<string | null>(null);

  useEffect(() => {
    loadQuotations();
  }, [search, selectedStatus, selectedType]);

  const loadQuotations = async () => {
    setLoading(true);
    try {
      const params: any = { search };
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedType !== 'all') params.type = selectedType;

      const res = await api.listQuotations(params);
      if (res.success) {
        setQuotations(res.quotations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async (q: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (q.status === 'converted') {
      router.push(`/invoices/${q.convertedInvoiceId}`);
      return;
    }

    if (
      !confirm(
        `Convert Quotation ${q.quotationNumber} into a new official invoice for ${q.customer?.name}?`
      )
    ) {
      return;
    }

    setConvertingId(q._id);
    try {
      const res = await api.convertQuotationToInvoice(q._id);
      if (res.success && res.invoice) {
        router.push(`/invoices/${res.invoice._id}`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to convert quotation.');
    } finally {
      setConvertingId(null);
    }
  };

  const handleStatusChange = async (id: string, status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.updateQuotationStatus(id, status);
      loadQuotations();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Pending
          </span>
        );
      case 'converted':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Converted to Invoice
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Quotations
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Create, track, and convert automotive repair proposals
          </p>
        </div>

        <Link
          href="/quotations/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F52B2B] hover:bg-[#DC2626] text-white font-semibold text-xs md:text-sm rounded-xl shadow-md shadow-[#F52B2B]/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Quotation</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by quotation no, customer, project..."
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20 focus:border-[#F52B2B]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-800 dark:text-gray-200 font-semibold cursor-pointer"
          >
            <option value="all">All Layouts</option>
            <option value="proposal_style">Proposal Style</option>
            <option value="invoice_style">Invoice Style</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-800 dark:text-gray-200 font-semibold cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="converted">Converted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Quotations List */}
      {loading ? (
        <div className="p-12 text-center text-sm text-gray-400">Loading quotations...</div>
      ) : quotations.length === 0 ? (
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-12 text-center rounded-2xl">
          <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No quotations found</h3>
          <p className="text-xs text-gray-400 mt-1">Create your first quotation to get started.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold text-[11px] uppercase tracking-wider bg-gray-50/50 dark:bg-[#0E1522]/50">
                  <th className="py-3.5 pl-4">No.</th>
                  <th className="py-3.5">Customer</th>
                  <th className="py-3.5">Service / Project</th>
                  <th className="py-3.5">Date</th>
                  <th className="py-3.5">Total Amount</th>
                  <th className="py-3.5 text-center">Status</th>
                  <th className="py-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-medium">
                {quotations.map((q) => (
                  <tr
                    key={q._id}
                    onClick={() => router.push(`/quotations/${q._id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-[#0E1522] cursor-pointer transition-colors"
                  >
                    <td className="py-4 pl-4 font-bold text-gray-900 dark:text-white">
                      {q.quotationNumber}
                    </td>
                    <td className="py-4 text-gray-700 dark:text-gray-300 max-w-[180px] truncate">
                      {q.customer?.name}
                    </td>
                    <td className="py-4 text-xs font-semibold text-gray-500 max-w-[220px] truncate">
                      {q.serviceTitle || q.vehicleProjectName || 'Automotive Service'}
                    </td>
                    <td className="py-4 text-gray-500 text-xs">
                      {new Date(q.quotationDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 font-bold text-gray-900 dark:text-white">
                      ₹ {q.totalAmount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 text-center">{getStatusBadge(q.status)}</td>
                    <td className="py-4 pr-4 text-right space-x-1" onClick={(e) => e.stopPropagation()}>
                      {q.status === 'pending' && (
                        <button
                          onClick={(e) => handleStatusChange(q._id, 'approved', e)}
                          title="Mark Approved"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {(q.status === 'approved' || q.status === 'pending') && (
                        <button
                          onClick={(e) => handleConvert(q, e)}
                          disabled={convertingId === q._id}
                          title="Convert to Invoice"
                          className="px-2.5 py-1 rounded-lg bg-[#F52B2B] text-white hover:bg-[#DC2626] text-xs font-semibold inline-flex items-center gap-1 shadow-sm"
                        >
                          <span>Convert</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {q.status === 'converted' && q.convertedInvoiceId && (
                        <Link
                          href={`/invoices/${q.convertedInvoiceId}`}
                          className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold hover:underline"
                        >
                          View Invoice
                        </Link>
                      )}
                      <a
                        href={api.downloadQuotationUrl(q._id)}
                        target="_blank"
                        rel="noreferrer"
                        title="Download PDF"
                        className="inline-block p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
