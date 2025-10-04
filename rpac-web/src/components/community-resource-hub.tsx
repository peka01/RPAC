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
  ArrowRight
} from 'lucide-react';
import { t } from '@/lib/locales';
import { resourceSharingService, type SharedResource, type HelpRequest } from '@/lib/resource-sharing-service';
import type { User } from '@supabase/supabase-js';

interface CommunityResourceHubProps {
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

export function CommunityResourceHub({ 
  user, 
  communityId, 
  communityName,
  isAdmin = false,
  onSendMessage 
}: CommunityResourceHubProps) {
  const [activeTab, setActiveTab] = useState<ViewTier>('shared');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Data states
  const [sharedResources, setSharedResources] = useState<SharedResource[]>([]);
  const [communityResources, setCommunityResources] = useState<any[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [showAddCommunityResource, setShowAddCommunityResource] = useState(false);
  const [showAddHelpRequest, setShowAddHelpRequest] = useState(false);

  useEffect(() => {
    if (communityId) {
      loadAllData();
    }
  }, [communityId]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [shared, help] = await Promise.all([
        resourceSharingService.getCommunityResources(communityId),
        resourceSharingService.getCommunityHelpRequests(communityId)
      ]);
      
      setSharedResources(shared);
      setHelpRequests(help);
      // TODO: Load community-owned resources from database
      setCommunityResources([]);
    } catch (err) {
      console.error('Error loading community resources:', err);
      setError('Kunde inte ladda samhällets resurser');
    } finally {
      setLoading(false);
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

  // Filter resources based on category and search
  const filterResources = (resources: any[]) => {
    let filtered = resources;
    
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(r => r.category === categoryFilter);
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

  const filteredShared = filterResources(sharedResources);
  const filteredHelp = filterResources(helpRequests);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3D4A2B]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section with Stats */}
      <div className="bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-2xl p-8 shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">📦 Samhällets resurser</h1>
            <p className="text-white/80 text-lg">{communityName}</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
            <Users size={20} />
            <span className="font-bold">{stats.contributors} bidragande</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Share2 size={18} className="text-white/80" />
              <span className="text-white/80 text-sm">Delade resurser</span>
            </div>
            <div className="text-3xl font-bold">{stats.totalShared}</div>
            <div className="text-white/80 text-xs mt-1">{stats.availableShared} tillgängliga</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={18} className="text-white/80" />
              <span className="text-white/80 text-sm">Samhällets resurser</span>
            </div>
            <div className="text-3xl font-bold">{stats.totalOwned}</div>
            <div className="text-white/80 text-xs mt-1">Gemensamma tillgångar</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={18} className="text-white/80" />
              <span className="text-white/80 text-sm">Hjälpförfrågningar</span>
            </div>
            <div className="text-3xl font-bold">{stats.activeHelp}</div>
            <div className="text-white/80 text-xs mt-1">{stats.resolvedHelp} lösta</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={18} className="text-white/80" />
              <span className="text-white/80 text-sm">Sammarbete</span>
            </div>
            <div className="text-3xl font-bold">{stats.contributors}</div>
            <div className="text-white/80 text-xs mt-1">Aktiva medlemmar</div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl p-4 shadow-md">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sök efter resurser..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              showFilters || categoryFilter !== 'all'
                ? 'bg-[#3D4A2B] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter size={20} />
            <span>Filter</span>
            {categoryFilter !== 'all' && (
              <span className="bg-white text-[#3D4A2B] px-2 py-0.5 rounded-full text-xs font-bold">
                1
              </span>
            )}
          </button>
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

      {/* Three-Tier Navigation */}
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
          <span>Samhällets resurser</span>
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

      {/* Content Area */}
      <div className="min-h-[400px]">
        {/* Tier 1: Shared from Members */}
        {activeTab === 'shared' && (
          <div className="space-y-4">
            {filteredShared.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-md">
                <Share2 size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Inga delade resurser än</h3>
                <p className="text-gray-600 mb-6">
                  Medlemmar kan dela överskottsresurser från sina personliga förråd
                </p>
                <div className="text-sm text-gray-500">
                  💡 Gå till din resursinventering för att dela dina resurser
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredShared.map(resource => (
                  <SharedResourceCard
                    key={resource.id}
                    resource={resource}
                    currentUserId={user.id}
                    onRequest={() => handleRequestResource(resource)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tier 2: Community-Owned Resources */}
        {activeTab === 'owned' && (
          <div className="space-y-4">
            {communityResources.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-md">
                <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Inga samhällsresurser än</h3>
                <p className="text-gray-600 mb-6">
                  Samhället kan ha gemensam utrustning, verktyg och faciliteter
                </p>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddCommunityResource(true)}
                    className="px-8 py-4 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-xl font-bold hover:shadow-lg transition-all"
                  >
                    <Plus size={20} className="inline mr-2" />
                    Lägg till samhällsresurs
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Community resources will go here */}
              </div>
            )}
          </div>
        )}

        {/* Tier 3: Help Requests */}
        {activeTab === 'help' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Aktiva hjälpförfrågningar</h3>
                <p className="text-gray-600">Samhället hjälper varandra</p>
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
    </div>
  );

  async function handleRequestResource(resource: SharedResource) {
    try {
      await resourceSharingService.requestResource(resource.id, user.id);
      await loadAllData();
    } catch (err) {
      console.error('Error requesting resource:', err);
      setError('Kunde inte begära resurs');
    }
  }

  function handleRespondToHelp(request: HelpRequest) {
    if (onSendMessage) {
      onSendMessage(`Jag kan hjälpa till med: "${request.title}". Låt oss prata om detaljerna.`);
    }
  }
}

// Shared Resource Card Component
function SharedResourceCard({ resource, currentUserId, onRequest }: any) {
  const category = categoryConfig[resource.category as keyof typeof categoryConfig] || categoryConfig.other;
  const isOwner = resource.user_id === currentUserId;
  const isAvailable = resource.status === 'available';

  return (
    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all border-2 border-transparent hover:border-[#3D4A2B]">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <span className="text-2xl">{category.emoji}</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{resource.resource_name}</h3>
            <p className="text-sm text-gray-600">{category.label}</p>
          </div>
        </div>
        {isOwner && (
          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">
            Din resurs
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Package size={16} className="text-gray-400" />
          <span className="font-semibold">{resource.quantity} {resource.unit}</span>
        </div>
        {resource.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={16} className="text-gray-400" />
            <span>{resource.location}</span>
          </div>
        )}
        {resource.available_until && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock size={16} className="text-gray-400" />
            <span>Till {new Date(resource.available_until).toLocaleDateString('sv-SE')}</span>
          </div>
        )}
        {resource.shared_by_name && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <UserIcon size={16} className="text-gray-400" />
            <span>{resource.shared_by_name}</span>
          </div>
        )}
      </div>

      {resource.notes && (
        <p className="text-sm text-gray-600 mb-4 italic">"{resource.notes}"</p>
      )}

      {!isOwner && isAvailable && (
        <button
          onClick={onRequest}
          className="w-full py-3 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Send size={18} />
          <span>Be om denna resurs</span>
        </button>
      )}

      {!isAvailable && (
        <div className="w-full py-3 bg-gray-100 text-gray-500 rounded-lg font-medium text-center">
          Ej tillgänglig
        </div>
      )}
    </div>
  );
}

// Help Request Card Component
function HelpRequestCard({ request, currentUserId, onRespond }: any) {
  const isOwner = request.user_id === currentUserId;
  const urgencyColors = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700'
  };
  const urgencyLabels = { low: 'Låg', medium: 'Medel', high: 'Hög' };

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
          onClick={onRespond}
          className="w-full py-3 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-lg font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Heart size={18} />
          <span>Jag kan hjälpa till</span>
        </button>
      )}
    </div>
  );
}

