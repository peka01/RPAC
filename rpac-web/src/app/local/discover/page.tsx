'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { supabase, communityService } from '@/lib/supabase';
import { t } from '@/lib/locales';
import { Search, MapPin, Users, Filter, Star, Calendar, UserPlus, Edit, Trash, Plus, Settings, X, Globe, Lock, LockOpen } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { LocalCommunity } from '@/lib/supabase';
import { ResourceListView, Column } from '@/components/resource-list-view';

// Configure for Edge Runtime (required for Cloudflare Pages)
export const runtime = 'edge';

export default function DiscoverPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [communities, setCommunities] = useState<LocalCommunity[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<LocalCommunity[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const [userMemberships, setUserMemberships] = useState<string[]>([]);
  const [homespaces, setHomespaces] = useState<Record<string, { slug: string; published: boolean }>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<LocalCommunity | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    location: '',
    accessType: 'öppet' as 'öppet' | 'stängt'
  });
  const [filters, setFilters] = useState({
    membership: 'all', // 'all', 'member', 'not_member'
    location: '',
    memberCount: 'all', // 'all', 'small', 'medium', 'large'
    sortBy: 'name' // 'name', 'member_count', 'created_at'
  });
  const searchParams = useSearchParams();

  // Define table columns for ResourceListView
  const tableColumns: Column<LocalCommunity>[] = [
    {
      key: 'community',
      label: 'Samhälle',
      width: '40%',
      render: (community) => {
        const isMember = userMemberships.includes(community.id);
        const isAdmin = user && community.created_by === user.id;
        const isOpen = community.access_type === 'öppet';
        return (
          <div className="flex items-center">
            {/* Access type icon (leftmost) */}
            <div className="flex-shrink-0 mr-3" title={isOpen ? 'Öppet samhälle' : 'Stängt samhälle'}>
              {isOpen ? (
                <LockOpen className="w-4 h-4 text-gray-500" />
              ) : (
                <Lock className="w-4 h-4 text-gray-500" />
              )}
            </div>
            <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${
              isMember ? 'bg-[#3D4A2B]/20' : 'bg-[#3D4A2B]/10'
            }`}>
              <Users className={`w-5 h-5 ${isMember ? 'text-[#3D4A2B]' : 'text-[#3D4A2B]'}`} />
            </div>
            <div className="ml-4">
              <div className={`text-sm font-medium ${isMember ? 'text-[#3D4A2B]' : 'text-gray-900'}`}>
                {community.community_name}
              </div>
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {community.description}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'location',
      label: 'Plats',
      width: '20%',
      render: (community) => (
        <div className="flex items-center text-sm text-gray-900">
          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
          {community.location}
        </div>
      )
    },
    {
      key: 'members',
      label: 'Medlemmar',
      width: '15%',
      render: (community) => (
        <span className="text-sm text-gray-900">{community.member_count || 0}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      width: '15%',
      render: (community) => {
        const isMember = userMemberships.includes(community.id);
        const isAdmin = user && community.created_by === user.id;
        return (
          <div className="flex flex-wrap gap-1">
            {isMember && (
              <span className="px-2 py-1 bg-[#3D4A2B]/20 text-[#3D4A2B] text-xs font-medium rounded-full">
                Medlem
              </span>
            )}
            {isAdmin && (
              <span className="px-2 py-1 bg-[#B8860B]/20 text-[#B8860B] text-xs font-medium rounded-full">
                Admin
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Åtgärder',
      width: '10%',
      render: (community) => {
        const isMember = userMemberships.includes(community.id);
        const isAdmin = user && community.created_by === user.id;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleMembership(community.id)}
              disabled={actionLoading === community.id}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                isMember
                  ? 'bg-[#3D4A2B]/20 text-[#3D4A2B] border border-[#3D4A2B]/30 hover:bg-[#3D4A2B]/30'
                  : 'bg-[#3D4A2B] text-white hover:bg-[#2A331E]'
              } ${actionLoading === community.id ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {actionLoading === community.id ? (
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              ) : isMember ? (
                'Lämna'
              ) : (
                'Gå med'
              )}
            </button>
            
            <div className="flex items-center gap-1">
              {/* Homespace icon - Show if community has published homespace */}
              {homespaces[community.id] && (
                <Link
                  href={`/${homespaces[community.id].slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-gray-400 hover:text-[#5C6B47] rounded"
                  title="Besök samhällets hemsida"
                >
                  <Globe className="w-4 h-4" />
                </Link>
              )}
              
              {isAdmin && (
                <>
                  <button
                    onClick={() => setEditingCommunity(community)}
                    className="p-1 text-gray-400 hover:text-[#3D4A2B] rounded"
                    title="Redigera"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCommunity(community.id)}
                    disabled={actionLoading === community.id}
                    className="p-1 text-gray-400 hover:text-red-600 rounded disabled:opacity-50"
                    title="Ta bort"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        );
      }
    }
  ];

  // Define card renderer for ResourceListView
  const cardRenderer = (community: LocalCommunity) => {
    const isMember = userMemberships.includes(community.id);
    const isAdmin = user && community.created_by === user.id;
    const isOpen = community.access_type === 'öppet';
    return (
      <div 
        className={`rounded-xl shadow-lg p-4 hover:shadow-xl transition-shadow h-full flex flex-col relative ${
          isMember 
            ? 'bg-gradient-to-r from-[#3D4A2B]/5 to-[#5C6B47]/5 border-2 border-[#3D4A2B]/20' 
            : 'bg-white'
        }`}
      >
        {/* Access type icon (top right corner) */}
        <div 
          className="absolute top-3 right-3" 
          title={isOpen ? 'Öppet samhälle' : 'Stängt samhälle'}
        >
          {isOpen ? (
            <LockOpen className="w-5 h-5 text-gray-500" />
          ) : (
            <Lock className="w-5 h-5 text-gray-500" />
          )}
        </div>

        {/* Header with icon and title */}
        <div className="flex items-start gap-3 mb-3 pr-8">
          <div className={`rounded-lg p-2 flex-shrink-0 ${
            isMember 
              ? 'bg-[#3D4A2B]/20' 
              : 'bg-[#3D4A2B]/10'
          }`}>
            <Users className={`w-5 h-5 ${
              isMember 
                ? 'text-[#3D4A2B]' 
                : 'text-[#3D4A2B]'
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <Link href="/local" className="hover:underline cursor-pointer">
              <h3 className={`text-lg font-bold leading-tight ${
                isMember
                  ? 'text-[#3D4A2B]'
                  : 'text-gray-900'
              }`}>
                {community.community_name}
              </h3>
            </Link>
            <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{community.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>{community.member_count || 0} medlemmar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-700 text-sm mb-3 flex-1 line-clamp-3">
          {community.description}
        </p>

        {/* Status tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {isAdmin && (
            <span className="px-2 py-1 bg-[#B8860B]/20 text-[#B8860B] text-xs font-medium rounded-full">
              Admin
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleMembership(community.id)}
              disabled={actionLoading === community.id}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isMember
                  ? 'bg-[#3D4A2B]/20 text-[#3D4A2B] border border-[#3D4A2B]/30 hover:bg-[#3D4A2B]/30'
                  : 'bg-[#3D4A2B] text-white hover:bg-[#2A331E]'
              } ${actionLoading === community.id ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {actionLoading === community.id ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : isMember ? (
                <>
                  <Star className="w-4 h-4" />
                  <span>Lämna</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Gå med</span>
                </>
              )}
            </button>

          </div>

          {/* Icon Actions */}
          <div className="flex items-center gap-1">
            {/* Homespace icon - Show if community has published homespace */}
            {homespaces[community.id] && (
              <Link
                href={`/${homespaces[community.id].slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-500 hover:text-[#5C6B47] hover:bg-[#5C6B47]/10 rounded-lg transition-colors"
                title="Besök samhällets hemsida"
              >
                <Globe className="w-4 h-4" />
              </Link>
            )}
            
            {/* CRUD Actions - Only for admins */}
            {isAdmin && (
              <>
                <button
                  onClick={() => setEditingCommunity(community)}
                  className="p-2 text-gray-500 hover:text-[#3D4A2B] hover:bg-[#3D4A2B]/10 rounded-lg transition-colors"
                  title="Redigera samhälle"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCommunity(community.id)}
                  disabled={actionLoading === community.id}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Ta bort samhälle"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    // Check for authenticated user
    const checkAuth = async () => {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        
        if (error) throw error;
        
        if (authUser) {
          setUser(authUser);
        } else {
          // Fallback to demo mode if no authenticated user
          const demoUser = {
            id: 'demo-user',
            email: 'demo@beready.se',
            user_metadata: { name: 'Demo Användare' }
          } as unknown as User;
          setUser(demoUser);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Use demo mode on error
        const demoUser = {
          id: 'demo-user',
          email: 'demo@beready.se',
          user_metadata: { name: 'Demo Användare' }
        } as unknown as User;
        setUser(demoUser);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load communities and user memberships
  useEffect(() => {
    if (user && user.id !== 'demo-user') {
      loadCommunities();
      loadUserMemberships();
    }
  }, [user]);

  // Filter and sort communities based on search query and filters
  useEffect(() => {
    let filtered = [...communities];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(community =>
        community.community_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Membership filter
    if (filters.membership === 'member') {
      filtered = filtered.filter(community => userMemberships.includes(community.id));
    } else if (filters.membership === 'not_member') {
      filtered = filtered.filter(community => !userMemberships.includes(community.id));
    }

    // Location filter
    if (filters.location.trim()) {
      filtered = filtered.filter(community =>
        community.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    // Member count filter
    if (filters.memberCount !== 'all') {
      filtered = filtered.filter(community => {
        const memberCount = community.member_count || 0;
        switch (filters.memberCount) {
          case 'small': return memberCount < 20;
          case 'medium': return memberCount >= 20 && memberCount < 50;
          case 'large': return memberCount >= 50;
          default: return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'member_count':
          return (b.member_count || 0) - (a.member_count || 0);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'name':
        default:
          return a.community_name.localeCompare(b.community_name);
      }
    });

    setFilteredCommunities(filtered);
  }, [searchQuery, communities, filters, userMemberships]);

  // Populate form when editing a community
  useEffect(() => {
    if (editingCommunity) {
      setCreateForm({
        name: editingCommunity.community_name || '',
        description: editingCommunity.description || '',
        location: editingCommunity.location || '',
        accessType: (editingCommunity.access_type as 'öppet' | 'stängt') || 'öppet' // Use existing access type or default to öppet
      });
    } else {
      setCreateForm({ name: '', description: '', location: '', accessType: 'öppet' });
    }
  }, [editingCommunity]);

  const loadCommunities = async () => {
    setLoadingCommunities(true);
    try {
      const allCommunities = await communityService.getCommunities();
      setCommunities(allCommunities);
      setFilteredCommunities(allCommunities);
      
      // Load homespaces for all communities
      loadHomespaces(allCommunities.map(c => c.id));
    } catch (error) {
      console.error('Error loading communities:', error);
    } finally {
      setLoadingCommunities(false);
    }
  };

  const loadUserMemberships = async () => {
    if (!user || user.id === 'demo-user') return;
    try {
      const memberships = await communityService.getUserMemberships(user.id);
      setUserMemberships(memberships);
    } catch (error) {
      console.error('Error loading user memberships:', error);
    }
  };

  const loadHomespaces = async (communityIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('community_homespaces')
        .select('community_id, slug, published')
        .in('community_id', communityIds)
        .eq('published', true);

      if (error) throw error;

      if (data) {
        const homespaceMap: Record<string, { slug: string; published: boolean }> = {};
        data.forEach((homespace) => {
          homespaceMap[homespace.community_id] = {
            slug: homespace.slug,
            published: homespace.published
          };
        });
        setHomespaces(homespaceMap);
      }
    } catch (error) {
      console.error('Error loading homespaces:', error);
    }
  };

  const handleToggleMembership = async (communityId: string) => {
    if (!user || user.id === 'demo-user') return;
    
    setActionLoading(communityId);
    try {
      const isMember = userMemberships.includes(communityId);
      
      if (isMember) {
        // Leave community
        await communityService.leaveCommunity(communityId, user.id);
        setUserMemberships(prev => prev.filter(id => id !== communityId));
      } else {
        // Join community
        await communityService.joinCommunity(communityId, user.id);
        setUserMemberships(prev => [...prev, communityId]);
      }
    } catch (error) {
      console.error('Error toggling membership:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCommunity = async (communityId: string) => {
    if (!user || user.id === 'demo-user') return;
    
    const community = communities.find(c => c.id === communityId);
    if (!community || community.created_by !== user.id) {
      alert('Du har inte behörighet att ta bort detta samhälle.');
      return;
    }
    
    if (confirm('Är du säker på att du vill ta bort detta samhälle? Detta kan inte ångras.')) {
      setActionLoading(communityId);
      try {
        await communityService.deleteCommunity(communityId);
        setCommunities(prev => prev.filter(c => c.id !== communityId));
        setFilteredCommunities(prev => prev.filter(c => c.id !== communityId));
      } catch (error) {
        console.error('Error deleting community:', error);
        alert('Ett fel uppstod vid borttagning av samhället.');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleCreateCommunity = async () => {
    if (!user || user.id === 'demo-user') return;
    if (!createForm.name.trim()) {
      alert('Vänligen ange ett namn för samhället.');
      return;
    }

    setCreateLoading(true);
    try {
      console.log('Creating community with data:', createForm);
      
      const newCommunity = await communityService.createCommunity({
        community_name: createForm.name,
        description: createForm.description || 'Ett lokalt beredskapssamhälle',
        location: createForm.location || 'Sverige',
        county: createForm.location || 'Sverige',
        created_by: user.id,
        is_public: true,
        access_type: createForm.accessType,
        auto_approve_members: createForm.accessType === 'öppet'
      });

      console.log('Community created successfully:', newCommunity);

      // Refresh communities list
      await loadCommunities();
      await loadUserMemberships();

      // Reset form and close modal
      setCreateForm({ name: '', description: '', location: '', accessType: 'öppet' });
      setShowCreateModal(false);
      
      alert('Samhället har skapats!');
    } catch (error) {
      console.error('Error creating community:', error);
      alert('Ett fel uppstod vid skapande av samhället. Försök igen.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateCommunity = async () => {
    if (!user || !editingCommunity || user.id === 'demo-user') return;
    if (!createForm.name.trim()) {
      alert('Vänligen ange ett namn för samhället.');
      return;
    }

    setCreateLoading(true);
    try {
      console.log('Updating community:', editingCommunity.id, createForm);
      
      await communityService.updateCommunity(editingCommunity.id, {
        community_name: createForm.name,
        description: createForm.description,
        location: createForm.location,
        county: createForm.location,
        access_type: createForm.accessType,
        auto_approve_members: createForm.accessType === 'öppet'
      });

      console.log('Community updated successfully');

      // Refresh communities list
      await loadCommunities();

      // Reset form and close modal
      setCreateForm({ name: '', description: '', location: '', accessType: 'öppet' });
      setEditingCommunity(null);
      
      alert('Samhället har uppdaterats!');
    } catch (error) {
      console.error('Error updating community:', error);
      alert('Ett fel uppstod vid uppdatering av samhället. Försök igen.');
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <ShieldProgressSpinner variant="bounce" size="xl" color="olive" message="Laddar" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('auth.login_required')}</h2>
            <p className="text-gray-600 mb-6">
              {t('auth.login_required_description')}
            </p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-[#3D4A2B] text-white font-medium rounded-lg hover:bg-[#2A331E] transition-colors"
            >
              {t('auth.go_to_login')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-[#3D4A2B]/10 rounded-xl p-3">
                  <Search className="w-8 h-8 text-[#3D4A2B]" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Hitta samhällen</h1>
                  <p className="text-gray-600">Upptäck och gå med i lokala samhällen nära dig</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#3D4A2B] text-white font-medium rounded-lg hover:bg-[#2A331E] transition-colors"
              >
                <Plus className="w-5 h-5" />
                Skapa samhälle
              </button>
            </div>
          </div>

          {/* Communities List using ResourceListView */}
          <ResourceListView
            items={filteredCommunities}
            columns={tableColumns}
            cardRenderer={cardRenderer}
            searchable={true}
            searchPlaceholder="Sök efter samhällen, platser eller beskrivningar..."
            onSearch={setSearchQuery}
            searchQuery={searchQuery}
            showViewToggle={true}
            loading={loadingCommunities}
            loadingMessage="Laddar samhällen..."
            cardGridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            emptyState={
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'Inga samhällen hittades' : 'Inga samhällen tillgängliga för sökning'}
                </h3>
                <p className="text-gray-600">
                  {searchQuery 
                    ? 'Prova att ändra din sökterm eller ta bort filter'
                    : 'Funktionen för att upptäcka nya samhällen kommer snart'
                  }
                </p>
              </div>
            }
          />
        </div>
      </div>

      {/* Create/Edit Community Modal */}
      {(showCreateModal || editingCommunity) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingCommunity ? 'Redigera samhälle' : 'Skapa nytt samhälle'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingCommunity(null);
                  setCreateForm({ name: '', description: '', location: '', accessType: 'öppet' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Namn
                </label>
                <input
                  type="text"
                  value={createForm.name || (editingCommunity?.community_name || '')}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                  placeholder="Samhällets namn"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beskrivning
                </label>
                <textarea
                  value={createForm.description || (editingCommunity?.description || '')}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                  placeholder="Beskrivning av samhället"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plats
                </label>
                <input
                  type="text"
                  value={createForm.location || (editingCommunity?.location || '')}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                  placeholder="Stad, region"
                />
              </div>

              {/* Access Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Åtkomsttyp <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#3D4A2B] transition-colors">
                    <input
                      type="radio"
                      name="accessType"
                      value="öppet"
                      checked={createForm.accessType === 'öppet'}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, accessType: e.target.value as 'öppet' | 'stängt' }))}
                      className="mt-1 w-4 h-4 text-[#3D4A2B] border-gray-300 focus:ring-[#3D4A2B]"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        <Globe size={16} className="text-green-600" />
                        Öppet samhälle
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Alla kan gå med direkt utan godkännande
                      </div>
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-[#3D4A2B] transition-colors">
                    <input
                      type="radio"
                      name="accessType"
                      value="stängt"
                      checked={createForm.accessType === 'stängt'}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, accessType: e.target.value as 'öppet' | 'stängt' }))}
                      className="mt-1 w-4 h-4 text-[#3D4A2B] border-gray-300 focus:ring-[#3D4A2B]"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        <Lock size={16} className="text-orange-600" />
                        Stängt samhälle
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Medlemsansökningar kräver godkännande från administratör
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingCommunity(null);
                  setCreateForm({ name: '', description: '', location: '', accessType: 'öppet' });
                }}
                disabled={createLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Avbryt
              </button>
              <button
                onClick={editingCommunity ? handleUpdateCommunity : handleCreateCommunity}
                disabled={createLoading || !createForm.name.trim()}
                className="flex-1 px-4 py-2 bg-[#3D4A2B] text-white font-medium rounded-lg hover:bg-[#2A331E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {editingCommunity ? 'Uppdaterar...' : 'Skapar...'}
                  </>
                ) : (
                  editingCommunity ? 'Uppdatera' : 'Skapa'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
