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
  AlertCircle,
  PenTool,
  Pencil,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { api } from '../../lib/api';
import { WhatsAppIcon, getQuotationWhatsAppUrl } from '../../lib/whatsapp';

export default function QuotationsPage() {
  const router = useRouter();

  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [activeTab, setActiveTab] = useState<'active' | 'trash'>('active');
  const [convertingId, setConvertingId] = useState<string | null>(null);

  // Soft delete modal state
  const [quotationToDelete, setQuotationToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    loadQuotations();
  }, [search, selectedStatus, selectedType, activeTab]);

  const loadQuotations = async () => {
    setLoading(true);
    try {
      const params: any = { search };
      if (activeTab === 'trash') {
        params.trash = 'true';
      }
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

  const handleSoftDelete = async () => {
    if (!quotationToDelete) return;
    setDeleting(true);
    try {
      const res = await api.deleteQuotation(quotationToDelete._id);
      if (res.success) {
        setQuotationToDelete(null);
        loadQuotations();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to soft delete quotation.');
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRestoringId(id);
    try {
      const res = await api.restoreQuotation(id);
      if (res.success) {
        loadQuotations();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to restore quotation.');
    } finally {
      setRestoringId(null);
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

      {/* Active vs Trash View Switcher */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all ${
            activeTab === 'active'
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          Active Quotations
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('trash')}
          className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'trash'
              ? 'bg-red-600 text-white shadow-sm'
              : 'text-gray-500 hover:text-red-600 dark:hover:text-red-400'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Trash / Deleted</span>
        </button>
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

          {activeTab === 'active' && (
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
          )}
        </div>
      </div>

      {/* Quotations List */}
      {loading ? (
        <div className="p-12 text-center text-sm text-gray-400">Loading quotations...</div>
      ) : quotations.length === 0 ? (
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-12 text-center rounded-2xl">
          <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {activeTab === 'trash' ? 'Trash is empty' : 'No quotations found'}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {activeTab === 'trash'
              ? 'No soft-deleted quotations found.'
              : 'Create your first quotation to get started.'}
          </p>
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
                  {activeTab === 'active' ? (
                    <th className="py-3.5 text-center">Status</th>
                  ) : (
                    <th className="py-3.5">Deleted At</th>
                  )}
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
                    <td className="py-4 text-gray-700 dark:text-gray-300 max-w-[180px]">
                      <div className="font-semibold text-gray-900 dark:text-white truncate">
                        {q.customer?.name}
                      </div>
                      {q.customer?.phone && (
                        <a
                          href={getQuotationWhatsAppUrl(q)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#25D366] transition-colors mt-0.5"
                          title={`Send quotation via WhatsApp to ${q.customer.phone}`}
                        >
                          <WhatsAppIcon className="w-3 h-3 text-[#25D366]" />
                          <span>{q.customer.phone}</span>
                        </a>
                      )}
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
                    {activeTab === 'active' ? (
                      <>
                        <td className="py-4 text-center">{getStatusBadge(q.status)}</td>
                        <td
                          className="py-4 pr-4 text-right space-x-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Send via WhatsApp */}
                          <a
                            href={getQuotationWhatsAppUrl(q)}
                            target="_blank"
                            rel="noreferrer"
                            title={`Send quotation via WhatsApp to ${q.customer?.phone || 'customer'}`}
                            className="inline-block p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            <WhatsAppIcon className="w-4 h-4" />
                          </a>

                          <Link
                            href={`/quotations/create?editId=${q._id}`}
                            title="Edit Quotation"
                            className="inline-block p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          {q.status === 'pending' && (
                            <button
                              onClick={(e) => handleStatusChange(q._id, 'approved', e)}
                              title="Mark Approved"
                              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
                              className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-semibold hover:underline"
                            >
                              View Invoice
                            </Link>
                          )}
                          <a
                            href={api.downloadQuotationUrl(q._id, false)}
                            target="_blank"
                            rel="noreferrer"
                            title="Download PDF (Badge Only - Default)"
                            className="inline-block p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <a
                            href={api.downloadQuotationUrl(q._id, true)}
                            target="_blank"
                            rel="noreferrer"
                            title="Download PDF with Signature"
                            className="inline-block p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            <PenTool className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => setQuotationToDelete(q)}
                            title="Soft Delete (Move to Trash)"
                            className="inline-block p-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-4 text-xs text-red-500 font-semibold">
                          {q.isdelete?.datetime
                            ? new Date(q.isdelete.datetime).toLocaleString('en-IN')
                            : 'Deleted'}
                        </td>
                        <td
                          className="py-4 pr-4 text-right space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => handleRestore(q._id, e)}
                            disabled={restoringId === q._id}
                            title="Restore Quotation"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{restoringId === q._id ? 'Restoring...' : 'Restore'}</span>
                          </button>
                          <a
                            href={api.downloadQuotationUrl(q._id, false)}
                            target="_blank"
                            rel="noreferrer"
                            title="Download PDF"
                            className="inline-block p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Soft Delete Confirmation Modal */}
      {quotationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setQuotationToDelete(null)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-2xl shadow-2xl overflow-hidden z-10 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Move Quotation to Trash?
                </h3>
                <p className="text-xs text-gray-500">Soft-delete confirmation</p>
              </div>
            </div>

            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Quotation <strong className="text-gray-900 dark:text-white">{quotationToDelete.quotationNumber}</strong> for{' '}
              <strong className="text-gray-900 dark:text-white">{quotationToDelete.customer?.name}</strong> (₹{quotationToDelete.totalAmount?.toLocaleString('en-IN')}) will be moved to the Trash. You can restore it anytime.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setQuotationToDelete(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleSoftDelete}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 transition-all"
              >
                {deleting ? 'Moving to Trash...' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
