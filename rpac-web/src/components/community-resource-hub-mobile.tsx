'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  Heart,
  AlertCircle,
  Clock,
  MapPin,
  Plus,
  X,
  Send,
  CheckCircle,
  Loader,
  Edit2,
  Trash2,
  User as UserIcon,
  Building2,
  Users,
  Search,
  Filter,
  Calendar,
  ShieldAlert,
  Wrench,
  Droplets,
  Zap,
  Share2,
  Check,
  ChevronDown,
  ChevronLeft
} from 'lucide-react';
import { resourceSharingService, type SharedResource, type HelpRequest } from '@/lib/resource-sharing-service';
import { communityResourceService, type CommunityResource } from '@/lib/community-resource-service';
import { communityService, type LocalCommunity } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { CommunityResourceModal } from './community-resource-modal';
import { SharedResourceActionsModal } from './shared-resource-actions-modal';
import type { User } from '@supabase/supabase-js';

interface CommunityResourceHubMobileProps {
  user: User;
  communityId: string;
  communityName: string;
  isAdmin?: boolean;
  onSendMessage?: (content: string) => void;
  initialTab?: string | null;
}

type ViewTier = 'shared' | 'owned' | 'help';
type CategoryFilter = 'all' | 'food' | 'water' | 'medicine' | 'energy' | 'tools' | 'machinery' | 'other';

const categoryConfig = {
  food: { icon: Package, emoji: '🍞', label: 'Mat', color: '#FFC000' },
  water: { icon: Droplets, emoji: '💧', label: 'Vatten', color: '#4A90E2' },
  medicine: { icon: Heart, emoji: '💊', label: 'Medicin', color: '#8B4513' },
  energy: { icon: Zap, emoji: '⚡', label: 'Energi', color: '#B8860B' },
  tools: { icon: Wrench, emoji: '🔧', label: 'Verktyg', color: '#4A5239' },
  machinery: { icon: Package, emoji: '🚜', label: 'Maskiner', color: '#6B8E23' },
  other: { icon: Package, emoji: '✨', label: 'Övrigt', color: '#707C5F' }
};

const resourceTypeConfig = {
  equipment: { emoji: '🔧', label: 'Utrustning' },
  facility: { emoji: '🏢', label: 'Facilitet' },
  skill: { emoji: '🎓', label: 'Kompetens' },
  vehicle: { emoji: '🚗', label: 'Fordon' },
  information: { emoji: '📚', label: 'Information' },
  other: { emoji: '✨', label: 'Övrigt' }
};

export function CommunityResourceHubMobile({
  user,
  communityId,
  communityName,
  isAdmin = false,
  onSendMessage,
  initialTab
}: CommunityResourceHubMobileProps) {
  console.log('CommunityResourceHubMobile component mounted with:', { communityId, communityName, initialTab });
  const [activeTab, setActiveTab] = useState<ViewTier>('shared');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  
  // Community selector state
  const [userCommunities, setUserCommunities] = useState<LocalCommunity[]>([]);
  const [currentCommunityId, setCurrentCommunityId] = useState<string>(communityId);
  const [currentCommunityName, setCurrentCommunityName] = useState<string>(communityName);

  // Data states
  const [sharedResources, setSharedResources] = useState<SharedResource[]>([]);
  const [communityResources, setCommunityResources] = useState<CommunityResource[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualCommunityName, setActualCommunityName] = useState<string>(communityName);

  // Modal states
  const [showResourceDetail, setShowResourceDetail] = useState<SharedResource | CommunityResource | HelpRequest | null>(null);
  const [showAddCommunityResource, setShowAddCommunityResource] = useState(false);
  const [showAddHelpRequest, setShowAddHelpRequest] = useState(false);
  const [editingCommunityResource, setEditingCommunityResource] = useState<CommunityResource | null>(null);
  const [managingResource, setManagingResource] = useState<SharedResource | null>(null);

  useEffect(() => {
    console.log('CommunityResourceHubMobile useEffect triggered with communityId:', communityId);
    if (currentCommunityId) {
      console.log('Loading data for community:', currentCommunityId);
      loadAllData();
      loadCommunityName();
    }
  }, [currentCommunityId]);

  // Load user communities for selector
  useEffect(() => {
    if (user && user.id !== 'demo-user') {
      loadUserCommunities();
    }
  }, [user]);

  // Update current community when props change
  useEffect(() => {
    setCurrentCommunityId(communityId);
    setCurrentCommunityName(communityName);
  }, [communityId, communityName]);

  // Check for resource parameter in URL and open modal
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const resourceId = urlParams.get('resource');
    
    if (resourceId && sharedResources.length > 0) {
      console.log('🔗 Mobile: Found resource parameter in URL:', resourceId);
      const resource = sharedResources.find(r => r.id === resourceId);
      
      if (resource) {
        console.log('✅ Mobile: Opening modal for resource from URL:', resource);
        setManagingResource(resource);
        
        // Remove the resource parameter from URL without reloading
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('resource');
        window.history.replaceState({}, '', newUrl.toString());
      } else {
        console.warn('⚠️ Mobile: Resource not found in sharedResources for URL parameter:', resourceId);
      }
    }
  }, [sharedResources]);

  // Listen for openResourceManagement events from notifications
  useEffect(() => {
    const handleOpenResourceManagement = (event: CustomEvent) => {
      const { resourceId } = event.detail;
      console.log('Mobile hub received openResourceManagement event with resourceId:', resourceId);
      console.log('Available sharedResources:', sharedResources.map(r => ({ id: r.id, resource_id: r.resource_id, status: r.status })));
      
      // If sharedResources is empty, wait and retry
      if (sharedResources.length === 0) {
        console.log('SharedResources is empty, waiting for data to load...');
        
        // Try multiple times with increasing delays
        const retryWithDelay = (attempt: number) => {
          setTimeout(() => {
            console.log(`Retry attempt ${attempt} - sharedResources now:`, sharedResources.map(r => ({ id: r.id, resource_id: r.resource_id, status: r.status })));
            const resource = sharedResources.find(r => r.id === resourceId);
            if (resource) {
              console.log('✅ Found resource for management (retry):', resource);
              setManagingResource(resource);
            } else if (attempt < 5) {
              retryWithDelay(attempt + 1);
            } else {
              console.error('❌ Failed to find resource after 5 attempts:', resourceId);
            }
          }, attempt * 500); // Increasing delay: 500ms, 1000ms, 1500ms, 2000ms, 2500ms
        };
        
        retryWithDelay(1);
        return;
      }
      
      // Find the resource in sharedResources
      const resource = sharedResources.find(r => r.id === resourceId);
      if (resource) {
        console.log('✅ Found resource for management immediately:', resource);
        setManagingResource(resource);
      } else {
        console.warn('⚠️ Resource not found immediately, will retry:', resourceId);
        // Still retry even if sharedResources is not empty, in case the data hasn't loaded yet
        const retryWithDelay = (attempt: number) => {
          setTimeout(() => {
            const resource = sharedResources.find(r => r.id === resourceId);
            if (resource) {
              console.log('✅ Found resource for management (delayed retry):', resource);
              setManagingResource(resource);
            } else if (attempt < 3) {
              retryWithDelay(attempt + 1);
            } else {
              console.error('❌ Failed to find resource after retries:', resourceId);
            }
          }, attempt * 300);
        };
        
        retryWithDelay(1);
      }
    };

    window.addEventListener('openResourceManagement', handleOpenResourceManagement as EventListener);
    
    return () => {
      window.removeEventListener('openResourceManagement', handleOpenResourceManagement as EventListener);
    };
  }, [sharedResources]);

  const loadCommunityName = async () => {
    try {
      console.log('Loading community name for ID:', currentCommunityId);
      const { data: community, error } = await supabase
        .from('local_communities')
        .select('community_name')
        .eq('id', currentCommunityId)
        .single();
      
      if (error) {
        console.error('Error fetching community:', error);
        return;
      }
      
      console.log('Fetched community:', community);
      if (community) {
        setActualCommunityName(community.community_name);
        console.log('Set community name to:', community.community_name);
      }
    } catch (error) {
      console.error('Error loading community name:', error);
    }
  };

  const loadUserCommunities = async () => {
    try {
      const memberships = await communityService.getUserMemberships(user.id);
      
      if (memberships.length > 0) {
        const communities = await Promise.all(
          memberships.map(id => communityService.getCommunityById(id))
        );
        
        const validCommunities = communities.filter(c => c !== null) as LocalCommunity[];
        setUserCommunities(validCommunities);
      }
    } catch (error) {
      console.error('Error loading communities:', error);
    }
  };

  const handleCommunityChange = (newCommunityId: string) => {
    const selectedCommunity = userCommunities.find(c => c.id === newCommunityId);
    if (selectedCommunity) {
      setCurrentCommunityId(selectedCommunity.id);
      setCurrentCommunityName(selectedCommunity.community_name);
      localStorage.setItem('selectedCommunityId', selectedCommunity.id);
      
      // Reload data for the new community
      loadAllData();
      loadCommunityName();
    }
  };

  // Handle initial tab from URL parameters
  useEffect(() => {
    if (initialTab === 'shared' || initialTab === 'delade') {
      setActiveTab('shared');
    } else if (initialTab === 'owned' || initialTab === 'gemensamma') {
      setActiveTab('owned');
    } else if (initialTab === 'help' || initialTab === 'hjalp') {
      setActiveTab('help');
    }
  }, [initialTab]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [shared, owned, help] = await Promise.all([
        resourceSharingService.getCommunityResources(currentCommunityId, user.id),
        communityResourceService.getCommunityResources(currentCommunityId),
        resourceSharingService.getCommunityHelpRequests(currentCommunityId)
      ]);

      setSharedResources(shared);
      console.log('Loaded shared resources:', shared.map(r => ({ id: r.id, resource_id: r.resource_id, status: r.status })));
      setCommunityResources(owned);
      setHelpRequests(help);
    } catch (err) {
      console.error('Error loading community resources:', err);
      setError('Kunde inte ladda samhällets resurser');
    } finally {
      setLoading(false);
    }
  };

  // Handler for requesting shared resources
  const handleRequestResource = async (resource: SharedResource) => {
    try {
      console.log('Requesting resource:', resource.id, 'for user:', user.id);
      
      // Create a request with default quantity
      await resourceSharingService.requestSharedResource({
        sharedResourceId: resource.id,
        requesterId: user.id,
        requestedQuantity: resource.shared_quantity,
        message: 'Jag skulle vilja begära denna resurs'
      });
      console.log('Request created, updating UI locally...');
      
      // Update the shared resources state locally to reflect the change
      setSharedResources(prevResources => 
        prevResources.map(r => 
          r.id === resource.id 
            ? { ...r, has_user_requested: true, status: 'requested' }
            : r
        )
      );
      
      console.log('UI updated locally, no reload needed');
      // Close the modal after successful request
      setShowResourceDetail(null);
    } catch (err) {
      console.error('Error requesting resource:', err);
      setError('Kunde inte begära resurs');
    }
  };

  // Handler for canceling shared resource requests
  const handleCancelRequest = async (resource: SharedResource) => {
    try {
      console.log('Canceling request for resource:', resource.id, 'for user:', user.id);
      
      // Cancel the request
      await resourceSharingService.cancelResourceRequest(resource.id, user.id);
      console.log('Request canceled, updating UI locally...');
      
      // Update the shared resources state locally to reflect the change
      setSharedResources(prevResources => 
        prevResources.map(r => 
          r.id === resource.id 
            ? { ...r, has_user_requested: false, status: 'available' }
            : r
        )
      );
      
      console.log('UI updated locally, no reload needed');
      // Close the modal after successful cancellation
      setShowResourceDetail(null);
    } catch (err) {
      console.error('Error canceling resource request:', err);
      setError('Kunde inte avbryta begäran');
    }
  };

  // Filter shared resources
  const filterSharedResources = (resources: SharedResource[]) => {
    let filtered = resources;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(r => r.resource_category === categoryFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.resource_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  // Filter community resources
  const filterCommunityResources = (resources: CommunityResource[]) => {
    let filtered = resources;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(r => r.category === categoryFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.resource_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  // Filter help requests
  const filterHelpRequests = (resources: HelpRequest[]) => {
    let filtered = resources;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(r => r.category === categoryFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  // Group shared resources by name
  const groupSharedResources = (resources: SharedResource[]) => {
    const grouped = new Map<string, SharedResource[]>();

    resources.forEach(resource => {
      const key = resource.resource_name?.toLowerCase() || 'unknown';
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(resource);
    });

    return Array.from(grouped.values());
  };

  const filteredShared = filterSharedResources(sharedResources);
  const groupedSharedResources = groupSharedResources(filteredShared);
  const filteredOwned = filterCommunityResources(communityResources);
  const filteredHelp = filterHelpRequests(helpRequests);

  // Handler for adding community resource
  const handleAddCommunityResource = async (resource: Partial<CommunityResource>) => {
    try {
      await communityResourceService.addCommunityResource({
        communityId,
        resourceName: resource.resource_name!,
        resourceType: resource.resource_type!,
        category: resource.category!,
        quantity: resource.quantity || 1,
        unit: resource.unit,
        location: resource.location,
        usageInstructions: resource.usage_instructions,
        bookingRequired: resource.booking_required || false,
        notes: resource.notes,
        createdBy: user.id
      });
      await loadAllData();
      setShowAddCommunityResource(false);
    } catch (err) {
      console.error('Error adding community resource:', err);
      throw err;
    }
  };

  // Handler for editing community resource
  const handleEditCommunityResource = async (resource: Partial<CommunityResource>) => {
    try {
      if (!editingCommunityResource) return;
      await communityResourceService.updateCommunityResource(editingCommunityResource.id, resource);
      await loadAllData();
      setShowAddCommunityResource(false);
      setEditingCommunityResource(null);
    } catch (err) {
      console.error('Error updating community resource:', err);
      throw err;
    }
  };

  // Handler for adding help request
  const handleAddHelpRequest = async (helpRequest: Partial<HelpRequest>) => {
    try {
      await resourceSharingService.createHelpRequest({
        userId: user.id,
        communityId,
        title: helpRequest.title!,
        description: helpRequest.description!,
        category: helpRequest.category!,
        urgency: helpRequest.urgency || 'medium',
        location: helpRequest.location
      });
      await loadAllData();
      setShowAddHelpRequest(false);
    } catch (err) {
      console.error('Error adding help request:', err);
      throw err;
    }
  };

  // Calculate statistics
  const stats = {
    totalShared: sharedResources.length,
    availableShared: sharedResources.filter(r => r.status === 'available').length,
    totalOwned: communityResources.length,
    activeHelp: helpRequests.filter(r => r.status === 'open' || r.status === 'in_progress').length,
    resolvedHelp: helpRequests.filter(r => r.status === 'resolved').length,
    contributors: new Set(sharedResources.map(r => r.user_id)).size
  };

  // Debug managingResource state
  console.log('CommunityResourceHubMobile render - managingResource:', managingResource);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5C6B47]/10 via-white to-[#707C5F]/10 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] text-white px-4 pt-6 pb-8 shadow-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Samhällsresurser</h1>
          <p className="text-[#C8D5B9] text-sm flex items-center gap-1">
            <Building2 size={14} />
            {actualCommunityName}
          </p>
          
          {/* Mobile Community Selector */}
          {userCommunities.length > 1 && (
            <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30 max-w-full overflow-hidden">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white/20 rounded-full p-2">
                  <Users size={14} className="text-white" />
                </div>
                <span className="font-bold text-white text-sm">Aktivt samhälle:</span>
              </div>
              <select
                value={currentCommunityId}
                onChange={(e) => handleCommunityChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border-2 border-white/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 text-gray-900 font-medium text-sm cursor-pointer hover:border-white/60 hover:shadow-md transition-all shadow-sm"
              >
                {userCommunities.map((community) => (
                  <option key={community.id} value={community.id} className="font-medium text-sm">
                    {community.community_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
            <div className="flex items-center gap-2 mb-2">
              <Share2 size={16} className="text-white/80" />
              <span className="text-xs text-white/80 font-medium">Delade</span>
            </div>
            <div className="text-2xl font-bold">{stats.availableShared}</div>
            <div className="text-xs text-white/70 mt-1">tillgängliga</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={16} className="text-white/80" />
              <span className="text-xs text-white/80 font-medium">Samhället</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalOwned}</div>
            <div className="text-xs text-white/70 mt-1">resurser</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-white/80" />
              <span className="text-xs text-white/80 font-medium">Önskemål</span>
            </div>
            <div className="text-2xl font-bold">{stats.activeHelp}</div>
            <div className="text-xs text-white/70 mt-1">aktiva</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Sök resurser..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-12 py-3 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button
            onClick={() => setShowFilterSheet(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[#3D4A2B] text-white hover:bg-[#2A331E] transition-all"
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('shared')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all touch-manipulation active:scale-95 ${
              activeTab === 'shared'
                ? 'bg-[#3D4A2B] text-white shadow-md'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Share2 size={16} />
              Delade ({stats.availableShared})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('owned')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all touch-manipulation active:scale-95 ${
              activeTab === 'owned'
                ? 'bg-[#3D4A2B] text-white shadow-md'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Building2 size={16} />
              Samhället ({stats.totalOwned})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all touch-manipulation active:scale-95 ${
              activeTab === 'help'
                ? 'bg-[#3D4A2B] text-white shadow-md'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <AlertCircle size={16} />
              Önskemål ({stats.activeHelp})
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3D4A2B] border-t-transparent mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">Laddar resurser...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertCircle className="mx-auto mb-3 text-red-500" size={40} />
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadAllData}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-medium"
            >
              Försök igen
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'shared' && (
              <SharedResourcesView
                groupedResources={groupedSharedResources}
                onResourceClick={setShowResourceDetail}
                userId={user.id}
              />
            )}
            {activeTab === 'owned' && (
              <OwnedResourcesView
                resources={filteredOwned}
                isAdmin={isAdmin}
                onResourceClick={setShowResourceDetail}
              />
            )}
            {activeTab === 'help' && (
              <HelpRequestsView
                requests={filteredHelp}
                onRequestClick={setShowResourceDetail}
                onRespond={(req) => {
                  if (onSendMessage) {
                    onSendMessage(`Jag kan hjälpa till med: "${req.title}". Låt oss prata om detaljerna.`);
                  }
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Filter Bottom Sheet */}
      {showFilterSheet && (
        <FilterBottomSheet
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          onClose={() => setShowFilterSheet(false)}
        />
      )}

      {/* Resource Detail Bottom Sheet */}
      {showResourceDetail && (
        <ResourceDetailBottomSheet
          resource={showResourceDetail}
          isAdmin={isAdmin}
          onClose={() => setShowResourceDetail(null)}
          onUpdate={loadAllData}
          onEdit={(resource) => {
            setEditingCommunityResource(resource as CommunityResource);
            setShowAddCommunityResource(true);
            setShowResourceDetail(null);
          }}
          onRequest={handleRequestResource}
          onCancelRequest={handleCancelRequest}
          userId={user.id}
        />
      )}

      {/* Community Resource Modal */}
      {showAddCommunityResource && (
        <CommunityResourceModal
          isOpen={showAddCommunityResource}
          onClose={() => {
            setShowAddCommunityResource(false);
            setEditingCommunityResource(null);
          }}
          onSubmit={editingCommunityResource ? handleEditCommunityResource : handleAddCommunityResource}
          resource={editingCommunityResource || undefined}
          mode={editingCommunityResource ? 'edit' : 'add'}
        />
      )}

      {/* Shared Resource Actions Modal */}
      {managingResource && (
        <>
          {console.log('Rendering SharedResourceActionsModal with resource:', managingResource)}
          <SharedResourceActionsModal
            isOpen={!!managingResource}
            resource={managingResource}
            onClose={() => {
              console.log('Closing SharedResourceActionsModal');
              setManagingResource(null);
            }}
            onUpdate={async (updates) => {
              console.log('Resource updated in modal:', updates);
              // Update the resource in the list
              setSharedResources(prev => 
                prev.map(r => r.id === managingResource.id ? { ...r, ...updates } : r)
              );
              setManagingResource(null);
            }}
            onDelete={async () => {
              console.log('Resource deleted in modal');
              // Remove the resource from the list
              setSharedResources(prev => 
                prev.filter(r => r.id !== managingResource.id)
              );
              setManagingResource(null);
            }}
          />
        </>
      )}

      {/* Help Request Bottom Sheet */}
      {showAddHelpRequest && (
        <AddHelpRequestBottomSheet
          onClose={() => setShowAddHelpRequest(false)}
          onSubmit={handleAddHelpRequest}
        />
      )}

      {/* Floating Action Button - Context-aware based on active tab */}
      {((activeTab === 'owned' && isAdmin) || activeTab === 'help') && (
        <button
          onClick={() => {
            if (activeTab === 'owned') {
              setShowAddCommunityResource(true);
            } else if (activeTab === 'help') {
              setShowAddHelpRequest(true);
            }
          }}
          className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-full shadow-2xl hover:shadow-3xl transition-all z-40 flex items-center justify-center touch-manipulation active:scale-95"
          aria-label={activeTab === 'owned' ? 'Lägg till samhällsresurs' : 'Skapa hjälpbegäran'}
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}

// Enhanced Shared Resources View Component
function SharedResourcesView({
  groupedResources,
  onResourceClick,
  userId
}: {
  groupedResources: SharedResource[][];
  onResourceClick: (resource: SharedResource) => void;
  userId: string;
}) {
  if (groupedResources.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-gradient-to-br from-[#5C6B47]/10 to-[#707C5F]/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Share2 className="text-[#5C6B47]" size={48} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">Inga delade resurser</h3>
        <p className="text-gray-600 text-sm max-w-sm mx-auto mb-6">
          Bli den första att dela en resurs med samhället och hjälp andra medlemmar!
        </p>
        <div className="bg-[#5C6B47]/5 border border-[#5C6B47]/20 rounded-xl p-4 max-w-sm mx-auto">
          <div className="text-sm text-[#5C6B47] font-semibold mb-1">💡 Tips</div>
          <div className="text-sm text-gray-600">
            Gå till din resursinventering för att dela dina resurser
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupedResources.map((group, idx) => {
        const firstResource = group[0];
        const totalQuantity = group.reduce((sum, r) => sum + r.shared_quantity, 0);
        const category = categoryConfig[firstResource.resource_category as keyof typeof categoryConfig] || categoryConfig.other;
        const contributors = new Set(group.map(r => r.user_id === userId ? 'Min resurs' : (r.sharer_name || 'Okänd'))).size;
        const availableCount = group.filter(r => r.status === 'available').length;
        const requestedCount = group.filter(r => r.has_user_requested).length;

        return (
          <button
            key={idx}
            onClick={() => onResourceClick(firstResource)}
            className="w-full bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-all touch-manipulation active:scale-98 group"
          >
            <div className="flex items-start gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ backgroundColor: `${category.color}15` }}
              >
                <span className="text-2xl">{category.emoji}</span>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{firstResource.resource_name}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                  <span className="font-semibold text-[#3D4A2B]">
                    {totalQuantity} {firstResource.resource_unit || 'st'}
                  </span>
                  <span>•</span>
                  <span>{contributors} delande</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-1 bg-[#556B2F]/10 text-[#556B2F] rounded-lg text-xs font-semibold">
                    {category.label}
                  </span>
                  {availableCount > 0 && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                      {availableCount} tillgängliga
                    </span>
                  )}
                  {requestedCount > 0 && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-semibold">
                      {requestedCount} begärda
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown className="text-gray-400 transform -rotate-90 group-hover:text-[#5C6B47] transition-colors" size={20} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Owned Resources View Component
function OwnedResourcesView({
  resources,
  isAdmin,
  onResourceClick
}: {
  resources: CommunityResource[];
  isAdmin: boolean;
  onResourceClick: (resource: CommunityResource) => void;
}) {
  if (resources.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-[#5C6B47]/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <Building2 className="text-[#5C6B47]" size={40} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Inga samhällsresurser</h3>
        <p className="text-gray-600 text-sm max-w-sm mx-auto">
          Samhället har inga gemensamma resurser registrerade än.
        </p>
        {isAdmin && (
          <p className="text-sm text-[#556B2F] mt-4 font-medium">
            Tryck på + knappen för att lägga till
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {resources.map((resource) => {
        const typeConfig = resourceTypeConfig[resource.resource_type as keyof typeof resourceTypeConfig] || resourceTypeConfig.other;
        const category = categoryConfig[resource.category as keyof typeof categoryConfig] || categoryConfig.other;

        return (
          <button
            key={resource.id}
            onClick={() => onResourceClick(resource)}
            className="w-full bg-white rounded-2xl p-5 shadow-lg border-2 border-gray-100 hover:shadow-xl hover:border-[#5C6B47]/30 transition-all duration-200 touch-manipulation active:scale-[0.98]"
          >
            {/* Header with Icon and Title */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#5C6B47]/10 to-[#707C5F]/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-3xl">{typeConfig.emoji}</span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{resource.resource_name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Package size={14} className="flex-shrink-0" />
                  <span className="font-semibold text-[#3D4A2B] truncate">
                    {resource.quantity} {resource.unit || 'st'}
                  </span>
                </div>
              </div>
            </div>

            {/* Location */}
            {resource.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3 pl-1">
                <MapPin size={14} className="flex-shrink-0 text-gray-400" />
                <span className="truncate">{resource.location}</span>
              </div>
            )}

            {/* Status Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1.5 bg-[#556B2F]/10 text-[#556B2F] rounded-lg text-xs font-semibold border border-[#556B2F]/20">
                {typeConfig.label}
              </span>
              <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                resource.status === 'available' 
                  ? 'bg-green-50 text-green-700 border-green-200' :
                resource.status === 'maintenance' 
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                'bg-gray-50 text-gray-700 border-gray-200'
              }`}>
                {resource.status === 'available' ? '✓ Tillgänglig' :
                  resource.status === 'maintenance' ? '⚠ Underhåll' :
                    resource.status === 'in_use' ? '◉ Används' : '◯ Ej tillgänglig'}
              </span>
              {resource.booking_required && (
                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1">
                  <Calendar size={12} />
                  Bokning
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Help Requests View Component
function HelpRequestsView({
  requests,
  onRequestClick,
  onRespond
}: {
  requests: HelpRequest[];
  onRequestClick: (request: HelpRequest) => void;
  onRespond: (request: HelpRequest) => void;
}) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-[#5C6B47]/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-[#556B2F]" size={40} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Inga aktiva önskemål</h3>
        <p className="text-gray-600 text-sm max-w-sm mx-auto">
          Fantastiskt! Samhället har inga öppna hjälpbegäran just nu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => {
        const category = categoryConfig[request.category as keyof typeof categoryConfig] || categoryConfig.other;
        const urgencyColors = {
          low: 'bg-blue-100 text-blue-700',
          medium: 'bg-yellow-100 text-yellow-700',
          high: 'bg-orange-100 text-orange-700',
          critical: 'bg-red-100 text-red-700'
        };

        return (
          <div
            key={request.id}
            className="bg-white rounded-2xl p-4 shadow-md border border-[#5C6B47]/20"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="text-3xl flex-shrink-0">{category.emoji}</div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1">{request.title}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{request.description}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${urgencyColors[request.urgency]}`}>
                    {request.urgency === 'low' ? 'Låg prioritet' :
                      request.urgency === 'medium' ? 'Medel' :
                        request.urgency === 'high' ? 'Hög prioritet' : 'KRITISK'}
                  </span>
                  <span className="px-2 py-1 bg-[#556B2F]/10 text-[#556B2F] rounded-lg text-xs font-semibold">
                    {category.label}
                  </span>
                  {request.status === 'in_progress' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                      Pågående
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onRequestClick(request)}
                className="flex-1 py-2.5 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all touch-manipulation active:scale-95"
              >
                Visa detaljer
              </button>
              {request.status === 'open' && (
                <button
                  onClick={() => onRespond(request)}
                  className="flex-1 py-2.5 px-4 bg-[#3D4A2B] text-white rounded-xl font-medium hover:bg-[#2A331E] transition-all touch-manipulation active:scale-95 flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  Hjälp till
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Filter Bottom Sheet Component
function FilterBottomSheet({
  categoryFilter,
  onCategoryChange,
  onClose
}: {
  categoryFilter: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 transition-opacity"
      onClick={onClose}
    >
      <div
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-transform animate-slide-up max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Filtrera efter kategori</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-all touch-manipulation"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                onCategoryChange('all');
                onClose();
              }}
              className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all touch-manipulation active:scale-98 ${categoryFilter === 'all'
                  ? 'bg-[#3D4A2B] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <span className="text-2xl">📦</span>
              <span className="font-semibold">Alla kategorier</span>
              {categoryFilter === 'all' && <Check className="ml-auto" size={20} />}
            </button>

            {Object.entries(categoryConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => {
                  onCategoryChange(key as CategoryFilter);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all touch-manipulation active:scale-98 ${categoryFilter === key
                    ? 'bg-[#3D4A2B] text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                <span className="text-2xl">{config.emoji}</span>
                <span className="font-semibold">{config.label}</span>
                {categoryFilter === key && <Check className="ml-auto" size={20} />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Resource Detail Bottom Sheet Component
function ResourceDetailBottomSheet({
  resource,
  isAdmin,
  onClose,
  onUpdate,
  onEdit,
  onRequest,
  onCancelRequest,
  userId
}: {
  resource: SharedResource | CommunityResource | HelpRequest;
  isAdmin: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onEdit?: (resource: CommunityResource) => void;
  onRequest?: (resource: SharedResource) => void;
  onCancelRequest?: (resource: SharedResource) => void;
  userId: string;
}) {
  // Determine resource type
  const isShared = 'resource_name' in resource && 'shared_quantity' in resource;
  const isOwned = 'resource_type' in resource && 'booking_required' in resource;
  const isHelp = 'title' in resource && 'urgency' in resource;

  const renderSharedDetails = (res: SharedResource) => {
    const category = categoryConfig[res.resource_category as keyof typeof categoryConfig] || categoryConfig.other;
    return (
      <>
        <div className="flex items-center gap-4 mb-6">
          <div className="text-5xl">{category.emoji}</div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{res.resource_name}</h2>
            <p className="text-gray-500">Delad av {res.user_id === userId ? 'Min resurs' : (res.sharer_name || 'Okänd')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#5C6B47]/10 rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-1">Mängd</div>
            <div className="text-xl font-bold text-[#3D4A2B]">
              {res.shared_quantity} {res.resource_unit || 'st'}
            </div>
          </div>
          <div className="bg-[#5C6B47]/10 rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-1">Status</div>
            <div className="text-lg font-semibold text-[#556B2F]">
              {res.status === 'taken' ? 'Hämtad' :
                res.status === 'available' ? (res.has_user_requested ? 'Begärd' : 'Tillgänglig') :
                res.status === 'reserved' ? 'Reserverad' : 'Hämtad'}
            </div>
          </div>
        </div>

        {res.location && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <MapPin size={16} />
              <span className="font-semibold">Plats</span>
            </div>
            <p className="text-gray-900">{res.location}</p>
          </div>
        )}

        {res.notes && (
          <div className="mb-6">
            <div className="text-gray-600 font-semibold mb-1">Anteckningar</div>
            <p className="text-gray-900">{res.notes}</p>
          </div>
        )}
      </>
    );
  };

  const renderOwnedDetails = (res: CommunityResource) => {
    const typeConfig = resourceTypeConfig[res.resource_type as keyof typeof resourceTypeConfig] || resourceTypeConfig.other;
    const category = categoryConfig[res.category as keyof typeof categoryConfig] || categoryConfig.other;
    return (
      <>
        <div className="flex items-center gap-4 mb-6">
          <div className="text-5xl">{typeConfig.emoji}</div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{res.resource_name}</h2>
            <p className="text-gray-500">{typeConfig.label} • {category.label}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[#5C6B47]/10 rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-1">Antal</div>
            <div className="text-xl font-bold text-[#3D4A2B]">
              {res.quantity} {res.unit || 'st'}
            </div>
          </div>
          <div className="bg-[#5C6B47]/10 rounded-xl p-4">
            <div className="text-sm text-gray-600 mb-1">Status</div>
            <div className={`text-lg font-semibold ${res.status === 'available' ? 'text-green-600' :
                res.status === 'maintenance' ? 'text-yellow-600' : 'text-gray-600'
              }`}>
              {res.status === 'available' ? 'Tillgänglig' :
                res.status === 'maintenance' ? 'Underhåll' :
                  res.status === 'in_use' ? 'Används' : 'Ej tillgänglig'}
            </div>
          </div>
        </div>

        {res.location && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <MapPin size={16} />
              <span className="font-semibold">Plats</span>
            </div>
            <p className="text-gray-900">{res.location}</p>
          </div>
        )}

        {res.usage_instructions && (
          <div className="mb-4">
            <div className="text-gray-600 font-semibold mb-1">Bruksanvisning</div>
            <p className="text-gray-900 text-sm">{res.usage_instructions}</p>
          </div>
        )}

        {res.booking_required && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 text-blue-700 font-semibold">
              <Calendar size={18} />
              Bokning krävs för användning
            </div>
          </div>
        )}
      </>
    );
  };

  const renderHelpDetails = (req: HelpRequest) => {
    const category = categoryConfig[req.category as keyof typeof categoryConfig] || categoryConfig.other;
    const urgencyColors = {
      low: 'bg-blue-100 text-blue-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-orange-100 text-orange-700',
      critical: 'bg-red-100 text-red-700'
    };

    return (
      <>
        <div className="flex items-center gap-4 mb-6">
          <div className="text-5xl">{category.emoji}</div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{req.title}</h2>
            <p className="text-gray-500">Från {req.requester_name || 'Okänd'}</p>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <span className={`px-3 py-2 rounded-xl text-sm font-semibold ${urgencyColors[req.urgency]}`}>
            {req.urgency === 'low' ? 'Låg prioritet' :
              req.urgency === 'medium' ? 'Medel prioritet' :
                req.urgency === 'high' ? 'Hög prioritet' : 'KRITISK'}
          </span>
          <span className="px-3 py-2 bg-[#556B2F]/10 text-[#556B2F] rounded-xl text-sm font-semibold">
            {category.label}
          </span>
        </div>

        <div className="mb-6">
          <div className="text-gray-600 font-semibold mb-2">Beskrivning</div>
          <p className="text-gray-900">{req.description}</p>
        </div>

        {req.location && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <MapPin size={16} />
              <span className="font-semibold">Plats</span>
            </div>
            <p className="text-gray-900">{req.location}</p>
          </div>
        )}
      </>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50"
      onClick={onClose}
    >
      <div
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up mb-20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-all touch-manipulation"
          >
            <ChevronLeft size={24} />
          </button>
          <h3 className="font-bold text-gray-900">Detaljer</h3>
          <div className="w-10"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isShared && renderSharedDetails(resource as SharedResource)}
          {isOwned && renderOwnedDetails(resource as CommunityResource)}
          {isHelp && renderHelpDetails(resource as HelpRequest)}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 pb-12 shadow-lg">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all touch-manipulation active:scale-95"
            >
              Stäng
            </button>
            {isShared && (resource as SharedResource).user_id === userId ? (
              <button
                onClick={() => onUpdate()}
                className="flex-1 py-3 px-4 bg-[#5C6B47] text-white rounded-xl font-semibold hover:bg-[#4A5239] transition-all touch-manipulation active:scale-95 relative"
              >
                Hantera
                {isShared && resource && ((resource as SharedResource).pending_requests_count ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {(resource as SharedResource).pending_requests_count}
                  </span>
                )}
              </button>
            ) : isShared && (resource as SharedResource).has_user_requested && (resource as SharedResource).status !== 'taken' ? (
              <button
                onClick={() => onCancelRequest?.(resource as SharedResource)}
                className="flex-1 py-3 px-4 bg-yellow-100 text-yellow-700 rounded-xl font-semibold hover:bg-yellow-200 transition-all touch-manipulation active:scale-95"
              >
                Avbryt begäran
              </button>
            ) : isShared && (resource as SharedResource).status === 'available' && onRequest ? (
              <button
                onClick={() => onRequest(resource as SharedResource)}
                className="flex-1 py-3 px-4 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-xl font-semibold hover:shadow-xl transition-all touch-manipulation active:scale-95"
              >
                Be om denna
              </button>
            ) : isAdmin && isOwned && onEdit ? (
              <button
                onClick={() => onEdit(resource as CommunityResource)}
                className="flex-1 py-3 px-4 bg-[#3D4A2B] text-white rounded-xl font-semibold hover:bg-[#2A331E] transition-all touch-manipulation active:scale-95"
              >
                <Edit2 size={18} className="inline mr-2" />
                Redigera
              </button>
            ) : (
              <div className="flex-1 py-3 px-4 bg-gray-100 text-gray-500 rounded-xl font-semibold text-center">
                Ej tillgänglig
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Add Help Request Bottom Sheet Component
function AddHelpRequestBottomSheet({
  onClose,
  onSubmit
}: {
  onClose: () => void;
  onSubmit: (helpRequest: Partial<HelpRequest>) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'other' as HelpRequest['category'],
    urgency: 'medium' as HelpRequest['urgency'],
    location: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim() || !form.description.trim()) {
      setError('Titel och beskrivning krävs');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit(form);
    } catch (err) {
      console.error('Error adding help request:', err);
      setError('Kunde inte skapa hjälpbegäran. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50"
      onClick={onClose}
    >
      <div
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] text-white px-6 py-5 flex items-center justify-between z-10 rounded-t-3xl">
          <div>
            <h3 className="text-xl font-bold">Skapa hjälpbegäran</h3>
            <p className="text-sm text-[#C8D5B9] mt-1">Be om hjälp från samhället</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-all touch-manipulation"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Titel *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="T.ex. Behöver hjälp med vedhuggning"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Beskrivning *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Beskriv vad du behöver hjälp med..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kategori
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(categoryConfig).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, category: key as HelpRequest['category'] })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all touch-manipulation active:scale-95 ${
                    form.category === key
                      ? 'border-[#3D4A2B] bg-[#3D4A2B]/10'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl">{config.emoji}</span>
                  <span className="text-xs font-medium text-gray-700">{config.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Urgency */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Prioritet
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'low', label: 'Låg', color: 'bg-blue-100 text-blue-700 border-blue-300' },
                { key: 'medium', label: 'Medel', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
                { key: 'high', label: 'Hög', color: 'bg-orange-100 text-orange-700 border-orange-300' },
                { key: 'critical', label: 'KRITISK', color: 'bg-red-100 text-red-700 border-red-300' }
              ].map(({ key, label, color }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, urgency: key as HelpRequest['urgency'] })}
                  className={`py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all touch-manipulation active:scale-95 ${
                    form.urgency === key
                      ? color
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Plats (frivilligt)
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="T.ex. Centrala Västerås"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all touch-manipulation active:scale-95 disabled:opacity-50"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={loading || !form.title.trim() || !form.description.trim()}
              className="flex-1 py-3 px-4 bg-[#3D4A2B] text-white rounded-xl font-semibold hover:bg-[#2A331E] transition-all touch-manipulation active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  Skapar...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Skapa begäran
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

