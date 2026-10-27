'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Car, FileText, Search, Plus, Users, ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';

export default function VehiclesPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, [search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.listCustomers({ search, limit: 100 });
      if (res.success) {
        setCustomers(res.customers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Extract all vehicle entries and purchase orders
  const vehicleRecords = customers.flatMap((c) =>
    (c.vehicleNumbers || []).map((v: string) => ({
      reference: v,
      type: 'vehicle' as const,
      customer: c
    }))
  );

  const poRecords = customers.flatMap((c) =>
    (c.purchaseOrders || []).map((po: string) => ({
      reference: po,
      type: 'po' as const,
      customer: c
    }))
  );

  const allRecords = [...vehicleRecords, ...poRecords];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Vehicles & Purchase Orders
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Registered vehicle registration numbers and client purchase orders
          </p>
        </div>

        <Link
          href="/invoices/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F52B2B] hover:bg-[#DC2626] text-white text-xs md:text-sm font-semibold rounded-xl shadow-md shadow-[#F52B2B]/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Invoice for Vehicle</span>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by vehicle registration or PO number..."
          className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
        />
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-gray-400">Loading records...</div>
      ) : allRecords.length === 0 ? (
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-12 text-center rounded-2xl">
          <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            No vehicle records found
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Vehicle numbers and PO numbers are automatically indexed when creating invoices.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allRecords.map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 rounded-2xl shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                    item.type === 'vehicle'
                      ? 'bg-red-50 text-[#F52B2B] dark:bg-red-950/40'
                      : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40'
                  }`}
                >
                  {item.type === 'vehicle' ? <Car className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                  {item.type === 'vehicle' ? 'Vehicle' : 'Purchase Order'}
                </span>
                <span className="text-xs font-semibold text-gray-400 capitalize">
                  {item.customer.customerType}
                </span>
              </div>

              <div>
                <div className="text-base font-bold text-gray-900 dark:text-white font-mono tracking-tight">
                  {item.reference}
                </div>
                <Link
                  href={`/customers/${item.customer._id}`}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:text-[#F52B2B] font-semibold mt-1 block truncate"
                >
                  {item.customer.name}
                </Link>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                <span className="text-gray-400">Total Invoiced:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  ₹ {item.customer.totalInvoiced?.toLocaleString('en-IN') || 0}
                </span>
              </div>

              <div className="pt-1">
                <Link
                  href={`/invoices/create?customerId=${item.customer._id}`}
                  className="w-full py-2 bg-gray-50 dark:bg-[#0E1522] hover:bg-red-50 dark:hover:bg-red-950/20 text-[#F52B2B] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-gray-200 dark:border-[#233048]"
                >
                  <span>Create Invoice</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
