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
  MessageCircle
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
  const [communityPulse, setCommunityPulse] = useState(true);
  const [user, setUser] = useState<{
    id: string;
    email?: string;
    user_metadata?: { name?: string };
  } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex-shrink-0">
      {/* Professional Military Background */}
      <div className="absolute inset-0 backdrop-blur-sm border-b" style={{ 
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--color-secondary)'
      }}></div>
      
      <div className="relative z-10">
        <div className="container mx-auto px-6">
          {/* Professional Header */}
          <div className={`flex items-center justify-between transition-all duration-300 ${isScrolled ? 'h-12' : 'h-16'}`}>
            
            {/* Authority Logo */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className={`flex items-center justify-center rounded-lg shadow-md p-2 transition-all duration-300 ${
                  isScrolled ? 'w-8 h-8' : 'w-12 h-12'
                }`} style={{ 
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)' 
                }}>
                  <RPACLogo size={isScrolled ? "sm" : "md"} className="text-white" />
                </div>
                {/* Professional status indicator */}
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full transition-all duration-500 ${
                  communityPulse ? 'scale-110' : 'scale-100'
                }`} style={{ backgroundColor: 'var(--color-success)' }}>
                  <div className="absolute inset-0 rounded-full animate-pulse opacity-75" style={{ backgroundColor: 'var(--color-success)' }}></div>
                </div>
              </div>
              <div>
                <h1 className={`font-bold transition-all duration-300 ${
                  isScrolled ? 'text-2xl' : 'text-4xl'
                }`} style={{ color: 'var(--text-primary)' }}>
                  BEREDD
                </h1>
              </div>
            </div>

            {/* Inline Navigation Items - Only when scrolled */}
            {isScrolled && (
              <div className="flex items-center space-x-2">
                {isClient && navigation.slice(0, 4).map((item, index) => {
                  const normalizedPathname = pathname.replace(/\/$/, '') || '/';
                  const normalizedHref = item.href.replace(/\/$/, '') || '/';
                  const isActive = normalizedPathname === normalizedHref || 
                                 (normalizedHref === '/dashboard' && normalizedPathname === '') ||
                                 (normalizedHref === '/dashboard' && normalizedPathname === '/');
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${
                        isActive
                          ? 'shadow-sm'
                          : 'hover:shadow-sm'
                      }`}
                      style={{
                        backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                        color: isActive ? 'white' : 'var(--text-primary)'
                      }}
                    >
                      <item.icon className="w-3 h-3" />
                      <span className="hidden lg:inline">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Professional Status Bar */}
            <div className="flex items-center space-x-3">
              
              {/* Connection Status */}
              <div className={`flex items-center space-x-2 rounded-lg text-xs transition-all duration-300 ${
                isScrolled ? 'px-2 py-1' : 'px-3 py-1'
              } ${
                isOnline 
                  ? 'shadow-sm' 
                  : 'animate-pulse'
              }`} style={{
                backgroundColor: isOnline ? 'var(--bg-olive-light)' : 'rgba(139, 69, 19, 0.1)',
                color: isOnline ? 'var(--color-primary)' : 'var(--color-danger)'
              }}>
                {isOnline ? (
                  <>
                    <Wifi className={isScrolled ? "w-3 h-3" : "w-4 h-4"} />
                    {!isScrolled && <span className="font-semibold">Online</span>}
                  </>
                ) : (
                  <>
                    <WifiOff className={isScrolled ? "w-3 h-3" : "w-4 h-4"} />
                    {!isScrolled && <span className="font-semibold">Offline</span>}
                  </>
                )}
              </div>

              {/* Crisis Mode Alert */}
              {isCrisisMode && (
                <div className={`flex items-center space-x-2 rounded-lg text-xs font-semibold animate-pulse transition-all duration-300 ${
                  isScrolled ? 'px-2 py-1' : 'px-3 py-1'
                }`} style={{
                  backgroundColor: 'rgba(139, 69, 19, 0.1)',
                  color: 'var(--color-danger)'
                }}>
                  <AlertTriangle className={isScrolled ? "w-3 h-3" : "w-4 h-4"} />
                  {!isScrolled && <span>Krisläge</span>}
                </div>
              )}

              {/* Professional User Menu */}
              {user && (
                <div className="relative user-menu-container">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`flex items-center space-x-2 rounded-lg transition-all duration-300 border ${
                      isScrolled ? 'px-2 py-1.5' : 'px-3 py-2'
                    }`}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--color-muted)'
                    }}
                  >
                    <div className={`rounded-lg flex items-center justify-center font-bold text-white transition-all duration-300 ${
                      isScrolled ? 'w-5 h-5 text-xs' : 'w-6 h-6 text-xs'
                    }`} style={{ 
                      backgroundColor: 'var(--color-primary)' 
                    }}>
                      {(user.user_metadata?.name || user.email || 'V').charAt(0).toUpperCase()}
                    </div>
                    {!isScrolled && (
                      <div className="text-left">
                        <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {getTimeOfDayGreeting()}, {user.user_metadata?.name || user.email?.split('@')[0] || t('dashboard.default_user')}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {t('dashboard.status_line')}
                        </div>
                      </div>
                    )}
                    <ChevronDown className={`transition-transform ${showUserMenu ? 'rotate-180' : ''} ${
                      isScrolled ? 'w-3 h-3' : 'w-3 h-3'
                    }`} style={{ color: 'var(--text-tertiary)' }} />
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-lg shadow-lg border py-2 z-50" style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--color-muted)'
                    }}>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          router.push('/settings');
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-xs transition-colors hover:bg-gray-50" 
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <Settings className="w-3 h-3" />
                        <span>{t('navigation.settings')}</span>
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-xs transition-colors hover:bg-gray-50"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <LogOut className="w-3 h-3" />
                        <span>{t('navigation.sign_out')}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Professional Navigation Grid - Hidden when scrolled */}
          {!isScrolled && (
            <div className="pb-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {isClient && navigation.map((item, index) => {
                const normalizedPathname = pathname.replace(/\/$/, '') || '/';
                const normalizedHref = item.href.replace(/\/$/, '') || '/';
                const isActive = normalizedPathname === normalizedHref || 
                               (normalizedHref === '/dashboard' && normalizedPathname === '') ||
                               (normalizedHref === '/dashboard' && normalizedPathname === '/');
                
                // Different olive tones for each navigation item
                const colorVariants = [
                  { bg: 'var(--color-primary)', border: 'var(--color-primary-dark)', accent: 'var(--color-primary)' },
                  { bg: 'var(--color-sage)', border: 'var(--color-quaternary)', accent: 'var(--color-sage)' },
                  { bg: 'var(--color-cool-olive)', border: 'var(--color-tertiary)', accent: 'var(--color-cool-olive)' },
                  { bg: 'var(--color-khaki)', border: 'var(--color-warm-olive)', accent: 'var(--color-khaki)' }
                ];
                const colors = colorVariants[index % colorVariants.length];
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group relative overflow-hidden rounded-lg transition-all duration-300 border ${
                      isActive
                        ? 'shadow-md border-2'
                        : 'shadow-sm hover:shadow-md border'
                    }`}
                    style={{
                      backgroundColor: isActive ? colors.bg : 'var(--bg-card)',
                      borderColor: isActive ? colors.border : 'var(--color-secondary)'
                    }}
                  >
                    <div className="relative p-4">
                      <div className="flex items-center justify-between mb-2">
                        <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-white' : ''
                        }`} style={{ 
                          color: isActive ? 'white' : colors.accent
                        }} />
                        <span className="text-xs px-2 py-1 rounded font-mono" style={{
                          backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : `${colors.bg}15`,
                          color: isActive ? 'white' : colors.accent
                        }}>{item.category}</span>
                      </div>
                      
                      <h3 className="font-bold text-sm mb-1" style={{ 
                        color: isActive ? 'white' : 'var(--text-primary)' 
                      }}>{item.name}</h3>
                      <p className="text-xs" style={{ 
                        color: isActive ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)' 
                      }}>{item.description}</p>
                      
                      {/* Professional Active Indicator */}
                      {isActive && (
                        <div className="absolute top-2 right-2">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
          )}
        </div>
      </div>
    </nav>
  );
}
