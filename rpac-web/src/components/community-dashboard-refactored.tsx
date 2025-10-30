'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  Package,
  Heart,
  MessageCircle,
  TrendingUp,
  Shield,
  AlertCircle,
  Calendar,
  MapPin,
  Activity,
  Clock,
  CheckCircle,
  Globe,
  ExternalLink,
  ChevronDown,
  Settings,
  Home,
  BarChart3,
  Eye,
  Trash2,
  UserPlus,
  Building2,
  Share2,
  Image as ImageIcon
} from 'lucide-react';
import { resourceSharingService } from '@/lib/resource-sharing-service';
import { communityActivityService, type CommunityActivity } from '@/lib/community-activity-service';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { CommunityActivityFeed } from '@/components/community-activity-feed';
import type { User } from '@supabase/supabase-js';
import type { LocalCommunity } from '@/lib/supabase';
import { supabase, communityService } from '@/lib/supabase';
import HomespaceEditorWrapper from '@/components/homespace-editor-wrapper';
import { CommunityAdminSectionResponsive } from '@/components/community-admin-section-responsive';
import { t } from '@/lib/locales';

interface CommunityDashboardRefactoredProps {
  user: User;
  community: LocalCommunity;
  onNavigate: (view: 'resources' | 'messaging') => void;
}

interface CommunityStats {
  totalResources: number;
  availableResources: number;
  helpRequests: number;
  activeMembers: number;
  recentActivity: number;
}

interface RecentActivity {
  id: string;
  type: 'member_joined' | 'resource_shared' | 'help_request';
  message: string;
  timestamp: string;
  user?: string;
}

// Activity icon mapping - matches CommunityActivityFeed
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

export function CommunityDashboardRefactored({ user, community, onNavigate }: CommunityDashboardRefactoredProps) {
  const [loading, setLoading] = useState(true);
  const [showHomespaceEditor, setShowHomespaceEditor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [homespaceSlug, setHomespaceSlug] = useState<string | null>(null);
  const [stats, setStats] = useState<CommunityStats>({
    totalResources: 0,
    availableResources: 0,
    helpRequests: 0,
    activeMembers: 0,
    recentActivity: 0
  });
  const [recentActivity, setRecentActivity] = useState<CommunityActivity[]>([]);

  useEffect(() => {
    if (community?.id) {
      loadCommunityStats();
      checkAdminStatus();
      loadRecentActivity();
    }
  }, [community?.id]);

  useEffect(() => {
    if (community?.id && isAdmin) {
      loadHomespaceData();
    }
  }, [community?.id, isAdmin]);

  const checkAdminStatus = async () => {
    if (!community?.id || !user || user.id === 'demo-user') {
      setIsAdmin(false);
      return;
    }
    
    const adminStatus = await communityService.isUserAdmin(community.id, user.id);
    setIsAdmin(adminStatus);
  };

  const loadHomespaceData = async () => {
    if (!community?.id) return;
    
    const { data } = await supabase
      .from('community_homespaces')
      .select('slug')
      .eq('community_id', community.id)
      .single();
    
    setHomespaceSlug(data?.slug || null);
  };

  const loadCommunityStats = async () => {
    if (!community?.id) return;
    
    try {
      setLoading(true);

      const resources = await resourceSharingService.getCommunityResources(community.id);
      const availableResources = resources.filter(r => r.status === 'available');
      const helpRequests = await resourceSharingService.getCommunityHelpRequests(community.id);

      setStats({
        totalResources: resources.length,
        availableResources: availableResources.length,
        helpRequests: helpRequests.length,
        activeMembers: community.member_count || 0,
        recentActivity: resources.length + helpRequests.length
      });
    } catch (error) {
      console.error('Error loading community stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    if (!community?.id) return;
    
    try {
      console.log('[Desktop] Loading recent activities for community:', community.id);
      const activities = await communityActivityService.getCommunityActivities(community.id, 5);
      console.log('[Desktop] Loaded activities:', activities);
      console.log('[Desktop] First activity image_url:', activities[0]?.image_url);
      setRecentActivity(activities);
    } catch (error) {
      console.error('Error loading recent activity:', error);
      setRecentActivity([]);
    }
  };

  const getActivityActionText = (activityType: string) => {
    switch (activityType) {
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
      default:
        return 'aktivitet';
    }
  };

  const getActivityLink = (activity: CommunityActivity): string | null => {
    if (activity.activity_type === 'help_requested' || activity.activity_type === 'help_response_added') {
      return `/local?tab=resources&resourceTab=help`;
    }
    if (activity.activity_type === 'community_resource_added' || 
        activity.activity_type === 'community_resource_updated') {
      return `/local?tab=resources&resourceTab=owned`;
    }
    if (activity.activity_type === 'resource_shared' || activity.activity_type === 'resource_added') {
      return `/local?tab=resources&resourceTab=shared`;
    }
    return null;
  };

  const getActivityIcon = (activityType: string) => {
    const config = activityIcons[activityType as keyof typeof activityIcons] || activityIcons.custom;
    const IconComponent = config.icon;
    
    return (
      <div className={`w-8 h-8 ${config.bg} rounded-full flex items-center justify-center flex-shrink-0`}>
        <IconComponent size={16} className="text-white" strokeWidth={2} />
      </div>
    );
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

  if (!community) {
    return (
      <div className="flex items-center justify-center p-12">
        <ShieldProgressSpinner size="lg" color="olive" message="Laddar samhälle" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ShieldProgressSpinner size="lg" color="olive" message="Laddar" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">

            {/* Action Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <button
                onClick={() => onNavigate('resources')}
                className="group bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all hover:scale-[1.02] text-left"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-[#3D4A2B]/10 rounded-xl flex items-center justify-center group-hover:bg-[#3D4A2B] transition-colors">
                    <Package size={28} className="text-[#3D4A2B] group-hover:text-white transition-colors" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Hantera resurser</h3>
                    <p className="text-gray-600">Dela, begär och inventera</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {stats.availableResources} tillgängliga resurser
                  </span>
                  <span className="text-[#3D4A2B] font-bold group-hover:translate-x-1 transition-transform">
                    Öppna →
                  </span>
                </div>
              </button>

              <Link
                href="/local/messages/community/"
                className="group bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all hover:scale-[1.02] text-left block"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-[#3D4A2B]/10 rounded-xl flex items-center justify-center group-hover:bg-[#3D4A2B] transition-colors">
                    <MessageCircle size={28} className="text-[#3D4A2B] group-hover:text-white transition-colors" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Meddelanden</h3>
                    <p className="text-gray-600">Kommunicera med medlemmar</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {t('messaging.community_chat_description')}
                  </span>
                  <span className="text-[#3D4A2B] font-bold group-hover:translate-x-1 transition-transform">
                    Öppna →
                  </span>
                </div>
              </Link>
            </div>

            {/* Admin Section - Only visible to admins */}
            {isAdmin && (
              <CommunityAdminSectionResponsive
                user={user}
                communityId={community.id}
                communityName={community.community_name}
                onSettingsUpdate={() => {
                  // Reload community data if needed
                  loadCommunityStats();
                }}
                onOpenHomespaceEditor={() => setShowHomespaceEditor(true)}
              />
            )}

            {/* Help Requests Alert (if any) */}
            {stats.helpRequests > 0 && (
              <div className="bg-[#B8860B]/10 border-2 border-[#B8860B] rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#B8860B] rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Heart size={24} className="text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {stats.helpRequests} {stats.helpRequests === 1 ? 'person behöver' : 'personer behöver'} hjälp
                    </h3>
                    <p className="text-gray-700 mb-4">
                      Medlemmar i ditt samhälle har begärt hjälp. Kan du bidra?
                    </p>
                    <button
                      onClick={() => {
                        // Navigate to resources page with help tab selected
                        window.location.href = `/local?tab=resources&resourceTab=help&community=${community.id}`;
                      }}
                      className="px-6 py-3 bg-[#B8860B] text-white font-bold rounded-xl hover:bg-[#9A7209] transition-colors"
                    >
                      Se förfrågningar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Activity Feed */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Activity size={20} className="text-[#3D4A2B]" />
                  Senaste aktivitet
                </h3>
                <button
                  onClick={() => window.location.href = `/local/activity?community=${community.id}`}
                  className="text-sm text-[#3D4A2B] hover:text-[#2A331E] font-semibold hover:underline"
                >
                  Visa alla
                </button>
              </div>
              
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => {
                    const link = getActivityLink(activity);
                    const hasImage = !!activity.image_url;
                    const content = (
                      <>
                        {getActivityIcon(activity.activity_type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">
                            {activity.activity_type === 'member_joined' ? (
                              <>
                                <span className="font-semibold">
                                  {activity.user_name && activity.user_name !== 'Anonym användare' ? activity.user_name : 'Ny medlem'}
                                </span>
                                {' '}
                                <span className="text-gray-600">
                                  {getActivityActionText(activity.activity_type)}
                                </span>
                              </>
                            ) : (
                              <>
                                {activity.user_name && activity.user_name !== 'Anonym användare' && (
                                  <>
                                    <span className="font-semibold">{activity.user_name}</span>
                                    {' '}
                                  </>
                                )}
                                <span className="text-gray-600">
                                  {getActivityActionText(activity.activity_type)}
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
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-[#3D4A2B] transition-all duration-200 cursor-pointer">
                                <Image
                                  src={activity.image_url!}
                                  alt={activity.resource_name || activity.title}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                />
                              </div>
                              {/* Large hover preview */}
                              <div className="absolute left-0 top-0 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                                <div className="relative w-48 h-48 rounded-xl overflow-hidden border-4 border-[#3D4A2B] shadow-2xl">
                                  <Image
                                    src={activity.image_url!}
                                    alt={activity.resource_name || activity.title}
                                    fill
                                    className="object-cover"
                                    sizes="192px"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Clock size={10} />
                            <span>{formatTimeAgo(activity.created_at)}</span>
                            {link && <ExternalLink size={10} className="ml-1 text-[#3D4A2B]" />}
                          </div>
                        </div>
                      </>
                    );

                    return link ? (
                      <Link
                        key={activity.id}
                        href={link}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        {content}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <Activity size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Ingen aktivitet ännu</p>
                  </div>
                )}
              </div>
            </div>
          </div>

      {/* Homespace Editor Modal */}
      {showHomespaceEditor && community?.id && (
        <HomespaceEditorWrapper
          communityId={community.id}
          userId={user.id}
          onClose={() => {
            setShowHomespaceEditor(false);
            if (isAdmin) {
              loadHomespaceData();
            }
          }}
        />
      )}
    </div>
  );
}
