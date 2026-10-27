'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Printer,
  CheckCircle2,
  IndianRupee,
  Share2,
  FileText,
  AlertCircle,
  Pencil,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { api } from '../../../lib/api';
import { WhatsAppIcon, getInvoiceWhatsAppUrl } from '../../../lib/whatsapp';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const [withSignature, setWithSignature] = useState(false);

  useEffect(() => {
    if (id) loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    setLoading(true);
    try {
      const res = await api.getInvoice(id);
      if (res.success) {
        setInvoice(res.invoice);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load invoice.');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueInvoice = async () => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      const res = await api.issueInvoice(invoice._id);
      if (res.success) {
        setInvoice(res.invoice);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to issue invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSoftDelete = async () => {
    setDeleting(true);
    try {
      const res = await api.deleteInvoice(invoice._id);
      if (res.success) {
        router.push('/invoices');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to soft delete invoice.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const res = await api.restoreInvoice(invoice._id);
      if (res.success) {
        loadInvoice();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to restore invoice.');
    } finally {
      setRestoring(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-gray-400">Loading invoice document...</div>;
  }

  if (error || !invoice) {
    return (
      <div className="p-8 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-red-600 dark:text-red-400">{error || 'Invoice not found.'}</p>
        <Link
          href="/invoices"
          className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Link>
      </div>
    );
  }

  const isSoftDeleted = invoice.isdelete?.status === true;
  const defaultDownloadUrl = api.downloadInvoiceUrl(invoice._id, false);
  const signatureDownloadUrl = api.downloadInvoiceUrl(invoice._id, true);
  const currentPreviewUrl = api.previewInvoiceUrl(invoice._id, withSignature);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Soft Delete Warning Banner if in trash */}
      {isSoftDeleted && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2.5">
            <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-xs md:text-sm font-bold">This invoice is in the Trash</p>
              <p className="text-[11px] text-red-500">
                Deleted on {invoice.isdelete?.datetime ? new Date(invoice.isdelete.datetime).toLocaleString('en-IN') : 'recently'}.
              </p>
            </div>
          </div>
          <button
            onClick={handleRestore}
            disabled={restoring}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{restoring ? 'Restoring...' : 'Restore Invoice'}</span>
          </button>
        </div>
      )}

      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => router.push('/invoices')}
          className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {invoice.status === 'draft' && !isSoftDeleted && (
            <button
              onClick={handleIssueInvoice}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F52B2B] hover:bg-[#DC2626] text-white text-xs font-semibold rounded-xl shadow-md shadow-[#F52B2B]/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Issue Official Invoice</span>
            </button>
          )}

          {/* Edit Invoice Action */}
          {!isSoftDeleted && (
            <Link
              href={`/invoices/create?editId=${invoice._id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl shadow-sm transition-all"
              title="Edit Invoice details"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit</span>
            </Link>
          )}

          {/* Delete Action (Soft Delete) */}
          {!isSoftDeleted && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl shadow-sm transition-all"
              title="Move Invoice to Trash"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          {/* Send via WhatsApp */}
          <a
            href={getInvoiceWhatsAppUrl(invoice)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-xl shadow-sm transition-all"
            title={`Send bill via WhatsApp to connected mobile (${invoice.customer?.phone || 'customer'})`}
          >
            <WhatsAppIcon className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
            <span>Send WhatsApp</span>
          </a>

          {/* Primary Action: Default PDF (Badge Only) */}
          <a
            href={defaultDownloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 dark:bg-gray-800 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            title="Download PDF with authentic transparent digital badge seal (Default)"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </a>

          {/* Dedicated Action: Download with Signature */}
          <a
            href={signatureDownloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl shadow-sm transition-all"
            title="Download PDF including both digital badge and handwritten signature"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>With Signature</span>
          </a>

          <button
            onClick={() => {
              const iframe = document.getElementById('invoice-preview-frame') as HTMLIFrameElement;
              if (iframe?.contentWindow) {
                iframe.contentWindow.print();
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] text-gray-700 dark:text-gray-300 hover:bg-gray-50 text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Invoice Status Banner */}
      <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {invoice.invoiceNumber}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                invoice.status === 'issued'
                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}
            >
              {invoice.status}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                invoice.paymentStatus === 'paid'
                  ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 font-bold'
                  : invoice.paymentStatus === 'partially_paid'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
              }`}
            >
              {invoice.paymentStatus}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>Billed to: <strong className="text-gray-800 dark:text-gray-200">{invoice.customer.name}</strong></span>
            {invoice.customer?.phone && (
              <a
                href={getInvoiceWhatsAppUrl(invoice)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-700 dark:text-gray-300 hover:text-[#F52B2B] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-700"
                title="Send bill on WhatsApp"
              >
                <WhatsAppIcon className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                <span>{invoice.customer.phone}</span>
              </a>
            )}
            {invoice.vehicleNumber ? <span>• Vehicle: {invoice.vehicleNumber}</span> : ''}
            {invoice.purchaseOrderNumber ? <span>• PO: {invoice.purchaseOrderNumber}</span> : ''}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-xs text-gray-400">Total Payable Amount</div>
          <div className="text-xl md:text-2xl font-bold text-[#F52B2B]">
            ₹ {invoice.totalAmount?.toLocaleString('en-IN')}
          </div>
          {invoice.balanceDue > 0 && (
            <div className="text-xs text-red-500 font-semibold mt-0.5">
              Balance Due: ₹ {invoice.balanceDue?.toLocaleString('en-IN')}
            </div>
          )}
        </div>
      </div>

      {/* Embedded Live PDF / HTML Preview Frame with Badging Controls */}
      <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-2xl shadow-sm overflow-hidden p-3 md:p-6 space-y-4">
        {/* Preview Control Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
              Live Document Preview
            </span>
            <span className="text-[11px] text-gray-400 hidden sm:inline">
              (Transparent digital seal active)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mr-1">
              Badging Mode:
            </span>
            <div className="inline-flex bg-gray-100 dark:bg-[#0E1522] p-1 rounded-xl border border-gray-200 dark:border-[#233048]">
              <button
                type="button"
                onClick={() => setWithSignature(false)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  !withSignature
                    ? 'bg-white dark:bg-[#161E2E] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                Badge Only (Default)
              </button>
              <button
                type="button"
                onClick={() => setWithSignature(true)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  withSignature
                    ? 'bg-white dark:bg-[#161E2E] text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                With Signature
              </button>
            </div>
          </div>
        </div>

        <div className="border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden shadow-inner bg-white">
          <iframe
            id="invoice-preview-frame"
            src={currentPreviewUrl}
            title="Invoice Preview"
            className="w-full h-[750px] md:h-[950px] border-none"
          />
        </div>
      </div>

      {/* Soft Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
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
              Invoice <strong className="text-gray-900 dark:text-white">{invoice.invoiceNumber}</strong> for{' '}
              <strong className="text-gray-900 dark:text-white">{invoice.customer?.name}</strong> will be moved to the Trash. You can restore it anytime from the Trash tab on the Invoices page.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
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
