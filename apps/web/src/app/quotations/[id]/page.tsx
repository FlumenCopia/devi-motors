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
  CheckCircle
} from 'lucide-react';
import { api } from '../../../lib/api';

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [converting, setConverting] = useState(false);

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

  const previewUrl = api.previewQuotationUrl(quotation._id);
  const downloadUrl = api.downloadQuotationUrl(quotation._id);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header & Actions matching Mobile Screen 5 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => router.push('/quotations')}
          className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Quotations
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {quotation.status !== 'converted' ? (
            <button
              onClick={handleConvert}
              disabled={converting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F52B2B] hover:bg-[#DC2626] text-white text-xs font-semibold rounded-xl shadow-md shadow-[#F52B2B]/20 transition-all"
            >
              <span>Convert to Invoice</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Link
              href={`/invoices/${quotation.convertedInvoiceId}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              <span>View Converted Invoice ({quotation.convertedInvoiceNumber})</span>
            </Link>
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

      {/* Embedded Live PDF / HTML Preview Frame */}
      <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-2xl shadow-sm overflow-hidden p-2 md:p-6">
        <div className="border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden shadow-inner bg-white">
          <iframe
            id="quotation-preview-frame"
            src={previewUrl}
            title="Quotation Preview"
            className="w-full h-[750px] md:h-[950px] border-none"
          />
        </div>
      </div>
    </div>
  );
}
