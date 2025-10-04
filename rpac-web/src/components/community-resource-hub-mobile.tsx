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
import { CommunityResourceModal } from './community-resource-modal';
import type { User } from '@supabase/supabase-js';

interface CommunityResourceHubMobileProps {
  user: User;
  communityId: string;
  communityName: string;
  isAdmin?: boolean;
  onSendMessage?: (content: string) => void;
}

type ViewTier = 'shared' | 'owned' | 'help';
type CategoryFilter = 'all' | 'food' | 'water' | 'medicine' | 'energy' | 'tools' | 'other';

const categoryConfig = {
  food: { icon: Package, emoji: '🍞', label: 'Mat', color: '#FFC000' },
  water: { icon: Droplets, emoji: '💧', label: 'Vatten', color: '#4A90E2' },
  medicine: { icon: Heart, emoji: '💊', label: 'Medicin', color: '#8B4513' },
  energy: { icon: Zap, emoji: '⚡', label: 'Energi', color: '#B8860B' },
  tools: { icon: Wrench, emoji: '🔧', label: 'Verktyg', color: '#4A5239' },
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
  onSendMessage
}: CommunityResourceHubMobileProps) {
  const [activeTab, setActiveTab] = useState<ViewTier>('shared');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  // Data states
  const [sharedResources, setSharedResources] = useState<SharedResource[]>([]);
  const [communityResources, setCommunityResources] = useState<CommunityResource[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showResourceDetail, setShowResourceDetail] = useState<SharedResource | CommunityResource | HelpRequest | null>(null);
  const [showAddCommunityResource, setShowAddCommunityResource] = useState(false);
  const [showAddHelpRequest, setShowAddHelpRequest] = useState(false);
  const [editingCommunityResource, setEditingCommunityResource] = useState<CommunityResource | null>(null);

  useEffect(() => {
    if (communityId) {
      loadAllData();
    }
  }, [communityId]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [shared, owned, help] = await Promise.all([
        resourceSharingService.getCommunityResources(communityId),
        communityResourceService.getCommunityResources(communityId),
        resourceSharingService.getCommunityHelpRequests(communityId)
      ]);

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

  // Filter resources
  const filterResources = (resources: any[]) => {
    let filtered = resources;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(r => r.category === categoryFilter || r.resource_category === categoryFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.resource_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  const filteredShared = filterResources(sharedResources);
  const groupedSharedResources = groupSharedResources(filteredShared);
  const filteredOwned = filterResources(communityResources);
  const filteredHelp = filterResources(helpRequests);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5C6B47]/10 via-white to-[#707C5F]/10 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] text-white px-4 pt-6 pb-8 shadow-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Samhällsresurser</h1>
          <p className="text-[#C8D5B9] text-sm flex items-center gap-1">
            <Building2 size={14} />
            {communityName}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
            <div className="text-2xl font-bold">{stats.availableShared}</div>
            <div className="text-xs text-[#C8D5B9] mt-1">Delade resurser</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
            <div className="text-2xl font-bold">{stats.totalOwned}</div>
            <div className="text-xs text-[#C8D5B9] mt-1">Samhällets</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
            <div className="text-2xl font-bold">{stats.activeHelp}</div>
            <div className="text-xs text-[#C8D5B9] mt-1">Aktiva önskemål</div>
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

// Shared Resources View Component
function SharedResourcesView({
  groupedResources,
  onResourceClick
}: {
  groupedResources: SharedResource[][];
  onResourceClick: (resource: SharedResource) => void;
}) {
  if (groupedResources.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-[#5C6B47]/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
          <Share2 className="text-[#5C6B47]" size={40} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Inga delade resurser</h3>
        <p className="text-gray-600 text-sm max-w-sm mx-auto">
          Bli den första att dela en resurs med samhället!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groupedResources.map((group, idx) => {
        const firstResource = group[0];
        const totalQuantity = group.reduce((sum, r) => sum + r.shared_quantity, 0);
        const category = categoryConfig[firstResource.resource_category as keyof typeof categoryConfig] || categoryConfig.other;
        const contributors = new Set(group.map(r => r.sharer_name || 'Okänd')).size;

        return (
          <button
            key={idx}
            onClick={() => onResourceClick(firstResource)}
            className="w-full bg-white rounded-2xl p-4 shadow-md border border-[#5C6B47]/20 hover:shadow-lg transition-all touch-manipulation active:scale-98"
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl flex-shrink-0">{category.emoji}</div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-gray-900 mb-1">{firstResource.resource_name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <span className="font-semibold text-[#3D4A2B]">
                    {totalQuantity} {firstResource.resource_unit || 'st'}
                  </span>
                  <span>•</span>
                  <span>{contributors} delande</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-[#556B2F]/10 text-[#556B2F] rounded-lg text-xs font-semibold">
                    {category.label}
                  </span>
                  {firstResource.status === 'available' && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                      Tillgänglig
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown className="text-gray-400 transform -rotate-90" size={20} />
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
    <div className="space-y-3">
      {resources.map((resource) => {
        const typeConfig = resourceTypeConfig[resource.resource_type as keyof typeof resourceTypeConfig] || resourceTypeConfig.other;
        const category = categoryConfig[resource.category as keyof typeof categoryConfig] || categoryConfig.other;

        return (
          <button
            key={resource.id}
            onClick={() => onResourceClick(resource)}
            className="w-full bg-white rounded-2xl p-4 shadow-md border border-[#5C6B47]/20 hover:shadow-lg transition-all touch-manipulation active:scale-98"
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl flex-shrink-0">{typeConfig.emoji}</div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-gray-900 mb-1">{resource.resource_name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <span className="font-semibold text-[#3D4A2B]">
                    {resource.quantity} {resource.unit || 'st'}
                  </span>
                  {resource.location && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {resource.location}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-[#556B2F]/10 text-[#556B2F] rounded-lg text-xs font-semibold">
                    {typeConfig.label}
                  </span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${resource.status === 'available' ? 'bg-green-100 text-green-700' :
                      resource.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                    }`}>
                    {resource.status === 'available' ? 'Tillgänglig' :
                      resource.status === 'maintenance' ? 'Underhåll' :
                        resource.status === 'in_use' ? 'Används' : 'Ej tillgänglig'}
                  </span>
                  {resource.booking_required && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                      Bokning krävs
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown className="text-gray-400 transform -rotate-90" size={20} />
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
  userId
}: {
  resource: SharedResource | CommunityResource | HelpRequest;
  isAdmin: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onEdit?: (resource: CommunityResource) => void;
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
            <p className="text-gray-500">Delad av {res.sharer_name || 'Okänd'}</p>
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
              {res.status === 'available' ? 'Tillgänglig' :
                res.status === 'requested' ? 'Begärd' :
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
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up"
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

        <div className="p-6">
          {isShared && renderSharedDetails(resource as SharedResource)}
          {isOwned && renderOwnedDetails(resource as CommunityResource)}
          {isHelp && renderHelpDetails(resource as HelpRequest)}

          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all touch-manipulation active:scale-95"
            >
              Stäng
            </button>
            {isAdmin && isOwned && onEdit && (
              <button
                onClick={() => onEdit(resource as CommunityResource)}
                className="flex-1 py-3 px-4 bg-[#3D4A2B] text-white rounded-xl font-semibold hover:bg-[#2A331E] transition-all touch-manipulation active:scale-95"
              >
                <Edit2 size={18} className="inline mr-2" />
                Redigera
              </button>
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

