'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { CommunityEditModal } from '@/components/community-edit-modal';
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
  const [pendingMemberships, setPendingMemberships] = useState<string[]>([]);
  const [homespaces, setHomespaces] = useState<Record<string, { slug: string; published: boolean }>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState<LocalCommunity | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    location: '',
    accessType: 'öppet' as 'öppet' | 'stängt',
    slug: ''
  });
  const [originalSlug, setOriginalSlug] = useState<string>('');
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
    const isPending = pendingMemberships.includes(community.id);
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
              disabled={actionLoading === community.id || isPending}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isMember
                  ? 'bg-[#3D4A2B]/20 text-[#3D4A2B] border border-[#3D4A2B]/30 hover:bg-[#3D4A2B]/30'
                  : isPending
                  ? 'bg-amber-100 text-amber-800 border border-amber-300 cursor-not-allowed'
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
              ) : isPending ? (
                <>
                  <span>Väntande</span>
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
        accessType: (editingCommunity.access_type as 'öppet' | 'stängt') || 'öppet', // Use existing access type or default to öppet
        slug: homespaces[editingCommunity.id]?.slug || '' // Only show slug if it actually exists
      });
    } else {
      setCreateForm({ name: '', description: '', location: '', accessType: 'öppet', slug: '' });
    }
  }, [editingCommunity, homespaces]);

  // Auto-generate slug from community name when creating (not editing)
  useEffect(() => {
    if (!editingCommunity && createForm.name && createForm.slug === '') {
      const autoSlug = createForm.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
      
      setCreateForm(prev => ({ ...prev, slug: autoSlug }));
    }
  }, [createForm.name, editingCommunity, createForm.slug]);

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
      const pending = await communityService.getPendingMemberships(user.id);
      setUserMemberships(memberships);
      setPendingMemberships(pending);
      console.log('📊 Memberships loaded:', { approved: memberships.length, pending: pending.length });
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
        // ✅ JOIN COMMUNITY - CHECK IF CLOSED FIRST
        console.log('🔧 Attempting to join community:', communityId);
        
        // Get community details to check access type
        const community = communities.find(c => c.id === communityId);
        const isClosed = community?.access_type === 'stängt';
        const autoApprove = community?.auto_approve_members === true;
        
        console.log('Community access:', { isClosed, autoApprove, accessType: community?.access_type });
        
        if (isClosed && !autoApprove) {
          // CLOSED COMMUNITY - CREATE PENDING REQUEST
          console.log('🔒 Closed community - creating pending request...');
          
          // Try with status first
          const { error: requestError } = await supabase
            .from('community_memberships')
            .insert({
              community_id: communityId,
              user_id: user.id,
              role: 'member',
              status: 'pending'
            });
          
          // Fallback without status if column doesn't exist
          if (requestError && (requestError.message?.includes('status') || requestError.message?.includes('column'))) {
            console.log('⚠️ Status column not found - joining directly instead');
            await communityService.joinCommunity(communityId, user.id);
            setUserMemberships(prev => [...prev, communityId]);
          } else if (requestError) {
            throw requestError;
          } else {
            console.log('✅ Pending request created');
            
            // Get user profile for notification
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('display_name, first_name')
              .eq('user_id', user.id)
              .single();
            
            const requesterName = profile?.display_name || profile?.first_name || user.email?.split('@')[0] || 'En användare';
            
            // Send notification to admins
            const { notificationService } = await import('@/lib/notification-service');
            await notificationService.createMembershipRequestNotification({
              communityId,
              communityName: community?.community_name || 'samhället',
              requesterId: user.id,
              requesterName
            });
            
            alert('Ansökan skickad! Väntar på godkännande från administratör.');
            // Add to pending memberships (not approved yet)
            setPendingMemberships(prev => [...prev, communityId]);
          }
        } else {
          // OPEN COMMUNITY - JOIN DIRECTLY
          console.log('🔓 Open community - joining directly...');
          await communityService.joinCommunity(communityId, user.id);
          setUserMemberships(prev => [...prev, communityId]);
          console.log('✅ Joined successfully');
        }
        
        // Refresh to update UI
        await loadCommunities();
        await loadUserMemberships();
      }
    } catch (error) {
      console.error('❌ Error toggling membership:', error);
      alert('Ett fel uppstod. Försök igen.');
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

    // Validate slug if provided
    if (createForm.slug.trim()) {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(createForm.slug.trim())) {
        alert('Slug får endast innehålla små bokstäver, siffror och bindestreck');
        return;
      }
      if (createForm.slug.trim().length < 3) {
        alert('Slug måste vara minst 3 tecken lång');
        return;
      }
      if (createForm.slug.trim().startsWith('-') || createForm.slug.trim().endsWith('-')) {
        alert('Slug får inte börja eller sluta med bindestreck');
        return;
      }
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

      // Create homespace slug if provided
      if (createForm.slug.trim()) {
        try {
          await supabase
            .from('community_homespaces')
            .insert({
              community_id: newCommunity.id,
              slug: createForm.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
              created_at: new Date().toISOString()
            });
          console.log('✅ Homespace slug created:', createForm.slug);
        } catch (slugError) {
          console.error('⚠️ Error creating homespace slug:', slugError);
          // Don't throw error, just log it as slug creation is not critical
        }
      }

      // ✅ AUTO-JOIN CREATOR AS ADMIN
      console.log('🔧 Auto-joining creator as admin...');
      try {
        // Try inserting with status first
        let { data: memberData, error: memberError } = await supabase
          .from('community_memberships')
          .insert({
            community_id: newCommunity.id,
            user_id: user.id,
            role: 'admin',
            status: 'approved'
          })
          .select();
        
        // Fallback if status column doesn't exist
        if (memberError && (memberError.message?.includes('status') || memberError.message?.includes('column'))) {
          console.log('⚠️ Status column not found, retrying without it...');
          const { data: retryData, error: retryError } = await supabase
            .from('community_memberships')
            .insert({
              community_id: newCommunity.id,
              user_id: user.id,
              role: 'admin'
            })
            .select();
          memberError = retryError;
          memberData = retryData;
        }
        
        if (memberError) {
          console.error('❌ Error auto-joining:', memberError);
          throw memberError;
        }
        
        console.log('✅ Creator joined as admin:', memberData);
        
        // Increment member count
        await supabase.rpc('increment_community_members', {
          community_id: newCommunity.id
        });
        
        // ✅ AUTO-UPGRADE CREATOR TO COMMUNITY_MANAGER TIER
        console.log('🔧 Auto-upgrading creator to community_manager tier...');
        try {
          const { error: tierError } = await supabase.rpc('upgrade_community_creator', {
            p_user_id: user.id
          });
          
          if (tierError) {
            console.warn('⚠️ Could not auto-upgrade tier (this is normal for existing community managers):', tierError.message);
          } else {
            console.log('✅ Creator upgraded to community_manager tier');
          }
        } catch (tierUpgradeError) {
          console.warn('⚠️ Tier upgrade failed (non-critical):', tierUpgradeError);
        }
        
      } catch (joinError) {
        console.error('❌ FATAL: Failed to auto-join creator:', joinError);
        alert('Samhället skapades men du kunde inte läggas till som medlem. Försök gå med manuellt.');
      }

      // Refresh communities list
      await loadCommunities();
      await loadUserMemberships();

      // Reset form and close modal
      setCreateForm({ name: '', description: '', location: '', accessType: 'öppet', slug: '' });
      setShowCreateModal(false);
      
      alert('Samhället har skapats och du är nu admin!');
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

    // Validate slug if provided
    if (createForm.slug.trim()) {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(createForm.slug.trim())) {
        alert('Slug får endast innehålla små bokstäver, siffror och bindestreck');
        return;
      }
      if (createForm.slug.trim().length < 3) {
        alert('Slug måste vara minst 3 tecken lång');
        return;
      }
      if (createForm.slug.trim().startsWith('-') || createForm.slug.trim().endsWith('-')) {
        alert('Slug får inte börja eller sluta med bindestreck');
        return;
      }
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

      // Update homespace slug if provided
      if (createForm.slug.trim()) {
        try {
          // First check if a homespace already exists for this community
          const { data: existingHomespace } = await supabase
            .from('community_homespaces')
            .select('id')
            .eq('community_id', editingCommunity.id)
            .single();
          
          let slugError;
          if (existingHomespace) {
            // Update existing homespace
            const { error } = await supabase
              .from('community_homespaces')
              .update({
                slug: createForm.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
              })
              .eq('community_id', editingCommunity.id);
            slugError = error;
          } else {
            // Create new homespace
            const { error } = await supabase
              .from('community_homespaces')
              .insert({
                community_id: editingCommunity.id,
                slug: createForm.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
              });
            slugError = error;
          }
          
          if (slugError) {
            console.error('⚠️ Error updating homespace slug:', slugError);
            if (slugError.code === '23505') {
              alert('Denna URL är redan upptagen av ett annat samhälle. Välj en annan URL.');
            } else {
              alert(`Fel vid uppdatering av hemsida URL: ${slugError.message}`);
            }
          } else {
            console.log('✅ Homespace slug updated:', createForm.slug);
          }
        } catch (slugError) {
          console.error('⚠️ Error updating homespace slug:', slugError);
          alert(`Fel vid uppdatering av hemsida URL: ${slugError instanceof Error ? slugError.message : 'Okänt fel'}`);
        }
      }

      // Refresh communities list
      await loadCommunities();

      // Reset form and close modal
      setCreateForm({ name: '', description: '', location: '', accessType: 'öppet', slug: '' });
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

      {/* Community Edit Modal */}
      {editingCommunity && (
        <CommunityEditModal
          isOpen={!!editingCommunity}
          onClose={() => {
            setEditingCommunity(null);
            setCreateForm({ name: '', description: '', location: '', accessType: 'öppet', slug: '' });
          }}
          community={editingCommunity}
          onUpdate={(updatedCommunity) => {
            // Update the community in the list
            setCommunities(prev => 
              prev.map(c => c.id === updatedCommunity.id ? updatedCommunity : c)
            );
            setEditingCommunity(null);
            setCreateForm({ name: '', description: '', location: '', accessType: 'öppet', slug: '' });
          }}
        />
      )}

      {/* Create Community Modal */}
      {showCreateModal && !editingCommunity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                Skapa nytt samhälle
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingCommunity(null);
                  setCreateForm({ name: '', description: '', location: '', accessType: 'öppet', slug: '' });
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
                  value={createForm.name}
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
                  value={createForm.description}
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
                  value={createForm.location}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                  placeholder="Stad, region"
                />
              </div>

              {/* Homespace Slug */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">beready.se/</span>
                  <input
                    type="text"
                    value={createForm.slug || ''}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                      setCreateForm(prev => ({ ...prev, slug: value }));
                    }}
                    placeholder="Genereras automatiskt från namnet"
                    className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      createForm.slug && (
                        createForm.slug.length < 3 || 
                        createForm.slug.startsWith('-') || 
                        createForm.slug.endsWith('-')
                      ) 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-[#3D4A2B]'
                    }`}
                    maxLength={50}
                  />
                </div>
                {!editingCommunity && createForm.slug && (
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-genererat från "{createForm.name}"
                  </p>
                )}
                {!editingCommunity && !createForm.slug && (
                  <p className="text-xs text-gray-500 mt-1">
                    Ingen hemsida än. Lägg till en slug för att skapa en. Uppdatera och publicera den sedan från Hemsida.
                  </p>
                )}
                {createForm.slug && createForm.slug.length < 3 && (
                  <p className="text-xs text-red-500 mt-1">
                    Slug måste vara minst 3 tecken lång
                  </p>
                )}
                {createForm.slug && (createForm.slug.startsWith('-') || createForm.slug.endsWith('-')) && (
                  <p className="text-xs text-red-500 mt-1">
                    Slug får inte börja eller sluta med bindestreck
                  </p>
                )}
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
                  setCreateForm({ name: '', description: '', location: '', accessType: 'öppet', slug: '' });
                }}
                disabled={createLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Avbryt
              </button>
              <button
                onClick={handleCreateCommunity}
                disabled={
                  createLoading || 
                  !createForm.name.trim() || 
                  (createForm.slug ? (
                    createForm.slug.length < 3 || 
                    createForm.slug.startsWith('-') || 
                    createForm.slug.endsWith('-')
                  ) : false)
                }
                className="flex-1 px-4 py-2 bg-[#3D4A2B] text-white font-medium rounded-lg hover:bg-[#2A331E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Skapar...
                  </>
                ) : (
                  'Skapa'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
