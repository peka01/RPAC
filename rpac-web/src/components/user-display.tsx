'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  ChevronDown, 
  Settings, 
  LogOut, 
  Wifi,
  WifiOff
} from 'lucide-react';
import { t } from '@/lib/locales';
import { supabase } from '@/lib/supabase';

interface UserDisplayProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: { name?: string };
  } | null;
  isScrolled?: boolean;
  onSignOut?: () => void;
}

export function UserDisplay({ user, isScrolled = false, onSignOut }: UserDisplayProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Check online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timeInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getTimeOfDayGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return t('dashboard.good_night');
    if (hour < 12) return t('dashboard.good_morning');
    if (hour < 18) return t('dashboard.good_day');
    return t('dashboard.good_evening');
  };

  const getUserInitials = () => {
    if (!user) return '?';
    const name = user.user_metadata?.name || user.email || 'User';
    return name.charAt(0).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (!user) return t('dashboard.default_user');
    return user.user_metadata?.name || user.email?.split('@')[0] || t('dashboard.default_user');
  };


  if (!user) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 rounded-lg border" style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--color-muted)'
      }}>
        <User className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {t('dashboard.default_user')}
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Main User Display */}
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className={`group flex items-center space-x-3 rounded-xl transition-all duration-300 border touch-manipulation hover:shadow-lg ${
          isScrolled ? 'px-3 py-2' : 'px-4 py-3'
        }`}
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--color-quaternary)'
        }}
      >
        {/* Avatar with Status Indicator */}
        <div className="relative">
          <div className={`rounded-full flex items-center justify-center font-bold text-white shadow-md transition-all duration-300 ${
            isScrolled ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base'
          }`} style={{ 
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)'
          }}>
            {getUserInitials()}
          </div>
          {/* Online Status Indicator */}
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 transition-all duration-300 ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          }`} style={{ borderColor: 'var(--bg-card)' }}>
            {isOnline ? (
              <Wifi className="w-2 h-2 text-white" />
            ) : (
              <WifiOff className="w-2 h-2 text-white" />
            )}
          </div>
        </div>

        {/* User Info - Hidden on mobile when scrolled */}
        {!isScrolled && (
          <div className="flex-1 text-left min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                {getTimeOfDayGreeting()}, {getUserDisplayName()}
              </span>
            </div>
          </div>
        )}

        {/* Dropdown Arrow */}
        <ChevronDown className={`transition-transform duration-200 ${
          showUserMenu ? 'rotate-180' : ''
        } ${isScrolled ? 'w-4 h-4' : 'w-4 h-4'}`} style={{ color: 'var(--text-tertiary)' }} />
      </button>

      {/* User Menu Dropdown */}
      {showUserMenu && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl shadow-xl border z-50" style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--color-quaternary)'
        }}>
          {/* User Info Header */}
          <div className="p-4 border-b" style={{ borderColor: 'var(--color-quaternary)' }}>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md" style={{ 
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)'
              }}>
                {getUserInitials()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {getUserDisplayName()}
                </div>
                <div className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                  {user.email}
                </div>
              </div>
            </div>
          </div>


          {/* Menu Actions */}
          <div className="p-2">
            <button
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              onClick={() => {
                setShowUserMenu(false);
                // Navigate to settings
              }}
            >
              <Settings className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {t('user.settings')}
              </span>
            </button>
            
            <button
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              onClick={() => {
                setShowUserMenu(false);
                // Navigate to profile
              }}
            >
              <User className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {t('user.profile')}
              </span>
            </button>

            <div className="border-t my-2" style={{ borderColor: 'var(--color-quaternary)' }} />
            
            <button
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors duration-200"
              onClick={() => {
                setShowUserMenu(false);
                onSignOut?.();
              }}
            >
              <LogOut className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />
              <span className="text-sm" style={{ color: 'var(--color-danger)' }}>
                {t('navigation.sign_out')}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
