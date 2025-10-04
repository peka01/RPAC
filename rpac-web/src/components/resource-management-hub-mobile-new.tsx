'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Package, Shield, Users, ChevronRight, Pencil, Trash, Share2, Search, X } from 'lucide-react';
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
  userId: string;
}

export function ResourceManagementHubMobile({ userId }: ResourceManagementHubMobileProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryKey | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
      const categoryFilled = categoryResources.filter(r => r.is_filled).length;
      const fillRate = categoryResources.length > 0 
        ? Math.round((categoryFilled / categoryResources.length) * 100)
        : 0;
      
      return {
        key: catKey,
        config: categoryConfig[catKey],
        total: categoryResources.length,
        filled: categoryFilled,
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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white px-6 py-8 rounded-b-3xl shadow-2xl mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Package size={32} className="text-white" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">Mina Resurser</h1>
            <p className="text-white/80 text-sm">Bygg din beredskap</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold mb-1">{stats.total}</div>
            <div className="text-xs text-white/80">Totalt</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold mb-1">{stats.msbFulfillmentPercent}%</div>
            <div className="text-xs text-white/80">MSB</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold mb-1">{stats.sharedCount}</div>
            <div className="text-xs text-white/80">Delade</div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Add Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
        >
          <Plus size={24} strokeWidth={2.5} />
          Lägg till resurs
        </button>

        {/* Category Filter Pills */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 pb-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all ${
                activeCategory === 'all'
                  ? 'bg-[#3D4A2B] text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              Alla
            </button>
            {categoryStats.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all flex items-center gap-2 ${
                  activeCategory === cat.key
                    ? 'bg-[#3D4A2B] text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                <span>{cat.config.emoji}</span>
                <span>{cat.config.label}</span>
                {cat.total > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeCategory === cat.key ? 'bg-white/20' : 'bg-gray-100'
                  }`}>
                    {cat.total}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sök resurser..."
            className="w-full pl-12 pr-12 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Resources List */}
        {filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <Package size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {searchQuery ? 'Inga resurser hittades' : 'Inga resurser ännu'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? 'Försök med en annan sökning' : 'Lägg till din första resurs för att komma igång'}
            </p>
          </div>
        ) : (
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

