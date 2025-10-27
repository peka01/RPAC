import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { WeatherProviderWrapper } from '@/components/WeatherProviderWrapper';
import { ResponsiveLayoutWrapper } from '@/components/responsive-layout-wrapper';
import { GlobalLoadingProvider } from '@/components/GlobalLoadingProvider';
import { t } from '@/lib/locales';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: t('metadata.app_title'),
  description: t('metadata.app_description'),
  keywords: [t('metadata.keywords_crisis'), t('metadata.keywords_resilience'), t('metadata.keywords_swedish'), t('metadata.keywords_ai'), t('metadata.keywords_community'), t('metadata.keywords_help')],
  authors: [{ name: 'RPAC Team' }],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '16x16 32x32', type: 'image/x-icon' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon-tp-bg.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
      { url: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.ico',
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
          <WeatherProviderWrapper>
            <GlobalLoadingProvider>
              <ResponsiveLayoutWrapper>
                {children}
              </ResponsiveLayoutWrapper>
            </GlobalLoadingProvider>
          </WeatherProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}