'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  User, 
  Users, 
  Globe,
  Settings,
  Bell,
  MessageCircle,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Shield
} from 'lucide-react';
import { t } from '@/lib/locales';
import { useState, useEffect, useRef } from 'react';
import { NotificationCenterMobile } from './notification-center-mobile';
import { GlobalMessagingButton } from './global-messaging-button';
import { communityService, type LocalCommunity } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

export function MobileNavigationV2() {
  const pathname = usePathname();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userCommunities, setUserCommunities] = useState<LocalCommunity[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        loadUnreadCount(session.user.id);
        loadUserProfile(session.user.id);
      }
    };

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadUnreadCount(session.user.id);
        loadUserCommunities(session.user);
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
        setUnreadCount(0);
        setUserCommunities([]);
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load user communities
  const loadUserCommunities = async (user: any) => {
    if (!user || user.id === 'demo-user') return;
    
    try {
      const memberships = await communityService.getUserMemberships(user.id);
      
      if (memberships.length > 0) {
        const communities = await Promise.all(
          memberships.map(id => communityService.getCommunityById(id))
        );
        
        const validCommunities = communities.filter(c => c !== null) as LocalCommunity[];
        setUserCommunities(validCommunities);
        
        // Set default community if available
        if (validCommunities.length > 0) {
          const savedCommunityId = localStorage.getItem('selectedCommunityId');
          const defaultCommunity = savedCommunityId 
            ? validCommunities.find(c => c.id === savedCommunityId) || validCommunities[0]
            : validCommunities[0];
          setSelectedCommunityId(defaultCommunity.id);
        }
      }
    } catch (error) {
      console.error('Error loading communities:', error);
    }
  };

  // Hide FAB when notification modal is open
  useEffect(() => {
    if (showNotifications) {
      document.body.classList.add('notification-modal-open');
    } else {
      document.body.classList.remove('notification-modal-open');
    }
    
    return () => {
      document.body.classList.remove('notification-modal-open');
    };
  }, [showNotifications]);

  // Subscribe to notification changes for real-time updates
  useEffect(() => {
    if (!user) return;

    let subscription: any = null;

    try {
      subscription = supabase
        .channel('notifications')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          }, 
          () => {
            loadUnreadCount(user.id);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to notifications');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Error subscribing to notifications');
          }
        });
    } catch (error) {
      console.error('Error setting up notification subscription:', error);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [user]);

  const loadUnreadCount = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error loading unread count:', error);
        // Set to 0 if there's an error (table might not exist or no permissions)
        setUnreadCount(0);
        return;
      }

      setUnreadCount(data?.length || 0);
    } catch (error) {
      console.error('Error loading unread count:', error);
      // Set to 0 if there's an error
      setUnreadCount(0);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Main navigation items that match desktop structure exactly
  const mainNavItems = [
    {
      href: '/dashboard',
      icon: Home,
      label: t('navigation.dashboard'),
      description: t('navigation.descriptions.operational_status')
    },
    {
      href: '/individual',
      icon: User,
      label: t('navigation.individual'),
      description: t('navigation.descriptions.individual_preparedness')
    },
    {
      href: '/local',
      icon: Users,
      label: t('navigation.local'),
      description: t('navigation.descriptions.community_resources')
    },
    {
      href: '/regional',
      icon: Globe,
      label: t('navigation.regional'),
      description: t('navigation.descriptions.regional_coordination')
    }
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };


  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-2xl z-50 safe-area-pb">
        <div className="flex items-center justify-between px-1 py-2">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center px-1 py-2 rounded-xl transition-all touch-manipulation flex-1 min-w-0 ${
                  active
                    ? 'bg-[#3D4A2B] text-white scale-105'
                    : 'text-gray-600 active:scale-95 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[8px] font-medium truncate w-full text-center leading-tight ${active ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Top Header - Fixed at top */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 mobile-header bg-white/95 backdrop-blur-sm border-b border-gray-200 safe-area-pt">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <img 
                src="/beready-logo2.png" 
                alt="BE READY" 
                className="h-8 w-auto"
              />
            </Link>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-2">
            {/* Messaging Button */}
            <GlobalMessagingButton user={user} />

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(true)}
              className="relative w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all touch-manipulation active:scale-95"
              aria-label="Notifieringar"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </button>

            {/* User Menu Button */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all touch-manipulation active:scale-95"
                aria-label="Användarmeny"
              >
                <User className="w-5 h-5 text-gray-600" />
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute top-12 right-0 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-[180px] z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">
                      {user?.user_metadata?.name || user?.email || 'Användare'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user?.email}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push('/settings');
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 touch-manipulation"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#3D4A2B]/10 flex items-center justify-center">
                      <Settings className="w-4 h-4 text-[#3D4A2B]" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Inställningar</div>
                      <div className="text-xs text-gray-500">Konto och inställningar</div>
                    </div>
                  </button>
                  
                  {/* Super Admin Option */}
                  {userProfile?.user_tier === 'super_admin' && (
                    <>
                      <div className="border-t my-2 border-gray-100" />
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          router.push('/super-admin');
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors flex items-center gap-3 touch-manipulation"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Shield className="w-4 h-4 text-purple-700" />
                        </div>
                        <div>
                          <div className="font-medium text-purple-900 text-sm">Super Admin</div>
                          <div className="text-xs text-purple-600">Systemadministration</div>
                        </div>
                      </button>
                    </>
                  )}
                  
                  <div className="border-t my-2 border-gray-100" />
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 touch-manipulation"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                      <LogOut className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">Logga ut</div>
                      <div className="text-xs text-gray-500">Avsluta sessionen</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {showMenu && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-50 animate-fade-in"
          onClick={() => setShowMenu(false)}
        >
          <div 
            className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] text-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <img 
                      src="/beready-logo2.png" 
                      alt="BE READY" 
                      className="h-8 w-auto"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">RPAC</h2>
                    <p className="text-white/80 text-sm">Beredskap & Resiliens</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-all active:scale-95 touch-manipulation"
                >
                  <X size={24} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Menu Content */}
            <div className="overflow-y-auto h-[calc(100%-140px)] p-4">
              <div className="space-y-2">
                {mainNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowMenu(false)}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all touch-manipulation ${
                        active
                          ? 'bg-[#3D4A2B] text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Icon size={24} strokeWidth={2} />
                      <div className="flex-1">
                        <div className="font-medium">{item.label}</div>
                        <div className={`text-sm ${active ? 'text-white/80' : 'text-gray-500'}`}>
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* User Section */}
              {user && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 bg-[#3D4A2B] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">
                        {user.email?.split('@')[0] || 'Användare'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification Center Modal */}
      {showNotifications && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50 animate-fade-in">
          <div className="fixed inset-0 bg-white animate-slide-in-bottom">
            <NotificationCenterMobile
              onClose={() => setShowNotifications(false)}
              user={user}
              router={router}
            />
          </div>
        </div>
      )}
    </>
  );
}
