'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  Package,
  Heart,
  AlertCircle,
  Clock,
  CheckCircle,
  Building2,
  Share2,
  Activity,
  Loader,
  ExternalLink,
  ImageIcon
} from 'lucide-react';
import { communityActivityService, type CommunityActivity } from '@/lib/community-activity-service';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { t } from '@/lib/locales';

interface CommunityActivityFeedProps {
  communityId: string;
  limit?: number;
  showHeader?: boolean;
  className?: string;
}

const activityIcons = {
  member_joined: { icon: Users, bg: 'bg-[#3D4A2B]' },
  resource_added: { icon: Building2, bg: 'bg-[#5C6B47]' },
  resource_shared: { icon: Share2, bg: 'bg-[#707C5F]' },
  help_requested: { icon: Heart, bg: 'bg-[#8B9B6D]' },
  help_response_added: { icon: CheckCircle, bg: 'bg-[#556B2F]' },
  community_resource_added: { icon: Building2, bg: 'bg-[#3D4A2B]' },
  community_resource_updated: { icon: Package, bg: 'bg-[#5C6B47]' },
  community_resource_deleted: { icon: AlertCircle, bg: 'bg-[#707C5F]' },
  milestone: { icon: CheckCircle, bg: 'bg-[#8B9B6D]' },
  custom: { icon: Activity, bg: 'bg-[#556B2F]' }
};

const categoryEmojis = {
  food: '🍞',
  water: '💧',
  medicine: '💊',
  energy: '⚡',
  tools: '🔧',
  machinery: '🚜',
  other: '✨'
};

export function CommunityActivityFeed({ 
  communityId, 
  limit = 10, 
  showHeader = true,
  className = ''
}: CommunityActivityFeedProps) {
  const [activities, setActivities] = useState<CommunityActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActivities();
  }, [communityId]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await communityActivityService.getCommunityActivities(communityId, limit);
      setActivities(data || []);
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Kunde inte ladda aktiviteter');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just nu';
    if (diffInMinutes < 60) return `${diffInMinutes} min sedan`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} tim sedan`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} dag${diffInDays > 1 ? 'ar' : ''} sedan`;
    
    return date.toLocaleDateString('sv-SE');
  };

  const getActivityIcon = (activity: CommunityActivity) => {
    const config = activityIcons[activity.activity_type] || activityIcons.custom;
    const IconComponent = config.icon;
    
    return (
      <div className={`w-8 h-8 ${config.bg} rounded-full flex items-center justify-center`}>
        <IconComponent size={16} className="text-white" strokeWidth={2} />
      </div>
    );
  };

  const getCategoryEmoji = (category?: string) => {
    if (!category) return '';
    return categoryEmojis[category as keyof typeof categoryEmojis] || '📦';
  };

  const getActivityActionText = (activity: CommunityActivity) => {
    switch (activity.activity_type) {
      case 'resource_added':
        return 'lade till resurs';
      case 'resource_shared':
        return 'delade resurs';
      case 'member_joined':
        return 'gick med i samhället';
      case 'help_requested':
        return 'begärde hjälp';
      case 'help_response_added':
        return 'erbjöd hjälp';
      case 'community_resource_added':
        return 'lade till gemensam resurs';
      case 'community_resource_updated':
        return 'uppdaterade gemensam resurs';
      case 'community_resource_deleted':
        return 'tog bort gemensam resurs';
      case 'milestone':
        return 'uppnådde milstolpe';
      case 'custom':
        return 'aktivitet';
      default:
        return 'aktivitet';
    }
  };

  const getActivityLink = (activity: CommunityActivity): string | null => {
    // Help requests and responses link to resources tab with help view
    if (activity.activity_type === 'help_requested' || activity.activity_type === 'help_response_added') {
      return `/local?tab=resources&resourceTab=help`;
    }
    
    // Community resources (owned by community) link to owned/gemensamma resurser tab
    if (activity.activity_type === 'community_resource_added' || 
        activity.activity_type === 'community_resource_updated') {
      return `/local?tab=resources&resourceTab=owned`;
    }
    
    // Shared resources (from members) link to shared tab
    if (activity.activity_type === 'resource_shared' || activity.activity_type === 'resource_added') {
      return `/local?tab=resources&resourceTab=shared`;
    }
    
    // Member joined is not linkable
    return null;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-md ${className}`}>
        <div className="flex items-center justify-center py-8">
          <ShieldProgressSpinner size="md" color="olive" message="Laddar aktiviteter" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-md ${className}`}>
        <div className="text-center py-8">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <p className="text-gray-600">{error}</p>
          <button
            onClick={loadActivities}
            className="mt-4 px-4 py-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors"
          >
            Försök igen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl shadow-md ${className}`}>
      {showHeader && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity size={24} className="text-[#3D4A2B]" />
              Senaste aktivitet
            </h3>
            <Clock size={20} className="text-gray-400" />
          </div>
        </div>
      )}

      <div className={showHeader ? "p-6" : "p-4"}>
        {activities.length === 0 ? (
          <div className="text-center py-4">
            <Activity size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600 text-sm">Ingen aktivitet än</p>
            <p className="text-xs text-gray-500 mt-1">
              Var den första att dela en resurs!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const link = getActivityLink(activity);
              const hasImage = !!activity.image_url;
              
              if (activity.activity_type === 'resource_shared') {
                console.log('[ActivityFeed] Resource shared activity:', {
                  id: activity.id,
                  resource_name: activity.resource_name,
                  image_url: activity.image_url,
                  hasImage: hasImage
                });
              }
              
              const content = (
                <>
                  {getActivityIcon(activity)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          {activity.activity_type === 'member_joined' ? (
                            // Member joined: "Per Karlsson gick med i samhället"
                            <>
                              <span className="font-semibold">
                                {activity.user_name && activity.user_name !== 'Anonym användare' ? activity.user_name : 'Ny medlem'}
                              </span>
                              {' '}
                              <span className="text-gray-600">
                                {getActivityActionText(activity)}
                              </span>
                            </>
                          ) : (
                            // Other activities: "Per Karlsson lade till gemensam resurs: Vattentäkt"
                            <>
                              {activity.user_name && activity.user_name !== 'Anonym användare' && (
                                <>
                                  <span className="font-semibold">{activity.user_name}</span>
                                  {' '}
                                </>
                              )}
                              <span className="text-gray-600">
                                {getActivityActionText(activity)}
                              </span>
                              {activity.resource_name && (
                                <>
                                  {': '}
                                  <span className="font-semibold text-gray-900">
                                    {activity.resource_name}
                                  </span>
                                </>
                              )}
                            </>
                          )}
                        </p>
                        
                        {/* Show image thumbnail if available */}
                        {hasImage && (
                          <div className="mt-2 relative group">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-[#3D4A2B] transition-all duration-200 cursor-pointer">
                              <Image
                                src={activity.image_url!}
                                alt={activity.resource_name || activity.title}
                                fill
                                className="object-cover"
                                sizes="64px"
                              />
                            </div>
                            {/* Large hover preview */}
                            <div className="absolute left-0 top-0 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                              <div className="relative w-64 h-64 rounded-xl overflow-hidden border-4 border-[#3D4A2B] shadow-2xl">
                                <Image
                                  src={activity.image_url!}
                                  alt={activity.resource_name || activity.title}
                                  fill
                                  className="object-cover"
                                  sizes="256px"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{formatTimeAgo(activity.created_at)}</span>
                        </div>
                        {link && (
                          <ExternalLink size={12} className="text-[#3D4A2B]" />
                        )}
                      </div>
                    </div>
                  </div>
                </>
              );

              return link ? (
                <Link
                  key={activity.id}
                  href={link}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  {content}
                </Link>
              ) : (
                <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
