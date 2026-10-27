'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  User,
  X,
  FileText,
  FileSpreadsheet,
  Users
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

interface HeaderProps {
  onToggleSidebar?: () => void;
  onOpenMobileDrawer?: () => void;
}

export function Header({ onToggleSidebar, onOpenMobileDrawer }: HeaderProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    invoices: any[];
    quotations: any[];
    customers: any[];
  }>({ invoices: [], quotations: [], customers: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ invoices: [], quotations: [], customers: [] });
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [invRes, quoRes, custRes] = await Promise.all([
          api.listInvoices({ search: query, limit: 3 }),
          api.listQuotations({ search: query, limit: 3 }),
          api.listCustomers({ search: query, limit: 3 })
        ]);
        setResults({
          invoices: invRes.invoices || [],
          quotations: quoRes.quotations || [],
          customers: custRes.customers || []
        });
        setShowDropdown(true);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const hasResults =
    results.invoices.length > 0 ||
    results.quotations.length > 0 ||
    results.customers.length > 0;

  return (
    <header className="h-16 md:h-20 bg-white dark:bg-[#0E1522] border-b border-gray-200 dark:border-[#1F293D] px-4 md:px-8 flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Left: Mobile hamburger & logo / Desktop collapse toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileDrawer || onToggleSidebar}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#161E2E] transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile brand logo */}
        <div className="md:hidden flex items-center">
          <Link href="/">
            <img src="/assets/logo.png" alt="DEVI MOTORS" className="h-8 w-auto object-contain" />
          </Link>
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-xl mx-4 relative" ref={searchRef}>
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim() && setShowDropdown(true)}
            placeholder="Search by invoice no, customer, vehicle no, PO, etc..."
            className="w-full pl-10 pr-9 py-2 md:py-2.5 text-xs md:text-sm bg-gray-50 dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-xl text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F52B2B]/20 focus:border-[#F52B2B] transition-all"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setShowDropdown(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && query.trim() && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#161E2E] border border-gray-200 dark:border-[#233048] rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
            {isSearching ? (
              <div className="p-4 text-center text-xs text-gray-400">Searching records...</div>
            ) : !hasResults ? (
              <div className="p-4 text-center text-xs text-gray-400">No matching records found.</div>
            ) : (
              <div className="max-h-80 overflow-y-auto p-2 space-y-2">
                {results.invoices.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-red-500" /> Invoices
                    </div>
                    {results.invoices.map((inv) => (
                      <Link
                        key={inv._id}
                        href={`/invoices/${inv._id}`}
                        onClick={() => setShowDropdown(false)}
                        className="block px-3 py-2 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {inv.invoiceNumber}
                          </span>
                          <span className="text-[#F52B2B] font-bold">
                            ₹ {inv.totalAmount?.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="text-gray-500 text-[11px]">
                          {inv.customer?.name} {inv.vehicleNumber ? `• ${inv.vehicleNumber}` : ''}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {results.quotations.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" /> Quotations
                    </div>
                    {results.quotations.map((q) => (
                      <Link
                        key={q._id}
                        href={`/quotations/${q._id}`}
                        onClick={() => setShowDropdown(false)}
                        className="block px-3 py-2 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {q.quotationNumber}
                          </span>
                          <span className="text-gray-700 dark:text-gray-200 font-bold">
                            ₹ {q.totalAmount?.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="text-gray-500 text-[11px]">
                          {q.customer?.name} • {q.serviceTitle || q.vehicleProjectName || 'Quotation'}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {results.customers.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2 py-1 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-green-500" /> Customers
                    </div>
                    {results.customers.map((c) => (
                      <Link
                        key={c._id}
                        href={`/customers/${c._id}`}
                        onClick={() => setShowDropdown(false)}
                        className="block px-3 py-2 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <div className="font-semibold text-gray-900 dark:text-white">{c.name}</div>
                        <div className="text-gray-500 text-[11px]">
                          {c.phone} {c.vehicleNumbers?.length ? `• ${c.vehicleNumbers.join(', ')}` : ''}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Action Icons & Profile */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#161E2E] transition-colors"
          title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#161E2E] transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#F52B2B] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              1
            </span>
          </button>
        </div>

        {/* Admin Profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200 dark:border-gray-800">
          <div className="w-9 h-9 rounded-full bg-gray-900 dark:bg-gray-700 text-white flex items-center justify-center font-bold text-sm">
            <User className="w-5 h-5" />
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
              {user?.name || 'Admin'}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">
              Super Admin
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
