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
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronDown, Settings, LogOut } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [isCrisisMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<{
    id: string;
    email?: string;
    user_metadata?: { name?: string };
  } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Ensure we're on the client side to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
    
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as Element;
        if (!target.closest('.user-menu-container')) {
          setShowUserMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setShowUserMenu(false);
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const navigation = [
    { name: t('navigation.home'), href: '/dashboard', icon: Home },
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

            {/* User Menu */}
            {user && (
              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white p-1">
                    <RPACLogo size="sm" className="text-green-700" />
                  </div>
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {user.user_metadata?.name || user.email}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/settings');
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Inställningar</span>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logga ut</span>
                    </button>
                  </div>
                )}
              </div>
            )}
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
