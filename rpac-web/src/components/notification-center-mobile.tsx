'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  MessageCircle, 
  Package, 
  AlertTriangle, 
  Info,
  ChevronRight,
  MoreHorizontal,
  ArrowLeft
} from 'lucide-react';
import { t } from '@/lib/locales';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Notification } from './notification-center';

interface NotificationCenterMobileProps {
  user: User;
  router?: any;
  onNotificationClick?: (notification: Notification) => void;
  onClose?: () => void;
}

export function NotificationCenterMobile({ user, router, onNotificationClick, onClose }: NotificationCenterMobileProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  // Load notifications
  useEffect(() => {
    console.log('NotificationCenterMobile useEffect triggered, user:', user);
    if (user?.id) {
      console.log('Loading notifications for user:', user.id);
      loadNotifications();
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      const notificationList = data || [];
      console.log('Loaded notifications:', notificationList.length, 'notifications');
      console.log('Notifications data:', notificationList);
      setNotifications(notificationList);
      setUnreadCount(notificationList.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotifications(prev => {
        const updated = prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        );
        
        // Check if all notifications are now read
        const allRead = updated.every(n => n.is_read);
        if (allRead && onClose) {
          // Small delay to show the read state before closing
          setTimeout(() => onClose(), 500);
        }
        
        return updated;
      });
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('delete_notification', { p_notification_id: notificationId });

      if (error) {
        console.error('Error deleting notification:', error);
        return;
      }

      if (data) {
        setNotifications(prev => {
          const updated = prev.filter(n => n.id !== notificationId);
          setUnreadCount(updated.filter(n => !n.is_read).length);
          return updated;
        });
        console.log('Notification deleted successfully');
      } else {
        console.error('Notification not found or could not be deleted');
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      if (unreadNotifications.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
      
      // Close modal after marking all as read
      if (onClose) {
        setTimeout(() => onClose(), 500);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const handleSwipeRight = (notificationId: string) => {
    markAsRead(notificationId);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case 'resource_request':
        return <Package className="w-6 h-6 text-blue-600" />;
      case 'message':
        return <MessageCircle className="w-6 h-6 text-green-600" />;
      case 'system':
        return <Info className="w-6 h-6 text-gray-600" />;
      default:
        return <Info className="w-6 h-6 text-gray-600" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return t('notifications.now');
    if (diffInMinutes < 60) return `${diffInMinutes} ${t('notifications.minutes_ago')}`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ${t('notifications.hours_ago')}`;
    return `${Math.floor(diffInMinutes / 1440)} ${t('notifications.days_ago')}`;
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">
          {t('notifications.title')} {unreadCount > 0 && `(${unreadCount})`}
        </h1>
        <div className="w-10">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-[#3D4A2B] hover:text-[#2A331E] transition-colors touch-manipulation"
            >
              {t('notifications.mark_all_read')}
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3D4A2B] mx-auto mb-4"></div>
            {t('notifications.loading')}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">{t('notifications.no_notifications')}</p>
            <p className="text-sm">{t('notifications.no_notifications_description')}</p>
          </div>
        ) : (
          <div className="space-y-1 pb-4">
            {notifications.map((notification) => {
              console.log('Rendering notification:', notification.type, notification.title, 'is_read:', notification.is_read);
              return (
              <div
                key={notification.id}
                className={`p-4 border-b border-gray-100 active:bg-gray-50 transition-colors ${
                  !notification.is_read ? 'bg-blue-50 border-l-4 border-l-[#3D4A2B]' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-base font-semibold text-gray-900 flex-1">
                        {notification.title}
                      </h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm text-gray-500">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-1 rounded-full hover:bg-gray-200 transition-colors touch-manipulation"
                          title="Ta bort notifiering"
                        >
                          <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                        </button>
                      </div>
                    </div>
                    {notification.sender_name && (
                      <p className="text-sm text-gray-600 mb-2">
                        {notification.sender_name}
                      </p>
                    )}
                    <p className="text-sm text-gray-700 mb-3">
                      {notification.content}
                    </p>
                    
                    {/* Action Buttons - Mobile Optimized */}
                    <div className="flex flex-col gap-2 mt-3">
                      {notification.type === 'emergency' || notification.type === 'message' ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notification);
                            }}
                            className="w-full px-4 py-3 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors touch-manipulation text-sm font-medium min-h-[44px] flex items-center justify-center"
                          >
                            {t('notifications.reply')}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors touch-manipulation text-sm font-medium min-h-[40px] flex items-center justify-center"
                          >
                            {t('notifications.read')}
                          </button>
                        </>
                      ) : notification.type === 'resource_request' ? (
                        <>
                          {console.log('Rendering Hantera förfrågan button for notification:', notification)}
                          {console.log('Notification is_read:', notification.is_read)}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Hantera förfrågan clicked for notification:', notification);
                              console.log('Action URL:', notification.action_url);
                              
                              // Close the notification modal first
                              if (onClose) {
                                onClose();
                              }
                              
                              // Navigate to the local resources page first, then open the modal
                              if (notification.action_url) {
                                try {
                                  const url = new URL(notification.action_url, window.location.origin);
                                  const resourceId = url.searchParams.get('resource');
                                  const communityId = url.searchParams.get('community');
                                  console.log('Parsed resourceId from URL:', resourceId);
                                  console.log('Parsed communityId from URL:', communityId);
                                  
                                  if (resourceId) {
                                    console.log('Navigating to local resources page first...');
                                    // Navigate to the local page with both community and resource parameters
                                    if (router) {
                                      const navigationUrl = communityId 
                                        ? `/local?tab=resources&community=${communityId}&resource=${resourceId}`
                                        : `/local?tab=resources&resource=${resourceId}`;
                                      
                                      console.log('Navigation URL:', navigationUrl);
                                      router.push(navigationUrl);
                                      
                                      // Wait for navigation and component mounting, then dispatch event
                                      setTimeout(() => {
                                        console.log('Dispatching openResourceManagement event with resourceId:', resourceId);
                                        window.dispatchEvent(new CustomEvent('openResourceManagement', { 
                                          detail: { resourceId } 
                                        }));
                                      }, 3000); // Even longer delay to ensure page navigation and component mounting
                                    } else {
                                      console.error('Router not available for navigation');
                                    }
                                  } else {
                                    console.error('No resourceId found in action_url:', notification.action_url);
                                  }
                                } catch (error) {
                                  console.error('Error parsing action_url:', error);
                                }
                              } else {
                                console.error('No action_url found in notification:', notification);
                              }
                            }}
                            className="w-full px-4 py-3 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors touch-manipulation text-sm font-medium min-h-[44px] flex items-center justify-center"
                          >
                            Hantera förfrågan
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors touch-manipulation text-sm font-medium min-h-[40px] flex items-center justify-center"
                          >
                            {t('notifications.mark_as_read')}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notification);
                            }}
                            className="w-full px-4 py-3 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors touch-manipulation text-sm font-medium min-h-[44px] flex items-center justify-center"
                          >
                            {t('notifications.view')}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors touch-manipulation text-sm font-medium min-h-[40px] flex items-center justify-center"
                          >
                            {t('notifications.read')}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
