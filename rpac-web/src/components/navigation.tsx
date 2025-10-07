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
import { NotificationCenterResponsive } from './notification-center-responsive';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [isCrisisMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [communityPulse, setCommunityPulse] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
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
      {/* Minimal-ink background */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: '#FFFFFF' }}
      ></div>

      <div className="relative z-10">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Prominent Top Menu */}
          <div className="flex items-center justify-between h-20">
            {/* Logo Section */}
            <Link
              href="/dashboard"
              className="flex items-center space-x-3 hover:opacity-90 transition-opacity duration-200 touch-manipulation"
            >
              <div className="relative">
                <img
                  src="/beready-logo2.png"
                  alt="BE READY"
                  className="h-14 w-auto"
                />
                {/* Subtle status indicator */}
                <div
                  className={`absolute -top-1 -right-1 w-3 h-3 rounded-full transition-all duration-500 ${
                    communityPulse ? 'scale-110' : 'scale-100'
                  }`}
                  style={{ backgroundColor: 'var(--color-success)' }}
                >
                  <div
                    className="absolute inset-0 rounded-full animate-pulse opacity-75"
                    style={{ backgroundColor: 'var(--color-success)' }}
                  ></div>
                </div>
              </div>
            </Link>

          {/* Navigation Items - minimal ink (no boxes/underlines) */}
          <div className="flex items-center gap-2">
              {isClient &&
                navigation.map((item) => {
                  const normalizedPathname = pathname.replace(/\/$/, '') || '/';
                  const normalizedHref = item.href.replace(/\/$/, '') || '/';
                  const isActiveBasic =
                    normalizedPathname === normalizedHref ||
                    (normalizedHref === '/dashboard' && (normalizedPathname === '' || normalizedPathname === '/'));
                  const isDescendant =
                    normalizedHref !== '/' && normalizedPathname.startsWith(normalizedHref + '/');
                  const isActive = isActiveBasic || isDescendant;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`group relative flex items-center gap-3 px-5 py-3 transition-all duration-200 touch-manipulation`}
                      style={{
                        color: isActive ? '#2A331E' : 'var(--text-primary)'
                      }}
                    >
                      <span className="relative flex items-center justify-center">
                        {isActive && (
                          <span className="absolute -inset-2 rounded-full" style={{ backgroundColor: 'rgba(61,74,43,0.12)' }}></span>
                        )}
                        <item.icon className={`relative transition-all duration-200 ${isActive ? 'w-6 h-6 drop-shadow-md' : 'w-5 h-5 group-hover:drop-shadow'} group-hover:translate-y-[-1px] ${!isActive && 'group-hover:scale-105'}`} />
                      </span>
                      <span className={`text-base hidden md:inline ${isActive ? 'font-bold' : 'font-semibold'}`}>{item.name}</span>
                    </Link>
                  );
                })}
            </div>

            {/* Status and User Section */}
            <div className="flex items-center gap-3">
              
              {/* Crisis Mode Alert - Only show in crisis mode */}
              {isCrisisMode && (
                <div className="flex items-center space-x-2 rounded-lg text-xs font-semibold animate-pulse px-3 py-1" style={{
                  backgroundColor: 'rgba(139, 69, 19, 0.1)',
                  color: 'var(--color-danger)'
                }}>
                  <AlertTriangle className="w-4 h-4" />
                  <span className="hidden sm:inline">Krisläge</span>
                </div>
              )}

              {/* Notification Center */}
              {user && (
                <NotificationCenterResponsive
                  user={user}
                  onNotificationClick={(notification) => {
                    // Handle notification click - navigate to relevant page
                    if (notification.action_url) {
                      router.push(notification.action_url);
                    } else {
                      // Default navigation based on notification type
                      switch (notification.type) {
                        case 'message':
                        case 'emergency':
                          router.push('/local?tab=messaging');
                          break;
                        case 'resource_request':
                          router.push('/local?tab=resources');
                          break;
                        case 'system':
                          router.push('/dashboard');
                          break;
                      }
                    }
                  }}
                />
              )}

              {/* User Menu */}
              {user && (
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 transition-all duration-300 px-1 py-1 touch-manipulation"
                  >
                    <div className="rounded-lg flex items-center justify-center font-bold text-white w-8 h-8 text-sm" style={{ 
                      backgroundColor: 'var(--color-primary)' 
                    }}>
                      {(user.user_metadata?.name || user.email || 'V').charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {user.user_metadata?.name || user.email?.split('@')[0] || t('dashboard.default_user')}
                      </div>
                    </div>
                    <ChevronDown className={`transition-transform ${showUserMenu ? 'rotate-180' : ''} w-4 h-4`} style={{ color: 'var(--text-tertiary)' }} />
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-lg shadow-lg border py-2 z-50" style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--color-muted)'
                    }}>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          router.push('/settings');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-base transition-colors hover:bg-gray-50 touch-manipulation" 
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <Settings className="w-5 h-5" />
                        <span>{t('navigation.settings')}</span>
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 text-base transition-colors hover:bg-gray-50 touch-manipulation"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <LogOut className="w-5 h-5" />
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
