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
  AlertTriangle,
  Heart,
  Leaf,
  Shield,
  MessageCircle,
  ChevronDown, 
  Settings, 
  LogOut
} from 'lucide-react';
import { t } from '@/lib/locales';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [isCrisisMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [communityPulse, setCommunityPulse] = useState(true);
  const [user, setUser] = useState<{
    id: string;
    email?: string;
    user_metadata?: { name?: string };
  } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

    // Community heartbeat pulse
    const pulseInterval = setInterval(() => {
      setCommunityPulse(prev => !prev);
    }, 2000);

    return () => {
      subscription.unsubscribe();
      clearInterval(pulseInterval);
    };
  }, []);

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

  const getTimeOfDayGreeting = () => {
    if (!isClient) return t('dashboard.good_day');
    
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return t('dashboard.good_morning');
    } else if (hour >= 12 && hour < 17) {
      return t('dashboard.good_day');
    } else if (hour >= 17 && hour < 22) {
      return t('dashboard.good_evening');
    } else {
      return t('dashboard.good_night');
    }
  };

  // Professional Crisis Intelligence Navigation
  const navigation = [
    { 
      name: t('navigation.overview'), 
      href: '/dashboard', 
      icon: Home,
      description: t('navigation.descriptions.operational_status'),
      category: t('navigation.categories.command')
    },
    { 
      name: t('navigation.individual'), 
      href: '/individual', 
      icon: Shield,
      description: t('navigation.descriptions.individual_preparedness'),
      category: t('navigation.categories.individual')
    },
    { 
      name: t('navigation.local'), 
      href: '/local', 
      icon: Users,
      description: t('navigation.descriptions.community_resources'),
      category: t('navigation.categories.local')
    },
    { 
      name: t('navigation.regional'), 
      href: '/regional', 
      icon: Globe,
      description: t('navigation.descriptions.regional_coordination'),
      category: t('navigation.categories.regional')
    },
  ];

  useEffect(() => {
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
    <nav className="fixed top-0 left-0 right-0 z-50 flex-shrink-0">
      {/* Professional Military Background */}
      <div className="absolute inset-0 backdrop-blur-sm border-b" style={{ 
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--color-secondary)'
      }}></div>
      
      <div className="relative z-10">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Static Classic Top Menu */}
          <div className="flex items-center justify-between h-16">
            
            {/* Logo Section */}
            <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity duration-200 touch-manipulation">
              <div className="relative">
                <img 
                  src="/beready-logo2.png" 
                  alt="BE READY" 
                  className="h-10 w-auto sm:h-12"
                />
                {/* Professional status indicator */}
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full transition-all duration-500 ${
                  communityPulse ? 'scale-110' : 'scale-100'
                }`} style={{ backgroundColor: 'var(--color-success)' }}>
                  <div className="absolute inset-0 rounded-full animate-pulse opacity-75" style={{ backgroundColor: 'var(--color-success)' }}></div>
                </div>
              </div>
            </Link>

            {/* Static Navigation Menu */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {isClient && navigation.map((item, index) => {
                const normalizedPathname = pathname.replace(/\/$/, '') || '/';
                const normalizedHref = item.href.replace(/\/$/, '') || '/';
                const isActive = normalizedPathname === normalizedHref || 
                               (normalizedHref === '/dashboard' && normalizedPathname === '') ||
                               (normalizedHref === '/dashboard' && normalizedPathname === '/');
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 touch-manipulation ${
                      isActive
                        ? 'shadow-sm'
                        : 'hover:shadow-sm'
                    }`}
                    style={{
                      backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                      color: isActive ? 'white' : 'var(--text-primary)'
                    }}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Status and User Section */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              
              {/* Connection Status */}
              <div className={`flex items-center space-x-2 rounded-lg text-xs px-3 py-1 ${
                isOnline 
                  ? 'shadow-sm' 
                  : 'animate-pulse'
              }`} style={{
                backgroundColor: isOnline ? 'var(--bg-olive-light)' : 'rgba(139, 69, 19, 0.1)',
                color: isOnline ? 'var(--color-primary)' : 'var(--color-danger)'
              }}>
                {isOnline ? (
                  <>
                    <Wifi className="w-4 h-4" />
                    <span className="font-semibold hidden sm:inline">Online</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4" />
                    <span className="font-semibold hidden sm:inline">Offline</span>
                  </>
                )}
              </div>

              {/* Crisis Mode Alert */}
              {isCrisisMode && (
                <div className="flex items-center space-x-2 rounded-lg text-xs font-semibold animate-pulse px-3 py-1" style={{
                  backgroundColor: 'rgba(139, 69, 19, 0.1)',
                  color: 'var(--color-danger)'
                }}>
                  <AlertTriangle className="w-4 h-4" />
                  <span className="hidden sm:inline">Krisläge</span>
                </div>
              )}

              {/* User Menu */}
              {user && (
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 rounded-lg transition-all duration-300 border px-3 py-2 touch-manipulation"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--color-muted)'
                    }}
                  >
                    <div className="rounded-lg flex items-center justify-center font-bold text-white w-6 h-6 text-xs" style={{ 
                      backgroundColor: 'var(--color-primary)' 
                    }}>
                      {(user.user_metadata?.name || user.email || 'V').charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {user.user_metadata?.name || user.email?.split('@')[0] || t('dashboard.default_user')}
                      </div>
                    </div>
                    <ChevronDown className={`transition-transform ${showUserMenu ? 'rotate-180' : ''} w-3 h-3`} style={{ color: 'var(--text-tertiary)' }} />
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 sm:w-56 rounded-lg shadow-lg border py-2 z-50" style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--color-muted)'
                    }}>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          router.push('/settings');
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm transition-colors hover:bg-gray-50 touch-manipulation" 
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <Settings className="w-4 h-4" />
                        <span>{t('navigation.settings')}</span>
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm transition-colors hover:bg-gray-50 touch-manipulation"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('navigation.sign_out')}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
