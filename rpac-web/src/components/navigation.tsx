'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  User, 
  Users, 
  Globe, 
  Wifi,
  WifiOff,
  AlertTriangle
} from 'lucide-react';
import { RPACLogo } from './rpac-logo';
import { t } from '@/lib/locales';
import { useState, useEffect } from 'react';
import { SimpleAuth } from './simple-auth';

export function Navigation() {
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(true);
  const [isCrisisMode, setIsCrisisMode] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  const navigation = [
    { name: t('navigation.home'), href: '/', icon: Home },
    { name: t('navigation.individual'), href: '/individual', icon: User },
    { name: t('navigation.local'), href: '/local', icon: Users },
    { name: t('navigation.regional'), href: '/regional', icon: Globe },
  ];

  useEffect(() => {
    // Only run on client side to prevent hydration issues
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return (
    <nav className="modern-nav">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Modern Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg bg-white p-2">
                <RPACLogo size="md" className="text-green-700" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold"
                  style={{ 
                    color: '#3D4A2B'
                  }}>
                BEREDD
              </h1>
            </div>
          </div>

          {/* Modern Status Indicators */}
          <div className="flex items-center space-x-6">
            {/* Connection Status */}
            <div className={`modern-status-indicator ${isOnline ? 'good' : 'critical'}`}>
              {isOnline ? (
                <Wifi className="w-5 h-5" />
              ) : (
                <WifiOff className="w-5 h-5" />
              )}
              <span className="text-sm font-semibold">
                {isOnline ? t('status.online') : t('status.offline')}
              </span>
            </div>

            {/* Crisis Mode Indicator */}
            {isCrisisMode && (
              <div className="modern-status-indicator critical">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-semibold">
                  {t('ui.krislage_aktivit')}
                </span>
              </div>
            )}

            {/* Auth Component */}
            <div className="ml-auto">
              <SimpleAuth />
            </div>
          </div>
        </div>

        {/* Modern Navigation Links */}
        <div className="flex flex-wrap gap-3 pb-6">
          {isClient && navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group relative flex items-center space-x-3 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  isActive
                    ? 'shadow-lg'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:shadow-md'
                }`}
                style={isActive ? { 
                  background: 'linear-gradient(135deg, #3D4A2B 0%, #2A331E 100%)',
                  boxShadow: '0 4px 16px rgba(61, 74, 43, 0.25)',
                  color: 'white'
                } : {}}
              >
                <item.icon 
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`}
                  style={isActive ? { color: 'white' } : {}}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
