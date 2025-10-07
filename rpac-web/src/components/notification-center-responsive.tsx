'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { NotificationCenter } from './notification-center';
import { NotificationCenterMobile } from './notification-center-mobile';
import type { User } from '@supabase/supabase-js';
import type { Notification } from './notification-center';

interface NotificationCenterResponsiveProps {
  user: User;
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationCenterResponsive({ user, onNotificationClick }: NotificationCenterResponsiveProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileCenter, setShowMobileCenter] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        </button>

        {/* Mobile Notification Center */}
        {showMobileCenter && (
          <NotificationCenterMobile
            user={user}
            onNotificationClick={handleMobileNotificationClick}
            onClose={() => setShowMobileCenter(false)}
          />
        )}
      </>
    );
  }

  return (
    <NotificationCenter
      user={user}
      onNotificationClick={handleNotificationClick}
    />
  );
}
