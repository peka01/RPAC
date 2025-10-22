'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  TrendingUp,
  Users,
  Link as LinkIcon,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  BarChart3,
  Eye,
  EyeOff,
  Copy,
  Trash2
} from 'lucide-react';

interface Invitation {
  id: string;
  invitation_code: string;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  description: string | null;
  created_at: string;
  last_used_at: string | null;
}

interface InvitationStats {
  totalInvitations: number;
  activeInvitations: number;
  totalUses: number;
  conversionRate: number;
  avgUsesPerInvitation: number;
  topPerformer: Invitation | null;
}

interface InvitationAnalyticsDashboardProps {
  communityId: string;
  communityName: string;
}

export default function InvitationAnalyticsDashboard({
  communityId,
  communityName
}: InvitationAnalyticsDashboardProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<InvitationStats>({
    totalInvitations: 0,
    activeInvitations: 0,
    totalUses: 0,
    conversionRate: 0,
    avgUsesPerInvitation: 0,
    topPerformer: null
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [communityId, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Get invitations
      let query = supabase
        .from('community_invitations')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

      // Apply time filter
      if (timeRange !== 'all') {
        const daysAgo = timeRange === '7d' ? 7 : 30;
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        query = query.gte('created_at', date.toISOString());
      }

      const { data: invitationsData, error } = await query;

      if (error) throw error;

      setInvitations(invitationsData || []);

      // Calculate stats
      if (invitationsData) {
        const totalUses = invitationsData.reduce((sum, inv) => sum + inv.current_uses, 0);
        const activeCount = invitationsData.filter(inv => inv.is_active).length;
        const topPerformer = [...invitationsData].sort((a, b) => b.current_uses - a.current_uses)[0] || null;

        setStats({
          totalInvitations: invitationsData.length,
          activeInvitations: activeCount,
          totalUses,
          conversionRate: invitationsData.length > 0 ? (totalUses / invitationsData.length) * 100 : 0,
          avgUsesPerInvitation: invitationsData.length > 0 ? totalUses / invitationsData.length : 0,
          topPerformer
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyInvitationLink = (code: string) => {
    const url = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(url);
    alert('Länk kopierad!');
  };

  const toggleInvitation = async (id: string, isActive: boolean) => {
    await supabase
      .from('community_invitations')
      .update({ is_active: !isActive })
      .eq('id', id);
    
    loadAnalytics();
  };

  const deleteInvitation = async (id: string) => {
    if (confirm('Radera denna inbjudan?')) {
      await supabase
        .from('community_invitations')
        .delete()
        .eq('id', id);
      
      loadAnalytics();
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUsagePercentage = (current: number, max: number | null) => {
    if (!max) return 0;
    return Math.min((current / max) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3D4A2B]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          📊 Inbjudningsanalys
        </h2>
        <p className="text-gray-600">
          {communityName} · Prestanda och statistik
        </p>
      </div>

      {/* Time Range Filter */}
      <div className="flex gap-2">
        {(['7d', '30d', 'all'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === range
                ? 'bg-[#3D4A2B] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {range === '7d' ? 'Senaste 7 dagarna' : range === '30d' ? 'Senaste 30 dagarna' : 'All tid'}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invitations */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-blue-500 rounded-lg">
              <LinkIcon size={24} className="text-white" />
            </div>
            <span className="text-3xl font-bold text-blue-900">{stats.totalInvitations}</span>
          </div>
          <div className="text-sm font-medium text-blue-900">Totalt Inbjudningar</div>
          <div className="text-xs text-blue-700 mt-1">
            {stats.activeInvitations} aktiva
          </div>
        </div>

        {/* Total Uses */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-green-500 rounded-lg">
              <Users size={24} className="text-white" />
            </div>
            <span className="text-3xl font-bold text-green-900">{stats.totalUses}</span>
          </div>
          <div className="text-sm font-medium text-green-900">Nya Medlemmar</div>
          <div className="text-xs text-green-700 mt-1">
            via inbjudningar
          </div>
        </div>

        {/* Avg Uses */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border-2 border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-purple-500 rounded-lg">
              <TrendingUp size={24} className="text-white" />
            </div>
            <span className="text-3xl font-bold text-purple-900">
              {stats.avgUsesPerInvitation.toFixed(1)}
            </span>
          </div>
          <div className="text-sm font-medium text-purple-900">Genomsnitt</div>
          <div className="text-xs text-purple-700 mt-1">
            per inbjudan
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-orange-500 rounded-lg">
              <BarChart3 size={24} className="text-white" />
            </div>
            <span className="text-3xl font-bold text-orange-900">
              {stats.conversionRate.toFixed(0)}%
            </span>
          </div>
          <div className="text-sm font-medium text-orange-900">Konvertering</div>
          <div className="text-xs text-orange-700 mt-1">
            genomsnittlig användning
          </div>
        </div>
      </div>

      {/* Top Performer */}
      {stats.topPerformer && stats.topPerformer.current_uses > 0 && (
        <div className="bg-gradient-to-r from-[#5C6B47] to-[#3D4A2B] text-white rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="font-bold text-lg">🏆 Bäst Presterande Inbjudan</div>
              <div className="text-white/80 text-sm">Din mest effektiva länk</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 bg-white/10 rounded-lg p-4">
            <div>
              <div className="text-white/60 text-xs mb-1">Kod</div>
              <div className="font-mono font-bold">{stats.topPerformer.invitation_code}</div>
            </div>
            <div>
              <div className="text-white/60 text-xs mb-1">Användningar</div>
              <div className="font-bold text-xl">{stats.topPerformer.current_uses}</div>
            </div>
            <div>
              <div className="text-white/60 text-xs mb-1">Skapad</div>
              <div className="font-medium">{formatDate(stats.topPerformer.created_at)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Invitations List */}
      <div className="bg-white rounded-xl border-2 border-gray-200">
        <div className="px-6 py-4 border-b-2 border-gray-200">
          <h3 className="font-bold text-lg text-gray-900">Alla Inbjudningar</h3>
          <p className="text-sm text-gray-600 mt-1">
            {invitations.length} inbjudning{invitations.length !== 1 ? 'ar' : ''}
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {invitations.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              Inga inbjudningar för denna period
            </div>
          ) : (
            invitations.map((invitation) => (
              <div key={invitation.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Code and Status */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono font-bold text-lg text-gray-900">
                        {invitation.invitation_code}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        invitation.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {invitation.is_active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>

                    {/* Description */}
                    {invitation.description && (
                      <div className="text-sm text-gray-600 mb-3">
                        {invitation.description}
                      </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 text-xs mb-1">Användningar</div>
                        <div className="font-semibold text-gray-900">
                          {invitation.current_uses}
                          {invitation.max_uses && ` / ${invitation.max_uses}`}
                        </div>
                        {invitation.max_uses && (
                          <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#3D4A2B] transition-all"
                              style={{ width: `${getUsagePercentage(invitation.current_uses, invitation.max_uses)}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-gray-500 text-xs mb-1">Skapad</div>
                        <div className="font-medium text-gray-900">
                          {formatDate(invitation.created_at)}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-500 text-xs mb-1">Senast använd</div>
                        <div className="font-medium text-gray-900">
                          {invitation.last_used_at ? formatDate(invitation.last_used_at) : 'Aldrig'}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-500 text-xs mb-1">Utgår</div>
                        <div className="font-medium text-gray-900">
                          {invitation.expires_at ? formatDate(invitation.expires_at) : 'Aldrig'}
                        </div>
                      </div>
                    </div>

                    {/* Link */}
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <span className="text-gray-500">Länk:</span>
                      <code className="flex-1 px-2 py-1 bg-gray-100 rounded text-gray-700 font-mono">
                        {window.location.origin}/invite/{invitation.invitation_code}
                      </code>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => copyInvitationLink(invitation.invitation_code)}
                      className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                      title="Kopiera länk"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={() => toggleInvitation(invitation.id, invitation.is_active)}
                      className={`p-2 hover:bg-gray-200 rounded-lg transition-colors ${
                        invitation.is_active ? 'text-green-600' : 'text-gray-400'
                      }`}
                      title={invitation.is_active ? 'Inaktivera' : 'Aktivera'}
                    >
                      {invitation.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button
                      onClick={() => deleteInvitation(invitation.id)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                      title="Radera"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

