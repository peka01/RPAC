'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Settings, 
  LogOut, 
  Bell,
  ChevronDown
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
            <a 
              href="/dashboard"
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img 
                src="/beready-logo2.png" 
                alt="BE READY" 
                className="h-16 w-auto"
              />
            </a>
          </div>

          {/* Right side - User menu and notifications */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            {user && (
              <button
                onClick={() => setShowNotifications(true)}
                className="relative w-12 h-12 bg-white/60 hover:bg-white/80 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm border border-gray-200/30"
              >
                <Bell className="w-6 h-6 text-gray-600" />
                {/* Notification badge could be added here */}
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
                      {user.email?.split('@')[0] || t('dashboard.user')}
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
          onClose={() => setShowNotifications(false)}
        />
      )}
    </>
  );
}
