'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  User, 
  Users, 
  Globe,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
  Package,
  HelpCircle
} from 'lucide-react';
import { t } from '@/lib/locales';
import { useState, useEffect } from 'react';
import { NotificationCenterMobile } from './notification-center-mobile';
import { supabase } from '@/lib/supabase';

export function MobileNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        loadUnreadCount(session.user.id);
      }
    };

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadUnreadCount(session.user.id);
      } else {
        setUser(null);
        setUnreadCount(0);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, 
        () => {
          // Reload unread count when notifications change
          loadUnreadCount(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
        return;
      }

      setUnreadCount(data?.length || 0);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  };

  const handleLogout = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Check if we're on resource pages
  const isOnResourcePages = pathname?.startsWith('/local/resources/');

  const mainNavItems = [
    {
      href: '/dashboard',
      icon: Home,
      label: 'Hem',
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
    },
  ];

  const resourceNavItems = [
    {
      href: '/local/resources/shared',
      icon: Users,
      label: 'Delade från medlemmar',
      description: 'Resurser som medlemmar delar'
    },
    {
      href: '/local/resources/owned',
      icon: Package,
      label: 'Gemensamma resurser',
      description: 'Samhällets gemensamma resurser'
    },
    {
      href: '/local/resources/help',
      icon: HelpCircle,
      label: 'Hjälpförfrågningar',
      description: 'Behov av hjälp i samhället'
    }
  ];

  const navItems = isOnResourcePages ? resourceNavItems : mainNavItems;

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#5C6B47]/20 shadow-2xl z-50 safe-area-pb">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all touch-manipulation ${
                  active
                    ? 'bg-[#3D4A2B] text-white scale-105'
                    : 'text-gray-600 active:scale-95'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[10px] font-medium ${active ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          
          
          <button
            onClick={() => setShowMenu(true)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-gray-600 active:scale-95 transition-all touch-manipulation relative"
          >
            <div className="relative">
              <Menu size={22} strokeWidth={2} />
              {user && unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </div>
            <span className="text-[10px] font-medium">Meny</span>
          </button>
        </div>
      </nav>

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
            <div className="flex items-center justify-between p-6 border-b-2 border-[#5C6B47]/20">
              <h2 className="text-2xl font-bold text-[#3D4A2B]">Meny</h2>
              <div className="flex items-center gap-4">
                {/* Mobile Notification Bell */}
                {user && (
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowNotifications(true);
                        setShowMenu(false);
                      }}
                      className="relative p-2 hover:bg-gray-100 rounded-full touch-manipulation"
                    >
                      <Bell size={24} className="text-gray-700" />
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                      )}
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-2 hover:bg-gray-100 rounded-full touch-manipulation"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-2">
              {navItems.map((item) => {
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
                        : 'hover:bg-gray-50 active:bg-gray-100'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      active ? 'bg-white/20' : 'bg-[#3D4A2B]/10'
                    }`}>
                      <Icon size={24} strokeWidth={2} className={active ? 'text-white' : 'text-[#3D4A2B]'} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold ${active ? 'text-white' : 'text-gray-900'}`}>
                        {item.label}
                      </h3>
                      <p className={`text-sm ${active ? 'text-white/80' : 'text-gray-600'}`}>
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}

              <div className="pt-4 mt-4 border-t border-gray-200 space-y-2">
                <Link
                  href="/settings"
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all touch-manipulation"
                >
                  <div className="p-2 rounded-lg bg-[#3D4A2B]/10">
                    <Settings size={24} strokeWidth={2} className="text-[#3D4A2B]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{t('navigation.settings')}</h3>
                    <p className="text-sm text-gray-600">Dina inställningar</p>
                  </div>
                </Link>
                
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-all touch-manipulation"
                >
                  <div className="p-2 rounded-lg bg-[#3D4A2B]/10">
                    <LogOut size={24} strokeWidth={2} className="text-[#3D4A2B]" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-gray-900">Logga ut</h3>
                    <p className="text-sm text-gray-600">Avsluta din session</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Notification Center Modal */}
      {showNotifications && user && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-50 animate-fade-in"
          onClick={() => setShowNotifications(false)}
        >
          <div 
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-[95vw] max-w-sm h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-[#3D4A2B]">Notifieringar</h2>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-2 hover:bg-gray-100 rounded-full touch-manipulation"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <NotificationCenterMobile
                user={user}
                router={router}
                onNotificationClick={(notification) => {
                  setShowNotifications(false);
                  // Handle notification click - navigate to relevant page
                  if (notification.action_url) {
                    router.push(notification.action_url);
                  } else {
                    // Default navigation based on notification type
                    switch (notification.type) {
                      case 'message':
                      case 'emergency':
                        router.push('/local/messages/community');
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
                onClose={() => setShowNotifications(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

