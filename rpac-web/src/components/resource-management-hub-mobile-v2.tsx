'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Package, Shield, Users, Search, Filter, X, Grid3x3, List as ListIcon, Pencil, Trash, Share2 } from 'lucide-react';
import { resourceService, Resource } from '@/lib/supabase';
import { SimpleAddResourceModal, msbRecommendations } from './simple-add-resource-modal';
import { EditResourceModal } from './edit-resource-modal';
import { ResourceShareToCommunityModal } from './resource-share-to-community-modal';
import { ResourceCardWithActions } from './resource-card-with-actions';

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

interface ResourceManagementHubMobileProps {
  user: { id: string; email?: string };
}

export function ResourceManagementHubMobile({ user }: ResourceManagementHubMobileProps) {
  const userId = user.id;
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryKey | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list');
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  useEffect(() => {
    loadResources();
  }, [userId]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await resourceService.getResources(userId);
      setResources(data);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = resources.length;
    const totalMsbRecommendations = Object.values(msbRecommendations)
      .flat()
      .filter(item => item.is_msb)
      .length;
    const fulfilledMsbRecommendations = resources.filter(r => r.is_msb_recommended && r.is_filled).length;
    const msbFulfillmentPercent = totalMsbRecommendations > 0 
      ? Math.round((fulfilledMsbRecommendations / totalMsbRecommendations) * 100)
      : 0;
    const sharedCount = resources.filter(r => r.is_shared_to_community).length;
    
    return { total, msbFulfillmentPercent, sharedCount };
  }, [resources]);

  // Category statistics
  const categoryStats = useMemo(() => {
    return (Object.keys(categoryConfig) as CategoryKey[]).map(catKey => {
      const categoryResources = resources.filter(r => r.category === catKey);
      return {
        key: catKey,
        config: categoryConfig[catKey],
        total: categoryResources.length
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

  const handleEdit = (resource: Resource) => {
    setSelectedResource(resource);
    setShowEditModal(true);
  };

  const handleDelete = async (resource: Resource) => {
    if (window.confirm(`Är du säker på att du vill ta bort ${resource.name}?`)) {
      try {
        await resourceService.deleteResource(resource.id);
        await loadResources();
      } catch (error) {
        console.error('Error deleting resource:', error);
        alert('Kunde inte ta bort resursen');
      }
    }
  };

  const handleShare = (resource: Resource) => {
    setSelectedResource(resource);
    setShowShareModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3D4A2B] mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar dina resurser...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5C6B47]/10 via-white to-[#707C5F]/10 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] text-white px-4 pt-6 pb-8 shadow-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Mina Resurser</h1>
          <p className="text-[#C8D5B9] text-sm">Bygg din beredskap</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-[#C8D5B9] mt-1">Totalt</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
            <div className="text-2xl font-bold">{stats.msbFulfillmentPercent}%</div>
            <div className="text-xs text-[#C8D5B9] mt-1">MSB</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3">
            <div className="text-2xl font-bold">{stats.sharedCount}</div>
            <div className="text-xs text-[#C8D5B9] mt-1">Delade</div>
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
            onClick={() => setShowFilterSheet(!showFilterSheet)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-[#3D4A2B] text-white hover:bg-[#2A331E] transition-all"
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
          <button
            onClick={() => setActiveCategory('all')}
            className={`flex-shrink-0 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all touch-manipulation active:scale-95 ${
              activeCategory === 'all'
                ? 'bg-[#3D4A2B] text-white shadow-md'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Alla ({resources.length})
          </button>
          {categoryStats.map(cat => (
            cat.total > 0 && (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex-shrink-0 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all touch-manipulation active:scale-95 flex items-center gap-2 ${
                  activeCategory === cat.key
                    ? 'bg-[#3D4A2B] text-white shadow-md'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <span>{cat.config.emoji}</span>
                {cat.config.label} ({cat.total})
              </button>
            )
          ))}
        </div>
      </div>

      {/* View Mode Toggle & Add Button */}
      <div className="px-4 pt-4 flex gap-3">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex-1 bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white py-3.5 rounded-xl font-bold shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Plus size={20} strokeWidth={2.5} />
          Lägg till
        </button>

        <div className="flex gap-1 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-2.5 rounded-lg transition-all active:scale-95 ${
              viewMode === 'cards'
                ? 'bg-[#3D4A2B] text-white'
                : 'text-gray-600'
            }`}
          >
            <Grid3x3 size={20} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2.5 rounded-lg transition-all active:scale-95 ${
              viewMode === 'list'
                ? 'bg-[#3D4A2B] text-white'
                : 'text-gray-600'
            }`}
          >
            <ListIcon size={20} />
          </button>
        </div>
      </div>

      {/* Resources List */}
      <div className="px-4 pt-4 pb-6">
        {filteredResources.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {searchQuery ? 'Inga resurser hittades' : 'Inga resurser ännu'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? 'Försök med en annan sökning' : 'Lägg till din första resurs för att komma igång'}
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="space-y-3">
            {filteredResources.map(resource => (
              <ResourceCardWithActions
                key={resource.id}
                resource={resource}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onShare={handleShare}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 shadow-sm">
            {filteredResources.map(resource => {
              const config = categoryConfig[resource.category as CategoryKey];
              return (
                <div key={resource.id} className="p-4 flex items-center gap-3">
                  <div className="text-2xl flex-shrink-0">{config.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 truncate">{resource.name}</h3>
                      {resource.is_msb_recommended && (
                        <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#556B2F]/10 text-[#556B2F]">
                          MSB
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>{resource.quantity} {resource.unit}</span>
                      <span>•</span>
                      <span>{resource.days_remaining >= 99999 ? '∞' : `${resource.days_remaining}d`}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleEdit(resource)}
                      className="p-2 text-[#3D4A2B] hover:bg-[#3D4A2B]/10 rounded-lg transition-colors active:scale-95"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleShare(resource)}
                      className="p-2 text-[#556B2F] hover:bg-[#556B2F]/10 rounded-lg transition-colors active:scale-95"
                    >
                      <Share2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(resource)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors active:scale-95"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <SimpleAddResourceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        userId={userId}
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
    </div>
  );
}

