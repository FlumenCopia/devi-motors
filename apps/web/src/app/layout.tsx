import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'DEVI MOTORS — Invoice & Customer Management',
  description:
    'Invoice, Quotation, and Customer Management System for DEVI MOTORS, Thiruvananthapuram, Kerala.',
  manifest: '/manifest.json',
  icons: {
    icon: '/assets/logo.png',
    apple: '/assets/logo.png'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Devi Motors'
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#F52B2B'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider>
          <AuthProvider>
            <AppLayout>{children}</AppLayout>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

// Devi Motors Production Web Application
