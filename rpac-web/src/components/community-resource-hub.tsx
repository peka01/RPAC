'use client';

import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  Grid3x3,
  List,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { t } from '@/lib/locales';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { resourceSharingService, type SharedResource, type HelpRequest } from '@/lib/resource-sharing-service';
import { communityResourceService, type CommunityResource } from '@/lib/community-resource-service';
import { supabase } from '@/lib/supabase';
import { SharedResourceActionsModal } from './shared-resource-actions-modal';
import { CommunityResourceModal } from './community-resource-modal';
import { ResourceListView } from './resource-list-view';
import type { User } from '@supabase/supabase-js';

interface CommunityResourceHubProps {
  user: User;
  communityId: string;
  communityName: string;
  isAdmin?: boolean;
  onSendMessage?: (content: string) => void;
  initialTab?: string | null;
  hideTabs?: boolean; // New prop to hide the resource tabs
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

export function CommunityResourceHub({ 
  user, 
  communityId, 
  communityName,
  isAdmin = false,
  onSendMessage,
  initialTab,
  hideTabs = false
}: CommunityResourceHubProps) {
  const [activeTab, setActiveTab] = useState<ViewTier>('shared');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  
  // Data states
  const [sharedResources, setSharedResources] = useState<SharedResource[]>([]);
  const [communityResources, setCommunityResources] = useState<CommunityResource[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actualCommunityName, setActualCommunityName] = useState<string>(communityName);
  
  // Modal states
  const [showAddCommunityResource, setShowAddCommunityResource] = useState(false);
  const [editingCommunityResource, setEditingCommunityResource] = useState<CommunityResource | null>(null);
  const [showAddHelpRequest, setShowAddHelpRequest] = useState(false);

  const [managingResource, setManagingResource] = useState<SharedResource | null>(null);

  useEffect(() => {
    if (communityId) {
      loadAllData();
      loadCommunityName();
    }
  }, [communityId]);

  // Check for resource parameter in URL and open modal
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const resourceId = urlParams.get('resource');
    
    if (resourceId && sharedResources.length > 0) {
      console.log('🔗 Found resource parameter in URL:', resourceId);
      const resource = sharedResources.find(r => r.id === resourceId);
      
      if (resource) {
        console.log('✅ Opening modal for resource from URL:', resource);
        setManagingResource(resource);
        
        // Remove the resource parameter from URL without reloading
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('resource');
        window.history.replaceState({}, '', newUrl.toString());
      } else {
        console.warn('⚠️ Resource not found in sharedResources for URL parameter:', resourceId);
      }
    }
  }, [sharedResources]);

  // Listen for custom event to open resource management modal
  useEffect(() => {
    const handleOpenResourceManagement = (event: CustomEvent) => {
      const { resourceId } = event.detail;
      console.log('Desktop hub received openResourceManagement event with resourceId:', resourceId);
      console.log('Available sharedResources:', sharedResources.map(r => ({ id: r.id, resource_id: r.resource_id, status: r.status })));
      
      if (resourceId) {
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
        
        // Find the resource in sharedResources and open the modal
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
      }
    };

    window.addEventListener('openResourceManagement', handleOpenResourceManagement as EventListener);
    
    return () => {
      window.removeEventListener('openResourceManagement', handleOpenResourceManagement as EventListener);
    };
  }, [sharedResources]);

  const loadCommunityName = async () => {
    try {
      const { data: community, error } = await supabase
        .from('local_communities')
        .select('community_name')
        .eq('id', communityId)
        .single();
      
      if (error) {
        console.error('Error fetching community:', error);
        return;
      }
      
      if (community) {
        setActualCommunityName(community.community_name);
      }
    } catch (error) {
      console.error('Error loading community name:', error);
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
        resourceSharingService.getCommunityResources(communityId, user.id),
        communityResourceService.getCommunityResources(communityId),
        resourceSharingService.getCommunityHelpRequests(communityId)
      ]);
      
      console.log('Loaded shared resources:', shared.map(r => ({ id: r.id, name: r.resource_name, has_user_requested: r.has_user_requested })));
      setSharedResources(shared);
      setCommunityResources(owned);
      setHelpRequests(help);
    } catch (err) {
      console.error('Error loading community resources:', err);
      setError('Kunde inte ladda samhällets resurser');
    } finally {
      setLoading(false);
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

  // Group shared resources by resource name
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

  // Apply filters
  const filteredShared = filterSharedResources(sharedResources);
  const groupedSharedResources = groupSharedResources(filteredShared);
  const filteredOwned = filterCommunityResources(communityResources);
  const filteredHelp = filterHelpRequests(helpRequests);

  // Calculate statistics
  const stats = {
    totalShared: sharedResources.length,
    availableShared: sharedResources.filter(r => r.status === 'available').length,
    totalOwned: communityResources.length,
    activeHelp: helpRequests.filter(r => r.status === 'open' || r.status === 'in_progress').length,
    resolvedHelp: helpRequests.filter(r => r.status === 'resolved').length,
    contributors: new Set(sharedResources.map(r => r.user_id)).size
  };

  // Community Resource Handlers
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
      setEditingCommunityResource(null);
    } catch (err) {
      console.error('Error adding community resource:', err);
      throw err;
    }
  };

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

  const handleDeleteCommunityResource = async (resourceId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna resurs?')) return;
    
    try {
      await communityResourceService.deleteCommunityResource(resourceId);
      await loadAllData();
    } catch (err) {
      console.error('Error deleting community resource:', err);
      alert('Kunde inte ta bort resursen');
    }
  };

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
    } catch (err) {
      console.error('Error requesting resource:', err);
      setError('Kunde inte begära resurs');
    }
  };

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
    } catch (err) {
      console.error('Error canceling resource request:', err);
      setError('Kunde inte avbryta begäran');
    }
  };

  function handleRespondToHelp(request: HelpRequest) {
    if (onSendMessage) {
      onSendMessage(`Jag kan hjälpa till med: "${request.title}". Låt oss prata om detaljerna.`);
    }
  }

  async function handleUpdateResource(resourceId: string, updates: Partial<SharedResource>) {
    try {
      await resourceSharingService.updateSharedResourceSimple(resourceId, updates);
      await loadAllData();
    } catch (err) {
      console.error('Error updating resource:', err);
      throw err;
    }
  }

  async function handleDeleteResource(resourceId: string) {
    try {
      await resourceSharingService.deleteSharedResource(resourceId);
      await loadAllData();
    } catch (err) {
      console.error('Error deleting resource:', err);
      throw err;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ShieldProgressSpinner variant="bounce" size="lg" color="olive" message="Laddar" />
      </div>
    );
  }

  // Resource type configuration for display
  const resourceTypeConfig = {
    equipment: { emoji: '🔧', label: 'Utrustning' },
    facility: { emoji: '🏢', label: 'Facilitet' },
    skill: { emoji: '🎓', label: 'Kompetens' },
    vehicle: { emoji: '🚗', label: 'Fordon' },
    other: { emoji: '✨', label: 'Övrigt' }
  };

  // Render Tier 2: Community-Owned Resources View
  const renderOwnedResourcesView = () => {
    return (
      <ResourceListView
        items={filteredOwned}
        loading={loading}
        loadingMessage="Laddar samhällets resurser..."
        
        // Table columns
        columns={[
          {
            key: 'resource',
            label: 'Resurs',
            render: (resource) => {
              const typeConfig = resourceTypeConfig[resource.resource_type as keyof typeof resourceTypeConfig] || resourceTypeConfig.other;
              const category = categoryConfig[resource.category as keyof typeof categoryConfig] || categoryConfig.other;
              return (
                <div className="flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">{typeConfig.emoji}</span>
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900">{resource.resource_name}</div>
                    <div className="text-xs text-gray-500">{category.label} • {typeConfig.label}</div>
                  </div>
                </div>
              );
            }
          },
          {
            key: 'quantity',
            label: 'Antal',
            render: (resource) => (
              <div>
                <div className="font-bold text-gray-900">
                  {resource.quantity} {(resource.unit || 'st').replace(/stycken/gi, 'st').replace(/styck/gi, 'st')}
                </div>
                {resource.booking_required && (
                  <div className="text-xs text-[#556B2F] font-semibold">Bokning krävs</div>
                )}
              </div>
            )
          },
          {
            key: 'location',
            label: 'Plats',
            render: (resource) => (
              <div className="text-sm text-gray-600 truncate max-w-[150px]">
                {resource.location || '—'}
              </div>
            )
          },
          {
            key: 'status',
            label: 'Status',
            render: (resource) => (
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                resource.status === 'available' ? 'bg-green-100 text-green-800' :
                resource.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                resource.status === 'in_use' ? 'bg-blue-100 text-blue-800' :
                resource.status === 'broken' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {resource.status === 'available' ? 'Tillgänglig' :
                 resource.status === 'maintenance' ? 'Underhåll' :
                 resource.status === 'in_use' ? 'I användning' :
                 resource.status === 'broken' ? 'Trasig' : 'Okänd'}
              </span>
            )
          },
          {
            key: 'actions',
            label: 'Åtgärder',
            align: 'right',
            render: (resource) => (
              isAdmin ? (
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setEditingCommunityResource(resource);
                      setShowAddCommunityResource(true);
                    }}
                    className="px-3 py-1.5 bg-[#5C6B47] text-white rounded text-sm font-medium hover:bg-[#4A5239] transition-all"
                  >
                    Redigera
                  </button>
                  <button
                    onClick={() => handleDeleteCommunityResource(resource.id)}
                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 transition-all"
                  >
                    Ta bort
                  </button>
                </div>
              ) : resource.booking_required ? (
                <button
                  onClick={() => alert('Bokningsfunktion kommer snart!')}
                  className="px-3 py-1.5 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded text-sm font-medium hover:shadow-md transition-all"
                >
                  Boka
                </button>
              ) : null
            )
          }
        ]}
        
        // Card renderer
        cardRenderer={(resource) => (
          <CommunityResourceCard
            resource={resource}
            currentUserId={user.id}
            isAdmin={isAdmin}
            onEdit={() => {
              setEditingCommunityResource(resource);
              setShowAddCommunityResource(true);
            }}
            onDelete={() => handleDeleteCommunityResource(resource.id)}
            onBook={() => alert('Bokningsfunktion kommer snart!')}
          />
        )}
        
        // Empty state
        emptyState={
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <Building2 size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Inga samhällsresurser ännu
            </h3>
            <p className="text-gray-600 mb-6">
              {isAdmin 
                ? 'Lägg till gemensam utrustning, faciliteter eller kompetenser som samhället kan använda.' 
                : 'Samhället har inte registrerat några resurser ännu.'}
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowAddCommunityResource(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                <Plus size={20} />
                <span>Lägg till första resursen</span>
              </button>
            )}
          </div>
        }
        
        // Parent handles all controls - no duplicate UI
        searchable={false}
        filterable={false}
        showViewToggle={false}
        
        // Use controlled viewMode from parent
        viewMode={viewMode}
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Hero Section with Better Resource Overview - Only show if tabs are not hidden */}
      {!hideTabs && (
        <div className="bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-2xl p-8 shadow-2xl">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">📦 Resurser</h1>
              <p className="text-white/80 text-lg">{actualCommunityName}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <Users size={16} />
                  <span className="text-sm font-semibold">{stats.contributors} bidragare</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
                  <CheckCircle size={16} />
                  <span className="text-sm font-semibold">{stats.availableShared} tillgängliga</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Three-Tier Navigation - Only show if tabs are not hidden */}
      {!hideTabs && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('shared')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'shared'
                ? 'bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Share2 size={20} />
            <span>Delade från medlemmar</span>
            <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-xs font-bold">
              {stats.totalShared}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('owned')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'owned'
                ? 'bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Building2 size={20} />
            <span>Gemensamma resurser</span>
            <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-xs font-bold">
              {stats.totalOwned}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('help')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'help'
                ? 'bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <AlertCircle size={20} />
            <span>Hjälpförfrågningar</span>
            {stats.activeHelp > 0 && (
              <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold animate-pulse">
                {stats.activeHelp}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl p-4 shadow-md">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex-1 relative min-w-0">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sök..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
            />
          </div>

          {/* View Toggle - For shared and owned resources */}
          {(activeTab === 'shared' || activeTab === 'owned') && (
            <div className="flex bg-gray-100 rounded-lg p-1 flex-shrink-0">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center justify-center p-2 rounded-md font-medium transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Kortvy"
              >
                <Grid3x3 size={18} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center justify-center p-2 rounded-md font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Tabellvy"
              >
                <List size={18} />
              </button>
            </div>
          )}

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all flex-shrink-0 ${
              showFilters || categoryFilter !== 'all'
                ? 'bg-[#3D4A2B] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter size={20} />
            <span className="hidden sm:inline">Filter</span>
            {categoryFilter !== 'all' && (
              <span className="bg-white text-[#3D4A2B] px-2 py-0.5 rounded-full text-xs font-bold">
                1
              </span>
            )}
          </button>

          {/* Add Resource Button - Only for admins on owned tab */}
          {activeTab === 'owned' && isAdmin && (
            <button
              onClick={() => {
                setEditingCommunityResource(null);
                setShowAddCommunityResource(true);
              }}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-lg font-bold hover:shadow-lg transition-all flex-shrink-0"
            >
              <Plus size={20} />
              <span className="hidden md:inline">Lägg till</span>
            </button>
          )}
        </div>

        {/* Category Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-[#3D4A2B] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Alla kategorier
              </button>
              {(Object.keys(categoryConfig) as CategoryFilter[]).filter(k => k !== 'all').map(cat => {
                const config = categoryConfig[cat as keyof typeof categoryConfig];
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      categoryFilter === cat
                        ? 'bg-[#3D4A2B] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{config.emoji}</span>
                    <span>{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {/* Tier 1: Shared from Members - Enhanced Display */}
        {activeTab === 'shared' && (
          <div className="space-y-6">
            {/* Resource Summary Bar */}
            {filteredShared.length > 0 && (
              <div className="bg-gradient-to-r from-[#5C6B47]/10 to-[#707C5F]/10 rounded-xl p-4 border border-[#5C6B47]/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-semibold text-[#3D4A2B]">
                      {groupedSharedResources.length} olika resurstyper
                    </div>
                    <div className="text-sm text-gray-600">
                      Totalt {filteredShared.reduce((sum, r) => sum + r.shared_quantity, 0)} enheter
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">{stats.availableShared} tillgängliga</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-gray-600">{stats.totalShared - stats.availableShared} begärda</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {filteredShared.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-md border border-gray-100">
                <div className="w-20 h-20 bg-[#5C6B47]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Share2 size={40} className="text-[#5C6B47]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Inga delade resurser än</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Medlemmar kan dela överskottsresurser från sina personliga förråd. Bli den första att bidra!
                </p>
                <div className="bg-[#5C6B47]/5 border border-[#5C6B47]/20 rounded-lg p-4 max-w-sm mx-auto">
                  <div className="text-sm text-[#5C6B47] font-semibold mb-1">💡 Tips</div>
                  <div className="text-sm text-gray-600">
                    Gå till din resursinventering för att dela dina resurser med samhället
                  </div>
                </div>
              </div>
            ) : viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedSharedResources.map((resourceGroup, idx) => (
                  <EnhancedGroupedSharedResourceCard
                    key={resourceGroup[0].id}
                    resources={resourceGroup}
                    currentUserId={user.id}
                    onRequest={(resource) => handleRequestResource(resource)}
                    onCancelRequest={(resource) => handleCancelRequest(resource)}
                    onManage={(resource) => setManagingResource(resource)}
                  />
                ))}
              </div>
            ) : (
              <SharedResourcesTableView
                groupedResources={groupedSharedResources}
                currentUserId={user.id}
                onRequest={(resource) => handleRequestResource(resource)}
                onCancelRequest={(resource) => handleCancelRequest(resource)}
                onManage={(resource) => setManagingResource(resource)}
              />
            )}
          </div>
        )}

        {/* Tier 2: Community-Owned Resources */}
        {activeTab === 'owned' && renderOwnedResourcesView()}

        {/* Tier 3: Help Requests */}
        {activeTab === 'help' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Aktiva hjälpförfrågningar</h3>
                <p className="text-gray-600">Vi hjälper varandra!</p>
              </div>
              <button
                onClick={() => setShowAddHelpRequest(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                <Plus size={20} />
                <span>Be om hjälp</span>
              </button>
            </div>

            {filteredHelp.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-md">
                <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Inga aktiva förfrågningar</h3>
                <p className="text-gray-600">
                  Alla behöver hjälp ibland - tveka inte att be om stöd
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredHelp.map(request => (
                  <HelpRequestCard
                    key={request.id}
                    request={request}
                    currentUserId={user.id}
                    onRespond={() => handleRespondToHelp(request)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Shared Resource Actions Modal */}
      {managingResource && (
        <SharedResourceActionsModal
          isOpen={!!managingResource}
          onClose={() => setManagingResource(null)}
          resource={managingResource}
          onUpdate={(updates) => handleUpdateResource(managingResource.id, updates)}
          onDelete={() => handleDeleteResource(managingResource.id)}
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
    </div>
  );
}

// Shared Resources Table View Component
function SharedResourcesTableView({ groupedResources, currentUserId, onRequest, onCancelRequest, onManage }: { 
  groupedResources: SharedResource[][], 
  currentUserId: string, 
  onRequest: (resource: SharedResource) => void, 
  onCancelRequest: (resource: SharedResource) => void, 
  onManage: (resource: SharedResource) => void 
}) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (resourceName: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(resourceName)) {
      newExpanded.delete(resourceName);
    } else {
      newExpanded.add(resourceName);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Resurs</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Antal</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Delat av</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Plats</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Åtgärd</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {groupedResources.map((resourceGroup) => {
              const firstResource = resourceGroup[0];
              const category = categoryConfig[firstResource.resource_category as keyof typeof categoryConfig] || categoryConfig.other;
              const totalQuantity = resourceGroup.reduce((sum, r) => sum + r.shared_quantity, 0);
              const isExpanded = expandedRows.has(firstResource.resource_name || '');
              const hasMyResource = resourceGroup.some(r => r.user_id === currentUserId);

              return (
                <React.Fragment key={firstResource.id}>
                  {/* Main Row */}
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl flex-shrink-0">{category.emoji}</span>
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            {firstResource.resource_name}
                            {hasMyResource && (
                              <span className="text-xs text-[#556B2F] font-medium">(Du)</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{category.label}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">
                        {totalQuantity} {firstResource.resource_unit || 'st'}
                      </div>
                      {resourceGroup.length > 1 && (
                        <div className="text-xs text-gray-500">{resourceGroup.length} personer</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700 truncate max-w-[200px]">
                        {resourceGroup.map(r => r.sharer_name || 'Okänd').join(' • ')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600 truncate max-w-[150px]">
                        {resourceGroup.length === 1 
                          ? (firstResource.location || '—')
                          : `${resourceGroup.filter(r => r.location).length} platser`
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {resourceGroup.length === 1 ? (
                        resourceGroup[0].user_id === currentUserId ? (
                          <button
                            onClick={() => onManage(resourceGroup[0])}
                            className="px-3 py-1.5 bg-[#5C6B47] text-white rounded text-sm font-medium hover:bg-[#4A5239] transition-all relative"
                          >
                            Hantera
                            {(resourceGroup[0].pending_requests_count ?? 0) > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                                {resourceGroup[0].pending_requests_count}
                              </span>
                            )}
                          </button>
                        ) : resourceGroup[0].status === 'available' ? (
                          <button
                            onClick={() => onRequest(resourceGroup[0])}
                            className="px-3 py-1.5 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded text-sm font-medium hover:shadow-md transition-all"
                          >
                            Be om
                          </button>
                        ) : resourceGroup[0].status === 'taken' ? (
                          <span className="text-xs text-gray-500">Hämtad</span>
                        ) : resourceGroup[0].has_user_requested ? (
                          <span className="text-xs text-yellow-600 font-medium">Begärd</span>
                        ) : (
                          <span className="text-xs text-gray-500">Ej tillgänglig</span>
                        )
                      ) : (
                        <button
                          onClick={() => toggleRow(firstResource.resource_name || '')}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200 transition-all"
                        >
                          {isExpanded ? '▲ Dölj' : '▼ Visa alla'}
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Rows */}
                  {isExpanded && resourceGroup.length > 1 && resourceGroup.map((resource, idx) => {
                    const isOwner = resource.user_id === currentUserId;
                    const isAvailable = resource.status === 'available';

                    return (
                      <tr key={resource.id} className="bg-gray-50 hover:bg-gray-100 transition-colors">
                        <td className="px-4 py-2 pl-12">
                          <div className="text-sm text-gray-600">↳ {resource.sharer_name || 'Okänd'}</div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-sm text-gray-700">{resource.shared_quantity} {resource.resource_unit || 'st'}</div>
                        </td>
                        <td className="px-4 py-2">
                          {isOwner && <span className="text-xs text-[#556B2F] font-medium">Du</span>}
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-sm text-gray-600">{resource.location || '—'}</div>
                          {resource.notes && (
                            <div className="text-xs text-gray-500 italic mt-0.5">"{resource.notes}"</div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {isOwner ? (
                            <button
                              onClick={() => onManage(resource)}
                              className="px-3 py-1 bg-[#5C6B47] text-white rounded text-xs font-medium hover:bg-[#4A5239] transition-all relative"
                            >
                              Hantera
                              {(resource.pending_requests_count ?? 0) > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                                  {resource.pending_requests_count}
                                </span>
                              )}
                            </button>
                          ) : resource.has_user_requested ? (
                            <button
                              onClick={() => onCancelRequest(resource)}
                              className="text-xs text-yellow-600 font-medium hover:text-yellow-700 transition-colors"
                            >
                              Avbryt
                            </button>
                          ) : isAvailable ? (
                            <button
                              onClick={() => onRequest(resource)}
                              className="px-3 py-1 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded text-xs font-medium hover:shadow-md transition-all"
                            >
                              Be om
                            </button>
                          ) : (
                            <span className="text-xs text-gray-500">Ej tillgänglig</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile List View */}
      <div className="md:hidden divide-y divide-gray-100">
        {groupedResources.map((resourceGroup) => {
          const firstResource = resourceGroup[0];
          const category = categoryConfig[firstResource.resource_category as keyof typeof categoryConfig] || categoryConfig.other;
          const totalQuantity = resourceGroup.reduce((sum, r) => sum + r.shared_quantity, 0);
          const isExpanded = expandedRows.has(firstResource.resource_name || '');
          const hasMyResource = resourceGroup.some(r => r.user_id === currentUserId);

          return (
            <div key={firstResource.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xl flex-shrink-0">{category.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 truncate">
                      {firstResource.resource_name}
                      {hasMyResource && <span className="text-xs text-[#556B2F] ml-1">(Du)</span>}
                    </div>
                    <div className="text-xs text-gray-500">{category.label}</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="font-bold text-gray-900">{totalQuantity} {firstResource.resource_unit || 'st'}</div>
                  {resourceGroup.length > 1 && (
                    <div className="text-xs text-gray-500">{resourceGroup.length} pers</div>
                  )}
                </div>
              </div>
              
              <div className="text-xs text-gray-600 mb-2 truncate">
                {resourceGroup.map(r => r.sharer_name || 'Okänd').join(' • ')}
              </div>

              {resourceGroup.length === 1 ? (
                <div className="mt-3">
                  {resourceGroup[0].user_id === currentUserId ? (
                    <button
                      onClick={() => onManage(resourceGroup[0])}
                      className="w-full py-2 bg-[#5C6B47] text-white rounded text-sm font-medium"
                    >
                      Hantera
                    </button>
                  ) : resourceGroup[0].status === 'available' ? (
                    <button
                      onClick={() => onRequest(resourceGroup[0])}
                      className="w-full py-2 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded text-sm font-medium"
                    >
                      Be om
                    </button>
                  ) : (
                    <div className="text-center text-xs text-gray-500 py-2">Ej tillgänglig</div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => toggleRow(firstResource.resource_name || '')}
                  className="w-full mt-2 py-2 bg-gray-100 text-gray-700 rounded text-sm font-medium"
                >
                  {isExpanded ? '▲ Dölj' : `▼ Visa alla (${resourceGroup.length})`}
                </button>
              )}

              {isExpanded && resourceGroup.map((resource) => (
                <div key={resource.id} className="mt-3 ml-4 pl-4 border-l-2 border-gray-200">
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {resource.sharer_name || 'Okänd'} • {resource.shared_quantity} {resource.resource_unit || 'st'}
                  </div>
                  {resource.location && (
                    <div className="text-xs text-gray-600 mb-1">📍 {resource.location}</div>
                  )}
                  {resource.user_id === currentUserId ? (
                    <button
                      onClick={() => onManage(resource)}
                      className="w-full py-1.5 bg-[#5C6B47] text-white rounded text-xs font-medium mt-2"
                    >
                      Hantera
                    </button>
                  ) : resource.has_user_requested && resource.status !== 'taken' ? (
                    <button
                      onClick={() => onCancelRequest(resource)}
                      className="w-full py-1.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium mt-2 hover:bg-yellow-200 transition-colors"
                    >
                      Avbryt begäran
                    </button>
                  ) : resource.status === 'available' ? (
                    <button
                      onClick={() => onRequest(resource)}
                      className="w-full py-1.5 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded text-xs font-medium mt-2"
                    >
                      Be om
                    </button>
                  ) : resource.status === 'taken' ? (
                    <div className="text-center text-xs text-gray-500 py-1.5 mt-2">Hämtad</div>
                  ) : (
                    <div className="text-center text-xs text-gray-500 py-1.5 mt-2">Ej tillgänglig</div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Enhanced Grouped Shared Resource Card Component with Better Visual Hierarchy
function EnhancedGroupedSharedResourceCard({ resources, currentUserId, onRequest, onCancelRequest, onManage }: { resources: SharedResource[], currentUserId: string, onRequest: (resource: SharedResource) => void, onCancelRequest: (resource: SharedResource) => void, onManage: (resource: SharedResource) => void }) {
  const [expanded, setExpanded] = useState(false);
  const firstResource = resources[0];
  const category = categoryConfig[firstResource.resource_category as keyof typeof categoryConfig] || categoryConfig.other;
  const totalQuantity = resources.reduce((sum, r) => sum + r.shared_quantity, 0);
  const hasMyResource = resources.some(r => r.user_id === currentUserId);
  const availableCount = resources.filter(r => r.status === 'available').length;
  const requestedCount = resources.filter(r => r.status === 'requested').length;

  // If only one resource, show single card
  if (resources.length === 1) {
    return <SharedResourceCard resource={firstResource} currentUserId={currentUserId} onRequest={() => onRequest(firstResource)} onCancelRequest={onCancelRequest} onManage={() => onManage(firstResource)} />;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100 hover:border-[#5C6B47]/30 group">
      {/* Enhanced Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ backgroundColor: `${category.color}15` }}
          >
            <span className="text-2xl">{category.emoji}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-lg text-gray-900 truncate mb-1">{firstResource.resource_name}</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-1 bg-[#5C6B47]/10 text-[#5C6B47] rounded-lg text-xs font-semibold">
                {category.label}
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-600">{resources.length} delande</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {hasMyResource && (
            <span className="bg-[#556B2F]/10 text-[#556B2F] px-2 py-1 rounded-lg text-xs font-semibold">
              Du bidrar
            </span>
          )}
        </div>
      </div>

      {/* Enhanced Key Info */}
      <div className="mb-5">
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-2xl font-bold text-gray-900">
            {totalQuantity} {(firstResource.resource_unit || 'st').replace(/stycken/gi, 'st').replace(/styck/gi, 'st')}
          </span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">{availableCount} tillgängliga</span>
          </div>
        </div>
        <div className="text-sm text-gray-600 truncate">
          Delat av: {resources.map(r => r.user_id === currentUserId ? 'Min resurs' : (r.sharer_name || 'Okänd')).join(', ')}
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-2 mb-4">
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

      {/* Enhanced Expandable List */}
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="w-full py-3 bg-gradient-to-r from-[#5C6B47]/5 to-[#707C5F]/5 text-[#3D4A2B] rounded-xl text-sm font-semibold hover:from-[#5C6B47]/10 hover:to-[#707C5F]/10 transition-all border border-[#5C6B47]/20"
        >
          Visa alla bidrag →
        </button>
      ) : (
        <div className="space-y-3">
          <button
            onClick={() => setExpanded(false)}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-all"
          >
            ▲ Dölj detaljer
          </button>
          
          {resources.map((resource) => {
            const isOwner = resource.user_id === currentUserId;
            const isAvailable = resource.status === 'available';
            const statusColor = isAvailable ? 'green' : resource.has_user_requested ? 'yellow' : 'gray';
            
            return (
              <div key={resource.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                {/* Contributor info */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {resource.sharer_name || 'Okänd'}
                    </span>
                    {isOwner && (
                      <span className="text-xs text-[#556B2F] font-medium bg-[#556B2F]/10 px-2 py-1 rounded">
                        du
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {resource.shared_quantity} {resource.resource_unit || 'st'}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${
                      statusColor === 'green' ? 'bg-green-500' : 
                      statusColor === 'yellow' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                </div>
                
                {/* Optional details */}
                {(resource.location || resource.notes) && (
                  <div className="text-xs text-gray-600 mb-3 space-y-1">
                    {resource.location && (
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        {resource.location}
                      </div>
                    )}
                    {resource.notes && (
                      <div className="italic">"{resource.notes}"</div>
                    )}
                  </div>
                )}

                {/* Action button */}
                {isOwner ? (
                  <button
                    onClick={() => onManage(resource)}
                    className="w-full py-2.5 bg-[#5C6B47] text-white rounded-lg text-sm font-semibold hover:bg-[#4A5239] transition-all shadow-sm"
                  >
                    Hantera ditt bidrag
                  </button>
                ) : isAvailable ? (
                  <button
                    onClick={() => onRequest(resource)}
                    className="w-full py-2.5 bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white rounded-lg text-sm font-semibold hover:shadow-md transition-all"
                  >
                    Be om från {resource.sharer_name}
                  </button>
                ) : (
                  <div className="w-full py-2.5 bg-gray-100 text-gray-500 rounded-lg text-sm text-center font-medium">
                    Ej tillgänglig
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Single Shared Resource Card Component
interface SharedResourceCardProps {
  resource: SharedResource;
  currentUserId: string;
  onRequest: (resourceId: string) => void;
  onCancelRequest: (resource: SharedResource) => void;
  onManage: (resourceId: string) => void;
}

function SharedResourceCard({ resource, currentUserId, onRequest, onCancelRequest, onManage }: SharedResourceCardProps) {
  const category = categoryConfig[resource.resource_category as keyof typeof categoryConfig] || categoryConfig.other;
  const isOwner = resource.user_id === currentUserId;
  const isAvailable = resource.status === 'available';
  const isEmpty = resource.shared_quantity === 0;

  const handleCardClick = () => {
    if (isOwner) {
      onManage(resource.id);
    } else if (isAvailable) {
      onRequest(resource.id);
    }
  };

  return (
    <div 
      className={`relative bg-white rounded-xl p-6 shadow-md hover:shadow-2xl transition-all border-3 cursor-pointer ${
        isEmpty 
          ? 'border-[#8B4513] ring-2 ring-[#8B4513] ring-offset-2' 
          : 'border-transparent hover:border-[#3D4A2B]'
      }`}
    >
      {/* Clickable overlay */}
      <div
        onClick={handleCardClick}
        className="absolute inset-0 z-0 cursor-pointer rounded-xl"
        role="button"
        tabIndex={0}
        aria-label={`${resource.resource_name}: ${resource.shared_quantity} ${resource.resource_unit || 'st'}. ${isOwner ? 'Hantera' : 'Be om denna'}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
      />

      {/* Empty/Critical Badge */}
      {isEmpty && (
        <div className="absolute top-3 right-3 bg-[#8B4513] text-white p-2 rounded-full shadow-lg z-10">
          <AlertTriangle size={16} strokeWidth={2.5} />
        </div>
      )}

      {/* Pattern overlay for color-blind accessibility */}
      {isEmpty && (
        <div className="absolute inset-0 opacity-5 pointer-events-none rounded-xl" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #8B4513 0, #8B4513 2px, transparent 2px, transparent 10px)'
        }}></div>
      )}
      {/* Header - Compact */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <span className="text-2xl">{category.emoji}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-black text-lg text-gray-900 break-words">{resource.resource_name}</h3>
            <p className="text-xs text-gray-600 font-medium">{category.label}</p>
          </div>
        </div>
        {isOwner && (
          <span className="text-[#556B2F] text-xs font-bold flex-shrink-0 ml-2 bg-[#556B2F]/10 px-2 py-1 rounded">Du</span>
        )}
      </div>

      {/* Key Info - Clean layout */}
      <div className="mb-4 relative z-10">
        <div className="flex items-baseline gap-2 mb-2" data-testid="shared-resource-quantity">
          <span className="text-xl font-black text-gray-900">
            {resource.shared_quantity} {(resource.resource_unit || 'st').replace(/stycken/gi, 'st').replace(/styck/gi, 'st')}
          </span>
        </div>
        <div className="text-sm font-medium text-gray-700 mb-1">
          {resource.user_id === currentUserId ? 'Min resurs' : (resource.sharer_name || 'Okänd')}
        </div>
        {/* Optional details - only if present */}
        {(resource.location || resource.notes) && (
          <div className="text-xs text-gray-600 mt-2 space-y-0.5">
            {resource.location && <div>📍 {resource.location}</div>}
            {resource.notes && <div className="italic">"{resource.notes}"</div>}
          </div>
        )}
      </div>

      {/* Empty State Microcopy */}
      {isEmpty && (
        <div className="mb-4 p-3 bg-[#8B4513]/5 border border-[#8B4513]/20 rounded-lg relative z-10">
          <p className="text-sm text-[#8B4513] font-bold">
            {t('dashboard.add_to_improve_preparedness')}
          </p>
        </div>
      )}

      {/* Action button */}
      <div className="relative z-10">
        {isOwner ? (
          <button
            onClick={(e) => { e.stopPropagation(); onManage(resource.id); }}
            className="w-full py-3 bg-[#5C6B47] text-white rounded-lg text-sm font-bold hover:bg-[#4A5239] transition-all shadow-md hover:shadow-lg min-h-[48px] relative"
            aria-label="Hantera din delade resurs"
          >
            Hantera
            {(resource.pending_requests_count ?? 0) > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                {resource.pending_requests_count}
              </span>
            )}
          </button>
        ) : resource.has_user_requested && resource.status !== 'taken' ? (
          <button
            onClick={(e) => { e.stopPropagation(); onCancelRequest(resource); }}
            className="w-full py-3 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-bold hover:bg-yellow-200 transition-all min-h-[48px] flex items-center justify-center"
          >
            Avbryt begäran
          </button>
        ) : isAvailable ? (
          <button
            onClick={(e) => { e.stopPropagation(); onRequest(resource.id); }}
            className="w-full py-3 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-lg text-sm font-bold hover:shadow-xl transition-all shadow-md min-h-[48px]"
            aria-label="Be om denna resurs"
          >
            Be om denna
          </button>
        ) : (
          <div className="w-full py-3 bg-gray-100 text-gray-500 rounded-lg text-xs text-center font-semibold min-h-[48px] flex items-center justify-center">
            Ej tillgänglig
          </div>
        )}
      </div>
    </div>
  );
}

// Help Request Card Component
interface HelpRequestCardProps {
  request: HelpRequest;
  currentUserId: string;
  onRespond: (requestId: string) => void;
}

function HelpRequestCard({ request, currentUserId, onRespond }: HelpRequestCardProps) {
  const isOwner = request.user_id === currentUserId;
  const urgencyColors: Record<string, string> = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
    critical: 'bg-red-200 text-red-800'
  };
  const urgencyLabels: Record<string, string> = { 
    low: 'Låg', 
    medium: 'Medel', 
    high: 'Hög',
    critical: 'Kritisk'
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-[#3D4A2B]">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-lg text-gray-900">{request.title}</h3>
            {isOwner && (
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
                Din förfrågan
              </span>
            )}
          </div>
          <p className="text-gray-700 mb-3">{request.description}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${urgencyColors[request.urgency]}`}>
          {urgencyLabels[request.urgency]}
        </span>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
        {request.category && (
          <div className="flex items-center gap-2">
            <Package size={16} className="text-gray-400" />
            <span>{categoryConfig[request.category as keyof typeof categoryConfig]?.label || request.category}</span>
          </div>
        )}
        {request.location && (
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-gray-400" />
            <span>{request.location}</span>
          </div>
        )}
        {request.created_at && (
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <span>{new Date(request.created_at).toLocaleDateString('sv-SE')}</span>
          </div>
        )}
      </div>

      {!isOwner && (request.status === 'open' || request.status === 'in_progress') && (
        <button
          onClick={() => onRespond(request.id)}
          className="w-full py-3 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Heart size={18} />
          <span>Jag kan hjälpa till</span>
        </button>
      )}
    </div>
  );
}

// Community Resource Card Component
interface CommunityResourceCardProps {
  resource: CommunityResource;
  currentUserId: string;
  isAdmin: boolean;
  onEdit: (resourceId: string) => void;
  onDelete: (resourceId: string) => void;
  onBook: (resourceId: string) => void;
}

function CommunityResourceCard({ resource, currentUserId, isAdmin, onEdit, onDelete, onBook }: CommunityResourceCardProps) {
  const category = categoryConfig[resource.category as keyof typeof categoryConfig] || categoryConfig.other;
  const isAvailable = resource.status === 'available';
  const needsBooking = resource.booking_required;
  const isEmpty = resource.quantity === 0;

  const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    available: { label: 'Tillgänglig', color: 'text-green-700', bgColor: 'bg-green-100' },
    in_use: { label: 'I bruk', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    maintenance: { label: 'Underhåll', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    broken: { label: 'Trasig', color: 'text-red-700', bgColor: 'bg-red-100' }
  };

  const typeConfig: Record<string, { label: string; emoji: string }> = {
    equipment: { label: 'Utrustning', emoji: '🔧' },
    facility: { label: 'Facilitet', emoji: '🏛️' },
    skill: { label: 'Kompetens', emoji: '📚' },
    information: { label: 'Information', emoji: 'ℹ️' }
  };

  const currentStatus = statusConfig[resource.status] || statusConfig.available;
  const resourceType = typeConfig[resource.resource_type] || typeConfig.equipment;

  const handleCardClick = () => {
    if (isAdmin) {
      onEdit(resource.id);
    }
  };

  return (
    <div 
      className={`relative bg-white rounded-xl p-6 shadow-md hover:shadow-2xl transition-all border-3 ${isAdmin ? 'cursor-pointer' : ''} ${
        isEmpty 
          ? 'border-[#8B4513] ring-2 ring-[#8B4513] ring-offset-2' 
          : 'border-transparent hover:border-[#3D4A2B]'
      }`}
    >
      {/* Clickable overlay for admins */}
      {isAdmin && (
        <div
          onClick={handleCardClick}
          className="absolute inset-0 z-0 cursor-pointer rounded-xl"
          role="button"
          tabIndex={0}
          aria-label={`${resource.resource_name}: ${resource.quantity} ${resource.unit}. Redigera`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCardClick();
            }
          }}
        />
      )}

      {/* Empty/Critical Badge */}
      {isEmpty && (
        <div className="absolute top-3 right-3 bg-[#8B4513] text-white p-2 rounded-full shadow-lg z-10">
          <AlertTriangle size={16} strokeWidth={2.5} />
        </div>
      )}

      {/* Pattern overlay for color-blind accessibility */}
      {isEmpty && (
        <div className="absolute inset-0 opacity-5 pointer-events-none rounded-xl" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #8B4513 0, #8B4513 2px, transparent 2px, transparent 10px)'
        }}></div>
      )}
      {/* Header */}
      <div className="flex items-start justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3 flex-1">
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <span className="text-3xl">{category.emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-lg text-gray-900 break-words">{resource.resource_name}</h3>
            <div className="flex items-center gap-2 text-sm">
              <span>{resourceType.emoji}</span>
              <span className="text-gray-600 font-medium">{resourceType.label}</span>
            </div>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${currentStatus.bgColor} ${currentStatus.color} whitespace-nowrap shadow-sm`}>
          {currentStatus.label}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4 relative z-10">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Package size={16} className="text-gray-400" />
          <span className="font-bold">{resource.quantity} {resource.unit?.replace(/stycken/gi, 'st').replace(/styck/gi, 'st') || ''}</span>
        </div>
        {resource.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={16} className="text-gray-400" />
            <span>{resource.location}</span>
          </div>
        )}
        {resource.responsible_user_name && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <UserIcon size={16} className="text-gray-400" />
            <span>Ansvarig: {resource.responsible_user_name}</span>
          </div>
        )}
        {needsBooking && (
          <div className="flex items-center gap-2 text-sm text-[#B8860B]">
            <Calendar size={16} />
            <span className="font-semibold">Kräver bokning</span>
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      {resource.usage_instructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-900">
            <strong>Instruktioner:</strong> {resource.usage_instructions}
          </p>
        </div>
      )}

      {/* Notes */}
      {resource.notes && (
        <p className="text-sm text-gray-600 mb-4 italic relative z-10">"{resource.notes}"</p>
      )}

      {/* Empty State Microcopy */}
      {isEmpty && (
        <div className="mb-4 p-3 bg-[#8B4513]/5 border border-[#8B4513]/20 rounded-lg relative z-10">
          <p className="text-sm text-[#8B4513] font-bold">
            Resursen är slut. Kontakta ansvarig eller lägg till fler.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 relative z-10">
        {isAvailable && needsBooking && (
          <button
            onClick={(e) => { e.stopPropagation(); onBook(resource.id); }}
            className="w-full py-3 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-lg font-bold hover:shadow-xl transition-all shadow-md flex items-center justify-center gap-2 min-h-[48px]"
            aria-label="Boka resurs"
          >
            <Calendar size={18} />
            <span>Boka resurs</span>
          </button>
        )}
        
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(resource.id); }}
              className="flex-1 py-3 bg-[#5C6B47] text-white rounded-lg font-bold hover:bg-[#4A5239] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 min-h-[48px]"
              aria-label="Redigera resurs"
            >
              <Edit2 size={18} />
              <span>Redigera</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(resource.id); }}
              className="px-4 py-3 bg-[#8B4513]/10 text-[#8B4513] rounded-lg font-bold hover:bg-[#8B4513]/20 transition-all shadow-md hover:shadow-lg min-h-[48px] min-w-[48px]"
              aria-label="Ta bort resurs"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

