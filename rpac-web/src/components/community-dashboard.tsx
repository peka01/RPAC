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
  Globe
} from 'lucide-react';
import { resourceSharingService } from '@/lib/resource-sharing-service';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import type { User } from '@supabase/supabase-js';
import type { LocalCommunity } from '@/lib/supabase';
import { supabase, communityService } from '@/lib/supabase';
import HomespaceEditorWrapper from '@/components/homespace-editor-wrapper';
import { CommunityAdminSection } from '@/components/community-admin-section';
import { t } from '@/lib/locales';

interface CommunityDashboardProps {
  user: User;
  community: LocalCommunity;
  onNavigate: (view: 'resources' | 'messaging') => void;
}

export function CommunityDashboard({ user, community, onNavigate }: CommunityDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [showHomespaceEditor, setShowHomespaceEditor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [homespaceSlug, setHomespaceSlug] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalResources: 0,
    availableResources: 0,
    helpRequests: 0,
    activeMembers: 0,
    recentActivity: 0
  });

  useEffect(() => {
    if (community?.id) {
      loadCommunityStats();
      checkAdminStatus();
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
    console.log('🔐 Admin status for community:', community.id, '=', adminStatus);
    setIsAdmin(adminStatus);
  };

  const loadHomespaceData = async () => {
    if (!community?.id) return;
    
    console.log('🏡 Loading homespace data for community:', community.id);
    const { data } = await supabase
      .from('community_homespaces')
      .select('slug')
      .eq('community_id', community.id)
      .single();
    
    console.log('🏡 Homespace slug:', data?.slug);
    setHomespaceSlug(data?.slug || null);
  };

  // Don't render if community is not loaded yet
  if (!community) {
    return (
      <div className="flex items-center justify-center p-12">
        <ShieldProgressSpinner variant="bounce" size="lg" color="olive" message="Laddar samhälle" />
      </div>
    );
  }

  const loadCommunityStats = async () => {
    if (!community?.id) return;
    
    try {
      setLoading(true);

      // Get shared resources
      const resources = await resourceSharingService.getCommunityResources(community.id);
      const availableResources = resources.filter(r => r.status === 'available');

      // Get help requests
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ShieldProgressSpinner variant="bounce" size="lg" color="olive" message="Laddar" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-2xl p-8 shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Shield size={40} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">{community.community_name}</h1>
              <p className="text-white/80 text-lg">
                {community.description || 'Lokalt beredskapsamhälle'}
              </p>
              {/* Public Homepage URL - visible to all */}
              {homespaceSlug && (
                <a
                  href={`/${homespaceSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors text-sm font-medium"
                >
                  <Globe size={16} />
                  <span>beready.se/{homespaceSlug}</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-70">
                    <path d="M10.5 1.5L1.5 10.5M10.5 1.5H3M10.5 1.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
            <div className="flex items-center gap-2">
              <MapPin size={16} />
              <span className="text-sm font-medium">
                {community.location || community.postal_code}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid - Enhanced with Context */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {t('local_community.status_title')}
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/25 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-white/90" />
                <span className="text-white/90 text-sm font-medium">Medlemmar</span>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.activeMembers}</div>
            <div className="text-white/80 text-xs">Aktiva medlemmar</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/25 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-white/90" />
                <span className="text-white/90 text-sm font-medium">Resurser</span>
              </div>
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.availableResources}</div>
            <div className="text-white/80 text-xs">Tillgängliga resurser</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/25 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Heart size={18} className="text-white/90" />
                <span className="text-white/90 text-sm font-medium">Förfrågningar</span>
              </div>
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.helpRequests}</div>
            <div className="text-white/80 text-xs">Aktiva förfrågningar</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/25 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-white/90" />
                <span className="text-white/90 text-sm font-medium">Aktivitet</span>
              </div>
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.recentActivity}</div>
            <div className="text-white/80 text-xs">Senaste veckan</div>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className="bg-[#556B2F]/10 border-2 border-[#556B2F]/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#556B2F] rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle size={24} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {community.community_name} är igång
            </h3>
            <p className="text-gray-700">
              {community.member_count} medlemmar bidrar redan. 
              {stats.availableResources > 0 && ` ${stats.availableResources} resurser finns tillgängliga.`}
              {stats.helpRequests > 0 && ` ${stats.helpRequests} personer behöver hjälp just nu.`}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate('resources')}
          className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] text-left border-2 border-transparent hover:border-[#3D4A2B]"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-[#3D4A2B]/10 rounded-xl flex items-center justify-center group-hover:bg-[#3D4A2B] transition-colors">
              <Package size={28} className="text-[#3D4A2B] group-hover:text-white transition-colors" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900 mb-1">
                Hantera resurser
              </div>
              <div className="text-sm text-gray-600">
                Dela, begär och inventera
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {stats.availableResources} tillgängliga resurser
            </span>
            <span className="text-[#3D4A2B] font-bold group-hover:translate-x-1 transition-transform">
              Öppna →
            </span>
          </div>
        </button>

        <Link
          href="/local/messages/community/"
          className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] text-left border-2 border-transparent hover:border-[#3D4A2B] block"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-[#3D4A2B]/10 rounded-xl flex items-center justify-center group-hover:bg-[#3D4A2B] transition-colors">
              <MessageCircle size={28} className="text-[#3D4A2B] group-hover:text-white transition-colors" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900 mb-1">
                Meddelanden
              </div>
              <div className="text-sm text-gray-600">
                Kommunicera med medlemmar
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
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
        <CommunityAdminSection
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
              <Heart size={24} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {stats.helpRequests} {stats.helpRequests === 1 ? 'person behöver' : 'personer behöver'} hjälp
              </h3>
              <p className="text-gray-700 mb-4">
                Medlemmar i ditt samhälle har begärt hjälp. Kan du bidra?
              </p>
              <button
                onClick={() => onNavigate('resources')}
                className="px-6 py-3 bg-[#B8860B] text-white font-bold rounded-xl hover:bg-[#9A7209] transition-colors"
              >
                Se förfrågningar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Preview (Optional) */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Senaste aktivitet</h3>
          <Clock size={20} className="text-gray-400" />
        </div>
        <div className="space-y-3">
          {stats.totalResources > 0 ? (
            <>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-2 h-2 bg-[#556B2F] rounded-full"></div>
                <span>{stats.totalResources} resurser delade av medlemmar</span>
              </div>
              {stats.helpRequests > 0 && (
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-[#B8860B] rounded-full"></div>
                  <span>{stats.helpRequests} aktiva hjälpförfrågningar</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-2 h-2 bg-[#3D4A2B] rounded-full"></div>
                <span>{stats.activeMembers} aktiva medlemmar</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600 text-center py-4">
              Ingen aktivitet än. Var den första att dela en resurs eller skapa en förfrågan!
            </p>
          )}
        </div>
      </div>

      {/* Homespace Editor Modal */}
      {showHomespaceEditor && community?.id && (
        <HomespaceEditorWrapper
          communityId={community.id}
          userId={user.id}
          onClose={() => {
            setShowHomespaceEditor(false);
            // Reload homespace data after editing
            if (isAdmin) {
              loadHomespaceData();
            }
          }}
        />
      )}
    </div>
  );
}

