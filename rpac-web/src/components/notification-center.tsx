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
  MoreHorizontal
} from 'lucide-react';
import { t } from '@/lib/locales';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface Notification {
  id: string;
  type: 'message' | 'resource_request' | 'emergency' | 'system';
  title: string;
  content: string;
  sender_name?: string;
  action_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

interface NotificationCenterProps {
  user: User;
  onNotificationClick?: (notification: Notification) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function NotificationCenter({ user, onNotificationClick, isOpen: externalIsOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load notifications
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        if (externalIsOpen !== undefined && onClose) {
          onClose();
        } else {
          setInternalIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

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

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      );
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
      console.log('📝 Marking all notifications as read. Unread count:', unreadNotifications.length);
      
      if (unreadNotifications.length === 0) {
        console.log('⏭️ No unread notifications to mark');
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('❌ Error marking all notifications as read:', error);
        return;
      }

      console.log('✅ Successfully marked all notifications as read in database');
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
      
      console.log('✅ Local state updated: unreadCount set to 0');
    } catch (err) {
      console.error('❌ Error marking all notifications as read:', err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    
    if (externalIsOpen !== undefined && onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'emergency':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'resource_request':
        return <Package className="w-5 h-5 text-blue-600" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-green-600" />;
      case 'system':
        return <Info className="w-5 h-5 text-gray-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationActions = (notification: Notification) => {
    switch (notification.type) {
      case 'emergency':
      case 'message':
        return (
          <div className="flex gap-2">
            <button
              onClick={async (e) => {
                e.stopPropagation();
                console.log('🔔 Desktop Svara button clicked for notification:', notification);
                console.log('🔔 Notification type:', notification.type);
                console.log('🔔 Action URL:', notification.action_url);
                console.log('🔔 Sender name:', notification.sender_name);
                
                // Close notification panel
                if (onClose) {
                  onClose();
                } else {
                  setInternalIsOpen(false);
                }
                
                // Check if action_url already has a userId parameter
                if (notification.action_url && notification.action_url.includes('userId=')) {
                  console.log('🔔 Action URL has userId, using it directly');
                  window.location.href = notification.action_url;
                  if (!notification.is_read) {
                    markAsRead(notification.id);
                  }
                  return;
                }
                
                // For direct messages without userId, try to look up the sender by display_name
                if (notification.action_url?.includes('/local/messages/direct') && notification.sender_name) {
                  console.log('🔔 Looking up sender by name:', notification.sender_name);
                  
                  try {
                    // Search for user by display_name
                    const { data: profiles, error } = await supabase
                      .from('user_profiles')
                      .select('user_id, display_name')
                      .ilike('display_name', notification.sender_name)
                      .limit(1);
                    
                    if (!error && profiles && profiles.length > 0) {
                      const senderId = profiles[0].user_id;
                      console.log('🔔 Found sender ID:', senderId);
                      window.location.href = `/local/messages/direct?userId=${senderId}`;
                      if (!notification.is_read) {
                        markAsRead(notification.id);
                      }
                      return;
                    } else {
                      console.log('🔔 Could not find sender by name');
                    }
                  } catch (err) {
                    console.error('🔔 Error looking up sender:', err);
                  }
                }
                
                // Fallback: use action_url if available
                if (notification.action_url) {
                  console.log('🔔 Using action_url:', notification.action_url);
                  window.location.href = notification.action_url;
                } else {
                  // No action_url - default to direct messages
                  console.log('🔔 No action_url, fallback to direct messages');
                  window.location.href = '/local/messages/direct';
                }
                
                // Mark as read
                if (!notification.is_read) {
                  markAsRead(notification.id);
                }
              }}
              className="px-3 py-1 text-xs bg-[#3D4A2B] text-white rounded-md hover:bg-[#2A331E] transition-colors"
            >
              {t('notifications.reply')}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                markAsRead(notification.id);
              }}
              className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              {t('notifications.mark_as_read')}
            </button>
          </div>
        );
      case 'resource_request':
        return (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('Desktop Hantera förfrågan clicked for notification:', notification);
                console.log('Action URL:', notification.action_url);
                
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
                      const navigationUrl = communityId 
                        ? `/local?tab=resources&community=${communityId}&resource=${resourceId}`
                        : `/local?tab=resources&resource=${resourceId}`;
                      
                      console.log('Navigation URL:', navigationUrl);
                      window.location.href = navigationUrl;
                      
                      // Wait for navigation and component mounting, then dispatch event
                      setTimeout(() => {
                        console.log('Dispatching openResourceManagement event with resourceId:', resourceId);
                        window.dispatchEvent(new CustomEvent('openResourceManagement', { 
                          detail: { resourceId } 
                        }));
                      }, 1000); // Delay to ensure page navigation and component mounting
                    } else {
                      console.error('No resourceId found in action_url:', notification.action_url);
                    }
                  } catch (error) {
                    console.error('Error parsing action URL:', error);
                  }
                }
              }}
              className="px-3 py-1 text-xs bg-[#3D4A2B] text-white rounded-md hover:bg-[#2A331E] transition-colors"
            >
              Hantera förfrågan
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                markAsRead(notification.id);
              }}
              className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              {t('notifications.mark_as_read')}
            </button>
          </div>
        );
      case 'system':
        return (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNotificationClick(notification);
              }}
              className="px-3 py-1 text-xs bg-[#3D4A2B] text-white rounded-md hover:bg-[#2A331E] transition-colors"
            >
              {t('notifications.view')}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                markAsRead(notification.id);
              }}
              className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              {t('notifications.mark_as_read')}
            </button>
          </div>
        );
      default:
        return null;
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
    <div className="relative" ref={panelRef}>
      {/* Notification Bell */}
      <button
        onClick={() => {
          if (externalIsOpen !== undefined && onClose) {
            onClose();
          } else {
            setInternalIsOpen(!isOpen);
          }
        }}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
        aria-label={`Notifieringar${unreadCount > 0 ? ` (${unreadCount} nya)` : ''}`}
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('notifications.title')} {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-[#3D4A2B] hover:text-[#2A331E] transition-colors"
                >
                  {t('notifications.mark_all_read')}
                </button>
              )}
              <button
                onClick={() => {
                  if (externalIsOpen !== undefined && onClose) {
                    onClose();
                  } else {
                    setInternalIsOpen(false);
                  }
                }}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                {t('notifications.loading')}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {t('notifications.no_notifications')}
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-1 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0"
                            title="Ta bort notifiering"
                          >
                            <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                          </button>
                        </div>
                      </div>
                      {notification.sender_name && (
                        <p className="text-xs text-gray-600 mb-1">
                          {notification.sender_name}
                        </p>
                      )}
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                        {notification.content}
                      </p>
                      {getNotificationActions(notification)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
