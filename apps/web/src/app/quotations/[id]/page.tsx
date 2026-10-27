'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  Printer,
  ArrowRight,
  Share2,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  Pencil,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { api } from '../../../lib/api';
import { WhatsAppIcon, getQuotationWhatsAppUrl } from '../../../lib/whatsapp';

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [converting, setConverting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const [withSignature, setWithSignature] = useState(false);

  useEffect(() => {
    if (id) loadQuotation();
  }, [id]);

  const loadQuotation = async () => {
    setLoading(true);
    try {
      const res = await api.getQuotation(id);
      if (res.success) {
        setQuotation(res.quotation);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load quotation.');
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!quotation) return;
    if (
      !confirm(
        `Convert Quotation ${quotation.quotationNumber} into an official Tax Invoice?`
      )
    ) {
      return;
    }

    setConverting(true);
    try {
      const res = await api.convertQuotationToInvoice(quotation._id);
      if (res.success && res.invoice) {
        router.push(`/invoices/${res.invoice._id}`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to convert quotation.');
    } finally {
      setConverting(false);
    }
  };

  const handleSoftDelete = async () => {
    setDeleting(true);
    try {
      const res = await api.deleteQuotation(quotation._id);
      if (res.success) {
        router.push('/quotations');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to soft delete quotation.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const res = await api.restoreQuotation(quotation._id);
      if (res.success) {
        loadQuotation();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to restore quotation.');
    } finally {
      setRestoring(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-gray-400">Loading quotation document...</div>;
  }

  if (error || !quotation) {
    return (
      <div className="p-8 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-red-600 dark:text-red-400">{error || 'Quotation not found.'}</p>
        <Link
          href="/quotations"
          className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Quotations
        </Link>
      </div>
    );
  }

  const isSoftDeleted = quotation.isdelete?.status === true;
  const defaultDownloadUrl = api.downloadQuotationUrl(quotation._id, false);
  const signatureDownloadUrl = api.downloadQuotationUrl(quotation._id, true);
  const currentPreviewUrl = api.previewQuotationUrl(quotation._id, withSignature);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Soft Delete Warning Banner if in trash */}
      {isSoftDeleted && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2.5">
            <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-xs md:text-sm font-bold">This quotation is in the Trash</p>
              <p className="text-[11px] text-red-500">
                Deleted on {quotation.isdelete?.datetime ? new Date(quotation.isdelete.datetime).toLocaleString('en-IN') : 'recently'}.
              </p>
            </div>
          </div>
          <button
            onClick={handleRestore}
            disabled={restoring}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{restoring ? 'Restoring...' : 'Restore Quotation'}</span>
          </button>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => router.push('/quotations')}
          className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Quotations
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {quotation.status !== 'converted' && !isSoftDeleted && (
            <button
              onClick={handleConvert}
              disabled={converting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F52B2B] hover:bg-[#DC2626] text-white text-xs font-semibold rounded-xl shadow-md shadow-[#F52B2B]/20 transition-all"
            >
              <span>Convert to Invoice</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {quotation.status === 'converted' && (
            <Link
              href={`/invoices/${quotation.convertedInvoiceId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              <span>View Converted Invoice ({quotation.convertedInvoiceNumber})</span>
            </Link>
          )}

          {/* Edit Quotation Action */}
          {!isSoftDeleted && (
            <Link
              href={`/quotations/create?editId=${quotation._id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl shadow-sm transition-all"
              title="Edit Quotation details"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit</span>
            </Link>
          )}

          {/* Delete Quotation Action */}
          {!isSoftDeleted && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs font-semibold rounded-xl shadow-sm transition-all"
              title="Move Quotation to Trash"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          {/* Send via WhatsApp */}
          <a
            href={getQuotationWhatsAppUrl(quotation)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-xl shadow-sm transition-all"
            title={`Send quotation via WhatsApp to connected mobile (${quotation.customer?.phone || 'customer'})`}
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
            title="Download Quotation PDF with digital badge (Default)"
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
            title="Download Quotation PDF including handwritten signature"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>With Signature</span>
          </a>

          <button
            onClick={() => {
              const iframe = document.getElementById('quotation-preview-frame') as HTMLIFrameElement;
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

      {/* Embedded Live PDF / HTML Preview Frame with Badging Controls */}
      <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-2xl shadow-sm overflow-hidden p-3 md:p-6 space-y-4">
        {/* Preview Control Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
              Live Quotation Preview
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
            id="quotation-preview-frame"
            src={currentPreviewUrl}
            title="Quotation Preview"
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
                  Move Quotation to Trash?
                </h3>
                <p className="text-xs text-gray-500">Soft-delete confirmation</p>
              </div>
            </div>

            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Quotation <strong className="text-gray-900 dark:text-white">{quotation.quotationNumber}</strong> for{' '}
              <strong className="text-gray-900 dark:text-white">{quotation.customer?.name}</strong> will be moved to the Trash. You can restore it anytime from the Trash tab on the Quotations page.
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
