'use client';

import { useState, useEffect } from 'react';
import { communityService, resourceSharingService, helpRequestService, LocalCommunity, ResourceSharing, HelpRequest } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { Users, Share2, HelpCircle, MapPin, Clock, AlertTriangle } from 'lucide-react';

interface CommunityHubProps {
  user: User;
}

const urgencyColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};

const urgencyLabels = {
  low: 'Låg',
  medium: 'Medium',
  high: 'Hög',
  critical: 'Kritisk'
};

export function CommunityHub({ user }: CommunityHubProps) {
  const [communities, setCommunities] = useState<LocalCommunity[]>([]);
  const [sharedResources, setSharedResources] = useState<ResourceSharing[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'communities' | 'resources' | 'requests'>('communities');
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [communityForm, setCommunityForm] = useState({
    community_name: '',
    location: '',
    description: ''
  });

  const [requestForm, setRequestForm] = useState({
    title: '',
    description: '',
    category: 'other' as HelpRequest['category'],
    urgency: 'medium' as HelpRequest['urgency'],
    location: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [communitiesData, resourcesData, requestsData] = await Promise.all([
        communityService.getCommunities(),
        resourceSharingService.getSharedResources(),
        helpRequestService.getHelpRequests()
      ]);
      
      setCommunities(communitiesData);
      setSharedResources(resourcesData);
      setHelpRequests(requestsData);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Ett oväntat fel inträffade');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await communityService.createCommunity({
        ...communityForm,
        user_id: user.id
      });

      setCommunityForm({ community_name: '', location: '', description: '' });
      setShowCreateCommunity(false);
      loadData();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Ett oväntat fel inträffade');
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await helpRequestService.createHelpRequest({
        ...requestForm,
        user_id: user.id,
        status: 'open'
      });

      setRequestForm({
        title: '',
        description: '',
        category: 'other',
        urgency: 'medium',
        location: ''
      });
      setShowCreateRequest(false);
      loadData();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Ett oväntat fel inträffade');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Lokalt Samhälle
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateCommunity(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Users size={20} />
            Skapa samhälle
          </button>
          <button
            onClick={() => setShowCreateRequest(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <HelpCircle size={20} />
            Be om hjälp
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/10 backdrop-blur-sm rounded-lg p-1">
        {[
          { id: 'communities', label: 'Samhällen', icon: Users },
          { id: 'resources', label: 'Delade resurser', icon: Share2 },
          { id: 'requests', label: 'Hjälpförfrågningar', icon: HelpCircle }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as 'communities' | 'resources' | 'requests')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === id
                ? 'bg-white/20 text-white'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {/* Communities Tab */}
      {activeTab === 'communities' && (
        <div className="space-y-4">
          {communities.map((community) => (
            <div
              key={community.id}
              className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users size={20} style={{ color: 'var(--text-primary)' }} />
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {community.community_name}
                  </h3>
                </div>
                <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <MapPin size={16} />
                  {community.location}
                </div>
              </div>
              
              {community.description && (
                <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>
                  {community.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  Skapad {new Date(community.created_at).toLocaleDateString('sv-SE')}
                </div>
              </div>
            </div>
          ))}

          {communities.length === 0 && (
            <div className="text-center py-8">
              <Users size={48} className="mx-auto mb-4 opacity-50" style={{ color: 'var(--text-secondary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>
                Inga lokala samhällen registrerade än. Skapa det första samhället för att komma igång.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Shared Resources Tab */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          {sharedResources.map((sharing) => (
            <div
              key={sharing.id}
              className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Delad resurs
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  sharing.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {sharing.status === 'available' ? 'Tillgänglig' : 'Upptagen'}
                </span>
              </div>
              
              <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div>
                  <span className="font-medium">Antal:</span> {sharing.shared_quantity}
                </div>
                {sharing.available_until && (
                  <div className="flex items-center gap-1">
                    <Clock size={16} />
                    Tillgänglig till {new Date(sharing.available_until).toLocaleDateString('sv-SE')}
                  </div>
                )}
              </div>
            </div>
          ))}

          {sharedResources.length === 0 && (
            <div className="text-center py-8">
              <Share2 size={48} className="mx-auto mb-4 opacity-50" style={{ color: 'var(--text-secondary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>
                Inga delade resurser tillgängliga just nu.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Help Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {helpRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {request.title}
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${urgencyColors[request.urgency]}`}>
                    {urgencyLabels[request.urgency]}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    request.status === 'open' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {request.status === 'open' ? 'Öppen' : 'Stängd'}
                  </span>
                </div>
              </div>
              
              <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>
                {request.description}
              </p>
              
              <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex items-center gap-1">
                  <AlertTriangle size={16} />
                  {request.category}
                </div>
                {request.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={16} />
                    {request.location}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock size={16} />
                  {new Date(request.created_at).toLocaleDateString('sv-SE')}
                </div>
              </div>
            </div>
          ))}

          {helpRequests.length === 0 && (
            <div className="text-center py-8">
              <HelpCircle size={48} className="mx-auto mb-4 opacity-50" style={{ color: 'var(--text-secondary)' }} />
              <p style={{ color: 'var(--text-secondary)' }}>
                Inga hjälpförfrågningar just nu.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create Community Modal */}
      {showCreateCommunity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Skapa nytt samhälle</h3>
            
            <form onSubmit={handleCreateCommunity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Samhällsnamn</label>
                <input
                  type="text"
                  value={communityForm.community_name}
                  onChange={(e) => setCommunityForm({ ...communityForm, community_name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Plats</label>
                <input
                  type="text"
                  value={communityForm.location}
                  onChange={(e) => setCommunityForm({ ...communityForm, location: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Beskrivning</label>
                <textarea
                  value={communityForm.description}
                  onChange={(e) => setCommunityForm({ ...communityForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Skapa
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateCommunity(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Avbryt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Help Request Modal */}
      {showCreateRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Skapa hjälpförfrågan</h3>
            
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titel</label>
                <input
                  type="text"
                  value={requestForm.title}
                  onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Beskrivning</label>
                <textarea
                  value={requestForm.description}
                  onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kategori</label>
                  <select
                    value={requestForm.category}
                    onChange={(e) => setRequestForm({ ...requestForm, category: e.target.value as HelpRequest['category'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="food">Mat</option>
                    <option value="water">Vatten</option>
                    <option value="medicine">Medicin</option>
                    <option value="energy">Energi</option>
                    <option value="tools">Verktyg</option>
                    <option value="other">Annat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Brådska</label>
                  <select
                    value={requestForm.urgency}
                    onChange={(e) => setRequestForm({ ...requestForm, urgency: e.target.value as HelpRequest['urgency'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Låg</option>
                    <option value="medium">Medium</option>
                    <option value="high">Hög</option>
                    <option value="critical">Kritisk</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Plats (valfritt)</label>
                <input
                  type="text"
                  value={requestForm.location}
                  onChange={(e) => setRequestForm({ ...requestForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Skapa
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateRequest(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Avbryt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
