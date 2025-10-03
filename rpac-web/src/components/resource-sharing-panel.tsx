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
  User as UserIcon
} from 'lucide-react';
import { t } from '@/lib/locales';
import { resourceSharingService, type SharedResource, type HelpRequest } from '@/lib/resource-sharing-service';
import type { User } from '@supabase/supabase-js';

interface ResourceSharingPanelProps {
  user: User;
  communityId: string;
  onSendMessage?: (content: string) => void;
}

export function ResourceSharingPanel({ user, communityId, onSendMessage }: ResourceSharingPanelProps) {
  const [activeTab, setActiveTab] = useState<'resources' | 'help'>('resources');
  const [sharedResources, setSharedResources] = useState<SharedResource[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [editingResource, setEditingResource] = useState<SharedResource | null>(null);

  // Share resource form
  const [shareForm, setShareForm] = useState({
    resourceName: '',
    category: 'food' as 'food' | 'water' | 'medicine' | 'energy' | 'tools',
    quantity: '',
    unit: 'st',
    availableUntil: '',
    location: '',
    notes: ''
  });

  // Help request form
  const [helpForm, setHelpForm] = useState({
    title: '',
    description: '',
    category: 'food' as HelpRequest['category'],
    urgency: 'medium' as HelpRequest['urgency'],
    location: ''
  });

  useEffect(() => {
    if (communityId) {
      loadData();
    }
  }, [communityId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [resources, requests] = await Promise.all([
        resourceSharingService.getCommunityResources(communityId),
        resourceSharingService.getCommunityHelpRequests(communityId)
      ]);
      
      setSharedResources(resources);
      setHelpRequests(requests);
    } catch (err) {
      console.error('Error loading community data:', err);
      setError('Kunde inte ladda resurser och förfrågningar');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestResource = async (resource: SharedResource) => {
    try {
      await resourceSharingService.requestResource(resource.id, user.id);
      await loadData();
    } catch (err) {
      console.error('Error requesting resource:', err);
      setError('Kunde inte begära resurs');
    }
  };

  const handleRespondToHelp = (request: HelpRequest) => {
    if (onSendMessage) {
      onSendMessage(`Jag kan hjälpa till med: "${request.title}". Låt oss prata om detaljerna.`);
    }
  };

  const handleShareResource = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingResource) {
        // Update existing resource
        await resourceSharingService.updateSharedResource({
          resourceId: editingResource.id,
          userId: user.id,
          resource_name: shareForm.resourceName,
          category: shareForm.category,
          unit: shareForm.unit,
          quantity: parseFloat(shareForm.quantity),
          shared_quantity: parseFloat(shareForm.quantity),
          available_until: shareForm.availableUntil || null,
          location: shareForm.location || null,
          notes: shareForm.notes || null
        });
      } else {
        // Insert directly into resource_sharing table
        const { supabase } = await import('@/lib/supabase');
        const { data, error } = await supabase
          .from('resource_sharing')
          .insert([{
            user_id: user.id,
            community_id: communityId,
            resource_name: shareForm.resourceName,
            category: shareForm.category,
            resource_category: shareForm.category, // Duplicate field
            unit: shareForm.unit,
            resource_unit: shareForm.unit, // Duplicate field (NOT NULL)
            quantity: parseFloat(shareForm.quantity),
            shared_quantity: parseFloat(shareForm.quantity),
            available_until: shareForm.availableUntil || null,
            location: shareForm.location || null,
            notes: shareForm.notes || null,
            status: 'available'
          }])
          .select()
          .single();
        
        if (error) throw error;
      }
      
      // Reload data to show the changes
      await loadData();
      
      setShowShareModal(false);
      setEditingResource(null);
      setShareForm({
        resourceName: '',
        category: 'food',
        quantity: '',
        unit: 'st',
        availableUntil: '',
        location: '',
        notes: ''
      });
    } catch (err) {
      console.error('Error sharing resource:', err);
      setError('Kunde inte dela resurs');
    }
  };

  const handleEditResource = (resource: SharedResource) => {
    setEditingResource(resource);
    setShareForm({
      resourceName: resource.resource_name || '',
      category: (resource.resource_category || 'food') as any,
      quantity: String(resource.shared_quantity || ''),
      unit: resource.resource_unit || 'st',
      availableUntil: resource.available_until || '',
      location: resource.location || '',
      notes: resource.notes || ''
    });
    setShowShareModal(true);
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna resurs?')) {
      return;
    }
    
    try {
      await resourceSharingService.removeSharedResource(resourceId, user.id);
      await loadData();
    } catch (err) {
      console.error('Error deleting resource:', err);
      setError('Kunde inte ta bort resurs');
    }
  };

  const handleCreateHelpRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await resourceSharingService.createHelpRequest({
        userId: user.id,
        communityId,
        title: helpForm.title,
        description: helpForm.description,
        category: helpForm.category,
        urgency: helpForm.urgency,
        location: helpForm.location || undefined
      });
      
      // Reload data to show the new request
      await loadData();
      
      setShowHelpModal(false);
      setHelpForm({
        title: '',
        description: '',
        category: 'food',
        urgency: 'medium',
        location: ''
      });
      
      // Notify in chat
      if (onSendMessage) {
        const urgencyEmoji = {
          low: '💬',
          medium: '❗',
          high: '🚨',
          critical: '🆘'
        }[helpForm.urgency];
        
        onSendMessage(`${urgencyEmoji} Ny hjälpförfrågan: ${helpForm.title}`);
      }
      
      await loadData();
    } catch (err) {
      console.error('Error creating help request:', err);
      setError('Kunde inte skapa hjälpförfrågan');
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      food: '🍞',
      water: '💧',
      medicine: '💊',
      energy: '⚡',
      tools: '🔧',
      shelter: '🏠',
      transport: '🚗',
      skills: '🛠️',
      other: '📦'
    };
    return icons[category] || '📦';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin text-[#3D4A2B]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'resources'
                ? 'bg-[#3D4A2B] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Package size={18} className="inline mr-2" />
            Delade resurser ({sharedResources.length})
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'help'
                ? 'bg-[#3D4A2B] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Heart size={18} className="inline mr-2" />
            Hjälpförfrågningar ({helpRequests.length})
          </button>
        </div>
        
        <button
          onClick={() => activeTab === 'resources' ? setShowShareModal(true) : setShowHelpModal(true)}
          className="px-4 py-2 bg-[#5C6B47] text-white rounded-lg hover:bg-[#4A5239] transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          {activeTab === 'resources' ? 'Dela resurs' : 'Be om hjälp'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="space-y-3">
          {sharedResources.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Package size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Inga delade resurser än</p>
              <p className="text-sm text-gray-500 mt-2">Var den första att dela något med samhället!</p>
            </div>
          ) : (
            sharedResources.map((resource) => (
              <div
                key={resource.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getCategoryIcon(resource.resource_category || 'other')}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{resource.resource_name}</h4>
                        <p className="text-sm text-gray-600">
                          {resource.shared_quantity} {resource.resource_unit}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <UserIcon size={14} />
                      <span className="font-medium">{resource.sharer_name}</span>
                    </div>
                    
                    {resource.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <MapPin size={14} />
                        {resource.location}
                      </div>
                    )}
                    
                    {resource.available_until && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Clock size={14} />
                        Tillgänglig till: {new Date(resource.available_until).toLocaleDateString('sv-SE')}
                      </div>
                    )}
                    
                    {resource.notes && (
                      <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                        {resource.notes}
                      </p>
                    )}
                  </div>
                  
                  {resource.user_id !== user.id && (
                    <>
                      {resource.status === 'available' && (
                        <button
                          onClick={() => handleRequestResource(resource)}
                          className="ml-4 px-4 py-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors flex items-center gap-2 text-sm"
                        >
                          <Send size={16} />
                          Begär
                        </button>
                      )}
                      {resource.status === 'requested' && (
                        <span className="ml-4 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          Förfrågad
                        </span>
                      )}
                    </>
                  )}
                  
                  {resource.user_id === user.id && (
                    <div className="ml-4 flex items-center gap-2">
                      {resource.status === 'requested' && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium mr-2">
                          Någon vill ha denna
                        </span>
                      )}
                      <button
                        onClick={() => handleEditResource(resource)}
                        className="p-2 text-[#3D4A2B] hover:bg-[#3D4A2B] hover:text-white rounded-lg transition-colors"
                        title="Redigera"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteResource(resource.id)}
                        className="p-2 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                        title="Ta bort"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Help Requests Tab */}
      {activeTab === 'help' && (
        <div className="space-y-3">
          {helpRequests.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Heart size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Inga hjälpförfrågningar just nu</p>
              <p className="text-sm text-gray-500 mt-2">Alla verkar klara sig bra!</p>
            </div>
          ) : (
            helpRequests.map((request) => (
              <div
                key={request.id}
                className={`bg-white border-2 rounded-lg p-4 hover:shadow-md transition-shadow ${getUrgencyColor(request.urgency)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getCategoryIcon(request.category)}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{request.title}</h4>
                        <p className="text-xs text-gray-600">
                          {request.urgency === 'critical' && '🆘 KRITISK'}
                          {request.urgency === 'high' && '🚨 HÖG PRIORITET'}
                          {request.urgency === 'medium' && '❗ MEDIUM'}
                          {request.urgency === 'low' && '💬 LÅG'}
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-3">{request.description}</p>
                    
                    {request.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <MapPin size={14} />
                        {request.location}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={12} />
                      {new Date(request.created_at).toLocaleString('sv-SE')}
                    </div>
                  </div>
                  
                  {request.user_id !== user.id && request.status === 'open' && (
                    <button
                      onClick={() => handleRespondToHelp(request)}
                      className="ml-4 px-4 py-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors flex items-center gap-2 text-sm"
                    >
                      <Heart size={16} />
                      Hjälp till
                    </button>
                  )}
                  
                  {request.user_id === user.id && (
                    <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      Din förfrågan
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Share Resource Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900">
                {editingResource ? 'Redigera resurs' : 'Dela resurs'}
              </h3>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setEditingResource(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleShareResource} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto p-6 space-y-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resursnamn
                </label>
                <input
                  type="text"
                  value={shareForm.resourceName}
                  onChange={(e) => setShareForm({ ...shareForm, resourceName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                  placeholder="t.ex. Konservburkar, Ficklampa"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori
                </label>
                <select
                  value={shareForm.category}
                  onChange={(e) => setShareForm({ ...shareForm, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                >
                  <option value="food">Mat</option>
                  <option value="water">Vatten</option>
                  <option value="medicine">Medicin</option>
                  <option value="energy">Energi</option>
                  <option value="tools">Verktyg</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Antal & Enhet
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={shareForm.quantity}
                    onChange={(e) => setShareForm({ ...shareForm, quantity: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                    placeholder="10"
                    required
                    min="0"
                    step="0.1"
                  />
                  <select
                    value={shareForm.unit}
                    onChange={(e) => setShareForm({ ...shareForm, unit: e.target.value })}
                    className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                  >
                    <option value="st">st</option>
                    <option value="kg">kg</option>
                    <option value="L">L</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tillgänglig till (valfritt)
                </label>
                <input
                  type="date"
                  value={shareForm.availableUntil}
                  onChange={(e) => setShareForm({ ...shareForm, availableUntil: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plats (valfritt)
                </label>
                <input
                  type="text"
                  value={shareForm.location}
                  onChange={(e) => setShareForm({ ...shareForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                  placeholder="t.ex. Hemma hos mig, Mötesplatsen"
                />
              </div>
              
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anteckning (valfritt)
                  </label>
                  <textarea
                    value={shareForm.notes}
                    onChange={(e) => setShareForm({ ...shareForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                    rows={3}
                    placeholder="Eventuella detaljer eller instruktioner..."
                  />
                </div>
              </div>
              
              <div className="flex gap-3 p-6 pt-4 border-t border-gray-200 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors font-medium"
                >
                  {editingResource ? 'Spara ändringar' : 'Dela resurs'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Help Request Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full my-8 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900">Be om hjälp</h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateHelpRequest} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto p-6 space-y-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titel
                </label>
                <input
                  type="text"
                  value={helpForm.title}
                  onChange={(e) => setHelpForm({ ...helpForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                  placeholder="t.ex. Behöver hjälp med transport"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beskrivning
                </label>
                <textarea
                  value={helpForm.description}
                  onChange={(e) => setHelpForm({ ...helpForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                  rows={4}
                  placeholder="Beskriv vad du behöver hjälp med..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori
                </label>
                <select
                  value={helpForm.category}
                  onChange={(e) => setHelpForm({ ...helpForm, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                >
                  <option value="food">Mat</option>
                  <option value="water">Vatten</option>
                  <option value="medicine">Medicin</option>
                  <option value="energy">Energi</option>
                  <option value="tools">Verktyg</option>
                  <option value="shelter">Boende</option>
                  <option value="transport">Transport</option>
                  <option value="skills">Kompetens</option>
                  <option value="other">Övrigt</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brådskande
                </label>
                <select
                  value={helpForm.urgency}
                  onChange={(e) => setHelpForm({ ...helpForm, urgency: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                >
                  <option value="low">Låg</option>
                  <option value="medium">Medium</option>
                  <option value="high">Hög</option>
                  <option value="critical">Kritisk</option>
                </select>
              </div>
              
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plats (valfritt)
                  </label>
                  <input
                    type="text"
                    value={helpForm.location}
                    onChange={(e) => setHelpForm({ ...helpForm, location: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                    placeholder="t.ex. Hemma, På torget"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 p-6 pt-4 border-t border-gray-200 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors font-medium"
                >
                  Skicka förfrågan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

