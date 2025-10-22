'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/locales';
import Link from 'next/link';
import { 
  Building2, 
  Search, 
  Filter,
  ChevronLeft,
  Globe,
  Lock,
  Users,
  Edit,
  Trash2,
  Clock,
  MapPin,
  AlertCircle
} from 'lucide-react';

interface Community {
  id: string;
  community_name: string;
  location: string;
  description: string;
  access_type: string;
  member_count: number;
  pending_requests: number;
  created_at: string;
  is_public: boolean;
  county: string;
  postal_code: string;
}

export default function CommunityManagementPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [accessFilter, setAccessFilter] = useState<string>('all');
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newAccessType, setNewAccessType] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCommunities();
  }, []);

  useEffect(() => {
    filterCommunities();
  }, [searchQuery, accessFilter, communities]);

  async function loadCommunities() {
    try {
      // Get all communities with pending request counts
      const { data, error } = await supabase
        .from('local_communities')
        .select(`
          *,
          pending_requests:community_memberships!community_memberships_community_id_fkey(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process the data to flatten pending_requests count
      const processedData = data.map(community => ({
        ...community,
        pending_requests: community.pending_requests?.[0]?.count || 0
      }));

      setCommunities(processedData as Community[]);
      setFilteredCommunities(processedData as Community[]);
    } catch (error) {
      console.error('Error loading communities:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterCommunities() {
    let filtered = [...communities];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(community => 
        community.community_name?.toLowerCase().includes(query) ||
        community.location?.toLowerCase().includes(query) ||
        community.county?.toLowerCase().includes(query)
      );
    }

    // Apply access filter
    if (accessFilter !== 'all') {
      filtered = filtered.filter(community => community.access_type === accessFilter);
    }

    setFilteredCommunities(filtered);
  }

  function openEditModal(community: Community) {
    setSelectedCommunity(community);
    setNewAccessType(community.access_type);
    setShowEditModal(true);
  }

  async function handleUpdateAccessType() {
    if (!selectedCommunity || !newAccessType) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('local_communities')
        .update({ 
          access_type: newAccessType,
          auto_approve_members: newAccessType === 'öppet'
        })
        .eq('id', selectedCommunity.id);

      if (error) throw error;

      // Reload communities
      await loadCommunities();
      setShowEditModal(false);
      setSelectedCommunity(null);
    } catch (error: any) {
      console.error('Error updating community:', error);
      alert(error.message || t('admin.messages.save_error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCommunity(communityId: string) {
    if (!confirm(t('admin.confirmations.delete_community'))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('local_communities')
        .delete()
        .eq('id', communityId);

      if (error) throw error;

      // Reload communities
      await loadCommunities();
      alert(t('admin.messages.delete_success'));
    } catch (error: any) {
      console.error('Error deleting community:', error);
      alert(error.message || t('admin.messages.delete_error'));
    }
  }

  function getAccessBadge(accessType: string) {
    if (accessType === 'öppet') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          <Globe className="w-3 h-3" />
          {t('admin.access_types.öppet')}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
        <Lock className="w-3 h-3" />
        {t('admin.access_types.stängt')}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#3D4A2B]/20 border-t-[#3D4A2B] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">{t('admin.community_management.loading_communities')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#2A331E] to-[#3D4A2B] text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <Link href="/super-admin" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4">
            <ChevronLeft className="w-5 h-5" />
            {t('admin.actions.back')}
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-10 h-10" />
            <h1 className="text-3xl font-bold">{t('admin.community_management.title')}</h1>
          </div>
          <p className="text-white/80 text-lg">
            {t('admin.community_management.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('admin.community_management.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
              />
            </div>

            {/* Access Filter */}
            <div className="relative w-full md:w-64">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={accessFilter}
                onChange={(e) => setAccessFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent appearance-none bg-white"
              >
                <option value="all">{t('admin.community_management.all_access_types')}</option>
                <option value="öppet">{t('admin.access_types.öppet')}</option>
                <option value="stängt">{t('admin.access_types.stängt')}</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Visar {filteredCommunities.length} av {communities.length} {t('admin.community_management.community_count')}
          </div>
        </div>

        {/* Communities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community) => (
            <div key={community.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all">
              {/* Community Header */}
              <div className="bg-gradient-to-br from-[#3D4A2B] to-[#5C6B47] text-white p-6">
                <h3 className="text-xl font-bold mb-2">{community.community_name}</h3>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <MapPin className="w-4 h-4" />
                  {community.location}
                </div>
              </div>

              {/* Community Info */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  {getAccessBadge(community.access_type)}
                  <div className="flex items-center gap-1 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-semibold">{community.member_count}</span>
                  </div>
                </div>

                {community.pending_requests > 0 && (
                  <div className="mb-4 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <span className="text-xs text-orange-800 font-medium">
                      {community.pending_requests} {t('admin.community_management.pending_requests').toLowerCase()}
                    </span>
                  </div>
                )}

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {community.description || 'Ingen beskrivning'}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(community)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-[#3D4A2B] text-white text-sm rounded-lg hover:bg-[#2A331E] transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    {t('admin.actions.edit')}
                  </button>
                  <button
                    onClick={() => handleDeleteCommunity(community.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCommunities.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">{t('admin.community_management.no_communities')}</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedCommunity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t('admin.community_management.edit_community')}
            </h2>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">{t('admin.tables.community')}</p>
              <p className="text-lg font-medium text-gray-900">{selectedCommunity.community_name}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin.community_management.access_type')}
              </label>
              <select
                value={newAccessType}
                onChange={(e) => setNewAccessType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
              >
                <option value="öppet">{t('admin.access_types.öppet')}</option>
                <option value="stängt">{t('admin.access_types.stängt')}</option>
              </select>
              <p className="mt-2 text-xs text-gray-500">
                {t(`admin.access_types.description.${newAccessType}`)}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('admin.actions.cancel')}
              </button>
              <button
                onClick={handleUpdateAccessType}
                disabled={saving || newAccessType === selectedCommunity.access_type}
                className="flex-1 px-4 py-3 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? t('admin.messages.loading') : t('admin.actions.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

