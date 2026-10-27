'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Search,
  Plus,
  Car,
  Filter,
  Eye,
  Download,
  IndianRupee,
  Calendar,
  AlertCircle,
  X,
  PenTool,
  Pencil,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { api } from '../../lib/api';
import { WhatsAppIcon, getInvoiceWhatsAppUrl } from '../../lib/whatsapp';

export default function InvoicesPage() {
  const router = useRouter();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [activeTab, setActiveTab] = useState<'active' | 'trash'>('active');

  // Soft delete modal state
  const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    loadInvoices();
  }, [search, selectedType, selectedStatus, selectedPaymentStatus, activeTab]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const params: any = { search };
      if (activeTab === 'trash') {
        params.trash = 'true';
      }
      if (selectedType !== 'all') params.type = selectedType;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedPaymentStatus !== 'all') params.paymentStatus = selectedPaymentStatus;

      const res = await api.listInvoices(params);
      if (res.success) {
        setInvoices(res.invoices || []);
      }
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!invoiceToDelete) return;
    setDeleting(true);
    try {
      const res = await api.deleteInvoice(invoiceToDelete._id);
      if (res.success) {
        setInvoiceToDelete(null);
        loadInvoices();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to soft delete invoice.');
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRestoringId(id);
    try {
      const res = await api.restoreInvoice(id);
      if (res.success) {
        loadInvoices();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to restore invoice.');
    } finally {
      setRestoringId(null);
    }
  };

  const handleOpenPaymentModal = (inv: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInvoice(inv);
    setPaymentAmount(inv.balanceDue || inv.totalAmount);
    setPaymentError('');
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');
    if (!selectedInvoice) return;

    if (paymentAmount <= 0) {
      setPaymentError('Payment amount must be greater than zero.');
      return;
    }

    if (paymentAmount > selectedInvoice.balanceDue) {
      setPaymentError(
        `Payment amount cannot exceed balance due (₹${selectedInvoice.balanceDue?.toLocaleString(
          'en-IN'
        )}).`
      );
      return;
    }

    setSubmittingPayment(true);
    try {
      const res = await api.recordPayment({
        invoiceId: selectedInvoice._id,
        amount: Number(paymentAmount),
        paymentDate,
        paymentMethod,
        transactionReference: transactionRef,
        notes: paymentNotes
      });

      if (res.success) {
        setIsPaymentModalOpen(false);
        loadInvoices();
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to record payment.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Paid
          </span>
        );
      case 'partially paid':
      case 'partially_paid':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Partially Paid
          </span>
        );
      case 'unpaid':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
            Unpaid
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
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Invoices
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage Vehicle and Business Client Tax Invoices
          </p>
        </div>

        <Link
          href="/invoices/create"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F52B2B] hover:bg-[#DC2626] text-white font-semibold text-xs md:text-sm rounded-xl shadow-md shadow-[#F52B2B]/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Invoice</span>
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
          All Invoices
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

      {/* Filters and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-4 rounded-2xl shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by invoice number, customer, vehicle no, PO..."
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20 focus:border-[#F52B2B]"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-800 dark:text-gray-200 font-semibold cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="vehicle">Vehicle Invoices</option>
            <option value="client">Client Invoices</option>
          </select>

          {/* Payment Status Filter */}
          {activeTab === 'active' && (
            <select
              value={selectedPaymentStatus}
              onChange={(e) => setSelectedPaymentStatus(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-800 dark:text-gray-200 font-semibold cursor-pointer"
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Paid</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          )}
        </div>
      </div>

      {/* Invoices List / Table */}
      {loading ? (
        <div className="p-12 text-center text-sm text-gray-400">Loading invoices...</div>
      ) : invoices.length === 0 ? (
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-12 text-center rounded-2xl">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {activeTab === 'trash' ? 'Trash is empty' : 'No invoices found'}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {activeTab === 'trash'
              ? 'No soft-deleted invoices found.'
              : 'Create your first invoice to get started.'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold text-[11px] uppercase tracking-wider bg-gray-50/50 dark:bg-[#0E1522]/50">
                  <th className="py-3.5 pl-4">Type</th>
                  <th className="py-3.5">Invoice No</th>
                  <th className="py-3.5">Customer</th>
                  <th className="py-3.5">Reference</th>
                  <th className="py-3.5">Date</th>
                  <th className="py-3.5">Total Amount</th>
                  {activeTab === 'active' ? (
                    <>
                      <th className="py-3.5">Balance Due</th>
                      <th className="py-3.5 text-center">Status</th>
                    </>
                  ) : (
                    <th className="py-3.5">Deleted At</th>
                  )}
                  <th className="py-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-medium">
                {invoices.map((inv) => (
                  <tr
                    key={inv._id}
                    onClick={() => router.push(`/invoices/${inv._id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-[#0E1522] cursor-pointer transition-colors"
                  >
                    <td className="py-4 pl-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          inv.invoiceType === 'vehicle'
                            ? 'bg-red-50 text-[#F52B2B] dark:bg-red-950/40'
                            : 'bg-navy-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                        }`}
                      >
                        {inv.invoiceType === 'vehicle' ? 'Vehicle' : 'Client'}
                      </span>
                    </td>
                    <td className="py-4 font-bold text-gray-900 dark:text-white">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-4 text-gray-700 dark:text-gray-300 max-w-[200px]">
                      <div className="font-semibold text-gray-900 dark:text-white truncate">
                        {inv.customer?.name}
                      </div>
                      {inv.customer?.phone && (
                        <a
                          href={getInvoiceWhatsAppUrl(inv)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#25D366] transition-colors mt-0.5"
                          title={`Send bill via WhatsApp to ${inv.customer.phone}`}
                        >
                          <WhatsAppIcon className="w-3 h-3 text-[#25D366]" />
                          <span>{inv.customer.phone}</span>
                        </a>
                      )}
                    </td>
                    <td className="py-4 text-xs font-semibold text-gray-500">
                      {inv.vehicleNumber || inv.purchaseOrderNumber || '—'}
                    </td>
                    <td className="py-4 text-gray-500 text-xs">
                      {new Date(inv.invoiceDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 font-bold text-gray-900 dark:text-white">
                      ₹ {inv.totalAmount?.toLocaleString('en-IN')}
                    </td>
                    {activeTab === 'active' ? (
                      <>
                        <td className="py-4 font-semibold text-xs">
                          {inv.balanceDue > 0 ? (
                            <span className="text-red-500">
                              ₹ {inv.balanceDue?.toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-emerald-500">₹ 0</span>
                          )}
                        </td>
                        <td className="py-4 text-center">{getStatusBadge(inv.paymentStatus)}</td>
                        <td
                          className="py-4 pr-4 text-right space-x-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Send on WhatsApp Button */}
                          <a
                            href={getInvoiceWhatsAppUrl(inv)}
                            target="_blank"
                            rel="noreferrer"
                            title={`Send bill via WhatsApp to ${inv.customer?.phone || 'customer'}`}
                            className="inline-block p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            <WhatsAppIcon className="w-4 h-4" />
                          </a>

                          {inv.balanceDue > 0 && inv.status === 'issued' && (
                            <button
                              onClick={(e) => handleOpenPaymentModal(inv, e)}
                              title="Record Payment"
                              className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                              <IndianRupee className="w-4 h-4" />
                            </button>
                          )}
                          <Link
                            href={`/invoices/create?editId=${inv._id}`}
                            title="Edit Invoice"
                            className="inline-block p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <a
                            href={api.downloadInvoiceUrl(inv._id, false)}
                            target="_blank"
                            rel="noreferrer"
                            title="Download PDF (Badge Only - Default)"
                            className="inline-block p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <a
                            href={api.downloadInvoiceUrl(inv._id, true)}
                            target="_blank"
                            rel="noreferrer"
                            title="Download PDF with Signature"
                            className="inline-block p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                          >
                            <PenTool className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => setInvoiceToDelete(inv)}
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
                          {inv.isdelete?.datetime
                            ? new Date(inv.isdelete.datetime).toLocaleString('en-IN')
                            : 'Deleted'}
                        </td>
                        <td
                          className="py-4 pr-4 text-right space-x-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => handleRestore(inv._id, e)}
                            disabled={restoringId === inv._id}
                            title="Restore Invoice"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{restoringId === inv._id ? 'Restoring...' : 'Restore'}</span>
                          </button>
                          <a
                            href={api.downloadInvoiceUrl(inv._id, false)}
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

      {/* Record Payment Modal */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsPaymentModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-2xl shadow-2xl overflow-hidden z-10 p-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Record Payment
                </h2>
                <p className="text-xs text-gray-500">
                  Invoice {selectedInvoice.invoiceNumber} • Balance Due: ₹
                  {selectedInvoice.balanceDue?.toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4">
              {paymentError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedInvoice.balanceDue}
                  step="any"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white font-semibold"
                  >
                    <option value="upi">UPI / GPay</option>
                    <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Transaction / UTR Reference
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UPI-99881122 or NEFT-776655"
                  className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Received via GPay from customer"
                  className="w-full px-3.5 py-2 text-xs bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-5 py-2 bg-[#F52B2B] hover:bg-[#DC2626] text-white text-xs font-semibold rounded-xl shadow-md shadow-[#F52B2B]/20 flex items-center justify-center min-w-[120px] transition-all"
                >
                  {submittingPayment ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Record Payment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Soft Delete Confirmation Modal */}
      {invoiceToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setInvoiceToDelete(null)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-2xl shadow-2xl overflow-hidden z-10 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950/60">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Move Invoice to Trash?
                </h3>
                <p className="text-xs text-gray-500">Soft-delete confirmation</p>
              </div>
            </div>

            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Invoice <strong className="text-gray-900 dark:text-white">{invoiceToDelete.invoiceNumber}</strong> for{' '}
              <strong className="text-gray-900 dark:text-white">{invoiceToDelete.customer?.name}</strong> (₹{invoiceToDelete.totalAmount?.toLocaleString('en-IN')}) will be moved to the Trash. You can restore it anytime.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
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
