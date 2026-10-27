'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode (already installed as PWA)
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isInStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if user dismissed previously
    const dismissedAt = localStorage.getItem('dm_pwa_dismissed');
    if (dismissedAt) {
      const diff = Date.now() - parseInt(dismissedAt, 10);
      if (diff < 3 * 24 * 60 * 60 * 1000) {
        // Dismissed within last 3 days
        return;
      }
    }

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // If iOS and not standalone, show prompt after a short delay
    if (isIosDevice && !isInStandaloneMode) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('dm_pwa_dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-sm z-50 animate-in slide-in-from-bottom duration-200">
      <div className="p-4 bg-gray-900 text-white dark:bg-[#161E2E] dark:border dark:border-[#233048] rounded-2xl shadow-2xl flex items-start justify-between gap-3 border border-gray-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F52B2B] text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-white">
              Install Devi Motors App
            </p>
            <p className="text-[11px] text-gray-300">
              {isIOS ? (
                <span className="flex items-center gap-1 flex-wrap">
                  Tap Share <Share className="w-3 h-3 inline text-[#F52B2B]" /> and choose &quot;Add to Home Screen&quot;
                </span>
              ) : (
                'Add to your home screen for quick, offline-ready invoicing on mobile.'
              )}
            </p>
            {!isIOS && deferredPrompt && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F52B2B] hover:bg-[#DC2626] text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install Now</span>
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="text-gray-400 hover:text-white p-1"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
