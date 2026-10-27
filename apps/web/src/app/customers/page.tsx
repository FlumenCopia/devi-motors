'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Car,
  ChevronRight,
  X,
  AlertCircle
} from 'lucide-react';
import { api } from '../../lib/api';

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    customerType: 'individual',
    contactPerson: '',
    phone: '',
    email: '',
    billingAddress: '',
    state: 'Kerala',
    stateCode: '32',
    pinCode: '',
    gstin: '',
    vehicleNumbers: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    loadCustomers();
  }, [search, selectedType]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.listCustomers({ search, type: selectedType });
      if (res.success) {
        setCustomers(res.customers || []);
      }
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);

    try {
      const vehicles = formData.vehicleNumbers
        ? formData.vehicleNumbers
            .split(',')
            .map((v) => v.trim().toUpperCase())
            .filter(Boolean)
        : [];

      const res = await api.createCustomer({
        ...formData,
        vehicleNumbers: vehicles
      });

      if (res.success) {
        setIsModalOpen(false);
        setFormData({
          name: '',
          customerType: 'individual',
          contactPerson: '',
          phone: '',
          email: '',
          billingAddress: '',
          state: 'Kerala',
          stateCode: '32',
          pinCode: '',
          gstin: '',
          vehicleNumbers: '',
          notes: ''
        });
        loadCustomers();
      }
    } catch (err: any) {
      setModalError(err.message || 'Failed to create customer.');
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'DM';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Customers
          </h1>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Manage individual vehicle owners and business clients
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F52B2B] hover:bg-[#DC2626] text-white font-semibold text-xs md:text-sm rounded-xl shadow-md shadow-[#F52B2B]/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-4 rounded-2xl shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, phone, vehicle, GST..."
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20 focus:border-[#F52B2B]"
          />
        </div>

        {/* Filter Pills matching mobile mockup */}
        <div className="flex items-center gap-2">
          {['all', 'individual', 'company'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                selectedType === type
                  ? 'bg-[#F52B2B] text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Customers List */}
      {loading ? (
        <div className="p-12 text-center text-sm text-gray-400">Loading customers...</div>
      ) : customers.length === 0 ? (
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-12 text-center rounded-2xl">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No customers found</h3>
          <p className="text-xs text-gray-400 mt-1">Add your first customer to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((cust) => (
            <Link
              key={cust._id}
              href={`/customers/${cust._id}`}
              className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] hover:border-[#F52B2B]/50 p-5 rounded-2xl shadow-sm transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold text-xs flex items-center justify-center flex-shrink-0 group-hover:bg-red-50 group-hover:text-[#F52B2B] transition-colors">
                      {getInitials(cust.name)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#F52B2B] transition-colors leading-tight">
                        {cust.name}
                      </h3>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {cust.customerType}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#F52B2B] transition-colors flex-shrink-0" />
                </div>

                <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>{cust.phone}</span>
                  </div>
                  {cust.gstin && (
                    <div className="flex items-center gap-2 font-mono text-[11px] text-gray-700 dark:text-gray-300">
                      <span className="font-bold">GSTIN:</span>
                      <span>{cust.gstin}</span>
                    </div>
                  )}
                  {cust.vehicleNumbers?.length > 0 && (
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                      <Car className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      <span>{cust.vehicleNumbers.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px]">Invoiced</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    ₹ {cust.totalInvoiced?.toLocaleString('en-IN') || 0}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 block text-[10px]">Outstanding</span>
                  <span
                    className={`font-bold ${
                      cust.outstandingBalance > 0 ? 'text-red-500' : 'text-emerald-500'
                    }`}
                  >
                    ₹ {cust.outstandingBalance?.toLocaleString('en-IN') || 0}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Add New Customer
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateCustomer} className="p-6 overflow-y-auto space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Customer Type Toggle */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Customer Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, customerType: 'individual' })}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      formData.customerType === 'individual'
                        ? 'bg-[#F52B2B] text-white border-[#F52B2B]'
                        : 'bg-gray-50 dark:bg-[#0E1522] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#233048]'
                    }`}
                  >
                    Individual (Vehicle Owner)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, customerType: 'company' })}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      formData.customerType === 'company'
                        ? 'bg-[#F52B2B] text-white border-[#F52B2B]'
                        : 'bg-gray-50 dark:bg-[#0E1522] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#233048]'
                    }`}
                  >
                    Business / Client Company
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {formData.customerType === 'company' ? 'Company Name' : 'Customer Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={
                    formData.customerType === 'company'
                      ? 'Terumo Penpol Private Limited'
                      : 'Rajesh Kumar'
                  }
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20 focus:border-[#F52B2B]"
                />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9447123456"
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20 focus:border-[#F52B2B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="client@example.com"
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20 focus:border-[#F52B2B]"
                  />
                </div>
              </div>

              {/* Billing Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Billing Address *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.billingAddress}
                  onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                  placeholder="Street address, building, locality, Thiruvananthapuram"
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20 focus:border-[#F52B2B]"
                />
              </div>

              {/* GSTIN & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    GSTIN {formData.customerType === 'company' && '(Recommended)'}
                  </label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    placeholder="32AAAAA0000A1Z5"
                    className="w-full px-3.5 py-2 text-sm uppercase bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20 focus:border-[#F52B2B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20 focus:border-[#F52B2B]"
                  />
                </div>
              </div>

              {/* Vehicle Numbers */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Vehicle Registration Number(s) (Optional)
                </label>
                <input
                  type="text"
                  value={formData.vehicleNumbers}
                  onChange={(e) => setFormData({ ...formData, vehicleNumbers: e.target.value })}
                  placeholder="e.g. KL 01DD 6151, KL 01CA 0001"
                  className="w-full px-3.5 py-2 text-sm uppercase bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20 focus:border-[#F52B2B]"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Separate multiple registration numbers with commas.
                </span>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#F52B2B] hover:bg-[#DC2626] text-white text-xs font-semibold rounded-xl shadow-md shadow-[#F52B2B]/20 flex items-center justify-center min-w-[100px]"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Save Customer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
