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
  MessageCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/locales';
import { ShieldProgressSpinner } from './ShieldProgressSpinner';
import InvitationAnalyticsDashboard from './invitation-analytics-dashboard';
import type { User } from '@supabase/supabase-js';

interface CommunityAdminSectionProps {
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

export function CommunityAdminSection({ 
  user, 
  communityId, 
  communityName,
  onSettingsUpdate,
  onOpenHomespaceEditor
}: CommunityAdminSectionProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'settings' | 'homepage' | 'analytics'>('members');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [memberFilter, setMemberFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<CommunityMember | null>(null);
  
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
      if (activeTab === 'members') {
        await Promise.all([loadPendingRequests(), loadMembers()]);
      } else if (activeTab === 'settings') {
        await loadSettings();
      }
    } catch (error) {
      console.error('Error loading data:', error);
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

  const handleApprove = async (membershipId: string, displayName: string) => {
    setActionLoading(membershipId);
    try {
      const { error } = await supabase.rpc('approve_membership_request', {
        p_membership_id: membershipId,
        p_reviewer_id: user.id
      });

      if (error) throw error;

      // Show success message
      alert(t('community_admin.pending_requests.approve_success').replace('{name}', displayName));
      
      // Reload both pending requests and members list
      await Promise.all([
        loadPendingRequests(),
        loadMembers()
      ]);
    } catch (error) {
      console.error('Error approving membership:', error);
      alert(t('community_admin.pending_requests.approve_error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (membershipId: string, displayName: string) => {
    const reason = prompt(t('community_admin.pending_requests.rejection_reason_title'), '');
    
    setActionLoading(membershipId);
    try {
      const { error } = await supabase.rpc('reject_membership_request', {
        p_membership_id: membershipId,
        p_reviewer_id: user.id,
        p_reason: reason || null
      });

      if (error) throw error;

      // Show success message
      alert(t('community_admin.pending_requests.reject_success').replace('{name}', displayName));
      
      // Reload both pending requests and members list
      await Promise.all([
        loadPendingRequests(),
        loadMembers()
      ]);
    } catch (error) {
      console.error('Error rejecting membership:', error);
      alert(t('community_admin.pending_requests.reject_error'));
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

      alert(t('community_admin.settings.save_success'));
      setOriginalSettings(settings);
      setHasChanges(false);

      if (onSettingsUpdate) {
        onSettingsUpdate();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(t('community_admin.settings.save_error'));
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

    // Get the reason from the textarea
    const reasonElement = document.getElementById('removeReason') as HTMLTextAreaElement;
    const reason = reasonElement?.value || null;

    setActionLoading(memberToRemove.membership_id);
    try {
      const { error } = await supabase.rpc('remove_community_member', {
        p_membership_id: memberToRemove.membership_id,
        p_remover_id: user.id,
        p_reason: reason
      });

      if (error) throw error;

      // Show success message
      alert(t('community_admin.members.remove_success').replace('{name}', memberToRemove.display_name));

      // Reload members list
      await loadMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      alert(t('community_admin.members.remove_error'));
    } finally {
      setActionLoading(null);
      setShowRemoveDialog(false);
      setMemberToRemove(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Idag';
    if (diffDays === 1) return 'Igår';
    if (diffDays < 7) return `${diffDays} dagar sedan`;
    
    return date.toLocaleDateString('sv-SE', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="mt-8 bg-gradient-to-br from-[#5C6B47]/10 to-[#4A5239]/5 border-2 border-[#5C6B47]/30 rounded-2xl p-6 shadow-xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#3D4A2B] rounded-xl flex items-center justify-center">
            <Shield size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('community_admin.section_title')}
            </h2>
            <p className="text-sm text-gray-600">
              {t('community_admin.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white rounded-xl p-2 shadow-inner overflow-x-auto">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-semibold text-sm transition-all relative ${
            activeTab === 'members'
              ? 'bg-[#3D4A2B] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Users size={18} />
            <span className="whitespace-nowrap">{t('community_admin.tabs.members')}</span>
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-[#B8860B] text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                {pendingCount}
              </span>
            )}
          </div>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
            activeTab === 'settings'
              ? 'bg-[#3D4A2B] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Settings size={18} />
            <span className="whitespace-nowrap">{t('community_admin.tabs.settings')}</span>
            {hasChanges && (
              <span className="w-2 h-2 bg-[#B8860B] rounded-full animate-pulse"></span>
            )}
          </div>
        </button>

        <button
          onClick={() => setActiveTab('homepage')}
          className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
            activeTab === 'homepage'
              ? 'bg-[#3D4A2B] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Globe size={18} />
            <span className="whitespace-nowrap">{t('community_admin.tabs.homepage')}</span>
          </div>
        </button>
        
        {/* Analytics Tab */}
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
            activeTab === 'analytics'
              ? 'bg-[#3D4A2B] text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <BarChart3 size={18} />
            <span className="whitespace-nowrap">{t('community_admin.tabs.analytics')}</span>
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl p-6 min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <ShieldProgressSpinner variant="bounce" size="lg" color="olive" message="Laddar" />
          </div>
        ) : (
          <>
            {/* Members Tab - Combined with Pending Requests */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {t('community_admin.pending_requests.title')}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t('community_admin.pending_requests.subtitle')}
                    </p>
                  </div>
                  {pendingCount > 0 && (
                    <div className="bg-[#B8860B]/10 border border-[#B8860B] rounded-lg px-4 py-2">
                      <span className="text-[#B8860B] font-bold">
                        {pendingCount} {pendingCount === 1 ? 'ansökan' : 'ansökningar'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Combined Member List */}
                {(memberFilter === 'all' || memberFilter === 'pending') && pendingRequests.length === 0 && memberFilter === 'pending' ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} className="text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Inga väntande ansökningar
                    </h3>
                    <p className="text-gray-600">
                      Alla ansökningar är hanterade. Bra jobbat!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Pending Requests Section */}
                    {(memberFilter === 'all' || memberFilter === 'pending') && pendingRequests.length > 0 && (
                      <>
                        {memberFilter === 'all' && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-[#B8860B]/5 rounded-lg mb-2">
                            <Clock size={16} className="text-[#B8860B]" />
                            <span className="text-sm font-semibold text-gray-700">
                              Väntande ansökningar ({pendingCount})
                            </span>
                          </div>
                        )}
                        {pendingRequests.map((request) => (
                          <div
                            key={request.membership_id}
                            className="border-2 border-[#B8860B]/30 bg-[#B8860B]/5 rounded-xl p-4 hover:border-[#B8860B] transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 bg-[#B8860B]/20 rounded-full flex items-center justify-center">
                                    <Clock size={20} className="text-[#B8860B]" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-gray-900">
                                        {request.display_name}
                                      </span>
                                      <span className="px-2 py-0.5 bg-[#B8860B] text-white text-xs font-bold rounded">
                                        VÄNTANDE
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                      <Mail size={12} />
                                      {request.user_email}
                                    </div>
                                  </div>
                                </div>

                            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                              {request.postal_code && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <MapPin size={14} className="text-[#5C6B47]" />
                                  <span>
                                    {request.postal_code.slice(0, 3)} {request.postal_code.slice(3)}
                                    {request.county && ` (${request.county})`}
                                  </span>
                                </div>
                              )}
                              {request.household_size && (
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Home size={14} className="text-[#5C6B47]" />
                                  <span>
                                    {request.household_size} {request.household_size === 1 ? 'person' : 'personer'}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-gray-600">
                                <Clock size={14} className="text-[#5C6B47]" />
                                <span>{formatDate(request.requested_at)}</span>
                              </div>
                            </div>

                                {request.join_message && (
                                  <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
                                    <div className="text-xs font-semibold text-gray-500 mb-1">
                                      Meddelande från sökande
                                    </div>
                                    <p className="text-sm text-gray-700 italic">
                                      "{request.join_message}"
                                    </p>
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => handleApprove(request.membership_id, request.display_name)}
                                  disabled={actionLoading === request.membership_id}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                  {actionLoading === request.membership_id ? (
                                    <ShieldProgressSpinner variant="bounce" size="sm" />
                                  ) : (
                                    <CheckCircle size={16} />
                                  )}
                                  Godkänn
                                </button>
                                <button
                                  onClick={() => handleReject(request.membership_id, request.display_name)}
                                  disabled={actionLoading === request.membership_id}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors font-semibold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                  {actionLoading === request.membership_id ? (
                                    <ShieldProgressSpinner variant="bounce" size="sm" color="olive" />
                                  ) : (
                                    <UserX size={16} />
                                  )}
                                  Avslå
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Approved Members Section */}
                    {(memberFilter === 'all' || memberFilter === 'approved') && members.length > 0 && (
                      <>
                        {memberFilter === 'all' && members.length > 0 && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg mb-2 mt-4">
                            <CheckCircle size={16} className="text-green-600" />
                            <span className="text-sm font-semibold text-gray-700">
                              Godkända medlemmar ({membersCount})
                            </span>
                          </div>
                        )}
                        {members.map((member) => (
                          <div
                            key={member.user_id}
                            className="border border-gray-200 rounded-lg p-4 hover:border-[#5C6B47] transition-colors bg-white"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#5C6B47]/10 rounded-full flex items-center justify-center">
                                  <Users size={20} className="text-[#5C6B47]" />
                                </div>
                                <div>
                                  <div className="font-bold text-gray-900 flex items-center gap-2">
                                    {member.display_name}
                                    {member.role === 'admin' && (
                                      <span className="text-xs bg-[#3D4A2B] text-white px-2 py-0.5 rounded">
                                        Admin
                                      </span>
                                    )}
                                    {member.role === 'moderator' && (
                                      <span className="text-xs bg-[#5C6B47] text-white px-2 py-0.5 rounded">
                                        Moderator
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Gick med {formatDate(member.joined_at)}
                                  </div>
                                </div>
                              </div>

                              {/* Action buttons - only show if user has permission */}
                              {member.user_id !== user.id && (
                                <div className="flex items-center gap-2">
                                  {/* Message button */}
                                  <a
                                    href={`/local/messages/direct/?userId=${member.user_id}`}
                                    className="w-8 h-8 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors flex items-center justify-center"
                                    title="Skicka meddelande"
                                  >
                                    <MessageCircle size={16} />
                                  </a>

                                  {/* Remove member button */}
                                  <button
                                    onClick={() => confirmRemoveMember(member)}
                                    disabled={actionLoading === member.membership_id}
                                    className="w-8 h-8 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    title="Ta bort medlem"
                                  >
                                    {actionLoading === member.membership_id ? (
                                      <ShieldProgressSpinner variant="bounce" size="sm" />
                                    ) : (
                                      <Trash2 size={16} />
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {t('community_admin.settings.title')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('community_admin.settings.subtitle')}
                  </p>
                </div>

                {/* Basic Info */}
                <div className="border-b border-gray-200 pb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    {t('community_admin.settings.basic_info')}
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('community_admin.settings.community_name')}
                      </label>
                      <input
                        type="text"
                        value={settings.community_name}
                        onChange={(e) => setSettings({ ...settings, community_name: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C6B47] focus:border-[#5C6B47]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('community_admin.settings.description')}
                      </label>
                      <textarea
                        value={settings.description || ''}
                        onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5C6B47] focus:border-[#5C6B47]"
                      />
                    </div>
                  </div>
                </div>

                {/* Access Control */}
                <div className="border-b border-gray-200 pb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    {t('community_admin.settings.access_control')}
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        {t('community_admin.settings.access_type_label')}
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#3D4A2B] transition-colors">
                          <input
                            type="radio"
                            name="access_type"
                            value="öppet"
                            checked={settings.access_type === 'öppet'}
                            onChange={(e) => setSettings({ 
                              ...settings, 
                              access_type: e.target.value as 'öppet' | 'stängt',
                              auto_approve_members: e.target.value === 'öppet'
                            })}
                            className="mt-1 w-5 h-5 text-[#3D4A2B] border-gray-300 focus:ring-[#3D4A2B]"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                              <Globe size={18} className="text-green-600" />
                              {t('community_admin.settings.access_type_öppet')}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {t('community_admin.settings.access_type_öppet_desc')}
                            </div>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#3D4A2B] transition-colors">
                          <input
                            type="radio"
                            name="access_type"
                            value="stängt"
                            checked={settings.access_type === 'stängt'}
                            onChange={(e) => setSettings({ 
                              ...settings, 
                              access_type: e.target.value as 'öppet' | 'stängt',
                              auto_approve_members: false
                            })}
                            className="mt-1 w-5 h-5 text-[#3D4A2B] border-gray-300 focus:ring-[#3D4A2B]"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 flex items-center gap-2">
                              <Lock size={18} className="text-orange-600" />
                              {t('community_admin.settings.access_type_stängt')}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {t('community_admin.settings.access_type_stängt_desc')}
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visibility */}
                <div className="border-b border-gray-200 pb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">
                    {t('community_admin.settings.visibility')}
                  </h4>
                  <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#3D4A2B] transition-colors">
                    <input
                      type="checkbox"
                      checked={settings.is_public}
                      onChange={(e) => setSettings({ ...settings, is_public: e.target.checked })}
                      className="mt-1 w-5 h-5 text-[#3D4A2B] border-gray-300 rounded focus:ring-[#3D4A2B]"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        {settings.is_public ? <Eye size={18} /> : <EyeOff size={18} />}
                        {settings.is_public 
                          ? t('community_admin.settings.is_public')
                          : t('community_admin.settings.is_private')
                        }
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {settings.is_public 
                          ? t('community_admin.settings.is_public_desc')
                          : t('community_admin.settings.is_private_desc')
                        }
                      </div>
                    </div>
                  </label>
                </div>

                {/* Save Button */}
                {hasChanges && (
                  <div className="flex items-center gap-3 bg-[#B8860B]/10 border-2 border-[#B8860B] rounded-xl p-4">
                    <AlertCircle size={20} className="text-[#B8860B] flex-shrink-0" />
                    <div className="flex-1 text-sm text-gray-700">
                      Du har osparade ändringar
                    </div>
                    <button
                      onClick={handleSaveSettings}
                      disabled={actionLoading === 'save'}
                      className="px-6 py-2.5 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === 'save' ? (
                        <ShieldProgressSpinner variant="bounce" size="sm" />
                      ) : (
                        <Save size={18} />
                      )}
                      {t('community_admin.settings.save_changes')}
                    </button>
                    <button
                      onClick={() => {
                        if (originalSettings) {
                          setSettings(originalSettings);
                        }
                      }}
                      className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold flex items-center gap-2"
                    >
                      <XIcon size={18} />
                      Ångra
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Homepage Tab */}
            {activeTab === 'homepage' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    🏡 {communityName}s hemsida
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('homespace.edit_description')}
                  </p>
                </div>

                {/* Homespace Editor Launch Button */}
                <button
                  onClick={onOpenHomespaceEditor}
                  className="w-full bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors font-semibold flex items-center justify-center gap-2 px-6 py-3 shadow-lg hover:shadow-xl"
                >
                  <Globe size={20} />
                  {t('homespace.edit_homepage')}
                </button>

              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <InvitationAnalyticsDashboard 
                communityId={communityId}
                communityName={communityName}
              />
            )}
          </>
        )}
      </div>

      {/* Remove Member Confirmation Dialog */}
      {showRemoveDialog && memberToRemove && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {t('community_admin.members.confirm_remove').replace('{name}', memberToRemove.display_name)}
                </h3>
                <p className="text-sm text-gray-600">
                  Denna åtgärd kan inte ångras
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('community_admin.members.remove_reason')} ({t('community_admin.members.remove_reason_placeholder').toLowerCase()})
                </label>
                <textarea
                  id="removeReason"
                  rows={3}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                  placeholder="Ange anledning..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={executeRemoveMember}
                disabled={actionLoading === memberToRemove.membership_id}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Ta bort medlem"
              >
                {actionLoading === memberToRemove.membership_id ? (
                  <ShieldProgressSpinner variant="bounce" size="sm" />
                ) : (
                  <Trash2 size={20} />
                )}
              </button>
              <button
                onClick={() => {
                  setShowRemoveDialog(false);
                  setMemberToRemove(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-semibold flex items-center justify-center gap-2"
                title="Avbryt"
              >
                <XIcon size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

