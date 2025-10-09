'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
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
    if (onClose) {
      onClose();
    }
  };

  if (isMobile) {
    return (
      <>
        {/* Mobile Notification Center - Full Screen Modal */}
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-white">
            <NotificationCenterMobile
              user={user}
              router={router}
              onNotificationClick={handleMobileNotificationClick}
              onClose={onClose}
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
