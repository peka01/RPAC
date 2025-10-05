import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { WeatherProviderWrapper } from '@/components/WeatherProviderWrapper';
import { ResponsiveLayoutWrapper } from '@/components/responsive-layout-wrapper';
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
            {/* Modern, clear olive-tinted background (no blue) */}
            <div className="fixed inset-0 bg-gradient-to-br from-[#F8FAF7] via-white to-[#F3F6EE] dark:from-[#0F130B] dark:via-[#141A0E] dark:to-[#0F130B]"></div>
            <div className="fixed inset-0 bg-[radial-gradient(1200px_800px_at_20%_15%,rgba(61,74,43,0.04),transparent_60%)]"></div>
            <div className="fixed inset-0 bg-[radial-gradient(1000px_700px_at_80%_70%,rgba(92,107,71,0.03),transparent_60%)]"></div>
            
            {/* Main content with modern spacing */}
            <div className="relative z-10">
              <WeatherProviderWrapper>
                <ResponsiveLayoutWrapper>
                  {children}
                </ResponsiveLayoutWrapper>
              </WeatherProviderWrapper>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}