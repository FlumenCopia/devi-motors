'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  User,
  Building2,
  Phone,
  Plus,
  Check,
  X,
  Car,
  FileText,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { api } from '../lib/api';

interface SmartCustomerSelectorProps {
  customers: any[];
  selectedCustomer: any | null;
  onSelectCustomer: (customer: any) => void;
  onClearCustomer?: () => void;
  onCustomerCreated?: (newCustomer: any) => void;
  error?: string;
}

export function SmartCustomerSelector({
  customers,
  selectedCustomer,
  onSelectCustomer,
  onClearCustomer,
  onCustomerCreated,
  error
}: SmartCustomerSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Quick Add form state
  const [quickForm, setQuickForm] = useState({
    name: '',
    phone: '',
    customerType: 'individual' as 'individual' | 'company',
    vehicleNumber: '',
    purchaseOrder: '',
    billingAddress: 'Thiruvananthapuram, Kerala',
    gstin: ''
  });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter customers based on search term (name, phone, vehicle, PO)
  const filteredCustomers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return customers.slice(0, 10); // Show recent 10 if no search term

    return customers.filter((c) => {
      const nameMatch = c.name?.toLowerCase().includes(q);
      const phoneMatch = c.phone?.toLowerCase().includes(q);
      const vehicleMatch = c.vehicleNumbers?.some((v: string) => v.toLowerCase().includes(q));
      const poMatch = c.purchaseOrders?.some((p: string) => p.toLowerCase().includes(q));
      const gstinMatch = c.gstin?.toLowerCase().includes(q);
      return nameMatch || phoneMatch || vehicleMatch || poMatch || gstinMatch;
    });
  }, [customers, searchTerm]);

  const handleOpenAddModal = (presetQuery?: string) => {
    const query = presetQuery ?? searchTerm;
    const isDigits = /^\d+$/.test(query.trim());
    setQuickForm({
      name: isDigits ? '' : query.trim(),
      phone: isDigits ? query.trim() : '',
      customerType: 'individual',
      vehicleNumber: '',
      purchaseOrder: '',
      billingAddress: 'Thiruvananthapuram, Kerala',
      gstin: ''
    });
    setModalError('');
    setShowAddModal(true);
    setIsOpen(false);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickForm.name.trim() || !quickForm.phone.trim()) {
      setModalError('Customer Name and Phone are required.');
      return;
    }

    setSubmitting(true);
    setModalError('');

    try {
      const payload: any = {
        name: quickForm.name.trim(),
        phone: quickForm.phone.trim(),
        customerType: quickForm.customerType,
        billingAddress: quickForm.billingAddress.trim() || 'Thiruvananthapuram, Kerala',
        state: 'Kerala',
        stateCode: '32',
        gstin: quickForm.gstin.trim()
      };

      if (quickForm.customerType === 'individual' && quickForm.vehicleNumber.trim()) {
        payload.vehicleNumbers = [quickForm.vehicleNumber.trim().toUpperCase()];
      }
      if (quickForm.customerType === 'company' && quickForm.purchaseOrder.trim()) {
        payload.purchaseOrders = [quickForm.purchaseOrder.trim()];
      }

      const res = await api.createCustomer(payload);
      if (res.success && res.customer) {
        onCustomerCreated?.(res.customer);
        onSelectCustomer(res.customer);
        setShowAddModal(false);
        setSearchTerm('');
      } else {
        setModalError(res.message || 'Failed to create customer.');
      }
    } catch (err: any) {
      setModalError(err.message || 'Network error while creating customer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2" ref={wrapperRef}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-[#F52B2B]" />
          <span>Customer / Client *</span>
        </label>
        <button
          type="button"
          onClick={() => handleOpenAddModal()}
          className="text-xs font-bold text-[#F52B2B] hover:underline inline-flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Quick Add Customer</span>
        </button>
      </div>

      {/* When a customer is already selected, display an easy-to-read, compact card with a Change button */}
      {selectedCustomer ? (
        <div className="p-3.5 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl flex items-center justify-between gap-3 transition-all hover:border-gray-300 dark:hover:border-gray-700">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#F52B2B] flex items-center justify-center font-bold text-sm flex-shrink-0">
              {selectedCustomer.customerType === 'company' ? (
                <Building2 className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-gray-900 dark:text-white truncate">
                  {selectedCustomer.name}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    selectedCustomer.customerType === 'company'
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {selectedCustomer.customerType === 'company' ? 'Company / Client' : 'Vehicle Owner'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex-wrap">
                <span className="inline-flex items-center gap-1 font-medium">
                  <Phone className="w-3 h-3 text-gray-400" />
                  {selectedCustomer.phone || 'No Phone'}
                </span>

                {selectedCustomer.vehicleNumbers?.length > 0 && (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-white dark:bg-[#161E2E] px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                    <Car className="w-3 h-3 text-[#F52B2B]" />
                    {selectedCustomer.vehicleNumbers[0]}
                  </span>
                )}

                {selectedCustomer.purchaseOrders?.length > 0 && (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-white dark:bg-[#161E2E] px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                    <FileText className="w-3 h-3 text-blue-500" />
                    {selectedCustomer.purchaseOrders[0]}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                onClearCustomer?.();
                setSearchTerm('');
                setIsOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 50);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-[#161E2E] hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-[#233048] rounded-lg transition-all"
            >
              Change
            </button>
          </div>
        </div>
      ) : (
        /* Search Box for Unselected State */
        <div className="relative">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Type customer name or mobile number..."
              className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20 focus:border-[#F52B2B] transition-all"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5 pointer-events-none" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 max-h-72 overflow-y-auto bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-xl shadow-xl z-30 divide-y divide-gray-100 dark:divide-gray-800 animate-in fade-in-50 duration-150">
              {filteredCustomers.length > 0 ? (
                <>
                  <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-gray-800/40 flex justify-between items-center">
                    <span>Matching Customers ({filteredCustomers.length})</span>
                    <span className="text-[10px] font-normal lowercase">tap to select</span>
                  </div>

                  {filteredCustomers.map((c) => (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => {
                        onSelectCustomer(c);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      className="w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2 hover:bg-red-50/60 dark:hover:bg-red-950/20 transition-colors group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs md:text-sm text-gray-900 dark:text-white group-hover:text-[#F52B2B] truncate">
                            {c.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {c.customerType === 'company' ? 'Company' : 'Individual'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 flex-wrap">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            📱 {c.phone}
                          </span>
                          {c.vehicleNumbers?.[0] && (
                            <span className="font-mono text-gray-500">
                              🚗 {c.vehicleNumbers[0]}
                            </span>
                          )}
                          {c.purchaseOrders?.[0] && (
                            <span className="font-mono text-gray-500">
                              📄 {c.purchaseOrders[0]}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-6 h-6 rounded-full bg-transparent group-hover:bg-[#F52B2B] text-transparent group-hover:text-white flex items-center justify-center transition-all flex-shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="p-4 text-center space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    No customer matches <strong>&quot;{searchTerm}&quot;</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenAddModal(searchTerm)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F52B2B] text-white text-xs font-bold rounded-lg hover:bg-[#DC2626] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add &quot;{searchTerm}&quot; as New Customer</span>
                  </button>
                </div>
              )}

              {/* Bottom Quick Action */}
              <div className="p-2 bg-gray-50 dark:bg-[#0E1522] border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs">
                <span className="text-[11px] text-gray-500">Can&apos;t find customer?</span>
                <button
                  type="button"
                  onClick={() => handleOpenAddModal()}
                  className="font-bold text-[#F52B2B] hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Create New
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

      {/* Quick Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !submitting && setShowAddModal(false)}
          />

          <div className="relative w-full max-w-lg bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-2xl shadow-2xl overflow-hidden z-10 p-5 md:p-6 space-y-4 animate-in fade-in-50 zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/50 text-[#F52B2B] flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Quick Add Customer
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Add new customer details &amp; auto-select instantly
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                disabled={submitting}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateCustomer} className="space-y-3.5">
              {/* Customer Type Toggle */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Customer Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuickForm({ ...quickForm, customerType: 'individual' })}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      quickForm.customerType === 'individual'
                        ? 'bg-[#F52B2B] text-white border-[#F52B2B]'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>Individual / Vehicle</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickForm({ ...quickForm, customerType: 'company' })}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 transition-all ${
                      quickForm.customerType === 'company'
                        ? 'bg-[#F52B2B] text-white border-[#F52B2B]'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Company / Insurance</span>
                  </button>
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {quickForm.customerType === 'company' ? 'Company Name *' : 'Customer Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={quickForm.name}
                    onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
                    placeholder={
                      quickForm.customerType === 'company' ? 'Terumo Penpol Pvt Ltd' : 'Rajesh Kumar'
                    }
                    className="w-full px-3 py-2 text-xs md:text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#F52B2B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    inputMode="tel"
                    value={quickForm.phone}
                    onChange={(e) => setQuickForm({ ...quickForm, phone: e.target.value })}
                    placeholder="9447123456"
                    className="w-full px-3 py-2 text-xs md:text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#F52B2B]"
                  />
                </div>
              </div>

              {/* Conditional Vehicle vs PO Number */}
              {quickForm.customerType === 'individual' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Vehicle Number (e.g. KL 01DD 6151)
                  </label>
                  <input
                    type="text"
                    value={quickForm.vehicleNumber}
                    onChange={(e) =>
                      setQuickForm({ ...quickForm, vehicleNumber: e.target.value.toUpperCase() })
                    }
                    placeholder="KL 01DD 6151"
                    className="w-full px-3 py-2 text-xs md:text-sm uppercase bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Purchase Order (PO)
                    </label>
                    <input
                      type="text"
                      value={quickForm.purchaseOrder}
                      onChange={(e) =>
                        setQuickForm({ ...quickForm, purchaseOrder: e.target.value })
                      }
                      placeholder="PO-2026-001"
                      className="w-full px-3 py-2 text-xs md:text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      value={quickForm.gstin}
                      onChange={(e) =>
                        setQuickForm({ ...quickForm, gstin: e.target.value.toUpperCase() })
                      }
                      placeholder="32AAAAA0000A1Z5"
                      className="w-full px-3 py-2 text-xs md:text-sm uppercase bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Billing Address
                </label>
                <input
                  type="text"
                  value={quickForm.billingAddress}
                  onChange={(e) => setQuickForm({ ...quickForm, billingAddress: e.target.value })}
                  placeholder="Thiruvananthapuram, Kerala"
                  className="w-full px-3 py-2 text-xs md:text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-[#F52B2B] hover:bg-[#DC2626] text-white text-xs font-bold rounded-xl shadow-md shadow-[#F52B2B]/20 flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save &amp; Select</span>
                    </>
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
