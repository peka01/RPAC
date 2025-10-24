'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/locales';
import Link from 'next/link';
import { CommunityEditModal } from '@/components/community-edit-modal';
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
  AlertCircle,
  Grid3x3,
  List
} from 'lucide-react';

interface Community {
  id: string;
  community_name: string;
  location: string;
  description: string;
  access_type: string;
  member_count: number;
  pending_requests: number;
  approved_members: number;
  rejected_requests: number;
  total_requests: number;
  created_at: string;
  is_public: boolean;
  county: string;
  postal_code: string;
  homepage_url?: string;
}

export default function CommunityManagementPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [accessFilter, setAccessFilter] = useState<string>('all');
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    loadCommunities();
  }, []);

  useEffect(() => {
    filterCommunities();
  }, [searchQuery, accessFilter, communities]);

  async function loadCommunities() {
    try {
      // Get all communities with basic data and homepage URL
      const { data: communitiesData, error: communitiesError } = await supabase
        .from('local_communities')
        .select(`
          *,
          community_homespaces(slug)
        `)
        .order('created_at', { ascending: false });

      if (communitiesError) throw communitiesError;

      // Get membership status counts for each community
      const processedData = await Promise.all(communitiesData.map(async (community) => {
        // Get all memberships for this community
        const { data: memberships, error: membershipsError } = await supabase
          .from('community_memberships')
          .select('status, membership_status')
          .eq('community_id', community.id);

        if (membershipsError) {
          console.error('Error fetching memberships for community', community.community_name, ':', membershipsError);
        }

        // Debug: Log membership data for this community
        console.log('🔍 Memberships for', community.community_name, ':', memberships);

        // Count by status (handle both status and membership_status columns)
        let pendingCount = 0;
        let approvedCount = 0;
        let rejectedCount = 0;

        if (memberships) {
          memberships.forEach(membership => {
            // Check both status columns for compatibility
            const currentStatus = membership.status || membership.membership_status || 'approved';
            
            switch (currentStatus) {
              case 'pending':
                pendingCount++;
                break;
              case 'approved':
                approvedCount++;
                break;
              case 'rejected':
                rejectedCount++;
                break;
              default:
                // Default to approved for backwards compatibility
                approvedCount++;
                break;
            }
          });
        }

        const homepageSlug = community.community_homespaces?.slug;
        
        // Debug: Log homepage URL processing (only for missing URLs)
        if (!homepageSlug) {
          console.log('❌ No homepage slug for community:', community.community_name, 'homespace data:', community.community_homespaces);
        }
        
        return {
          ...community,
          pending_requests: pendingCount || 0,
          approved_members: approvedCount || 0,
          rejected_requests: rejectedCount || 0,
          total_requests: (pendingCount || 0) + (approvedCount || 0) + (rejectedCount || 0),
          homepage_url: homepageSlug ? `beready.se/${homepageSlug}` : undefined
        };
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
    setShowEditModal(true);
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

            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Visa:</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white text-[#3D4A2B] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                  Tabell
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'cards'
                      ? 'bg-white text-[#3D4A2B] shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                  Kort
                </button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Visar {filteredCommunities.length} av {communities.length} {t('admin.community_management.community_count')}
          </div>
        </div>

        {/* Communities Content */}
        {viewMode === 'table' ? (
          /* Table View */
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-1/4 px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Samhälle
                    </th>
                    <th className="w-1/6 px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Plats
                    </th>
                    <th className="w-1/6 px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Åtkomst
                    </th>
                    <th className="w-1/6 px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Medlemmar
                    </th>
                    <th className="w-1/6 px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="w-1/6 px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Åtgärder
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCommunities.map((community) => (
                    <tr key={community.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900 truncate" title={community.community_name}>
                            {community.community_name}
                          </div>
                          <div className="text-xs text-gray-500 truncate" title={community.description || 'Ingen beskrivning'}>
                            {community.description || 'Ingen beskrivning'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate" title={community.location}>
                            {community.location}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {getAccessBadge(community.access_type)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Users className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium">{community.member_count}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          {community.pending_requests > 0 && (
                            <div className="flex items-center gap-1 text-orange-600">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs font-medium">
                                {community.pending_requests} väntande
                              </span>
                            </div>
                          )}
                          {community.approved_members > 0 && (
                            <div className="flex items-center gap-1 text-green-600">
                              <Users className="w-3 h-3" />
                              <span className="text-xs">
                                {community.approved_members} godkända
                              </span>
                            </div>
                          )}
                          {community.rejected_requests > 0 && (
                            <div className="flex items-center gap-1 text-red-600">
                              <AlertCircle className="w-3 h-3" />
                              <span className="text-xs">
                                {community.rejected_requests} avvisade
                              </span>
                            </div>
                          )}
                          {community.total_requests === 0 && (
                            <span className="text-xs text-gray-500">Inga ansökningar</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEditModal(community)}
                            className="inline-flex items-center justify-center w-8 h-8 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors flex-shrink-0"
                            title={t('admin.actions.edit')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {community.homepage_url && (
                            <a
                              href={`https://${community.homepage_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-8 h-8 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex-shrink-0"
                              title={`Öppna hemsida: ${community.homepage_url}`}
                            >
                              <Globe className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteCommunity(community.id)}
                            className="inline-flex items-center justify-center w-8 h-8 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex-shrink-0"
                            title="Radera samhälle"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Card View */
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

                  {(community.pending_requests > 0 || community.approved_members > 0 || community.rejected_requests > 0) && (
                    <div className="mb-4 space-y-2">
                      {community.pending_requests > 0 && (
                        <div className="px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-600" />
                          <span className="text-xs text-orange-800 font-medium">
                            {community.pending_requests} väntande ansökningar
                          </span>
                        </div>
                      )}
                      {community.approved_members > 0 && (
                        <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                          <Users className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-800 font-medium">
                            {community.approved_members} godkända medlemmar
                          </span>
                        </div>
                      )}
                      {community.rejected_requests > 0 && (
                        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-xs text-red-800 font-medium">
                            {community.rejected_requests} avvisade ansökningar
                          </span>
                        </div>
                      )}
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
                    {community.homepage_url && (
                      <a
                        href={`https://${community.homepage_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        title={`Öppna hemsida: ${community.homepage_url}`}
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
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
        )}

        {filteredCommunities.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">{t('admin.community_management.no_communities')}</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedCommunity && (
        <CommunityEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          community={selectedCommunity as any}
          onUpdate={(updatedCommunity) => {
            // Update the community in the list
            setCommunities(prev => 
              prev.map(c => c.id === updatedCommunity.id ? { ...c, ...updatedCommunity } : c)
            );
            setFilteredCommunities(prev => 
              prev.map(c => c.id === updatedCommunity.id ? { ...c, ...updatedCommunity } : c)
            );
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
}

