'use client';

import { useState, useEffect } from 'react';
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
  Loader
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
  member_joined: { icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
  resource_added: { icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
  resource_shared: { icon: Share2, color: 'text-purple-600', bg: 'bg-purple-100' },
  help_requested: { icon: Heart, color: 'text-orange-600', bg: 'bg-orange-100' },
  milestone: { icon: CheckCircle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  custom: { icon: Activity, color: 'text-gray-600', bg: 'bg-gray-100' }
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
        <IconComponent size={16} className={config.color} strokeWidth={2} />
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
        return t('local_community.activity_resource_added');
      case 'resource_shared':
        return t('local_community.activity_resource_shared');
      case 'member_joined':
        return t('local_community.activity_member_joined');
      case 'help_requested':
        return t('local_community.activity_help_requested');
      case 'milestone':
        return t('local_community.activity_milestone');
      case 'custom':
        return t('local_community.activity_custom');
      default:
        return t('local_community.activity_custom');
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-md ${className}`}>
        <div className="flex items-center justify-center py-8">
          <ShieldProgressSpinner variant="bounce" size="md" color="olive" message="Laddar aktiviteter" />
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
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                {getActivityIcon(activity)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        {activity.activity_type === 'member_joined' ? (
                          // Special display for member joined activities - show member name prominently
                          <>
                            <span className="font-medium text-gray-900 truncate">
                              {activity.user_name && activity.user_name !== 'Anonym användare' ? activity.user_name : 'Ny medlem'}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {getActivityActionText(activity)}
                            </span>
                          </>
                        ) : (
                          // Regular display for other activities
                          <>
                            <span className="font-medium text-gray-900 truncate">
                              {activity.resource_name && getCategoryEmoji(activity.resource_category)} {activity.resource_name || activity.title}
                            </span>
                            {activity.resource_category && activity.resource_category !== 'other' && (
                              <span className="px-2 py-0.5 bg-[#556B2F]/10 rounded-full text-[#556B2F] text-xs whitespace-nowrap">
                                {activity.resource_category}
                              </span>
                            )}
                            <span className="text-gray-500 text-xs">
                              {getActivityActionText(activity)}
                            </span>
                            {activity.user_name && activity.user_name !== 'Anonym användare' && (
                              <span className="text-gray-500 text-xs">
                                • {activity.user_name}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                      <Clock size={12} />
                      <span>{formatTimeAgo(activity.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
