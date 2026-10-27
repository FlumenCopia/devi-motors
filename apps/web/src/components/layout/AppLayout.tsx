'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { MobileDrawer } from './MobileDrawer';
import { useAuth } from '../../context/AuthContext';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // If on login page, render clean full-screen layout
  if (pathname === '/login') {
    return <main className="min-h-screen bg-gray-50 dark:bg-[#0B0F17]">{children}</main>;
  }

  // Redirect to login if unauthenticated once loaded
  if (!loading && !user) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B0F17]">
        <div className="w-8 h-8 border-4 border-[#F52B2B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B0F17]">
        <div className="w-8 h-8 border-4 border-[#F52B2B] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-gray-900 dark:text-gray-100 transition-colors">
      {/* Desktop Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} />

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
      />

      {/* Main Container */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-200 ${
          sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        } pb-16 md:pb-0`}
      >
        <Header
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        />

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
}
