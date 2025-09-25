'use client';

import { useState, useEffect } from 'react';
import { communityService, resourceSharingService, helpRequestService, LocalCommunity, ResourceSharing, HelpRequest } from '@/lib/supabase';
import { 
  Users, 
  Share2, 
  HelpCircle, 
  MapPin, 
  Clock, 
  AlertTriangle,
  Heart,
  Sparkles,
  MessageCircle,
  HandHeart,
  TreePine,
  Sun,
  Zap,
  Shield
} from 'lucide-react';
import { t } from '@/lib/locales';

interface CommunityHubProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: { name?: string };
  };
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
    let mounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Check if this is a demo user
        if (true || user.id === 'demo-user') {
          // Load demo data from localStorage (persist between reloads)
          const savedCommunities = localStorage.getItem('rpac-demo-communities');
          const demoCommunities: LocalCommunity[] = savedCommunities ? JSON.parse(savedCommunities) : [
            {
              id: 'demo-comm-1',
              user_id: 'demo-user',
              community_name: 'Demo Samhälle',
              location: 'Stockholm',
              description: 'Ett demo-samhälle för testning',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
          if (!savedCommunities) {
            localStorage.setItem('rpac-demo-communities', JSON.stringify(demoCommunities));
          }

          const savedRequests = localStorage.getItem('rpac-demo-requests');
          const demoRequests: HelpRequest[] = savedRequests ? JSON.parse(savedRequests) : [
            {
              id: 'demo-req-1',
              user_id: 'demo-user',
              title: 'Behöver hjälp med mat',
              description: 'Behöver akut hjälp med mat för familjen',
              category: 'food' as const,
              urgency: 'high' as const,
              location: 'Stockholm',
              status: 'open' as const,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
          if (!savedRequests) {
            localStorage.setItem('rpac-demo-requests', JSON.stringify(demoRequests));
          }

          if (mounted) {
            setCommunities(demoCommunities);
            setSharedResources([]);
            setHelpRequests(demoRequests);
          }
        } else {
          const [communitiesData, resourcesData, requestsData] = await Promise.all([
            communityService.getCommunities(),
            resourceSharingService.getSharedResources(),
            helpRequestService.getHelpRequests()
          ]);
          
          if (mounted) {
            setCommunities(communitiesData);
            setSharedResources(resourcesData);
            setHelpRequests(requestsData);
          }
        }
      } catch (error: unknown) {
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Ett oväntat fel inträffade');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [user.id]);


  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Use demo mode for all users (Supabase has columns= bug)
      if (true || user.id === 'demo-user') {
        // Persist to localStorage and update state
        const newCommunity: LocalCommunity = {
          id: `demo-comm-${Date.now()}`,
          user_id: user?.id || 'demo-user',
          community_name: communityForm.community_name,
          location: communityForm.location,
          description: communityForm.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const saved = localStorage.getItem('rpac-demo-communities');
        const list: LocalCommunity[] = saved ? JSON.parse(saved) : [];
        const updated = [newCommunity, ...list];
        localStorage.setItem('rpac-demo-communities', JSON.stringify(updated));
        setCommunities(updated);
      } else {
        await communityService.createCommunity({
          ...communityForm,
          user_id: user.id
        });
      }

      setCommunityForm({ community_name: '', location: '', description: '' });
      setShowCreateCommunity(false);
      // No reload needed; state already updated in demo mode
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Ett oväntat fel inträffade');
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Use demo mode for all users (Supabase has columns= bug)
      if (true || user.id === 'demo-user') {
        // Persist to localStorage and update state
        const newRequest: HelpRequest = {
          id: `demo-req-${Date.now()}`,
          user_id: user?.id || 'demo-user',
          title: requestForm.title,
          description: requestForm.description,
          category: requestForm.category,
          urgency: requestForm.urgency,
          location: requestForm.location,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as HelpRequest;
        const saved = localStorage.getItem('rpac-demo-requests');
        const list: HelpRequest[] = saved ? JSON.parse(saved) : [];
        const updated = [newRequest, ...list];
        localStorage.setItem('rpac-demo-requests', JSON.stringify(updated));
        setHelpRequests(updated);
      } else {
        await helpRequestService.createHelpRequest({
          ...requestForm,
          user_id: user.id,
          status: 'open'
        });
      }

      setRequestForm({
        title: '',
        description: '',
        category: 'other',
        urgency: 'medium',
        location: ''
      });
      setShowCreateRequest(false);
      // No reload needed; state already updated in demo mode
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
    <div className="bg-white/95 rounded-xl p-6 border shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden" style={{ 
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--color-cool-olive)'
    }}>
      {/* Professional Background Elements */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.03]">
        <TreePine className="w-full h-full" style={{ color: 'var(--color-sage)' }} />
      </div>
      <div className="absolute bottom-0 left-0 w-16 h-16 opacity-[0.03]">
        <Heart className="w-full h-full" style={{ color: 'var(--color-warm-olive)' }} />
      </div>

      {/* Community Intelligence Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-lg flex items-center justify-center shadow-md" style={{ 
              background: 'linear-gradient(135deg, var(--color-cool-olive) 0%, var(--color-tertiary) 100%)' 
            }}>
              <Users className="w-7 h-7 text-white" />
            </div>
            {/* Network Status Pulse */}
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-sage)' }}>
              <div className="absolute inset-0 rounded-full bg-current animate-ping opacity-50"></div>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('community.coordination_title')}</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('community.coordination_description')}</p>
          </div>
        </div>
        
        {/* Network Health Metrics */}
        <div className="text-center px-3 py-2 rounded-lg shadow-sm" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
          <div className="text-lg font-bold" style={{ color: 'var(--color-cool-olive)' }}>87%</div>
          <div className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>{t('community.network')}</div>
        </div>
      </div>

      {/* Tactical Community Operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => setShowCreateCommunity(true)}
          className="group text-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--color-sage) 0%, var(--color-quaternary) 100%)' }}
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-bold text-base">{t('buttons.establish_community')}</div>
              <div className="text-sm opacity-90">{t('descriptions.organize_preparedness')}</div>
            </div>
          </div>
        </button>
        
        <button
          onClick={() => setShowCreateRequest(true)}
          className="group text-white p-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--color-warm-olive) 0%, var(--color-primary-dark) 100%)' }}
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <HandHeart className="w-6 h-6" />
            </div>
            <div className="text-left">
              <div className="font-bold text-base">{t('buttons.request_assistance')}</div>
              <div className="text-sm opacity-90">{t('descriptions.activate_support')}</div>
            </div>
          </div>
        </button>
      </div>

      {/* Error Message with Empathy */}
      {error && (
        <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-semibold">Något gick fel, men det ordnar sig</span>
          </div>
          <p className="text-red-700 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Revolutionary Zero-Learning Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { 
            id: 'communities', 
            label: t('community.caring_communities'), 
            icon: Users,
            description: t('community.discover_neighbors'),
            emotion: '🏘️',
            gradient: 'from-slate-500 to-slate-600'
          },
          { 
            id: 'resources', 
            label: t('community.generous_hearts'), 
            icon: Share2,
            description: t('community.share_with_love'),
            emotion: '💝',
            gradient: 'from-stone-500 to-stone-600'
          },
          { 
            id: 'requests', 
            label: t('community.helping_hands'), 
            icon: HandHeart,
            description: t('community.help_when_needed'),
            emotion: '🤲',
            gradient: 'from-gray-500 to-gray-600'
          }
        ].map(({ id, label, icon: Icon, description, emotion, gradient }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as 'communities' | 'resources' | 'requests')}
            className={`group relative p-4 rounded-xl transition-all duration-300 transform hover:scale-105 overflow-hidden ${
              activeTab === id
                ? 'ring-2 ring-white/50 shadow-xl'
                : 'hover:shadow-lg'
            }`}
          >
            {/* Dynamic Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-opacity duration-300 ${
              activeTab === id ? 'opacity-100' : 'opacity-80 group-hover:opacity-90'
            }`}></div>
            
            {/* Content */}
            <div className="relative text-white text-center">
              <div className="flex items-center justify-center mb-2">
                <Icon className={`w-6 h-6 mr-2 ${activeTab === id ? 'animate-pulse' : ''}`} />
                <span className="text-lg">{emotion}</span>
              </div>
              <div className="font-bold text-sm mb-1">{label}</div>
              <div className="text-xs opacity-90">{description}</div>
              
              {/* Active Indicator */}
              {activeTab === id && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
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
                    <option value="urgent">Akut</option>
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
