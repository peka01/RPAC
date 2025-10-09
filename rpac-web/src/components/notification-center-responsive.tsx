'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { NotificationCenter } from './notification-center';
import { NotificationCenterMobile } from './notification-center-mobile';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Notification } from './notification-center';

interface NotificationCenterResponsiveProps {
  user: User;
  onNotificationClick?: (notification: Notification) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

export function NotificationCenterResponsive({ user, onNotificationClick, onClose, isOpen }: NotificationCenterResponsiveProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileCenter, setShowMobileCenter] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load unread count
  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_read', false);

        if (!error && data) {
          setUnreadCount(data.length);
        }
      } catch (err) {
        console.error('Error loading unread count:', err);
      }
    };

    loadUnreadCount();
  }, [user?.id]);

  const handleNotificationClick = (notification: Notification) => {
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const handleMobileNotificationClick = (notification: Notification) => {
    handleNotificationClick(notification);
    setShowMobileCenter(false);
  };

  if (isMobile) {
    return (
      <>
        {/* Mobile Notification Bell */}
        <button
          onClick={() => setShowMobileCenter(true)}
          className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
          aria-label="Notifieringar"
        >
          <Bell className="w-6 h-6 text-gray-700" />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </button>

        {/* Mobile Notification Center - Full Screen Modal */}
        {showMobileCenter && (
          <div className="fixed inset-0 z-50 bg-white">
            <NotificationCenterMobile
              user={user}
              onNotificationClick={handleMobileNotificationClick}
              onClose={() => setShowMobileCenter(false)}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <NotificationCenter
      user={user}
      onNotificationClick={handleNotificationClick}
      onClose={onClose}
      isOpen={isOpen}
    />
  );
}
