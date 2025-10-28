'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { resourceSharingService } from '@/lib/resource-sharing-service';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { CommunityActivityFeed } from '@/components/community-activity-feed';
import type { User } from '@supabase/supabase-js';
import type { LocalCommunity } from '@/lib/supabase';
import { supabase, communityService } from '@/lib/supabase';
import HomespaceEditorWrapper from '@/components/homespace-editor-wrapper';
import { CommunityAdminSectionResponsive } from '@/components/community-admin-section-responsive';
import { t } from '@/lib/locales';

interface CommunityDashboardRefactoredMobileProps {
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

export function CommunityDashboardRefactoredMobile({ user, community, onNavigate }: CommunityDashboardRefactoredMobileProps) {
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
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

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
      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'member_joined',
          message: 'Ny medlem gick med i samhället',
          timestamp: '22 tim sedan'
        },
        {
          id: '2',
          type: 'member_joined',
          message: 'Simon Salgfors gick med i samhället',
          timestamp: '22 tim sedan'
        },
        {
          id: '3',
          type: 'member_joined',
          message: 'Test User gick med i samhället',
          timestamp: '22 tim sedan'
        }
      ];
      
      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
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
    <div className="px-4 py-6 space-y-6">


        {/* Statistics Cards - Mobile Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users size={16} className="text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Medlemmar</h4>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.activeMembers}</div>
            <p className="text-xs text-gray-600">Aktiva medlemmar</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Package size={16} className="text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Resurser</h4>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.availableResources}</div>
            <p className="text-xs text-gray-600">Tillgängliga resurser</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                <Heart size={16} className="text-pink-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Förfrågningar</h4>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.helpRequests}</div>
            <p className="text-xs text-gray-600">Aktiva förfrågningar</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity size={16} className="text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">Aktivitet</h4>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.recentActivity}</div>
            <p className="text-xs text-gray-600">Senaste veckan</p>
          </div>
        </div>

        {/* Enhanced Activity Feed - Prominent Mobile Section */}
        <div className="bg-gradient-to-br from-[#3D4A2B]/5 to-[#5C6B47]/10 rounded-2xl p-6 border border-[#3D4A2B]/20 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#3D4A2B] rounded-xl flex items-center justify-center">
                <Activity size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Senaste aktivitet</h3>
                <p className="text-sm text-[#3D4A2B] font-medium">Vad händer i samhället</p>
              </div>
            </div>
            <button className="px-3 py-1.5 bg-[#3D4A2B]/10 text-[#3D4A2B] text-xs font-semibold rounded-lg hover:bg-[#3D4A2B]/20 transition-colors">
              Visa alla
            </button>
          </div>
          
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.slice(0, 3).map((activity, index) => (
                <div key={activity.id} className="flex items-start gap-3 p-4 bg-white/80 rounded-xl border border-white/50 hover:bg-white transition-colors">
                  <div className="w-8 h-8 bg-[#5C6B47] rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Users size={14} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{activity.message}</p>
                    <p className="text-xs text-[#3D4A2B]/70 mt-1 font-medium">{activity.timestamp}</p>
                  </div>
                  {index === 0 && (
                    <div className="w-2 h-2 bg-[#3D4A2B] rounded-full animate-pulse"></div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[#3D4A2B]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Activity size={24} className="text-[#3D4A2B]" />
                </div>
                <p className="text-gray-600 text-sm">Ingen aktivitet ännu</p>
                <p className="text-gray-500 text-xs mt-1">Aktiviteter visas här när medlemmar delar resurser</p>
              </div>
            )}
          </div>
          
          {recentActivity.length > 3 && (
            <div className="mt-4 pt-4 border-t border-[#3D4A2B]/20">
              <button className="w-full py-2 px-4 bg-white/50 text-[#3D4A2B] text-sm font-semibold rounded-lg hover:bg-white/80 transition-colors">
                Visa {recentActivity.length - 3} fler aktiviteter
              </button>
            </div>
          )}
        </div>

        {/* Action Cards - Mobile Stack */}
        <div className="space-y-4">
          <button
            onClick={() => onNavigate('resources')}
            className="group bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all w-full text-left touch-manipulation active:scale-98"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#3D4A2B]/10 rounded-xl flex items-center justify-center group-hover:bg-[#3D4A2B] transition-colors">
                <Package size={24} className="text-[#3D4A2B] group-hover:text-white transition-colors" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Hantera resurser</h3>
                <p className="text-gray-600 text-sm">Dela, begär och inventera</p>
              </div>
              <ChevronRight size={20} className="text-[#3D4A2B]" />
            </div>
            <div className="text-sm text-gray-600">
              {stats.availableResources} tillgängliga resurser
            </div>
          </button>

          <Link
            href="/local/messages/community/"
            className="group bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all w-full text-left block touch-manipulation active:scale-98"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[#3D4A2B]/10 rounded-xl flex items-center justify-center group-hover:bg-[#3D4A2B] transition-colors">
                <MessageCircle size={24} className="text-[#3D4A2B] group-hover:text-white transition-colors" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Meddelanden</h3>
                <p className="text-gray-600 text-sm">Kommunicera med medlemmar</p>
              </div>
              <ChevronRight size={20} className="text-[#3D4A2B]" />
            </div>
            <div className="text-sm text-gray-600">
              {t('messaging.community_chat_description')}
            </div>
          </Link>
        </div>

        {/* Admin Section - Mobile Optimized */}
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

        {/* Help Requests Alert - Mobile */}
        {stats.helpRequests > 0 && (
          <div className="bg-[#B8860B]/10 border-2 border-[#B8860B] rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#B8860B] rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                <Heart size={20} className="text-white" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {stats.helpRequests} {stats.helpRequests === 1 ? 'person behöver' : 'personer behöver'} hjälp
                </h3>
                <p className="text-gray-700 text-sm mb-4">
                  Medlemmar i ditt samhälle har begärt hjälp. Kan du bidra?
                </p>
                <button
                  onClick={() => onNavigate('resources')}
                  className="w-full px-6 py-3 bg-[#B8860B] text-white font-bold rounded-xl hover:bg-[#9A7209] transition-colors touch-manipulation active:scale-98"
                >
                  Se förfrågningar
                </button>
              </div>
            </div>
          </div>
        )}


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
