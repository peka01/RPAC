'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, Users, User } from 'lucide-react';
import { communityService, type LocalCommunity } from '@/lib/supabase';
import { t } from '@/lib/locales';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface GlobalMessagingButtonProps {
  user: SupabaseUser;
}

export function GlobalMessagingButton({ user }: GlobalMessagingButtonProps) {
  const router = useRouter();
  const [userCommunities, setUserCommunities] = useState<LocalCommunity[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load user communities
  useEffect(() => {
    if (user && user.id !== 'demo-user') {
      loadUserCommunities();
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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

  const handleMessagingOption = (type: 'community' | 'direct') => {
    setShowDropdown(false);
    
    if (type === 'community') {
      // Navigate to community messaging
      router.push('/local?tab=messages');
    } else if (type === 'direct') {
      // Navigate to direct messaging
      router.push('/local?tab=messages&type=direct');
    }
  };

  const handleMessagingClick = () => {
    // Toggle dropdown menu
    setShowDropdown(!showDropdown);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Messaging Button */}
      <button
        onClick={handleMessagingClick}
        className="relative w-12 h-12 bg-white/60 hover:bg-white/80 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm border border-gray-200/30"
        aria-label="Meddelanden"
      >
        <MessageCircle className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute top-12 right-0 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-[180px] z-50 animate-fade-in">
          <button
            onClick={() => handleMessagingOption('community')}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 touch-manipulation"
          >
            <div className="w-8 h-8 rounded-lg bg-[#3D4A2B]/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#3D4A2B]" />
            </div>
            <div>
              <div className="font-medium text-gray-900 text-sm">Samhällsmeddelanden</div>
              <div className="text-xs text-gray-500">Chat med hela samhället</div>
            </div>
          </button>
          
          <button
            onClick={() => handleMessagingOption('direct')}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 touch-manipulation"
          >
            <div className="w-8 h-8 rounded-lg bg-[#5C6B47]/10 flex items-center justify-center">
              <User className="w-4 h-4 text-[#5C6B47]" />
            </div>
            <div>
              <div className="font-medium text-gray-900 text-sm">{t('messaging.direct_messages')}</div>
              <div className="text-xs text-gray-500">
                {t('messaging.direct_messages_description')} {selectedCommunityId ? 
                  userCommunities.find(c => c.id === selectedCommunityId)?.name || 'samhället' : 
                  'samhället'
                }
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
