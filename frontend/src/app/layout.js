import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import SWRegister from '@/components/SWRegister';

export const metadata = {
  title: 'RoleFit — AI Resume Tailoring',
  description: 'AI-powered resume tailoring platform. Generate ATS-optimized resumes tailored for specific job roles.',
  icons: {
    icon: [
      { url: '/favicon.ico?v=3' },
      { url: '/favicon.png?v=3', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-512x512.png' },
    ],
  },
};

import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="preload" href="/logo-wide.png" as="image" />
        <link rel="icon" type="image/png" href="/favicon.png?v=3" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=3" />
        <link rel="shortcut icon" href="/favicon.ico?v=3" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
        
        {/* Performance Optimizations */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SWRegister />
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
