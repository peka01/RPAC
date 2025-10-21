'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Users, 
  Search,
  Navigation,
  CheckCircle,
  AlertCircle,
  Loader,
  X,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { geographicService } from '@/lib/geographic-service';
import { communityService, type LocalCommunity } from '@/lib/supabase';
import { t } from '@/lib/locales';
import type { User } from '@supabase/supabase-js';

interface CommunityDiscoveryProps {
  user?: User;
  userPostalCode?: string;
  onJoinCommunity?: (communityId: string) => void;
}

interface CommunityWithDistance extends LocalCommunity {
  distance?: number;
  isNearby?: boolean;
}

export function CommunityDiscovery({ user, userPostalCode, onJoinCommunity }: CommunityDiscoveryProps) {
  const [communities, setCommunities] = useState<CommunityWithDistance[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<CommunityWithDistance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(50);
  const [filterType, setFilterType] = useState<'nearby' | 'county' | 'region'>('nearby');
  const [locationSummary, setLocationSummary] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityWithDistance | null>(null);
  const [userMemberships, setUserMemberships] = useState<string[]>([]);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    isPublic: true
  });
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    isPublic: true
  });

  useEffect(() => {
    console.log('useEffect triggered:', { userPostalCode, user: user?.id });
    if (userPostalCode) {
      handleSearch();
    }
  }, [userPostalCode]);

  useEffect(() => {
    console.log('User effect triggered:', { user: user?.id, isDemo: user?.id === 'demo-user' });
    if (user && user.id !== 'demo-user') {
      loadUserMemberships();
    }
  }, [user]);

  const loadUserMemberships = async () => {
    if (!user || user.id === 'demo-user') {
      console.log('No user or demo user, skipping membership load');
      return;
    }
    
    try {
      console.log('Loading memberships for user:', user.id);
      const memberships = await communityService.getUserMemberships(user.id);
      console.log('Loaded memberships:', memberships);
      setUserMemberships(memberships);
    } catch (err) {
      console.error('Error loading memberships:', err);
    }
  };

  useEffect(() => {
    filterCommunities();
  }, [communities, filterType]);

  const handleSearch = async () => {
    if (!userPostalCode?.trim()) {
      setError(t('community.enter_postal_code'));
      return;
    }

    // Validate postal code
    if (!geographicService.validatePostalCode(userPostalCode)) {
      setError(t('community.postal_code_format'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const normalized = geographicService.normalizePostalCode(userPostalCode);
      
      // Get location summary
      const summary = geographicService.getLocationSummary(normalized);
      setLocationSummary(summary);

      // Get recommended radius based on region
      const recommendedRadius = geographicService.getRecommendedRadius(normalized);
      setSearchRadius(recommendedRadius);

      // Find nearby communities
      const nearbyCommunities = await geographicService.findNearbyCommunitiesByPostalCode(
        normalized,
        recommendedRadius
      );

      // Enhance with distance information
      const enhancedCommunities: CommunityWithDistance[] = nearbyCommunities.map(community => ({
        ...community,
        isNearby: community.distance <= 20
      }));

      setCommunities(enhancedCommunities);

      if (enhancedCommunities.length === 0) {
        setError(t('community.no_communities_found').replace('{radius}', recommendedRadius.toString()));
      }

    } catch (err) {
      console.error('Error searching communities:', err);
      setError(t('community.search_error'));
    } finally {
      setLoading(false);
    }
  };

  const filterCommunities = () => {
    if (!userPostalCode || communities.length === 0) {
      setFilteredCommunities(communities);
      return;
    }

    const normalized = geographicService.normalizePostalCode(userPostalCode);
    let filtered: CommunityWithDistance[] = [];

    switch (filterType) {
      case 'nearby':
        // Include communities with distance within radius (including 0)
        filtered = communities.filter(c => {
          // If no distance is set, we can't filter by proximity
          if (c.distance === undefined || c.distance === null) return false;
          return c.distance <= searchRadius;
        });
        console.log('Nearby filter:', { 
          searchRadius, 
          filtered: filtered.length, 
          all: communities.length,
          distances: communities.map(c => ({ name: c.community_name, distance: c.distance, postal: c.postal_code }))
        });
        break;
      case 'county':
        const userCounty = geographicService.getCountyFromPostalCode(normalized);
        filtered = communities.filter(c => {
          if (!c.postal_code) return false;
          const communityCounty = geographicService.getCountyFromPostalCode(c.postal_code);
          return communityCounty === userCounty;
        });
        break;
      case 'region':
        const userRegion = geographicService.getRegionFromPostalCode(normalized);
        filtered = communities.filter(c => {
          if (!c.postal_code) return false;
          const communityRegion = geographicService.getRegionFromPostalCode(c.postal_code);
          return communityRegion === userRegion;
        });
        break;
    }

    setFilteredCommunities(filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0)));
  };

  const getDistanceColor = (distance?: number) => {
    if (!distance) return 'text-[#4A5239]';
    if (distance < 10) return 'text-[#556B2F]';
    if (distance < 30) return 'text-[#3D4A2B]';
    if (distance < 50) return 'text-[#B8860B]';
    return 'text-[#4A5239]';
  };

  const getDistanceLabel = (distance?: number) => {
    if (!distance) return '';
    if (distance < 1) return t('community.your_area');
    if (distance < 10) return t('community.very_close');
    if (distance < 30) return t('community.nearby');
    if (distance < 50) return t('community.within_region');
    return t('community.far_away');
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || user.id === 'demo-user') {
      setError('Du måste vara inloggad för att skapa ett samhälle');
      return;
    }

    if (!userPostalCode) {
      setError('Du måste ha ett postnummer i din profil för att skapa ett samhälle');
      return;
    }

    if (!createForm.name.trim()) {
      setError('Samhällets namn krävs');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const locationInfo = geographicService.parsePostalCode(userPostalCode);
      
      const newCommunity = await communityService.createCommunity({
        community_name: createForm.name.trim(),
        description: createForm.description.trim(),
        location: locationInfo.city || locationInfo.county,
        postal_code: userPostalCode,
        county: locationInfo.county,
        is_public: createForm.isPublic,
        created_by: user.id
      });

      // Automatically join the community you just created (as admin)
      try {
        await communityService.joinCommunity(newCommunity.id, user.id);
        console.log('Creator automatically joined community as member');
      } catch (joinErr) {
        console.error('Error auto-joining community:', joinErr);
        // Non-fatal, continue
      }

      // Reset form and close modal
      setCreateForm({ name: '', description: '', isPublic: true });
      setShowCreateModal(false);
      
      // Refresh memberships and communities list
      await loadUserMemberships();
      await handleSearch();
      
      // Show success message
      setError(null);
      
    } catch (err) {
      console.error('Error creating community:', err);
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid skapande av samhälle');
    } finally {
      setCreating(false);
    }
  };

  const canCreateCommunity = () => {
    return user && user.id !== 'demo-user' && userPostalCode;
  };

  const canManageCommunity = (community: CommunityWithDistance) => {
    return user && user.id !== 'demo-user' && community.created_by === user.id;
  };

  const isMember = (communityId: string) => {
    const result = userMemberships.includes(communityId);
    console.log('isMember check:', { communityId, userMemberships, result });
    return result;
  };

  const handleJoinCommunity = async (community: CommunityWithDistance) => {
    if (!user || user.id === 'demo-user') {
      setError('Du måste vara inloggad för att gå med i ett samhälle');
      return;
    }

    try {
      await communityService.joinCommunity(community.id, user.id);
      await loadUserMemberships();
      await handleSearch(); // Refresh to update member count
      onJoinCommunity?.(community.id);
    } catch (err) {
      console.error('Error joining community:', err);
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid anslutning till samhälle');
    }
  };

  const handleLeaveCommunity = (community: CommunityWithDistance) => {
    setSelectedCommunity(community);
    setShowLeaveModal(true);
  };

  const confirmLeave = async () => {
    if (!selectedCommunity || !user) return;

    setLeaving(true);
    setError(null);

    try {
      await communityService.leaveCommunity(selectedCommunity.id, user.id);
      setShowLeaveModal(false);
      setSelectedCommunity(null);
      await loadUserMemberships();
      await handleSearch(); // Refresh to update member count
    } catch (err) {
      console.error('Error leaving community:', err);
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid utträde från samhälle');
    } finally {
      setLeaving(false);
    }
  };

  const handleEditCommunity = (community: CommunityWithDistance) => {
    setSelectedCommunity(community);
    setEditForm({
      name: community.community_name,
      description: community.description || '',
      isPublic: community.is_public ?? true
    });
    setShowEditModal(true);
  };

  const handleDeleteCommunity = (community: CommunityWithDistance) => {
    setSelectedCommunity(community);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedCommunity) return;

    setDeleting(true);
    setError(null);

    try {
      await communityService.deleteCommunity(selectedCommunity.id);
      setShowDeleteModal(false);
      setSelectedCommunity(null);
      
      // Refresh communities list
      await handleSearch();
    } catch (err) {
      console.error('Error deleting community:', err);
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid borttagning av samhälle');
    } finally {
      setDeleting(false);
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommunity) return;

    if (!editForm.name.trim()) {
      setError('Samhällets namn krävs');
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      await communityService.updateCommunity(selectedCommunity.id, {
        community_name: editForm.name.trim(),
        description: editForm.description.trim(),
        is_public: editForm.isPublic
      });

      setShowEditModal(false);
      setSelectedCommunity(null);
      
      // Refresh communities list
      await handleSearch();
    } catch (err) {
      console.error('Error updating community:', err);
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid uppdatering av samhälle');
    } finally {
      setUpdating(false);
    }
  };

  // Show message if no postal code in profile
  if (!userPostalCode) {
    return (
      <div className="text-center py-12 bg-[#5C6B47]/10 rounded-lg">
        <MapPin size={64} className="mx-auto mb-4 text-[#4A5239]" />
        <h4 className="text-lg font-semibold text-gray-800 mb-2">
          {t('local_community.enter_postal_code')}
        </h4>
        <p className="text-gray-600 mb-4">
          {t('profile.location_description')}
        </p>
        <Link
          href="/settings"
          className="inline-block px-6 py-3 bg-[#3D4A2B] text-white font-medium rounded-lg hover:bg-[#2A331E] transition-colors"
        >
          {t('local_community.location_settings')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <div className="bg-gradient-to-r from-[#5C6B47]/20 to-[#707C5F]/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Search size={24} className="text-[#3D4A2B]" />
          {t('community.find_local')}
        </h3>

        <div className="space-y-4">
          {/* Location Summary + Create Button */}
          {locationSummary && (
            <div className="flex items-center justify-between gap-3 text-sm text-gray-700 bg-white rounded-lg p-3">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#3D4A2B]" />
                <span><strong>{t('community.your_location')}:</strong> {locationSummary}</span>
              </div>
              {canCreateCommunity() && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="px-3 py-1.5 bg-[#556B2F] text-white text-sm font-medium rounded-lg hover:bg-[#3D4A2B] transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus size={16} />
                  Skapa nytt
                </button>
              )}
            </div>
          )}

          {/* Auto-search button */}
          {!loading && communities.length === 0 && (
            <button
              onClick={handleSearch}
              className="w-full px-6 py-3 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Search size={20} />
              {t('community.search')}
            </button>
          )}

          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader className="animate-spin text-[#3D4A2B]" size={32} />
            </div>
          )}

          {/* Filter Tabs */}
          {communities.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('nearby')}
                className={`flex-1 py-2 px-4 rounded-lg transition-all text-sm font-medium ${
                  filterType === 'nearby'
                    ? 'bg-[#3D4A2B] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-[#5C6B47]'
                }`}
              >
                {t('community.nearby_area')} ({searchRadius} {t('community.km')})
              </button>
              <button
                onClick={() => setFilterType('county')}
                className={`flex-1 py-2 px-4 rounded-lg transition-all text-sm font-medium ${
                  filterType === 'county'
                    ? 'bg-[#3D4A2B] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-[#5C6B47]'
                }`}
              >
                {t('community.the_county')}
              </button>
              <button
                onClick={() => setFilterType('region')}
                className={`flex-1 py-2 px-4 rounded-lg transition-all text-sm font-medium ${
                  filterType === 'region'
                    ? 'bg-[#3D4A2B] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-[#5C6B47]'
                }`}
              >
                {t('community.the_region')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-[#B8860B]/10 border-l-4 border-[#B8860B] p-4 rounded">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-[#B8860B]" size={20} />
            <p className="text-gray-800">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {filteredCommunities.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-gray-800 mb-4">
            {filteredCommunities.length === 1 
              ? t('community.found_communities').replace('{count}', '1')
              : t('community.found_communities_plural').replace('{count}', filteredCommunities.length.toString())}
          </h4>
          <div className="space-y-3">
            {filteredCommunities.map((community) => (
              <div
                key={community.id}
                className="bg-white rounded-lg border border-[#5C6B47]/30 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="text-lg font-semibold text-gray-900">
                        {community.community_name}
                      </h5>
                      {community.isNearby && (
                        <span className="px-2 py-1 bg-[#556B2F]/20 text-[#556B2F] text-xs font-medium rounded">
                          {t('community.near_you')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin size={16} />
                        {community.location}
                      </div>
                      {community.distance !== undefined && (
                        <div className={`flex items-center gap-1 font-medium ${getDistanceColor(community.distance)}`}>
                          <Navigation size={16} />
                          ~{Math.round(community.distance)} {t('community.km')}
                          <span className="text-xs">({getDistanceLabel(community.distance)})</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users size={18} />
                    <span className="font-medium">{community.member_count || 0}</span>
                  </div>
                </div>

                {community.description && (
                  <p className="text-gray-700 mb-3 text-sm">{community.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {community.postal_code && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {community.postal_code.slice(0, 3)} {community.postal_code.slice(3)}
                      </span>
                    )}
                    {community.county && (
                      <span>{community.county}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {(() => {
                      const isCreator = canManageCommunity(community);
                      const isMemberOfCommunity = isMember(community.id);
                      
                      if (isCreator) {
                        // Creators always see Edit/Delete buttons
                        return (
                          <>
                            <button
                              onClick={() => handleEditCommunity(community)}
                              className="px-3 py-2 bg-[#B8860B] text-white text-sm font-medium rounded-lg hover:bg-[#8B6508] transition-colors flex items-center gap-1"
                              title={t('community.edit_community')}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteCommunity(community)}
                              className="px-3 py-2 bg-[#8B4513] text-white text-sm font-medium rounded-lg hover:bg-[#6B3410] transition-colors flex items-center gap-1"
                              title={t('community.delete_community')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        );
                      } else if (isMemberOfCommunity) {
                        // Members (not creators) see Leave button
                        return (
                          <button
                            onClick={() => handleLeaveCommunity(community)}
                            className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                          >
                            <X size={16} />
                            {t('community.leave_community')}
                          </button>
                        );
                      } else {
                        // Non-members see Join button
                        return (
                          <button
                            onClick={() => handleJoinCommunity(community)}
                            className="px-4 py-2 bg-[#3D4A2B] text-white text-sm font-medium rounded-lg hover:bg-[#2A331E] transition-colors flex items-center gap-2"
                          >
                            <CheckCircle size={16} />
                            {t('community.join_community')}
                          </button>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results - from filtering */}
      {!loading && filteredCommunities.length === 0 && userPostalCode && !error && communities.length > 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users size={64} className="mx-auto mb-4 text-gray-400" />
          <h4 className="text-lg font-semibold text-gray-800 mb-2">
            {t('community.no_communities_nearby').replace('{filterType}', 
              filterType === 'nearby' ? t('community.nearby_area') : 
              filterType === 'county' ? t('community.the_county') : 
              t('community.the_region'))}
          </h4>
          <p className="text-gray-600 mb-4">
            {t('community.be_first_create')}
          </p>
          {canCreateCommunity() && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-[#556B2F] text-white font-medium rounded-lg hover:bg-[#3D4A2B] transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus size={20} />
              {t('community.create_new_community')}
            </button>
          )}
        </div>
      )}

      {/* No Communities At All - Database is empty */}
      {!loading && communities.length === 0 && userPostalCode && !error && (
        <div className="text-center py-12 bg-[#5C6B47]/10 rounded-lg border-2 border-dashed border-[#5C6B47]/30">
          <Users size={64} className="mx-auto mb-4 text-[#5C6B47]" />
          <h4 className="text-lg font-semibold text-gray-800 mb-2">
            Inga samhällen finns än i ditt område
          </h4>
          <p className="text-gray-600 mb-4">
            {t('community.be_first_create')}
          </p>
          {canCreateCommunity() && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-[#556B2F] text-white font-medium rounded-lg hover:bg-[#3D4A2B] transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus size={20} />
              {t('community.create_new_community')}
            </button>
          )}
        </div>
      )}

      {/* Create Community Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {t('community.create_community_title')}
            </h3>

            <form onSubmit={handleCreateCommunity} className="space-y-4">
              {/* Community Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('community.community_name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder={t('community.community_name_placeholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                  maxLength={100}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('community.community_description')}
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder={t('community.community_description_placeholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] resize-none"
                  rows={4}
                  maxLength={500}
                />
              </div>

              {/* Location Info */}
              {userPostalCode && (
                <div className="bg-[#5C6B47]/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <MapPin size={16} className="text-[#3D4A2B]" />
                    <span><strong>Plats:</strong> {locationSummary}</span>
                  </div>
                </div>
              )}

              {/* Public Toggle */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={createForm.isPublic}
                  onChange={(e) => setCreateForm({ ...createForm, isPublic: e.target.checked })}
                  className="mt-1 w-4 h-4 text-[#3D4A2B] border-gray-300 rounded focus:ring-[#3D4A2B]"
                />
                <label htmlFor="isPublic" className="flex-1">
                  <div className="font-medium text-gray-900">{t('community.make_public')}</div>
                  <div className="text-sm text-gray-600">{t('community.public_community_help')}</div>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={creating}
                >
                  {t('community.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={creating || !createForm.name.trim()}
                  className="flex-1 px-4 py-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      {t('community.creating')}
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      {t('community.create')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Community Modal */}
      {showEditModal && selectedCommunity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {t('community.edit_community_title')}
            </h3>

            <form onSubmit={submitEdit} className="space-y-4">
              {/* Community Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('community.community_name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder={t('community.community_name_placeholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                  maxLength={100}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('community.community_description')}
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder={t('community.community_description_placeholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] resize-none"
                  rows={4}
                  maxLength={500}
                />
              </div>

              {/* Public Toggle */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="editIsPublic"
                  checked={editForm.isPublic}
                  onChange={(e) => setEditForm({ ...editForm, isPublic: e.target.checked })}
                  className="mt-1 w-4 h-4 text-[#3D4A2B] border-gray-300 rounded focus:ring-[#3D4A2B]"
                />
                <label htmlFor="editIsPublic" className="flex-1">
                  <div className="font-medium text-gray-900">{t('community.make_public')}</div>
                  <div className="text-sm text-gray-600">{t('community.public_community_help')}</div>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={updating}
                >
                  {t('community.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={updating || !editForm.name.trim()}
                  className="flex-1 px-4 py-2 bg-[#B8860B] text-white rounded-lg hover:bg-[#8B6508] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      {t('community.updating')}
                    </>
                  ) : (
                    <>
                      <Edit size={20} />
                      {t('community.update')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Community Modal */}
      {showDeleteModal && selectedCommunity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('community.delete_community')}
              </h3>
              
              <p className="text-gray-700 mb-2">
                {t('community.delete_community_confirm').replace('{name}', selectedCommunity.community_name)}
              </p>
              
              <p className="text-sm text-gray-600 mb-6">
                {t('community.delete_community_warning')}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={deleting}
                >
                  {t('community.cancel')}
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-[#8B4513] text-white rounded-lg hover:bg-[#6B3410] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      {t('community.deleting')}
                    </>
                  ) : (
                    <>
                      <Trash2 size={20} />
                      {t('community.delete')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Community Modal */}
      {showLeaveModal && selectedCommunity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowLeaveModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
                <X className="h-6 w-6 text-gray-600" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('community.leave_community')}
              </h3>
              
              <p className="text-gray-700 mb-6">
                {t('community.leave_community_confirm').replace('{name}', selectedCommunity.community_name)}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={leaving}
                >
                  {t('community.cancel')}
                </button>
                <button
                  onClick={confirmLeave}
                  disabled={leaving}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {leaving ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      {t('community.leaving')}
                    </>
                  ) : (
                    <>
                      <X size={20} />
                      {t('community.leave')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
