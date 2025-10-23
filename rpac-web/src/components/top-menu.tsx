'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Settings, 
  LogOut, 
  Bell,
  ChevronDown,
  Shield
} from 'lucide-react';
import { t } from '@/lib/locales';
import { supabase } from '@/lib/supabase';
import { NotificationCenterResponsive } from './notification-center-responsive';

interface TopMenuProps {
  user: any;
}

export function TopMenu({ user }: TopMenuProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get user display name based on profile preference
  const getUserDisplayName = () => {
    if (!user) return t('dashboard.default_user');
    if (!userProfile) return user.email?.split('@')[0] || t('dashboard.default_user');
    
    const preference = userProfile.name_display_preference || 'display_name';
    
    switch (preference) {
      case 'display_name':
        return userProfile.display_name || user.email?.split('@')[0] || t('dashboard.default_user');
      case 'first_last':
        if (userProfile.first_name && userProfile.last_name) {
          return `${userProfile.first_name} ${userProfile.last_name}`;
        }
        return userProfile.display_name || user.email?.split('@')[0] || t('dashboard.default_user');
      case 'initials':
        if (userProfile.first_name && userProfile.last_name) {
          return `${userProfile.first_name[0]}${userProfile.last_name[0]}`.toUpperCase();
        }
        if (userProfile.display_name) {
          return userProfile.display_name.substring(0, 2).toUpperCase();
        }
        return user.email?.split('@')[0] || t('dashboard.default_user');
      default:
        return userProfile.display_name || user.email?.split('@')[0] || t('dashboard.default_user');
    }
  };

  // Load unread notification count
  const loadUnreadCount = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error loading unread count:', error);
        setUnreadCount(0);
        return;
      }

      const count = data?.length || 0;
      // Unread count updated
      setUnreadCount(count);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  };

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('display_name, first_name, last_name, name_display_preference')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };

    loadUserProfile();
  }, [user]);

  // Load unread count and subscribe to changes
  useEffect(() => {
    if (!user?.id) return;

    // Initial load
    loadUnreadCount(user.id);

    // Subscribe to realtime changes
    let subscription;
    try {
      subscription = supabase
        .channel('notifications-top-menu')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            loadUnreadCount(user.id);
          }
        )
        .subscribe((status) => {
          // Silent subscription - no console logging needed
        });
    } catch (error) {
      console.warn('⚠️ Could not create notification subscription:', error);
    }

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [user?.id]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return t('dashboard.good_morning');
    } else if (hour < 18) {
      return t('dashboard.good_afternoon');
    } else {
      return t('dashboard.good_night');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && !(event.target as Element).closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  return (
    <>
      {/* Top Menu Bar */}
      <div className="fixed top-0 right-0 left-0 z-50 bg-gradient-to-r from-gray-50 via-white to-gray-100 border-b border-gray-200/50 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left side - Logo */}
          <div className="flex items-center">
            <Link 
              href="/dashboard"
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img 
                src="/beready-logo2.png" 
                alt="BE READY" 
                className="h-16 w-auto"
              />
            </Link>
          </div>

          {/* Right side - User menu and notifications */}
          <div className="flex items-center gap-3">
          {/* Notifications */}
          {user && (
            <button
              onClick={() => setShowNotifications(true)}
              className="relative w-12 h-12 bg-white/60 hover:bg-white/80 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm border border-gray-200/30"
              aria-label={`Notifieringar${unreadCount > 0 ? ` (${unreadCount} nya)` : ''}`}
            >
              <Bell className="w-6 h-6 text-gray-600" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </button>
          )}

            {/* User Menu */}
            {user ? (
              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/60 transition-all duration-200 shadow-sm border border-gray-200/30"
                >
                  <div className="w-10 h-10 bg-white/40 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-gray-900 text-base font-medium">
                      {getUserDisplayName()}
                    </div>
                  </div>
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/settings');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      <Settings className="w-4 h-4" />
                      {t('navigation.settings')}
                    </button>
                    
                    {/* Super Admin Option */}
                    {userProfile?.user_tier === 'super_admin' && (
                      <>
                        <div className="border-t my-1 border-gray-200" />
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            router.push('/super-admin');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-purple-700 hover:bg-purple-50"
                        >
                          <Shield className="w-4 h-4" />
                          Super Admin
                        </button>
                      </>
                    )}
                    
                    <div className="border-t my-1 border-gray-200" />
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('navigation.sign_out')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/60 transition-all duration-200 shadow-sm border border-gray-200/30"
              >
                <div className="w-10 h-10 bg-white/40 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <span className="text-gray-700 text-base font-medium">{t('dashboard.login')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {user && (
        <NotificationCenterResponsive
          user={user}
          isOpen={showNotifications}
          onClose={() => {
            setShowNotifications(false);
            // Refresh the unread count when closing the notification panel
            console.log('🔄 Notification panel closed, refreshing unread count...');
            loadUnreadCount(user.id);
          }}
        />
      )}
    </>
  );
}
