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
  Trash2,
  ChevronDown,
  Filter,
  Sparkles
} from 'lucide-react';
import { geographicService } from '@/lib/geographic-service';
import { communityService, type LocalCommunity } from '@/lib/supabase';
import { t } from '@/lib/locales';
import type { User } from '@supabase/supabase-js';

interface CommunityDiscoveryMobileProps {
  user?: User;
  userPostalCode?: string;
  onJoinCommunity?: (communityId: string) => void;
}

interface CommunityWithDistance extends LocalCommunity {
  distance?: number;
  isNearby?: boolean;
}

export function CommunityDiscoveryMobile({ user, userPostalCode, onJoinCommunity }: CommunityDiscoveryMobileProps) {
  const [communities, setCommunities] = useState<CommunityWithDistance[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<CommunityWithDistance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(50);
  const [filterType, setFilterType] = useState<'nearby' | 'county' | 'region'>('nearby');
  const [locationSummary, setLocationSummary] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [creating, setCreating] = useState(false);
  const [userMemberships, setUserMemberships] = useState<string[]>([]);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    isPublic: true
  });

  useEffect(() => {
    if (userPostalCode) {
      handleSearch();
    }
  }, [userPostalCode]);

  useEffect(() => {
    if (user && user.id !== 'demo-user') {
      loadUserMemberships();
    }
  }, [user]);

  useEffect(() => {
    filterCommunities();
  }, [communities, filterType]);

  const loadUserMemberships = async () => {
    if (!user || user.id === 'demo-user') return;
    
    try {
      const memberships = await communityService.getUserMemberships(user.id);
      setUserMemberships(memberships);
    } catch (err) {
      console.error('Error loading memberships:', err);
    }
  };

  const handleSearch = async () => {
    if (!userPostalCode?.trim()) {
      setError(t('community.enter_postal_code'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const locationInfo = geographicService.parsePostalCode(userPostalCode);
      
      if (!locationInfo.county) {
        setError(t('community.invalid_postal_code'));
        setLoading(false);
        return;
      }

      setLocationSummary(`${locationInfo.county}, ${locationInfo.region}`);

      // Get all communities and filter by location
      const allCommunities = await communityService.getCommunities();
      
      // Filter communities by county
      const filteredCommunities = allCommunities.filter(community => 
        community.county === locationInfo.county
      );

      const withDistance = filteredCommunities.map(community => {
        const distance = community.postal_code
          ? geographicService.calculatePostalCodeDistance(userPostalCode, community.postal_code)
          : undefined;
        
        return {
          ...community,
          distance,
          isNearby: distance !== undefined && distance <= searchRadius
        };
      });

      withDistance.sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });

      setCommunities(withDistance);
    } catch (err) {
      console.error('Search error:', err);
      setError(t('community.search_error'));
    } finally {
      setLoading(false);
    }
  };

  const filterCommunities = () => {
    if (!userPostalCode) {
      setFilteredCommunities(communities);
      return;
    }

    const locationInfo = geographicService.parsePostalCode(userPostalCode);
    let filtered: CommunityWithDistance[] = [];

    switch (filterType) {
      case 'nearby':
        filtered = communities.filter(c => c.isNearby);
        break;
      case 'county':
        filtered = communities.filter(c => c.county === locationInfo.county);
        break;
      case 'region':
        filtered = communities.filter(c => {
          if (!c.postal_code) return false;
          const communityInfo = geographicService.parsePostalCode(c.postal_code);
          return communityInfo.region === locationInfo.region;
        });
        break;
    }

    setFilteredCommunities(filtered);
  };

  const handleJoinCommunity = async (community: CommunityWithDistance) => {
    if (!user || user.id === 'demo-user') {
      alert('Demo-användare kan inte gå med i samhällen. Skapa ett riktigt konto först.');
      return;
    }

    try {
      await communityService.joinCommunity(community.id, user.id);
      await loadUserMemberships();
      
      if (onJoinCommunity) {
        onJoinCommunity(community.id);
      }
    } catch (err) {
      console.error('Error joining community:', err);
      setError('Kunde inte gå med i samhället');
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || user.id === 'demo-user' || !userPostalCode) {
      return;
    }

    setCreating(true);
    try {
      const locationInfo = geographicService.parsePostalCode(userPostalCode);
      
      const newCommunity = await communityService.createCommunity({
        created_by: user.id,
        community_name: createForm.name,
        location: locationInfo.county,
        description: createForm.description,
        postal_code: userPostalCode,
        county: locationInfo.county,
        is_public: createForm.isPublic
      });

      await communityService.joinCommunity(newCommunity.id, user.id);
      
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', isPublic: true });
      handleSearch();
      
      if (onJoinCommunity) {
        onJoinCommunity(newCommunity.id);
      }
    } catch (err) {
      console.error('Error creating community:', err);
      setError('Kunde inte skapa samhället');
    } finally {
      setCreating(false);
    }
  };

  const getDistanceColor = (distance?: number) => {
    if (!distance) return 'text-gray-400';
    if (distance < 10) return 'text-green-600';
    if (distance < 30) return 'text-[#556B2F]';
    if (distance < 100) return 'text-[#B8860B]';
    return 'text-gray-600';
  };

  const getDistanceLabel = (distance?: number) => {
    if (!distance) return '';
    if (distance < 10) return t('community.very_close');
    if (distance < 30) return t('community.nearby');
    if (distance < 100) return t('community.within_region');
    return t('community.far_away');
  };

  const isMember = (communityId: string) => userMemberships.includes(communityId);

  // Filter Sheet Modal (Bottom Sheet)
  const FilterSheet = () => (
    <div 
      className={`fixed inset-0 bg-black/50 z-50 transition-opacity ${
        showFilterSheet ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setShowFilterSheet(false)}
    >
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-transform ${
          showFilterSheet ? 'translate-y-0' : 'translate-y-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Filtrera samhällen</h3>
            <button
              onClick={() => setShowFilterSheet(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                setFilterType('nearby');
                setShowFilterSheet(false);
              }}
              className={`w-full p-4 rounded-2xl border-2 transition-all touch-manipulation active:scale-98 ${
                filterType === 'nearby'
                  ? 'border-[#3D4A2B] bg-[#3D4A2B]/10 font-bold'
                  : 'border-gray-200 hover:border-[#3D4A2B]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 text-left">Närområdet</h4>
                  <p className="text-sm text-gray-600 text-left">0-{searchRadius} km</p>
                </div>
                {filterType === 'nearby' && <CheckCircle className="text-[#3D4A2B]" size={24} />}
              </div>
            </button>

            <button
              onClick={() => {
                setFilterType('county');
                setShowFilterSheet(false);
              }}
              className={`w-full p-4 rounded-2xl border-2 transition-all touch-manipulation active:scale-98 ${
                filterType === 'county'
                  ? 'border-[#3D4A2B] bg-[#3D4A2B]/10 font-bold'
                  : 'border-gray-200 hover:border-[#3D4A2B]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 text-left">Länet</h4>
                  <p className="text-sm text-gray-600 text-left">Hela ditt län</p>
                </div>
                {filterType === 'county' && <CheckCircle className="text-[#3D4A2B]" size={24} />}
              </div>
            </button>

            <button
              onClick={() => {
                setFilterType('region');
                setShowFilterSheet(false);
              }}
              className={`w-full p-4 rounded-2xl border-2 transition-all touch-manipulation active:scale-98 ${
                filterType === 'region'
                  ? 'border-[#3D4A2B] bg-[#3D4A2B]/10 font-bold'
                  : 'border-gray-200 hover:border-[#3D4A2B]/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 text-left">Regionen</h4>
                  <p className="text-sm text-gray-600 text-left">Götaland/Svealand/Norrland</p>
                </div>
                {filterType === 'region' && <CheckCircle className="text-[#3D4A2B]" size={24} />}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Create Modal
  const CreateModal = () => (
    <div 
      className={`fixed inset-0 bg-black/50 z-50 transition-opacity ${
        showCreateModal ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setShowCreateModal(false)}
    >
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-transform max-h-[90vh] overflow-y-auto ${
          showCreateModal ? 'translate-y-0' : 'translate-y-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleCreateCommunity} className="p-6 pb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="text-[#3D4A2B]" size={24} />
              Skapa samhälle
            </h3>
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Samhällets namn *
              </label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="t.ex. Alvesta Beredskap"
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Beskrivning
              </label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Beskriv vad ert samhälle handlar om..."
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent resize-none text-base"
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-[#5C6B47]/10 rounded-xl">
              <input
                type="checkbox"
                id="isPublic"
                checked={createForm.isPublic}
                onChange={(e) => setCreateForm({ ...createForm, isPublic: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-[#3D4A2B] focus:ring-[#3D4A2B]"
              />
              <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                Gör synlig för andra (rekommenderat)
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={creating || !createForm.name.trim()}
            className="w-full mt-6 bg-[#3D4A2B] text-white font-bold py-4 px-6 rounded-xl hover:bg-[#2A331E] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all touch-manipulation active:scale-98 flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <Loader className="animate-spin" size={20} />
                Skapar...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Skapa samhälle
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );

  if (!userPostalCode) {
    return (
      <div className="text-center py-12 px-4">
        <div className="bg-[#5C6B47]/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <MapPin size={40} className="text-[#5C6B47]" />
        </div>
        <h4 className="text-lg font-semibold text-gray-800 mb-2">
          Ange ditt postnummer
        </h4>
        <p className="text-gray-600 mb-6 text-sm">
          För att hitta samhällen i ditt område behöver vi veta din plats
        </p>
        <Link
          href="/settings"
          className="inline-block px-6 py-3 bg-[#3D4A2B] text-white font-bold rounded-xl hover:bg-[#2A331E] transition-all touch-manipulation active:scale-95"
        >
          Gå till inställningar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] rounded-3xl p-6 text-white shadow-xl">
        <h2 className="text-2xl font-bold mb-2">Hitta samhällen</h2>
        <p className="text-[#C8D5B9] text-sm mb-4">{locationSummary}</p>
        
        {!loading && communities.length === 0 && (
          <button
            onClick={handleSearch}
            className="w-full bg-white/90 text-[#3D4A2B] font-bold py-3 px-4 rounded-xl hover:bg-white transition-all touch-manipulation active:scale-98 flex items-center justify-center gap-2"
          >
            <Search size={20} />
            Sök efter samhällen
          </button>
        )}
      </div>

      {/* Filter Bar */}
      {communities.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilterSheet(true)}
            className="flex-1 bg-white border-2 border-[#5C6B47]/30 rounded-xl px-4 py-3 font-medium text-gray-700 hover:border-[#3D4A2B] transition-all touch-manipulation active:scale-98 flex items-center justify-center gap-2"
          >
            <Filter size={20} />
            Filter: {filterType === 'nearby' ? 'Närområdet' : filterType === 'county' ? 'Länet' : 'Regionen'}
            <ChevronDown size={18} />
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#556B2F] text-white rounded-xl p-3 hover:bg-[#3D4A2B] transition-all touch-manipulation active:scale-95"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader className="animate-spin text-[#3D4A2B] mb-4" size={48} />
          <p className="text-gray-600 font-medium">Söker samhällen...</p>
        </div>
      )}

      {error && (
        <div className="bg-[#B8860B]/10 border-l-4 border-[#B8860B] p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-[#B8860B] flex-shrink-0" size={24} />
            <p className="text-gray-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Communities List */}
      {filteredCommunities.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide px-1">
            {filteredCommunities.length} {filteredCommunities.length === 1 ? 'samhälle' : 'samhällen'} hittades
          </h4>
          
          {filteredCommunities.map((community) => (
            <div
              key={community.id}
              className="bg-white rounded-2xl border-2 border-[#5C6B47]/20 p-5 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-[#3D4A2B] rounded-lg p-1.5">
                      <Users className="text-white" size={16} />
                    </div>
                    <h5 className="text-lg font-bold text-gray-900">
                      {community.community_name}
                    </h5>
                    {community.isNearby && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                        NÄRA
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {community.location}
                    </span>
                    <span>•</span>
                    <span className="font-medium">{community.member_count || 0} medlemmar</span>
                  </div>

                  {community.distance !== undefined && (
                    <div className={`flex items-center gap-1 text-sm font-semibold ${getDistanceColor(community.distance)}`}>
                      <Navigation size={14} />
                      ~{Math.round(community.distance)} km
                      <span className="text-xs opacity-75">• {getDistanceLabel(community.distance)}</span>
                    </div>
                  )}
                </div>
              </div>

              {community.description && (
                <p className="text-gray-700 mb-4 text-sm leading-relaxed">{community.description}</p>
              )}

              {isMember(community.id) ? (
                <div className="flex items-center gap-2 text-[#3D4A2B] bg-[#3D4A2B]/10 rounded-xl px-4 py-3 font-bold">
                  <CheckCircle size={20} />
                  Du är medlem
                </div>
              ) : (
                <button
                  onClick={() => handleJoinCommunity(community)}
                  className="w-full bg-[#3D4A2B] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#2A331E] transition-all touch-manipulation active:scale-98 flex items-center justify-center gap-2"
                >
                  <CheckCircle size={20} />
                  Gå med
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && filteredCommunities.length === 0 && communities.length > 0 && (
        <div className="text-center py-12 bg-white rounded-2xl p-6 shadow-lg">
          <Users size={64} className="mx-auto mb-4 text-gray-300" />
          <h4 className="text-lg font-bold text-gray-800 mb-2">
            Inga samhällen i {filterType === 'nearby' ? 'närområdet' : filterType === 'county' ? 'ditt län' : 'din region'}
          </h4>
          <p className="text-gray-600 mb-6 text-sm">
            Bli den första att skapa ett samhälle här!
          </p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-[#556B2F] text-white font-bold rounded-xl hover:bg-[#3D4A2B] transition-all touch-manipulation active:scale-95 flex items-center gap-2 mx-auto"
          >
            <Plus size={20} />
            Skapa samhälle
          </button>
        </div>
      )}

      <FilterSheet />
      <CreateModal />
    </div>
  );
}

