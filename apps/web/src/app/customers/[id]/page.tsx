'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Car,
  FileText,
  FileSpreadsheet,
  Plus,
  AlertCircle,
  Pencil,
  Trash2,
  RotateCcw,
  X
} from 'lucide-react';
import { api } from '../../../lib/api';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [customer, setCustomer] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit / Delete modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

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

  useEffect(() => {
    if (id) {
      loadCustomerDetails();
    }
  }, [id]);

  const loadCustomerDetails = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomer(id);
      if (res.success) {
        setCustomer(res.customer);
        setInvoices(res.invoices || []);
        setQuotations(res.quotations || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load customer details.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = () => {
    if (!customer) return;
    setFormData({
      name: customer.name || '',
      customerType: customer.customerType || 'individual',
      contactPerson: customer.contactPerson || '',
      phone: customer.phone || '',
      email: customer.email || '',
      billingAddress: customer.billingAddress || '',
      state: customer.state || 'Kerala',
      stateCode: customer.stateCode || '32',
      pinCode: customer.pinCode || '',
      gstin: customer.gstin || '',
      vehicleNumbers: customer.vehicleNumbers ? customer.vehicleNumbers.join(', ') : '',
      notes: customer.notes || ''
    });
    setModalError('');
    setIsEditModalOpen(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
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

      const res = await api.updateCustomer(customer._id, {
        ...formData,
        vehicleNumbers: vehicles
      });

      if (res.success) {
        setIsEditModalOpen(false);
        loadCustomerDetails();
      }
    } catch (err: any) {
      setModalError(err.message || 'Failed to update customer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSoftDelete = async () => {
    setDeleting(true);
    try {
      const res = await api.deleteCustomer(customer._id);
      if (res.success) {
        router.push('/customers');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to soft delete customer.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const res = await api.restoreCustomer(customer._id);
      if (res.success) {
        loadCustomerDetails();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to restore customer.');
    } finally {
      setRestoring(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-gray-400">Loading customer profile...</div>;
  }

  if (error || !customer) {
    return (
      <div className="p-8 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-2xl text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-red-600 dark:text-red-400">{error || 'Customer not found.'}</p>
        <Link
          href="/customers"
          className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </Link>
      </div>
    );
  }

  const isSoftDeleted = customer.isdelete?.status === true;

  return (
    <div className="space-y-6">
      {/* Soft Delete Warning Banner if in trash */}
      {isSoftDeleted && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2.5">
            <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-xs md:text-sm font-bold">This customer profile is in the Trash</p>
              <p className="text-[11px] text-red-500">
                Deleted on {customer.isdelete?.datetime ? new Date(customer.isdelete.datetime).toLocaleString('en-IN') : 'recently'}.
              </p>
            </div>
          </div>
          <button
            onClick={handleRestore}
            disabled={restoring}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{restoring ? 'Restoring...' : 'Restore Customer'}</span>
          </button>
        </div>
      )}

      {/* Top back navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {!isSoftDeleted && (
            <>
              <button
                onClick={handleOpenEditModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-xl shadow-sm transition-all"
                title="Edit Customer Details"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 hover:bg-red-100 text-red-700 dark:text-red-300 text-xs font-semibold rounded-xl shadow-sm transition-all"
                title="Move Customer to Trash"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </>
          )}

          <Link
            href={`/invoices/create?customerId=${customer._id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#F52B2B] hover:bg-[#DC2626] text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Invoice</span>
          </Link>
          <Link
            href={`/quotations/create?customerId=${customer._id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Quotation</span>
          </Link>
        </div>
      </div>

      {/* Customer Profile Header Card */}
      <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                {customer.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {customer.customerType}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.gstin && (
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-bold">GSTIN:</span>
                  <span>{customer.gstin}</span>
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="whitespace-pre-line">{customer.billingAddress}</span>
            </div>
          </div>

          {/* 3 Metric Mini Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-center">
              <span className="block text-[10px] uppercase font-bold text-gray-400">Invoiced</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white mt-0.5 block">
                ₹ {customer.totalInvoiced?.toLocaleString('en-IN') || 0}
              </span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-center">
              <span className="block text-[10px] uppercase font-bold text-gray-400">Paid</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                ₹ {customer.totalPaid?.toLocaleString('en-IN') || 0}
              </span>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-center">
              <span className="block text-[10px] uppercase font-bold text-gray-400">Outstanding</span>
              <span
                className={`text-sm font-bold mt-0.5 block ${
                  customer.outstandingBalance > 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'
                }`}
              >
                ₹ {customer.outstandingBalance?.toLocaleString('en-IN') || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Associated Vehicles & POs */}
        {(customer.vehicleNumbers?.length > 0 || customer.purchaseOrders?.length > 0) && (
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-4 text-xs">
            {customer.vehicleNumbers?.length > 0 && (
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-red-500" />
                <span className="text-gray-400">Vehicles:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {customer.vehicleNumbers.join(', ')}
                </span>
              </div>
            )}
            {customer.purchaseOrders?.length > 0 && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className="text-gray-400">Purchase Orders:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {customer.purchaseOrders.join(', ')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document History Tabs / Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Previous Invoices */}
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#F52B2B]" /> Invoices ({invoices.length})
            </h2>
          </div>

          {invoices.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No invoices issued yet.</p>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <Link
                  key={inv._id}
                  href={`/invoices/${inv._id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#0E1522] hover:bg-red-50 dark:hover:bg-red-950/20 transition-all border border-gray-100 dark:border-gray-800 group"
                >
                  <div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-[#F52B2B] transition-colors">
                      {inv.invoiceNumber}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {inv.invoiceDate} {inv.vehicleNumber ? `• ${inv.vehicleNumber}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-gray-900 dark:text-white">
                      ₹ {inv.totalAmount?.toLocaleString('en-IN')}
                    </div>
                    <span
                      className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inv.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : inv.paymentStatus === 'partially_paid'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                      }`}
                    >
                      {inv.paymentStatus}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Previous Quotations */}
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-500" /> Quotations ({quotations.length})
            </h2>
          </div>

          {quotations.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No quotations created yet.</p>
          ) : (
            <div className="space-y-3">
              {quotations.map((q) => (
                <Link
                  key={q._id}
                  href={`/quotations/${q._id}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#0E1522] hover:bg-gray-100 dark:hover:bg-gray-800/40 transition-all border border-gray-100 dark:border-gray-800 group"
                >
                  <div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors">
                      {q.quotationNumber}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      {q.quotationDate} • {q.serviceTitle || q.vehicleProjectName || 'Quotation'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-gray-900 dark:text-white">
                      ₹ {q.totalAmount?.toLocaleString('en-IN')}
                    </div>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                      {q.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Customer Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsEditModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Edit Customer Details
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="p-6 overflow-y-auto space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Customer Type */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, customerType: 'individual' })}
                  className={`p-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    formData.customerType === 'individual'
                      ? 'border-[#F52B2B] bg-red-50/50 dark:bg-red-950/30 text-[#F52B2B]'
                      : 'border-gray-200 dark:border-[#233048] text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Individual Person
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, customerType: 'company' })}
                  className={`p-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    formData.customerType === 'company'
                      ? 'border-[#F52B2B] bg-red-50/50 dark:bg-red-950/30 text-[#F52B2B]'
                      : 'border-gray-200 dark:border-[#233048] text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Company / Organization
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  {formData.customerType === 'company' ? 'Company Name' : 'Customer Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20 focus:border-[#F52B2B]"
                />
              </div>

              {formData.customerType === 'company' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20 focus:border-[#F52B2B]"
                  />
                </div>
              )}

              {/* Phone & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20 focus:border-[#F52B2B]"
                  />
                </div>
              </div>

              {/* GSTIN */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  GSTIN (Optional)
                </label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  maxLength={15}
                  placeholder="e.g. 32AAAAA0000A1Z5"
                  className="w-full px-3.5 py-2 text-sm uppercase font-mono bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20 focus:border-[#F52B2B]"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Billing Address
                </label>
                <textarea
                  rows={2}
                  value={formData.billingAddress}
                  onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20 focus:border-[#F52B2B]"
                />
              </div>

              {/* State & Pincode */}
              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    PIN Code
                  </label>
                  <input
                    type="text"
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    maxLength={6}
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
                  onClick={() => setIsEditModalOpen(false)}
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
                    'Update Customer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                  Move Customer to Trash?
                </h3>
                <p className="text-xs text-gray-500">Soft-delete confirmation</p>
              </div>
            </div>

            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Customer <strong className="text-gray-900 dark:text-white">{customer.name}</strong> will be moved to the Trash. You can restore them anytime from the Trash tab on the customers page.
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
