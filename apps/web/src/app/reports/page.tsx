'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  IndianRupee,
  TrendingUp,
  Percent,
  FileCheck,
  FileSpreadsheet,
  Users
} from 'lucide-react';
import { api } from '../../lib/api';

export default function ReportsPage() {
  const [financialYear, setFinancialYear] = useState('2026-2027');
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [financialYear]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await api.getReports(financialYear);
      if (res.success) {
        setReports(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const tax = reports?.taxSummary || {
    totalTaxable: 0,
    totalCgst: 0,
    totalSgst: 0,
    totalIgst: 0,
    totalGst: 0,
    grandTotal: 0
  };

  const quoStats = reports?.quotationStats || {
    total: 0,
    converted: 0,
    approved: 0,
    conversionRate: 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Financial & Tax Reports
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            GST summaries, customer performance, and conversion metrics
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] px-3.5 py-2 rounded-xl text-xs md:text-sm font-semibold shadow-sm self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={financialYear}
            onChange={(e) => setFinancialYear(e.target.value)}
            className="bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none cursor-pointer"
          >
            <option value="2026-2027">Financial Year 2026 - 2027</option>
            <option value="2025-2026">Financial Year 2025 - 2026</option>
            <option value="2024-2025">Financial Year 2024 - 2025</option>
          </select>
        </div>
      </div>

      {/* GST Summary Cards */}
      <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-6 rounded-2xl shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
          GST Tax Summary ({financialYear})
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Taxable Base</span>
            <span className="text-sm md:text-base font-bold text-gray-900 dark:text-white mt-1 block">
              ₹ {tax.totalTaxable?.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3.5 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Central Tax (CGST)</span>
            <span className="text-sm md:text-base font-bold text-gray-900 dark:text-white mt-1 block">
              ₹ {tax.totalCgst?.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3.5 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">State Tax (SGST)</span>
            <span className="text-sm md:text-base font-bold text-gray-900 dark:text-white mt-1 block">
              ₹ {tax.totalSgst?.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3.5 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">Inter-State (IGST)</span>
            <span className="text-sm md:text-base font-bold text-gray-900 dark:text-white mt-1 block">
              ₹ {tax.totalIgst?.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
            <span className="text-[10px] text-[#F52B2B] font-bold uppercase block">Total GST</span>
            <span className="text-sm md:text-base font-bold text-[#F52B2B] mt-1 block">
              ₹ {tax.totalGst?.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-3.5 bg-gray-900 text-white rounded-xl">
            <span className="text-[10px] text-gray-300 font-bold uppercase block">Total Revenue</span>
            <span className="text-sm md:text-base font-bold mt-1 block">
              ₹ {tax.grandTotal?.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Quotation Conversion Stats & Customer-wise Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quotation conversion card */}
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-6 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
            Quotation Performance
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Total Quotations Created:</span>
              <span className="font-bold text-gray-900 dark:text-white">{quoStats.total}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Approved by Customer:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {quoStats.approved}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Converted to Tax Invoices:</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {quoStats.converted}
              </span>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center text-xs font-semibold mb-1">
                <span>Conversion Rate</span>
                <span className="text-[#F52B2B] font-bold text-sm">
                  {quoStats.conversionRate}%
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#F52B2B] h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, quoStats.conversionRate)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Customer-wise sales table */}
        <div className="lg:col-span-2 bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-6 rounded-2xl shadow-sm">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs mb-4">
            Top Customers by Revenue
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="pb-3 pl-2">Customer</th>
                  <th className="pb-3 text-center">Invoices</th>
                  <th className="pb-3 text-right">Invoiced Amount</th>
                  <th className="pb-3 text-right pr-2">Paid Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-medium">
                {reports?.customerSales?.map((c: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-[#0E1522]">
                    <td className="py-3 pl-2 font-bold text-gray-900 dark:text-white">
                      {c._id}
                    </td>
                    <td className="py-3 text-center text-gray-500">{c.invoiceCount}</td>
                    <td className="py-3 text-right font-bold text-gray-900 dark:text-white">
                      ₹ {c.totalInvoiced?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 text-right pr-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                      ₹ {c.totalPaid?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
