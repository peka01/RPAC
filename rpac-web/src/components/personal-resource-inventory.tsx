'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, TrendingUp, Package, AlertTriangle, Clock, Shield, Pencil, Trash, Share2, Users, HelpCircle, ChevronDown, ChevronUp, ChevronRight, Search, X, Eye, EyeOff, CheckCircle2, XCircle, Timer, Check, MapPin } from 'lucide-react';
import { t } from '@/lib/locales';
import { resourceService, Resource } from '@/lib/supabase';
import { resourceSharingService, SharedResource } from '@/lib/resource-sharing-service';
import { ResourceListView, Column, CategoryFilter, useListViewState } from './resource-list-view';
import { ResourceCardWithActions, ResourceTableRow } from './resource-card-with-actions';
import { ResourceMiniCard } from './resource-mini-card';
import { SimpleAddResourceModal, msbRecommendations } from './simple-add-resource-modal';
import { EditResourceModal } from './edit-resource-modal';
import { ResourceShareToCommunityModal } from './resource-share-to-community-modal';
import { SharedResourceActionsModal } from './shared-resource-actions-modal';
import { BulkMsbModal } from './bulk-msb-modal';

const categoryConfig = {
  food: { emoji: '🍞', label: 'Mat' },
  water: { emoji: '💧', label: 'Vatten' },
  medicine: { emoji: '💊', label: 'Medicin' },
  energy: { emoji: '⚡', label: 'Energi' },
  tools: { emoji: '🔧', label: 'Verktyg' },
  machinery: { emoji: '🚜', label: 'Maskiner' },
  other: { emoji: '✨', label: 'Övrigt' }
};

type CategoryKey = keyof typeof categoryConfig;

interface PersonalResourceInventoryProps {
  userId: string;
}

export function PersonalResourceInventory({ userId }: PersonalResourceInventoryProps) {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [sharedResources, setSharedResources] = useState<SharedResource[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkMsbModal, setShowBulkMsbModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSharedResourceModal, setShowSharedResourceModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedSharedResource, setSelectedSharedResource] = useState<SharedResource | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<CategoryKey>>(
    new Set(Object.keys(categoryConfig) as CategoryKey[])
  );
  const [showSharedResources, setShowSharedResources] = useState(true);

  const {
    searchQuery: _unused1,
    setSearchQuery: _unused2,
    activeCategory,
    setActiveCategory,
    viewMode,
    setViewMode
  } = useListViewState(resources);

  useEffect(() => {
    loadResources();
  }, [userId]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const [resourcesData, sharedData, requestsData] = await Promise.all([
        resourceService.getResources(userId),
        resourceSharingService.getUserSharedResources(userId),
        resourceSharingService.getUserResourceRequests(userId)
      ]);
      setResources(resourcesData);
      setSharedResources(sharedData);
      setMyRequests(requestsData);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSharedResource = async (updates: Partial<SharedResource>) => {
    if (!selectedSharedResource) return;
    
    try {
      await resourceSharingService.updateSharedResourceSimple(selectedSharedResource.id, updates);
      await loadResources(); // Reload to get updated data
      setShowSharedResourceModal(false);
    } catch (error) {
      console.error('Error updating shared resource:', error);
    }
  };

  const handleDeleteSharedResource = async () => {
    if (!selectedSharedResource) return;
    
    try {
      await resourceSharingService.deleteSharedResource(selectedSharedResource.id);
      await loadResources(); // Reload to get updated data
      setShowSharedResourceModal(false);
    } catch (error) {
      console.error('Error deleting shared resource:', error);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Är du säker på att du vill avbryta denna begäran?')) return;
    
    try {
      await resourceSharingService.denyResourceRequest(requestId, 'Begäran avbruten av användaren');
      await loadResources(); // Reload to get updated data
    } catch (error) {
      console.error('Error canceling request:', error);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = resources.length;
    const withQuantity = resources.filter(r => r.quantity > 0).length;
    const empty = total - withQuantity;
    const expiringSoon = resources.filter(r => 
      r.quantity > 0 && r.days_remaining < 30 && r.days_remaining < 99999
    ).length;
    const msbCount = resources.filter(r => r.is_msb_recommended).length;
    
    // Calculate MSB fulfillment based on categories covered
    const msbCategories = ['food', 'water', 'medicine', 'energy', 'tools', 'other'];
    const msbResourcesAdded = resources.filter(r => r.is_msb_recommended && r.quantity > 0);
    const msbCategoriesWithResources = new Set(msbResourcesAdded.map(r => r.category));
    const msbFulfillmentPercent = Math.round((msbCategoriesWithResources.size / msbCategories.length) * 100);
    
    // MSB fulfillment calculated successfully
    
    // Calculate shared resources statistics
    const sharedCount = sharedResources.length;
    const availableShared = sharedResources.filter(r => r.status === 'available').length;
    const requestedShared = sharedResources.filter(r => r.status === 'requested').length;
    const takenShared = sharedResources.filter(r => r.status === 'taken').length;
    
    return { 
      total, 
      filled: withQuantity, 
      empty, 
      expiringSoon, 
      msbCount, 
      msbFulfillmentPercent, 
      sharedCount,
      availableShared,
      requestedShared,
      takenShared
    };
  }, [resources, sharedResources]);

  // Get color for MSB fulfillment
  const getMsbColor = (percent: number) => {
    if (percent >= 80) return { bg: '#556B2F', text: '#ffffff' }; // Green
    if (percent >= 50) return { bg: '#B8860B', text: '#ffffff' }; // Yellow
    return { bg: '#8B4513', text: '#ffffff' }; // Red
  };

  // Get color for category health
  const getCategoryStatusColor = (fillRate: number) => {
    if (fillRate >= 70) return '#556B2F'; // Green
    if (fillRate >= 30) return '#B8860B'; // Yellow
    return '#8B4513'; // Red
  };

  // Category statistics
  const categoryStats = useMemo(() => {
    return (Object.keys(categoryConfig) as CategoryKey[]).map(catKey => {
      const categoryResources = resources.filter(r => r.category === catKey);
      const categoryWithQuantity = categoryResources.filter(r => r.quantity > 0).length;
      const fillRate = categoryResources.length > 0 
        ? Math.round((categoryWithQuantity / categoryResources.length) * 100)
        : 0;
      
      return {
        key: catKey,
        config: categoryConfig[catKey],
        total: categoryResources.length,
        filled: categoryWithQuantity,
        fillRate
      };
    });
  }, [resources]);

  // Filter resources
  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || resource.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [resources, searchQuery, activeCategory]);

  // Create a map of shared resources for quick lookup
  const sharedResourcesMap = useMemo(() => {
    const map = new Map();
    sharedResources.forEach(shared => {
      map.set(shared.resource_id, shared);
    });
    return map;
  }, [sharedResources]);

  // Category filters for ResourceListView
  const categories: CategoryFilter[] = (Object.keys(categoryConfig) as CategoryKey[]).map(key => ({
    id: key,
    label: categoryConfig[key].label,
    emoji: categoryConfig[key].emoji
  }));

  // Table columns for ResourceListView (Category column removed, grouping by category instead)
  const columns: Column<Resource>[] = [
    {
      key: 'name',
      label: 'Resurs',
      sortable: true,
      render: (resource) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900">{resource.name}</span>
          {resource.is_msb_recommended && (
            <div className="bg-[#556B2F]/10 text-[#556B2F] px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
              <TrendingUp size={10} />
              MSB
            </div>
          )}
        </div>
      )
    },
    {
      key: 'quantity',
      label: 'Antal',
      width: '120px',
      align: 'center',
      sortable: true,
      render: (resource) => {
        // Abbreviate common units for table view
        const abbreviatedUnit = resource.unit
          .replace(/förpackning/gi, 'fp')
          .replace(/förpackningar/gi, 'fp');
        return (
          <span className="font-semibold text-gray-900">
            {resource.quantity} {abbreviatedUnit}
          </span>
        );
      }
    },
    {
      key: 'days_remaining',
      label: 'Hållbarhet',
      width: '120px',
      align: 'center',
      sortable: true,
      render: (resource) => (
        <span className="font-semibold text-gray-900">
          {resource.days_remaining >= 99999 ? '∞' : `${resource.days_remaining}d`}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Åtgärder',
      width: '160px',
      align: 'right',
      render: (resource) => (
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => handleEdit(resource)}
            className="p-2 text-[#3D4A2B] hover:bg-[#3D4A2B]/10 rounded-lg transition-colors"
            title="Redigera"
          >
            <Pencil size={18} />
          </button>
          
          <button
            onClick={() => handleShare(resource)}
            className="p-2 text-[#556B2F] hover:bg-[#556B2F]/10 rounded-lg transition-colors"
            title="Dela till samhälle"
          >
            <Share2 size={18} />
          </button>
          
          <button
            onClick={() => {
              if (window.confirm(`Är du säker på att du vill ta bort ${resource.name}?`)) {
                handleDelete(resource);
              }
            }}
            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
            title="Ta bort"
          >
            <Trash size={18} />
          </button>
        </div>
      )
    }
  ];

  const handleEdit = (resource: Resource) => {
    setSelectedResource(resource);
    setShowEditModal(true);
  };

  const handleDelete = async (resource: Resource) => {
    try {
      await resourceService.deleteResource(resource.id);
      await loadResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Kunde inte ta bort resursen');
    }
  };

  const handleShare = (resource: Resource) => {
    setSelectedResource(resource);
    setShowShareModal(true);
  };

  return (
    <div className="space-y-8">
      {/* Stats Dashboard with Enhanced Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#3D4A2B]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Package size={28} className="text-[#3D4A2B]" />
            </div>
            <div className="flex-1">
              <div className="text-4xl font-black text-gray-900 mb-1">{stats.total}</div>
              <div className="text-sm font-semibold text-gray-700">Totalt resurser</div>
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl p-6 shadow-lg border-3 hover:shadow-xl transition-all relative group/tooltip"
          style={{ borderColor: getMsbColor(stats.msbFulfillmentPercent).bg }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 relative"
              style={{ backgroundColor: `${getMsbColor(stats.msbFulfillmentPercent).bg}20` }}
            >
              <Shield size={28} style={{ color: getMsbColor(stats.msbFulfillmentPercent).bg }} />
              <HelpCircle 
                size={16} 
                className="absolute -top-1 -right-1 text-gray-500"
              />
            </div>
            <div className="flex-1">
              <div 
                className="text-4xl font-black mb-1"
                style={{ 
                  color: getMsbColor(stats.msbFulfillmentPercent).bg,
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {stats.msbFulfillmentPercent}%
              </div>
              <div className="text-sm font-semibold text-gray-700">MSB uppfyllnad</div>
            </div>
          </div>
          
          {/* Tooltip */}
          <div className="absolute left-0 bottom-full mb-2 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-10">
            {t('dashboard.msb_tooltip')}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-[#3D4A2B]/20 hover:shadow-xl transition-all">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#3D4A2B]/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Share2 size={28} className="text-[#3D4A2B]" />
            </div>
            <div className="flex-1">
              <div className="text-4xl font-black text-gray-900 mb-1">{stats.sharedCount}</div>
              <div className="text-sm font-semibold text-gray-700">Delade resurser</div>
              {stats.sharedCount > 0 && (
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{stats.availableShared} tillgängliga</span>
                  </div>
                  {stats.requestedShared > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>{stats.requestedShared} begärda</span>
                    </div>
                  )}
                  {stats.takenShared > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>{stats.takenShared} hämtade</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shared Resources Section */}
      {stats.sharedCount > 0 && (
        <div className="bg-gradient-to-r from-[#5C6B47]/10 to-[#707C5F]/10 rounded-xl p-6 border border-[#5C6B47]/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#5C6B47]/20 rounded-lg flex items-center justify-center">
                <Share2 size={20} className="text-[#5C6B47]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('resources.shared_resources_title')}</h3>
                <p className="text-sm text-gray-600">{t('resources.shared_resources_description')}</p>
              </div>
            </div>
            <button
              onClick={() => setShowSharedResources(!showSharedResources)}
              className="flex items-center gap-2 px-3 py-2 bg-white/50 hover:bg-white/70 rounded-lg transition-all"
            >
              {showSharedResources ? <EyeOff size={16} /> : <Eye size={16} />}
              <span className="text-sm font-medium">
                {showSharedResources ? t('resources.hide') : t('resources.show')}
              </span>
            </button>
          </div>

          {showSharedResources && (
            <div className="space-y-4">
              {sharedResources.map((sharedResource) => {
                const statusColor = sharedResource.status === 'available' ? 'green' : 
                                  sharedResource.status === 'requested' ? 'yellow' : 'blue';
                const statusLabel = sharedResource.status === 'available' ? 'Tillgänglig' :
                                  sharedResource.status === 'requested' ? 'Begärd' : 'Hämtad';
                const statusIcon = sharedResource.status === 'available' ? '✓' :
                                  sharedResource.status === 'requested' ? '◷' : '✔';
                
                return (
                  <div key={sharedResource.id} className="bg-white rounded-2xl p-5 border-2 border-gray-100 shadow-md hover:shadow-lg hover:border-[#5C6B47]/30 transition-all duration-200">
                    {/* Header with Icon and Title */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#5C6B47]/10 to-[#707C5F]/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-3xl">
                          {categoryConfig[sharedResource.resource_category as keyof typeof categoryConfig]?.emoji || '📦'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-lg mb-1 truncate">{sharedResource.resource_name}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Package size={14} className="flex-shrink-0" />
                          <span className="font-semibold text-[#3D4A2B] truncate">
                            {sharedResource.shared_quantity} {sharedResource.resource_unit || 'st'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    {sharedResource.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 pl-1">
                        <MapPin size={14} className="flex-shrink-0 text-gray-400" />
                        <span className="truncate">{sharedResource.location}</span>
                      </div>
                    )}

                    {/* Notes */}
                    {sharedResource.notes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700 italic">"{sharedResource.notes}"</p>
                      </div>
                    )}

                    {/* Community Link */}
                    {sharedResource.community_id && (
                      <div className="mb-4 p-3 bg-[#5C6B47]/5 rounded-lg border border-[#5C6B47]/20">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 flex-1 min-w-0">
                            <Users size={14} className="flex-shrink-0 text-[#5C6B47]" />
                            <span className="truncate">Delad i {sharedResource.community_name || 'samhälle'}</span>
                          </div>
                          <button
                            onClick={() => {
                              // Navigate to community resource hub with shared tab
                              router.push(`/local?community=${sharedResource.community_id}&tab=shared`);
                            }}
                            className="flex items-center gap-1 text-xs text-[#5C6B47] hover:text-[#2A331E] font-semibold px-3 py-1.5 bg-white hover:bg-[#5C6B47]/10 rounded-lg border border-[#5C6B47]/20 hover:border-[#5C6B47]/40 transition-all flex-shrink-0"
                            title="Gå till samhällets resursvy för att se hur denna resurs visas för andra"
                          >
                            <span className="whitespace-nowrap">Visa i samhälle</span>
                            <ChevronRight size={12} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Status and Action Button */}
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-2 rounded-lg text-xs font-semibold border flex-shrink-0 ${
                        statusColor === 'green' 
                          ? 'bg-green-50 text-green-700 border-green-200' :
                        statusColor === 'yellow' 
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {statusIcon} {statusLabel}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedSharedResource(sharedResource);
                          setShowSharedResourceModal(true);
                        }}
                        className="py-2.5 px-6 bg-gradient-to-r from-[#5C6B47] to-[#4A5239] hover:from-[#4A5239] hover:to-[#3D4A2B] text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 relative min-h-[44px] flex items-center justify-center"
                      >
                        <span>Hantera</span>
                        {(sharedResource.pending_requests_count ?? 0) > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                            {sharedResource.pending_requests_count}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* My Requests Section */}
      {myRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#5C6B47]/10 rounded-lg flex items-center justify-center">
                <Users size={20} className="text-[#3D4A2B]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{t('resources.my_requests')}</h3>
                <p className="text-sm text-gray-600">{t('resources.my_requests_description')}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {myRequests.map((request) => {
              const statusColor = request.status === 'pending' ? 'yellow' : 
                                request.status === 'approved' ? 'green' : 
                                request.status === 'denied' ? 'red' : 
                                request.status === 'completed' ? 'olive' : 'gray';
              const statusLabel = request.status === 'pending' ? 'Väntande' :
                                request.status === 'approved' ? 'Godkänd' :
                                request.status === 'denied' ? 'Nekad' :
                                request.status === 'completed' ? 'Slutförd' : 'Avbruten';
              const statusIcon = request.status === 'pending' ? <Timer size={14} /> :
                                request.status === 'approved' ? <CheckCircle2 size={14} /> :
                                request.status === 'denied' ? <XCircle size={14} /> :
                                request.status === 'completed' ? <Check size={14} /> : <Clock size={14} />;
              
              return (
                <div key={request.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {categoryConfig[request.resource_category as keyof typeof categoryConfig]?.emoji || '📦'}
                      </span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{request.resource_name}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span>{request.requested_quantity} {request.resource_unit || 'st'}</span>
                          <span>•</span>
                          <span>Från {request.sharer_name || 'Okänd'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                        statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                        statusColor === 'green' ? 'bg-green-100 text-green-700' :
                        statusColor === 'red' ? 'bg-red-100 text-red-700' :
                        statusColor === 'olive' ? 'bg-[#5C6B47]/10 text-[#3D4A2B]' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {statusIcon}
                        {statusLabel}
                      </span>
                      {request.status === 'approved' && (
                        <button
                          onClick={async () => {
                            try {
                              await resourceSharingService.completeResourceRequest(request.id);
                              await loadResources(); // Reload to update the list
                            } catch (error) {
                              console.error('Error completing request:', error);
                            }
                          }}
                          className="px-3 py-1.5 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-lg text-xs font-medium hover:shadow-md transition-all flex items-center gap-1.5"
                        >
                          <Check size={14} />
                          Markera som slutförd
                        </button>
                      )}
                      {request.status === 'pending' && (
                        <button
                          onClick={() => handleCancelRequest(request.id)}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium hover:shadow-md transition-all flex items-center gap-1.5"
                        >
                          <XCircle size={14} />
                          Avbryt begäran
                        </button>
                      )}
                    </div>
                  </div>
                  {request.message && (
                    <div className="mt-2 text-sm text-gray-600 italic">
                      "{request.message}"
                    </div>
                  )}
                  {request.response_message && (
                    <div className="mt-2 text-sm text-gray-600 bg-gray-100 p-2 rounded">
                      <strong>Svar från ägare:</strong> {request.response_message}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sök resurser..."
            className="w-full pl-10 pr-10 py-3 border-2 border-gray-200 rounded-lg focus:border-[#3D4A2B] focus:ring-0 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="text-sm text-gray-600">
            {filteredResources.length} {filteredResources.length === 1 ? 'resurs' : 'resurser'}
            {searchQuery && ` som matchar "${searchQuery}"`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white font-bold text-sm rounded-lg hover:shadow-lg transition-all shadow-md min-h-[40px] touch-manipulation active:scale-98"
              aria-label="Lägg till ny resurs"
            >
              <Plus size={18} />
              <span>Lägg till resurs</span>
            </button>
            <button
              onClick={() => setShowBulkMsbModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#3D4A2B] to-[#5C6B47] text-white font-bold text-sm rounded-lg hover:shadow-lg transition-all shadow-md min-h-[40px] touch-manipulation active:scale-98"
              aria-label="Lägg till MSB-resurser"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Lägg till MSB-resurser</span>
              <span className="sm:hidden">MSB</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredResources.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center shadow-lg border-2 border-gray-200">
          <div className="text-7xl mb-6">
            {searchQuery ? '🔍' : '📦'}
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-3">
            {searchQuery ? t('dashboard.empty_search_result') : 'Din beredskapslista är tom'}
          </h3>
          <p className="text-gray-600 font-medium mb-8 max-w-md mx-auto leading-relaxed">
            {searchQuery ? t('dashboard.empty_search_tip') : 'Börja bygga din beredskapslista genom att lägga till resurser'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white font-bold text-base rounded-xl hover:shadow-xl transition-all shadow-lg min-h-[56px] touch-manipulation active:scale-98"
            aria-label="Lägg till ny resurs"
          >
            <Plus size={22} />
            <span>{searchQuery ? 'Lägg till resurs' : 'Lägg till första resursen'}</span>
          </button>
        </div>
      )}

      {/* Accordion-Style Category Groups */}
      {filteredResources.length > 0 && (
        <div className="space-y-3">
          {categoryStats
            .filter(cat => {
              // Only show categories that have resources (after filtering)
              const categoryResources = filteredResources.filter(r => r.category === cat.key);
              return categoryResources.length > 0;
            })
            .map(cat => {
              const categoryResources = filteredResources.filter(r => r.category === cat.key);
              const isEmpty = cat.total === 0 || cat.fillRate === 0;
              const statusColor = getCategoryStatusColor(cat.fillRate);
              const isExpanded = expandedCategories.has(cat.key);
              
              // Count shared resources in this category
              const sharedInCategory = categoryResources.filter(r => sharedResourcesMap.has(r.id)).length;
              
              return (
                <div 
                  key={cat.key} 
                  id={`category-${cat.key}`}
                  className="bg-white rounded-xl shadow-md border-2 border-gray-100 overflow-visible scroll-mt-4"
                >
                  {/* Sticky Category Header */}
                  <button
                    onClick={() => {
                      setExpandedCategories(prev => {
                        const next = new Set(prev);
                        if (next.has(cat.key)) {
                          next.delete(cat.key);
                        } else {
                          next.add(cat.key);
                        }
                        return next;
                      });
                    }}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-white to-gray-50 hover:from-gray-50 hover:to-gray-100 transition-colors sticky top-0 z-10 border-b-2 border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{cat.config.emoji}</span>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black text-gray-900">{cat.config.label}</h3>
                          <span 
                            className="text-xs font-bold px-2 py-1 rounded-full"
                            style={{ 
                              backgroundColor: isEmpty ? '#f5f5f5' : statusColor + '20',
                              color: isEmpty ? '#999' : statusColor
                            }}
                          >
                            {categoryResources.length}
                          </span>
                          {sharedInCategory > 0 && (
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-[#5C6B47]/20 text-[#5C6B47] flex items-center gap-1">
                              <Share2 size={10} />
                              {sharedInCategory}
                            </span>
                          )}
                        </div>
                        {isEmpty && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <AlertTriangle size={12} />
                            <span>Lägg till resurser</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>

                  {/* Category Resources */}
                  {isExpanded && (
                    <div className="p-3">
                      {categoryResources.map(resource => (
                        <ResourceMiniCard
                          key={resource.id}
                          resource={resource}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onShare={handleShare}
                          sharedResource={sharedResourcesMap.get(resource.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Modals */}
      <SimpleAddResourceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        userId={userId}
        onSuccess={loadResources}
      />

      <BulkMsbModal
        isOpen={showBulkMsbModal}
        onClose={() => setShowBulkMsbModal(false)}
        userId={userId}
        existingResources={resources}
        onSuccess={loadResources}
      />

      {selectedResource && (
        <>
          <EditResourceModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedResource(null);
            }}
            resource={selectedResource}
            onSuccess={loadResources}
          />

          <ResourceShareToCommunityModal
            isOpen={showShareModal}
            onClose={() => {
              setShowShareModal(false);
              setSelectedResource(null);
            }}
            resource={selectedResource}
            userId={userId}
            onSuccess={loadResources}
          />
        </>
      )}

      {selectedSharedResource && (
        <SharedResourceActionsModal
          isOpen={showSharedResourceModal}
          onClose={() => {
            setShowSharedResourceModal(false);
            setSelectedSharedResource(null);
          }}
          resource={selectedSharedResource}
          onUpdate={handleUpdateSharedResource}
          onDelete={handleDeleteSharedResource}
        />
      )}
    </div>
  );
}

