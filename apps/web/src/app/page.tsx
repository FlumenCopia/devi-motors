'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  IndianRupee,
  Clock,
  FileSpreadsheet,
  Plus,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Calendar,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { api } from '../lib/api';
import { useTheme } from '../context/ThemeContext';

export default function DashboardPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();

  const [financialYear, setFinancialYear] = useState('2026-2027');
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMetrics();
  }, [financialYear]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboardMetrics(financialYear);
      if (res.success) {
        setMetrics(res.metrics);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
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
      case 'pending':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Pending
          </span>
        );
      case 'approved':
        return (
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Approved
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

  const getInitials = (name: string) => {
    if (!name) return 'DM';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Top Greeting & Financial Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Good Morning, Admin!
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Here's what's happening with your business today.
          </p>
        </div>

        {/* FY Dropdown */}
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

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {/* Total Invoiced */}
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 rounded-2xl shadow-sm transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-950/50 text-[#F52B2B] flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Total Invoiced
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                ₹ {metrics?.totalInvoiced?.toLocaleString('en-IN') || '0'}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="w-4 h-4" />
            <span>12%</span>
            <span className="text-gray-400 font-normal">vs. last month</span>
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 rounded-2xl shadow-sm transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gray-900 dark:bg-gray-800 text-white flex items-center justify-center flex-shrink-0">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Total Paid
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                ₹ {metrics?.totalPaid?.toLocaleString('en-IN') || '0'}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ArrowUpRight className="w-4 h-4" />
            <span>18%</span>
            <span className="text-gray-400 font-normal">vs. last month</span>
          </div>
        </div>

        {/* Outstanding */}
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 rounded-2xl shadow-sm transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-950/50 text-[#F52B2B] flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Outstanding
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                ₹ {metrics?.outstandingBalance?.toLocaleString('en-IN') || '0'}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-red-500">
            <ArrowUpRight className="w-4 h-4" />
            <span>5%</span>
            <span className="text-gray-400 font-normal">vs. last month</span>
          </div>
        </div>

        {/* Quotations Pending */}
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 rounded-2xl shadow-sm transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gray-900 dark:bg-gray-800 text-white flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Quotations Pending
              </div>
              <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                {metrics?.quotationsPending || '0'}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <ArrowDownRight className="w-4 h-4" />
            <span>33%</span>
            <span className="text-gray-400 font-normal">vs. last month</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Monthly Sales Overview & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 md:p-6 rounded-2xl shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Monthly Sales Overview
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Invoiced amount and payments received across FY
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#F52B2B]"></div>
                <span className="text-gray-600 dark:text-gray-300">Invoiced</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-800 dark:bg-gray-200"></div>
                <span className="text-gray-600 dark:text-gray-300">Paid</span>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics?.monthlySales || []}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={resolvedTheme === 'dark' ? '#233048' : '#f1f5f9'}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: resolvedTheme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: resolvedTheme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => (val >= 1000 ? `${val / 1000}K` : `${val}`)}
                />
                <Tooltip
                  formatter={(value: any) => [`₹ ${Number(value).toLocaleString('en-IN')}`, '']}
                  contentStyle={{
                    backgroundColor: resolvedTheme === 'dark' ? '#0E1522' : '#ffffff',
                    borderColor: resolvedTheme === 'dark' ? '#233048' : '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="invoiced" name="Invoiced" fill="#F52B2B" radius={[4, 4, 0, 0]} maxBarSize={16} />
                <Bar dataKey="paid" name="Paid" fill={resolvedTheme === 'dark' ? '#CBD5E1' : '#1E293B'} radius={[4, 4, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions (1 col) */}
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 md:p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-colors">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                href="/invoices/create"
                className="w-full flex items-center justify-between p-3.5 bg-gray-50 dark:bg-[#0E1522] hover:bg-red-50 dark:hover:bg-red-950/20 border border-gray-200 dark:border-[#233048] rounded-xl text-sm font-semibold text-gray-900 dark:text-white transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-[#F52B2B] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span>Create New Invoice</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#F52B2B] transition-colors" />
              </Link>

              <Link
                href="/quotations/create"
                className="w-full flex items-center justify-between p-3.5 bg-gray-50 dark:bg-[#0E1522] hover:bg-gray-100 dark:hover:bg-gray-800/50 border border-gray-200 dark:border-[#233048] rounded-xl text-sm font-semibold text-gray-900 dark:text-white transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-gray-800 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <span>Create New Quotation</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />
              </Link>

              <Link
                href="/customers?action=new"
                className="w-full flex items-center justify-between p-3.5 bg-gray-50 dark:bg-[#0E1522] hover:bg-red-50 dark:hover:bg-red-950/20 border border-gray-200 dark:border-[#233048] rounded-xl text-sm font-semibold text-gray-900 dark:text-white transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-[#F52B2B] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Users className="w-4 h-4" />
                  </div>
                  <span>Add Customer</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#F52B2B] transition-colors" />
              </Link>

              <Link
                href="/customers"
                className="w-full flex items-center justify-between p-3.5 bg-gray-50 dark:bg-[#0E1522] hover:bg-gray-100 dark:hover:bg-gray-800/50 border border-gray-200 dark:border-[#233048] rounded-xl text-sm font-semibold text-gray-900 dark:text-white transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-gray-800 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Users className="w-4 h-4" />
                  </div>
                  <span>View All Customers</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Documents & Recent Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Documents Table (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 md:p-6 rounded-2xl shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Recent Documents
            </h2>
            <Link
              href="/invoices"
              className="text-xs font-bold text-[#F52B2B] hover:underline flex items-center gap-1"
            >
              View All &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="pb-3 pl-2">Type</th>
                  <th className="pb-3">No.</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3 pr-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-medium">
                {metrics?.recentDocuments?.map((doc: any) => (
                  <tr
                    key={doc.id}
                    onClick={() => router.push(`/${doc.type}s/${doc.id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-[#0E1522] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 pl-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          doc.type === 'invoice'
                            ? 'bg-red-50 text-[#F52B2B] dark:bg-red-950/40'
                            : 'bg-navy-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                        }`}
                      >
                        {doc.type === 'invoice' ? 'Invoice' : 'Quotation'}
                      </span>
                    </td>
                    <td className="py-3.5 font-bold text-gray-900 dark:text-white">
                      {doc.documentNumber}
                    </td>
                    <td className="py-3.5 text-gray-600 dark:text-gray-300 max-w-[180px] truncate">
                      {doc.customerName}
                    </td>
                    <td className="py-3.5 text-gray-500 text-xs">
                      {new Date(doc.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 font-bold text-gray-900 dark:text-white">
                      ₹ {doc.amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 pr-2 text-right">{getStatusBadge(doc.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Customers List (1 col) */}
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 md:p-6 rounded-2xl shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Recent Customers
            </h2>
            <Link
              href="/customers"
              className="text-xs font-bold text-[#F52B2B] hover:underline flex items-center gap-1"
            >
              View All &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {metrics?.recentCustomers?.map((cust: any) => (
              <Link
                key={cust.id}
                href={`/customers/${cust.id}`}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#0E1522] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold text-xs flex items-center justify-center flex-shrink-0 group-hover:bg-red-100 group-hover:text-[#F52B2B] transition-colors">
                    {getInitials(cust.name)}
                  </div>
                  <div>
                    <div className="text-xs md:text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#F52B2B] transition-colors max-w-[150px] truncate">
                      {cust.name}
                    </div>
                    <div className="text-[11px] text-gray-500 capitalize">
                      {cust.customerType} {cust.gstin ? `• ${cust.gstin}` : ''}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
