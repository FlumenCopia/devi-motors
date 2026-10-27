'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  FileSpreadsheet,
  Car,
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Quotations', href: '/quotations', icon: FileSpreadsheet },
    { name: 'Vehicles / Orders', href: '/vehicles', icon: Car },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings }
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`hidden md:flex flex-col justify-between border-r transition-all duration-200 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      } bg-white dark:bg-[#0E1522] border-gray-200 dark:border-[#1F293D] min-h-screen fixed left-0 top-0 bottom-0`}
    >
      <div>
        {/* Brand Header */}
        <div className="h-20 flex items-center px-5 border-b border-gray-100 dark:border-[#1F293D]/60">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/assets/logo.png"
              alt="DEVI MOTORS"
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Navigation items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                  active
                    ? 'bg-[#F52B2B] text-white shadow-sm shadow-[#F52B2B]/20 font-medium'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#161E2E] hover:text-gray-900 dark:hover:text-white'
                }`}
                title={collapsed ? item.name : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-[#1F293D]/60">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
