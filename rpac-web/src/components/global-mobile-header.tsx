'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Bell, User, Users, ChevronDown, ArrowLeft, X } from 'lucide-react';
import { GlobalMessagingButton } from './global-messaging-button';
import { NotificationCenterMobile } from './notification-center-mobile';
import { communityService, type LocalCommunity } from '@/lib/supabase';
import { t } from '@/lib/locales';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface GlobalMobileHeaderProps {
  user: SupabaseUser;
}

export function GlobalMobileHeader({ user }: GlobalMobileHeaderProps) {
  const [showMessagingDropdown, setShowMessagingDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userCommunities, setUserCommunities] = useState<LocalCommunity[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Load user communities
  useEffect(() => {
    if (user && user.id !== 'demo-user') {
      loadUserCommunities();
    }
  }, [user]);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!error && data) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.is_read).length);
        }
      } catch (err) {
        console.error('Error loading notifications:', err);
      }
    };

    loadNotifications();
  }, [user?.id]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMessagingDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadUserCommunities = async () => {
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

  const handleMessagingOption = (type: 'private' | 'community') => {
    setShowMessagingDropdown(false);
    
    if (type === 'private') {
      // Navigate to private messaging
      window.location.href = '/local/messaging?tab=direct';
    } else if (type === 'community' && selectedCommunityId) {
      // Navigate to community messaging
      window.location.href = `/local/messaging?tab=community&community=${selectedCommunityId}`;
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 safe-area-pt">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <img 
            src="/logga-beready.png" 
            alt="BE READY" 
            className="h-8 w-auto"
          />
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
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
          </div>

          {/* Messaging Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowMessagingDropdown(!showMessagingDropdown)}
              className="relative w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all touch-manipulation active:scale-95"
              aria-label="Meddelanden"
            >
              <MessageCircle className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </button>

            {/* Dropdown Menu */}
            {showMessagingDropdown && (
              <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                <button
                  onClick={() => handleMessagingOption('private')}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-[#3D4A2B]/10 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-[#3D4A2B]" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{t('messaging.direct_messages')}</div>
                    <div className="text-sm text-gray-600">
                      {t('messaging.direct_messages_description')} {selectedCommunityId ? 
                        userCommunities.find(c => c.id === selectedCommunityId)?.community_name || 'samhället' : 
                        'samhället'
                      }
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleMessagingOption('community')}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                  disabled={userCommunities.length === 0}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    userCommunities.length === 0 
                      ? 'bg-gray-100' 
                      : 'bg-[#3D4A2B]/10'
                  }`}>
                    <Users className={`w-5 h-5 ${
                      userCommunities.length === 0 
                        ? 'text-gray-400' 
                        : 'text-[#3D4A2B]'
                    }`} />
                  </div>
                  <div>
                    <div className={`font-semibold ${
                      userCommunities.length === 0 
                        ? 'text-gray-400' 
                        : 'text-gray-900'
                    }`}>
                      Samhällsmeddelanden
                    </div>
                    <div className={`text-sm ${
                      userCommunities.length === 0 
                        ? 'text-gray-400' 
                        : 'text-gray-600'
                    }`}>
                      {userCommunities.length === 0 
                        ? 'Inget samhälle'
                        : 'Samhällschat'
                      }
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="absolute right-4 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifieringar {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            <button
              onClick={() => setShowNotifications(false)}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">Inga notifieringar</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {notification.title}
                        </h4>
                        <button
                          onClick={async () => {
                            try {
                              await supabase
                                .from('notifications')
                                .delete()
                                .eq('id', notification.id);
                              setNotifications(prev => prev.filter(n => n.id !== notification.id));
                              setUnreadCount(prev => Math.max(0, prev - 1));
                            } catch (err) {
                              console.error('Error deleting notification:', err);
                            }
                          }}
                          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                          title="Ta bort notifiering"
                        >
                          <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                        </button>
                      </div>
                      {notification.sender_name && (
                        <p className="text-xs text-gray-600 mb-1">
                          {notification.sender_name}
                        </p>
                      )}
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                        {notification.content}
                      </p>
                      <div className="flex gap-2">
                        {/* Action Button based on notification type */}
                        {notification.type === 'resource_request' && notification.action_url && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              console.log('Hantera förfrågan clicked for notification:', notification);
                              console.log('Action URL:', notification.action_url);
                              
                              // Close the notification dropdown first
                              setShowNotifications(false);
                              
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
                        )}
                        
                        {notification.type === 'message' && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              console.log('🔔 Svara button clicked for notification:', notification);
                              console.log('🔔 Notification type:', notification.type);
                              console.log('🔔 Action URL:', notification.action_url);
                              setShowNotifications(false);
                              
                              // Navigate to direct messages page
                              if (notification.action_url) {
                                console.log('🔔 Using action_url:', notification.action_url);
                                window.location.href = notification.action_url;
                              } else {
                                console.log('🔔 No action_url, fallback to general direct messages');
                                window.location.href = '/local/messages/direct';
                              }
                            }}
                            className="px-3 py-1 text-xs bg-[#3D4A2B] text-white rounded-md hover:bg-[#2A331E] transition-colors"
                          >
                            Svara
                          </button>
                        )}
                        
                        {notification.type === 'emergency' && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setShowNotifications(false);
                              
                              // Navigate based on action URL or to community messages
                              if (notification.action_url) {
                                window.location.href = notification.action_url;
                              } else {
                                // Emergency messages typically go to community chat
                                window.location.href = '/local/messages/community';
                              }
                            }}
                            className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                          >
                            Hantera
                          </button>
                        )}
                        
                        {notification.type === 'system' && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setShowNotifications(false);
                              // Navigate to relevant system page
                              window.location.href = '/dashboard';
                            }}
                            className="px-3 py-1 text-xs bg-[#3D4A2B] text-white rounded-md hover:bg-[#2A331E] transition-colors"
                          >
                            Visa
                          </button>
                        )}

                        {/* Mark as Read Button */}
                        {!notification.is_read && (
                          <button
                            onClick={async () => {
                              try {
                                await supabase
                                  .from('notifications')
                                  .update({ 
                                    is_read: true, 
                                    read_at: new Date().toISOString() 
                                  })
                                  .eq('id', notification.id);
                                setNotifications(prev => 
                                  prev.map(n => 
                                    n.id === notification.id 
                                      ? { ...n, is_read: true, read_at: new Date().toISOString() }
                                      : n
                                  )
                                );
                                setUnreadCount(prev => Math.max(0, prev - 1));
                              } catch (err) {
                                console.error('Error marking notification as read:', err);
                              }
                            }}
                            className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                          >
                            Markera som läst
                          </button>
                        )}
                      </div>
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
