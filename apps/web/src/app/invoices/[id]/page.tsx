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
  AlertCircle
} from 'lucide-react';
import { api } from '../../../lib/api';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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

  const previewUrl = api.previewInvoiceUrl(invoice._id);
  const downloadUrl = api.downloadInvoiceUrl(invoice._id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => router.push('/invoices')}
          className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {invoice.status === 'draft' && (
            <button
              onClick={handleIssueInvoice}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F52B2B] hover:bg-[#DC2626] text-white text-xs font-semibold rounded-xl shadow-md shadow-[#F52B2B]/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Issue Official Invoice</span>
            </button>
          )}

          <a
            href={downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 dark:bg-gray-800 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
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
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}
            >
              {invoice.status}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                invoice.paymentStatus === 'paid'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : invoice.paymentStatus === 'partially_paid'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
              }`}
            >
              {invoice.paymentStatus}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Billed to: <strong className="text-gray-800 dark:text-gray-200">{invoice.customer.name}</strong> •{' '}
            {invoice.vehicleNumber ? `Vehicle: ${invoice.vehicleNumber}` : ''}
            {invoice.purchaseOrderNumber ? `PO: ${invoice.purchaseOrderNumber}` : ''}
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

      {/* Embedded Live PDF / HTML Preview Frame */}
      <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-2xl shadow-sm overflow-hidden p-2 md:p-6">
        <div className="border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden shadow-inner bg-white">
          <iframe
            id="invoice-preview-frame"
            src={previewUrl}
            title="Invoice Preview"
            className="w-full h-[750px] md:h-[950px] border-none"
          />
        </div>
      </div>
    </div>
  );
}
