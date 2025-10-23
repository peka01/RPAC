'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Settings,
  UserCheck,
  Clock,
  MapPin,
  Home,
  Mail,
  Shield,
  AlertCircle,
  CheckCircle,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Save,
  X as XIcon,
  UserX,
  ExternalLink,
  BarChart3,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Menu,
  MoreVertical
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/locales';
import { ShieldProgressSpinner } from './ShieldProgressSpinner';
import InvitationAnalyticsDashboard from './invitation-analytics-dashboard';
import type { User } from '@supabase/supabase-js';

interface CommunityAdminSectionMobileProps {
  user: User;
  communityId: string;
  communityName: string;
  onSettingsUpdate?: () => void;
  onOpenHomespaceEditor?: () => void;
}

interface PendingRequest {
  membership_id: string;
  user_id: string;
  user_email: string;
  display_name: string;
  join_message: string | null;
  requested_at: string;
  postal_code: string | null;
  county: string | null;
  household_size: number | null;
}

interface CommunityMember {
  membership_id: string;
  user_id: string;
  email: string;
  display_name: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  membership_status: string;
}

interface CommunitySettings {
  community_name: string;
  description: string | null;
  access_type: 'öppet' | 'stängt';
  auto_approve_members: boolean;
  is_public: boolean;
}

export function CommunityAdminSectionMobile({ 
  user, 
  communityId, 
  communityName,
  onSettingsUpdate,
  onOpenHomespaceEditor
}: CommunityAdminSectionMobileProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'settings' | 'homepage' | 'analytics'>('members');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [memberFilter, setMemberFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<CommunityMember | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['pending']));
  
  // Pending requests state
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  
  // Members state
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [membersCount, setMembersCount] = useState(0);
  
  // Settings state
  const [settings, setSettings] = useState<CommunitySettings>({
    community_name: communityName,
    description: null,
    access_type: 'öppet',
    auto_approve_members: true,
    is_public: true
  });
  const [originalSettings, setOriginalSettings] = useState<CommunitySettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadData();
  }, [communityId, activeTab, memberFilter]);

  useEffect(() => {
    if (originalSettings) {
      const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
      setHasChanges(changed);
    }
  }, [settings, originalSettings]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPendingRequests(),
        loadMembers(),
        loadSettings()
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      // Loading pending requests for community
      
      // Get pending memberships - try both column names
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('community_memberships')
        .select('id, user_id, join_message, requested_at, membership_status, status')
        .eq('community_id', communityId)
        .or('membership_status.eq.pending,status.eq.pending')  // Try both column names
        .order('requested_at', { ascending: true });

      if (membershipsError) {
        console.error('❌ Error loading pending memberships:', membershipsError);
        setPendingRequests([]);
        setPendingCount(0);
        return;
      }

      if (!membershipsData || membershipsData.length === 0) {
        setPendingRequests([]);
        setPendingCount(0);
        return;
      }

      // Try to get community members with emails using RPC function
      
      const { data: membersWithEmails, error: membersRpcError } = await supabase
        .rpc('get_community_members_with_emails', { p_community_id: communityId });
      
      let profilesMap = new Map();
      let emailsMap = new Map();

      if (membersRpcError) {
        console.warn('⚠️ RPC function not available, using fallback query:', membersRpcError.message);
        
        // Fallback: Get profiles without emails
        const userIds = membershipsData.map(m => m.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, postal_code, county')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('❌ Error fetching profiles:', profilesError);
        } else {
          profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
        }
      } else {
        // Success: We have profiles with emails
        profilesMap = new Map(membersWithEmails?.map((m: any) => [m.user_id, m]) || []);
        emailsMap = new Map(membersWithEmails?.map((m: any) => [m.user_id, m.email]) || []);
      }

      const transformedRequests = membershipsData.map((m, index) => {
        const profile = profilesMap.get(m.user_id);
        const userEmail = emailsMap.get(m.user_id);
        
        // Determine display name with fallbacks:
        // 1. display_name from profile
        // 2. email prefix (username before @)
        // 3. "Medlem X" as last resort
        let displayName = 'Okänd användare';
        if (profile?.display_name && profile.display_name.trim()) {
          displayName = profile.display_name.trim();
        } else if (userEmail) {
          displayName = userEmail.split('@')[0];
        } else {
          displayName = `Medlem ${index + 1}`;
        }

        return {
          membership_id: m.id,
          user_id: m.user_id,
          user_email: userEmail || 'unknown',
          display_name: displayName,
          join_message: m.join_message,
          requested_at: m.requested_at,
          postal_code: profile?.postal_code || null,
          county: profile?.county || null,
          household_size: null // family_size column doesn't exist yet
        };
      });

      setPendingRequests(transformedRequests);
      setPendingCount(transformedRequests.length);
    } catch (error) {
      console.error('❌ Exception loading pending requests:', error);
      setPendingRequests([]);
      setPendingCount(0);
    }
  };

  const loadMembers = async () => {
    try {
      // First get memberships - try both column names
      const { data: membershipsData, error: membershipsError } = await supabase
        .from('community_memberships')
        .select('id, user_id, role, joined_at, status, membership_status')
        .eq('community_id', communityId)
        .or('membership_status.eq.approved,status.eq.approved')  // Try both column names
        .order('joined_at', { ascending: false });

      if (membershipsError) {
        console.error('❌ Error loading memberships:', membershipsError);
        return;
      }

      if (!membershipsData || membershipsData.length === 0) {
        setMembers([]);
        setMembersCount(0);
        return;
      }

      // Get user profiles for these users
      const userIds = membershipsData.map(m => m.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('❌ Error loading profiles:', profilesError);
      }

      // Combine data
      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
      
      const transformedMembers = membershipsData.map(m => ({
        membership_id: m.id,
        user_id: m.user_id,
        email: '',
        display_name: profilesMap.get(m.user_id)?.display_name || 'Okänd användare',
        role: m.role,
        joined_at: m.joined_at,
        membership_status: m.membership_status || m.status  // Use whichever column exists
      }));

      setMembers(transformedMembers);
      setMembersCount(transformedMembers.length);
    } catch (error) {
      console.error('❌ Exception loading members:', error);
      setMembers([]);
      setMembersCount(0);
    }
  };

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('local_communities')
      .select('community_name, description, access_type, auto_approve_members, is_public')
      .eq('id', communityId)
      .single();

    if (error) {
      console.error('Error loading settings:', error);
      return;
    }

    const loadedSettings = {
      community_name: data.community_name,
      description: data.description,
      access_type: data.access_type || 'öppet',
      auto_approve_members: data.auto_approve_members ?? true,
      is_public: data.is_public ?? true
    };

    setSettings(loadedSettings);
    setOriginalSettings(loadedSettings);
  };

  const handleApproveRequest = async (membershipId: string) => {
    setActionLoading(membershipId);
    try {
      const { error } = await supabase.rpc('approve_membership_request', {
        p_membership_id: membershipId,
        p_reviewer_id: user.id
      });

      if (error) throw error;

      // Reload both pending requests and members list
      await Promise.all([
        loadPendingRequests(),
        loadMembers()
      ]);
      
      if (onSettingsUpdate) onSettingsUpdate();
    } catch (error) {
      console.error('Error approving request:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (membershipId: string) => {
    setActionLoading(membershipId);
    try {
      const { error } = await supabase.rpc('reject_membership_request', {
        p_membership_id: membershipId,
        p_reviewer_id: user.id,
        p_reason: null
      });

      if (error) throw error;

      await loadPendingRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveSettings = async () => {
    setActionLoading('save');
    try {
      const { error } = await supabase
        .from('local_communities')
        .update({
          community_name: settings.community_name,
          description: settings.description,
          access_type: settings.access_type,
          auto_approve_members: settings.auto_approve_members,
          is_public: settings.is_public
        })
        .eq('id', communityId);

      if (error) throw error;

      setOriginalSettings({ ...settings });
      setHasChanges(false);
      
      if (onSettingsUpdate) onSettingsUpdate();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const confirmRemoveMember = (member: CommunityMember) => {
    setMemberToRemove(member);
    setShowRemoveDialog(true);
  };

  const executeRemoveMember = async () => {
    if (!memberToRemove) return;

    setActionLoading(memberToRemove.membership_id);
    try {
      const { error } = await supabase.rpc('remove_community_member', {
        p_membership_id: memberToRemove.membership_id,
        p_remover_id: user.id,
        p_reason: null
      });

      if (error) throw error;

      // Reload members list
      await loadMembers();
    } catch (error) {
      console.error('Error removing member:', error);
    } finally {
      setActionLoading(null);
      setShowRemoveDialog(false);
      setMemberToRemove(null);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-[#3D4A2B] text-white';
      case 'moderator': return 'bg-[#5C6B47] text-white';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'moderator': return 'Moderator';
      default: return 'Medlem';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
      {/* Mobile Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3D4A2B]/10 rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-[#3D4A2B]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {t('community_admin.section_title')}
              </h2>
              <p className="text-sm text-gray-600">
                {t('community_admin.subtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-[#3D4A2B] px-3 py-1 rounded-lg">
              <span className="text-white text-xs font-semibold">
                {t('community_admin.admin_badge')}
              </span>
            </div>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      {showMobileMenu && (
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setActiveTab('members');
                setShowMobileMenu(false);
              }}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'members'
                  ? 'bg-[#3D4A2B] text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              <Users size={18} />
              <span>{t('community_admin.tabs.members')}</span>
              {pendingCount > 0 && (
                <span className="w-5 h-5 bg-[#B8860B] text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('settings');
                setShowMobileMenu(false);
              }}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'settings'
                  ? 'bg-[#3D4A2B] text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              <Settings size={18} />
              <span>{t('community_admin.tabs.settings')}</span>
              {hasChanges && (
                <span className="w-2 h-2 bg-[#B8860B] rounded-full animate-pulse"></span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('homepage');
                setShowMobileMenu(false);
              }}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'homepage'
                  ? 'bg-[#3D4A2B] text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              <Globe size={18} />
              <span>{t('community_admin.tabs.homepage')}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('analytics');
                setShowMobileMenu(false);
              }}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
                activeTab === 'analytics'
                  ? 'bg-[#3D4A2B] text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              <BarChart3 size={18} />
              <span>{t('community_admin.tabs.analytics')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <ShieldProgressSpinner variant="bounce" size="lg" color="olive" message="Laddar" />
          </div>
        ) : (
          <>
            {/* Members Tab - Mobile Optimized */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                {/* Pending Requests Section */}
                {pendingRequests.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <button
                      onClick={() => toggleSection('pending')}
                      className="w-full flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                          <Clock size={16} className="text-amber-600" />
                        </div>
                        <div className="text-left">
                        <h3 className="font-semibold text-amber-800">
                          {t('community_admin.pending_requests.title')}
                        </h3>
                        <p className="text-sm text-amber-600">
                          {t('community_admin.pending_requests.subtitle')}
                        </p>
                        </div>
                      </div>
                      {expandedSections.has('pending') ? (
                        <ChevronUp size={20} className="text-amber-600" />
                      ) : (
                        <ChevronDown size={20} className="text-amber-600" />
                      )}
                    </button>

                    {expandedSections.has('pending') && (
                      <div className="mt-4 space-y-3">
                        {pendingRequests.map((request) => (
                          <div key={request.membership_id} className="bg-white rounded-lg p-4 border border-amber-200">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">
                                  {request.display_name}
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                  {request.user_email}
                                </p>
                                {request.join_message && (
                                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mb-3">
                                    "{request.join_message}"
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                  {request.postal_code && (
                                    <span className="flex items-center gap-1">
                                      <MapPin size={12} />
                                      {request.postal_code}
                                    </span>
                                  )}
                                  {request.household_size && (
                                    <span className="flex items-center gap-1">
                                      <Home size={12} />
                                      {request.household_size} personer
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {formatDate(request.requested_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveRequest(request.membership_id)}
                                disabled={actionLoading === request.membership_id}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#3D4A2B] text-white px-4 py-3 rounded-lg font-semibold text-sm transition-all active:scale-98 touch-manipulation disabled:opacity-50"
                              >
                                {actionLoading === request.membership_id ? (
                                  <ShieldProgressSpinner variant="rotate" size="sm" color="olive" />
                                ) : (
                                  <>
                                    <CheckCircle size={16} />
                                    {t('community_admin.approve')}
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request.membership_id)}
                                disabled={actionLoading === request.membership_id}
                                className="flex-1 flex items-center justify-center gap-2 bg-red-100 text-red-700 px-4 py-3 rounded-lg font-semibold text-sm transition-all active:scale-98 touch-manipulation disabled:opacity-50"
                              >
                                {actionLoading === request.membership_id ? (
                                  <ShieldProgressSpinner variant="rotate" size="sm" color="green" />
                                ) : (
                                  <>
                                    <XIcon size={16} />
                                    {t('community_admin.reject')}
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Members List Section */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <button
                    onClick={() => toggleSection('members')}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#3D4A2B]/10 rounded-lg flex items-center justify-center">
                        <Users size={16} className="text-[#3D4A2B]" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">
                          {t('community_admin.tabs.members')}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {membersCount} {t('community_admin.total_members')}
                        </p>
                      </div>
                    </div>
                    {expandedSections.has('members') ? (
                      <ChevronUp size={20} className="text-gray-600" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-600" />
                    )}
                  </button>

                  {expandedSections.has('members') && (
                    <div className="mt-4 space-y-3">
                      {members.map((member) => (
                        <div key={member.membership_id} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-gray-900">
                                  {member.display_name}
                                </h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(member.role)}`}>
                                  {getRoleText(member.role)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {member.email}
                              </p>
                              <p className="text-xs text-gray-500">
                                {t('community_admin.joined')}: {formatDate(member.joined_at)}
                              </p>
                            </div>
                            {member.user_id !== user.id && (
                              <div className="flex items-center gap-2">
                                {/* Message button */}
                                <a
                                  href={`/local/messages/direct/?userId=${member.user_id}`}
                                  className="w-10 h-10 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center active:scale-98 touch-manipulation"
                                  title="Skicka meddelande"
                                >
                                  <MessageCircle size={18} />
                                </a>

                                {/* Remove member button */}
                                <button
                                  onClick={() => confirmRemoveMember(member)}
                                  disabled={actionLoading === member.membership_id}
                                  className="w-10 h-10 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center active:scale-98 touch-manipulation"
                                  title="Ta bort medlem"
                                >
                                  {actionLoading === member.membership_id ? (
                                    <ShieldProgressSpinner variant="bounce" size="sm" />
                                  ) : (
                                    <Trash2 size={18} />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab - Mobile Optimized */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('community_admin.community_name')}
                    </label>
                    <input
                      type="text"
                      value={settings.community_name}
                      onChange={(e) => setSettings({ ...settings, community_name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {t('community_admin.description')}
                    </label>
                    <textarea
                      value={settings.description || ''}
                      onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent transition-all resize-none"
                      placeholder={t('community_admin.description_placeholder')}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        {t('community_admin.access_type')}
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="radio"
                            name="access_type"
                            value="öppet"
                            checked={settings.access_type === 'öppet'}
                            onChange={(e) => setSettings({ ...settings, access_type: e.target.value as 'öppet' | 'stängt' })}
                            className="w-4 h-4 text-[#3D4A2B] focus:ring-[#3D4A2B]"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">Öppet samhälle</div>
                            <div className="text-sm text-gray-600">Nya medlemmar godkänns automatiskt</div>
                          </div>
                          <Globe size={20} className="text-[#3D4A2B]" />
                        </label>

                        <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="radio"
                            name="access_type"
                            value="stängt"
                            checked={settings.access_type === 'stängt'}
                            onChange={(e) => setSettings({ ...settings, access_type: e.target.value as 'öppet' | 'stängt' })}
                            className="w-4 h-4 text-[#3D4A2B] focus:ring-[#3D4A2B]"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">Stängt samhälle</div>
                            <div className="text-sm text-gray-600">Kräver godkännande för nya medlemmar</div>
                          </div>
                          <Lock size={20} className="text-[#3D4A2B]" />
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <div className="font-semibold text-gray-900">Synlig för alla</div>
                        <div className="text-sm text-gray-600">Samhället visas i sökresultat</div>
                      </div>
                      <button
                        onClick={() => setSettings({ ...settings, is_public: !settings.is_public })}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings.is_public ? 'bg-[#3D4A2B]' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          settings.is_public ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>

                {hasChanges && (
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveSettings}
                      disabled={actionLoading === 'save'}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#3D4A2B] text-white px-6 py-4 rounded-xl font-semibold transition-all active:scale-98 touch-manipulation disabled:opacity-50"
                    >
                      {actionLoading === 'save' ? (
                        <ShieldProgressSpinner variant="rotate" size="sm" color="olive" />
                      ) : (
                        <>
                          <Save size={18} />
                          {t('community_admin.save_changes')}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSettings(originalSettings || settings);
                        setHasChanges(false);
                      }}
                      className="px-6 py-4 border border-gray-300 text-gray-700 rounded-xl font-semibold transition-all active:scale-98 touch-manipulation"
                    >
                      {t('community_admin.cancel')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Homepage Tab - Mobile Optimized */}
            {activeTab === 'homepage' && (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#3D4A2B]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Globe size={32} className="text-[#3D4A2B]" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {t('community_admin.homepage_editor')}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {t('community_admin.homepage_description')}
                  </p>
                  <button
                    onClick={onOpenHomespaceEditor}
                    className="w-full flex items-center justify-center gap-3 bg-[#3D4A2B] text-white px-6 py-4 rounded-xl font-semibold transition-all active:scale-98 touch-manipulation"
                  >
                    <Globe size={20} />
                    {t('community_admin.open_homepage_editor')}
                  </button>
                </div>
              </div>
            )}

            {/* Analytics Tab - Mobile Optimized */}
            {activeTab === 'analytics' && (
              <div className="space-y-4">
                <InvitationAnalyticsDashboard 
                  communityId={communityId}
                  communityName={communityName}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Remove Member Confirmation Dialog */}
      {showRemoveDialog && memberToRemove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Ta bort medlem
                </h3>
                <p className="text-sm text-gray-600">
                  Är du säker på att du vill ta bort {memberToRemove.display_name}?
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={executeRemoveMember}
                disabled={actionLoading === memberToRemove.membership_id}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-xl font-semibold transition-all active:scale-98 touch-manipulation disabled:opacity-50"
              >
                {actionLoading === memberToRemove.membership_id ? (
                  <ShieldProgressSpinner variant="rotate" size="sm" color="olive" />
                ) : (
                  <>
                    <Trash2 size={16} />
                    Ta bort
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowRemoveDialog(false);
                  setMemberToRemove(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold transition-all active:scale-98 touch-manipulation"
              >
                Avbryt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
