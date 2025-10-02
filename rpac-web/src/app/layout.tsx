import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Navigation } from '@/components/navigation';
import { t } from '@/lib/locales';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: t('metadata.app_title'),
  description: t('metadata.app_description'),
  keywords: [t('metadata.keywords_crisis'), t('metadata.keywords_resilience'), t('metadata.keywords_swedish'), t('metadata.keywords_ai'), t('metadata.keywords_community'), t('metadata.keywords_help')],
  authors: [{ name: 'RPAC Team' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3D4A2B',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen relative">
            {/* Military-crisis background with subtle, professional patterns */}
            <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"></div>
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(61,74,43,0.02),transparent_50%)]"></div>
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(44,74,92,0.02),transparent_50%)]"></div>
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(92,74,44,0.02),transparent_50%)]"></div>
            
            {/* Main content with modern spacing */}
            <div className="relative z-10">
              <Navigation />
              <main className="pt-20" style={{ scrollBehavior: 'auto' }}>
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}