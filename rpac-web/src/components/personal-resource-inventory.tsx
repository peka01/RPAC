'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, TrendingUp, Package, CheckCircle, AlertTriangle, Clock, Shield, Pencil, Trash, Share2, Users } from 'lucide-react';
import { resourceService, Resource } from '@/lib/supabase';
import { ResourceListView, Column, CategoryFilter, useListViewState } from './resource-list-view';
import { ResourceCardWithActions, ResourceTableRow } from './resource-card-with-actions';
import { SimpleAddResourceModal, msbRecommendations } from './simple-add-resource-modal';
import { EditResourceModal } from './edit-resource-modal';
import { ResourceShareToCommunityModal } from './resource-share-to-community-modal';

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
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const {
    searchQuery,
    setSearchQuery,
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
    const filled = resources.filter(r => r.is_filled).length;
    const empty = total - filled;
    const expiringSoon = resources.filter(r => 
      r.is_filled && r.days_remaining < 30 && r.days_remaining < 99999
    ).length;
    const msbCount = resources.filter(r => r.is_msb_recommended).length;
    
    // Calculate MSB fulfillment
    const totalMsbRecommendations = Object.values(msbRecommendations)
      .flat()
      .filter(item => item.is_msb)
      .length;
    
    const fulfilledMsbRecommendations = resources.filter(r => r.is_msb_recommended && r.is_filled).length;
    const msbFulfillmentPercent = totalMsbRecommendations > 0 
      ? Math.round((fulfilledMsbRecommendations / totalMsbRecommendations) * 100)
      : 0;
    
    // Calculate shared resources
    const sharedCount = resources.filter(r => r.is_shared_to_community).length;
    
    return { total, filled, empty, expiringSoon, msbCount, msbFulfillmentPercent, sharedCount };
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
    <div className="space-y-6">
      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-md border-2 border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#3D4A2B]/10 rounded-xl flex items-center justify-center">
              <Package size={24} className="text-[#3D4A2B]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Totalt resurser</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-md border-2 border-[#556B2F]/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#556B2F]/10 rounded-xl flex items-center justify-center">
              <Shield size={24} className="text-[#556B2F]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.msbFulfillmentPercent}%</div>
              <div className="text-sm text-gray-600">MSB uppfyllnad</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-md border-2 border-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users size={24} className="text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.sharedCount}</div>
              <div className="text-sm text-gray-600">Delade resurser</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Overview Cards */}
      <div className="bg-white rounded-xl shadow-md border-2 border-gray-100 p-4">
        <h3 className="text-base font-bold text-gray-900 mb-3">Översikt per kategori</h3>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {categoryStats.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`p-2 rounded-lg border-2 transition-all hover:shadow-md ${
                activeCategory === cat.key
                  ? 'border-[#3D4A2B] bg-[#3D4A2B]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">{cat.config.emoji}</div>
              <div className="text-xs font-bold text-gray-900 truncate">{cat.config.label}</div>
              <div className="text-[10px] text-gray-600 mb-1">{cat.total}</div>
              {cat.total > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-[#3D4A2B] h-1.5 rounded-full transition-all"
                    style={{ width: `${cat.fillRate}%` }}
                  />
                </div>
              )}
            </button>
          ))}
        </div>
        {activeCategory !== 'all' && (
          <button
            onClick={() => setActiveCategory('all')}
            className="mt-3 text-xs text-[#3D4A2B] hover:text-[#2A331E] font-medium"
          >
            ← Visa alla kategorier
          </button>
        )}
      </div>

      {/* Main Inventory List - Without Category Column */}
      <ResourceListView
        items={filteredResources}
        columns={columns}
        cardRenderer={(resource) => (
          <ResourceCardWithActions
            resource={resource}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onShare={handleShare}
          />
        )}
        mobileListRenderer={(resource) => (
          <div className="p-4">
            <ResourceCardWithActions
              resource={resource}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onShare={handleShare}
            />
          </div>
        )}
        defaultViewMode="cards"
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showViewToggle={true}
        searchable={true}
        searchPlaceholder="Sök resurser..."
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        filterable={false}
        loading={loading}
        loadingMessage="Laddar dina resurser..."
        emptyState={
          <div className="bg-white rounded-xl p-12 text-center shadow-md">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Din beredskapslista är tom
            </h3>
            <p className="text-gray-600 mb-6">
              Börja bygga din beredskapslista genom att lägga till resurser
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white font-bold rounded-xl hover:shadow-lg transition-all inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Lägg till första resursen
            </button>
          </div>
        }
        headerActions={
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white font-bold rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Lägg till resurs</span>
          </button>
        }
        rowKey={(resource) => resource.id}
        cardGridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        tableClassName="overflow-x-auto"
      />

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

