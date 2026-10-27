'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Receipt,
  Landmark,
  Image as ImageIcon,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon
} from 'lucide-react';
import { api } from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { AUTOMOTIVE_HSN_CODES } from '@/shared';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const [settings, setSettings] = useState<any>({
    companyName: 'DEVI MOTORS',
    tagline: 'Professional Car Painting, Polishing & Detailing',
    addressLine1: 'T.C 17/2456-1, Opp.Rajiv Gandhi Centre for Bio Technology',
    addressLine2: 'Jagathy, Thycaud P.O, Thiruvananthapuram',
    state: 'Kerala',
    stateCode: '32',
    pinCode: '695014',
    phone: '9447138617',
    email: 'devi.motors.tvm@gmail.com',
    gstin: '32BAAPJ2054E1ZG',
    defaultHsn: '998714',
    bankDetails: {
      bankName: 'IndusInd Bank',
      branch: 'Poojappura, Trivandrum Branch',
      accountNumber: '259447138617',
      ifscCode: 'INDB0001480',
      gpay: '9447138617'
    },
    invoicePrefix: 'DM',
    quotationPrefix: 'DQ',
    defaultPaymentTerms: 'Immediate upon invoice submission'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.getSettings();
      if (res.success && res.settings) {
        setSettings(res.settings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.updateSettings(settings);
      if (res.success) {
        setSuccessMsg('Settings updated successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-sm text-gray-400">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
          Company Settings
        </h1>
        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Configure legal details, GST rates, bank accounts, and PDF document branding
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2.5 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Business Information */}
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 md:p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
            <Building2 className="w-4 h-4 text-[#F52B2B]" />
            <span>Business Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Company Legal Name
              </label>
              <input
                type="text"
                required
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Tagline / Service Scope
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Address Line 1
              </label>
              <input
                type="text"
                required
                value={settings.addressLine1}
                onChange={(e) => setSettings({ ...settings, addressLine1: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Address Line 2 (Area, City)
              </label>
              <input
                type="text"
                required
                value={settings.addressLine2}
                onChange={(e) => setSettings({ ...settings, addressLine2: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                required
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* 2. Tax & Numbering Settings */}
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 md:p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
            <Receipt className="w-4 h-4 text-[#F52B2B]" />
            <span>Taxation & Document Numbering</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Company GSTIN *
              </label>
              <input
                type="text"
                required
                value={settings.gstin}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3.5 py-2 text-sm uppercase bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Default Service HSN/SAC Code
              </label>
              <select
                value={
                  AUTOMOTIVE_HSN_CODES.some((c) => c.code === settings.defaultHsn)
                    ? settings.defaultHsn
                    : 'custom'
                }
                onChange={(e) => {
                  if (e.target.value !== 'custom') {
                    setSettings({ ...settings, defaultHsn: e.target.value });
                  }
                }}
                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
              >
                <optgroup label="Devi Motors Primary Codes">
                  {AUTOMOTIVE_HSN_CODES.filter((c) => c.isPrimary).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.label} ({c.type})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Related Automotive Codes">
                  {AUTOMOTIVE_HSN_CODES.filter((c) => !c.isPrimary).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.label} ({c.type})
                    </option>
                  ))}
                </optgroup>
                <option value="custom">+ Custom HSN/SAC Code</option>
              </select>

              {(!AUTOMOTIVE_HSN_CODES.some((c) => c.code === settings.defaultHsn) ||
                settings.defaultHsn === '') && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={settings.defaultHsn}
                    onChange={(e) =>
                      setSettings({ ...settings, defaultHsn: e.target.value.replace(/\D/g, '') })
                    }
                    placeholder="Enter custom 4-8 digit HSN/SAC code"
                    className="w-full px-3 py-1.5 text-xs font-mono bg-white dark:bg-[#0E1522] border border-red-300 dark:border-red-900/50 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                State Code (Kerala = 32)
              </label>
              <input
                type="text"
                value={settings.stateCode}
                onChange={(e) => setSettings({ ...settings, stateCode: e.target.value })}
                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Invoice Prefix
              </label>
              <input
                type="text"
                value={settings.invoicePrefix}
                onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                className="w-full px-3.5 py-2 text-sm uppercase bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Format: DM/08/26-27</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Quotation Prefix
              </label>
              <input
                type="text"
                value={settings.quotationPrefix}
                onChange={(e) => setSettings({ ...settings, quotationPrefix: e.target.value })}
                className="w-full px-3.5 py-2 text-sm uppercase bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Format: DQ/05/26-27</span>
            </div>
          </div>
        </div>

        {/* 3. Bank Account Details */}
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 md:p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
            <Landmark className="w-4 h-4 text-[#F52B2B]" />
            <span>Bank & Payment Details</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                required
                value={settings.bankDetails?.bankName}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bankDetails: { ...settings.bankDetails, bankName: e.target.value }
                  })
                }
                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Branch
              </label>
              <input
                type="text"
                value={settings.bankDetails?.branch}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bankDetails: { ...settings.bankDetails, branch: e.target.value }
                  })
                }
                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Account Number *
              </label>
              <input
                type="text"
                required
                value={settings.bankDetails?.accountNumber}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bankDetails: { ...settings.bankDetails, accountNumber: e.target.value }
                  })
                }
                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                IFSC Code *
              </label>
              <input
                type="text"
                required
                value={settings.bankDetails?.ifscCode}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bankDetails: {
                      ...settings.bankDetails,
                      ifscCode: e.target.value.toUpperCase()
                    }
                  })
                }
                className="w-full px-3.5 py-2 text-sm uppercase bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                GPay / UPI Mobile Number
              </label>
              <input
                type="text"
                value={settings.bankDetails?.gpay}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bankDetails: { ...settings.bankDetails, gpay: e.target.value }
                  })
                }
                className="w-full px-3.5 py-2 text-sm bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* 4. Branding & Stamp/Signature Preview */}
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 md:p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3">
            <ImageIcon className="w-4 h-4 text-[#F52B2B]" />
            <span>Document Branding & Signature Assets</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-center">
              <span className="text-xs font-bold text-gray-500 block mb-2">Company Logo</span>
              <img
                src="/assets/logo.png"
                alt="Logo"
                className="h-12 w-auto mx-auto object-contain"
              />
            </div>

            <div className="p-4 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-center">
              <span className="text-xs font-bold text-gray-500 block mb-2">Circular Stamp</span>
              <img
                src="/assets/stamp.jpg"
                alt="Stamp"
                className="h-14 w-auto mx-auto object-contain rounded-full"
              />
            </div>

            <div className="p-4 bg-gray-50 dark:bg-[#0E1522] border border-gray-200 dark:border-[#233048] rounded-xl text-center">
              <span className="text-xs font-bold text-gray-500 block mb-2">
                Authorized Signature
              </span>
              <img
                src="/assets/signature.jpg"
                alt="Signature"
                className="h-12 w-auto mx-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* 5. Application Theme Preferences */}
        <div className="bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] p-5 md:p-6 rounded-2xl shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Theme Preference</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`px-4 py-2 text-xs font-bold rounded-xl border flex items-center gap-2 ${
                theme === 'light'
                  ? 'bg-red-50 text-[#F52B2B] border-[#F52B2B]'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
              }`}
            >
              <Sun className="w-4 h-4" /> Light Mode
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`px-4 py-2 text-xs font-bold rounded-xl border flex items-center gap-2 ${
                theme === 'dark'
                  ? 'bg-red-50 text-[#F52B2B] border-[#F52B2B]'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
              }`}
            >
              <Moon className="w-4 h-4" /> Dark Mode
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[#F52B2B] hover:bg-[#DC2626] text-white text-xs md:text-sm font-semibold rounded-xl shadow-md shadow-[#F52B2B]/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
