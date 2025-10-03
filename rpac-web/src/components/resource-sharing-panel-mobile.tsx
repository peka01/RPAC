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
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { t } from '@/lib/locales';
import { resourceSharingService, type SharedResource, type HelpRequest } from '@/lib/resource-sharing-service';
import type { User } from '@supabase/supabase-js';

interface ResourceSharingPanelMobileProps {
  user: User;
  communityId: string;
  onSendMessage?: (content: string) => void;
}

export function ResourceSharingPanelMobile({ user, communityId, onSendMessage }: ResourceSharingPanelMobileProps) {
  const [activeTab, setActiveTab] = useState<'resources' | 'help'>('resources');
  const [sharedResources, setSharedResources] = useState<SharedResource[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showHelpSheet, setShowHelpSheet] = useState(false);

  const [shareForm, setShareForm] = useState({
    resourceName: '',
    category: 'food' as 'food' | 'water' | 'medicine' | 'energy' | 'tools',
    quantity: '',
    unit: 'st',
    availableUntil: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    if (communityId) {
      loadData();
    }
  }, [communityId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resources, requests] = await Promise.all([
        resourceSharingService.getCommunityResources(communityId),
        resourceSharingService.getCommunityHelpRequests(communityId)
      ]);
      
      setSharedResources(resources);
      setHelpRequests(requests);
    } catch (err) {
      console.error('Error loading community data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShareResource = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { supabase } = await import('@/lib/supabase');
      await supabase.from('resource_sharing').insert([{
        user_id: user.id,
        community_id: communityId,
        resource_name: shareForm.resourceName,
        category: shareForm.category,
        resource_category: shareForm.category,
        unit: shareForm.unit,
        resource_unit: shareForm.unit,
        quantity: parseFloat(shareForm.quantity),
        shared_quantity: parseFloat(shareForm.quantity),
        available_until: shareForm.availableUntil || null,
        location: shareForm.location || null,
        notes: shareForm.notes || null,
        status: 'available'
      }]);
      
      await loadData();
      setShowShareSheet(false);
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
    }
  };

  const handleRequestResource = async (resource: SharedResource) => {
    try {
      await resourceSharingService.requestResource(resource.id, user.id);
      await loadData();
    } catch (err) {
      console.error('Error requesting resource:', err);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return '🍞';
      case 'water': return '💧';
      case 'medicine': return '💊';
      case 'energy': return '⚡';
      case 'tools': return '🔧';
      default: return '📦';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'food': return 'from-amber-500 to-orange-600';
      case 'water': return 'from-blue-400 to-blue-600';
      case 'medicine': return 'from-red-400 to-pink-600';
      case 'energy': return 'from-yellow-400 to-amber-500';
      case 'tools': return 'from-gray-500 to-gray-700';
      default: return 'from-[#3D4A2B] to-[#2A331E]';
    }
  };

  // Share Sheet Modal
  const ShareSheet = () => (
    <div 
      className={`fixed inset-0 bg-black/50 z-50 transition-opacity ${
        showShareSheet ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setShowShareSheet(false)}
    >
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-transform max-h-[90vh] overflow-y-auto ${
          showShareSheet ? 'translate-y-0' : 'translate-y-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleShareResource} className="p-6 pb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="text-[#3D4A2B]" size={28} />
              Dela resurs
            </h3>
            <button
              type="button"
              onClick={() => setShowShareSheet(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Kategori
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { value: 'food', label: 'Mat', emoji: '🍞' },
                  { value: 'water', label: 'Vatten', emoji: '💧' },
                  { value: 'medicine', label: 'Medicin', emoji: '💊' },
                  { value: 'energy', label: 'Energi', emoji: '⚡' },
                  { value: 'tools', label: 'Verktyg', emoji: '🔧' }
                ].map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setShareForm({ ...shareForm, category: cat.value as any })}
                    className={`p-3 rounded-2xl border-2 transition-all touch-manipulation active:scale-95 ${
                      shareForm.category === cat.value
                        ? 'border-[#3D4A2B] bg-[#3D4A2B]/10 scale-105'
                        : 'border-gray-200 hover:border-[#3D4A2B]/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{cat.emoji}</div>
                    <div className={`text-xs font-medium ${
                      shareForm.category === cat.value ? 'text-[#3D4A2B]' : 'text-gray-600'
                    }`}>
                      {cat.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Resource Name */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Vad delar du? *
              </label>
              <input
                type="text"
                value={shareForm.resourceName}
                onChange={(e) => setShareForm({ ...shareForm, resourceName: e.target.value })}
                placeholder="t.ex. Pasta, Batterier, Första hjälpen-kit..."
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent text-base"
              />
            </div>

            {/* Quantity & Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Antal *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={shareForm.quantity}
                  onChange={(e) => setShareForm({ ...shareForm, quantity: e.target.value })}
                  placeholder="5"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Enhet
                </label>
                <select
                  value={shareForm.unit}
                  onChange={(e) => setShareForm({ ...shareForm, unit: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent text-base bg-white"
                >
                  <option value="st">st</option>
                  <option value="kg">kg</option>
                  <option value="liter">liter</option>
                  <option value="förpackning">förpackning</option>
                  <option value="låda">låda</option>
                </select>
              </div>
            </div>

            {/* Location (Optional) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Plats <span className="text-gray-400 font-normal">(valfritt)</span>
              </label>
              <input
                type="text"
                value={shareForm.location}
                onChange={(e) => setShareForm({ ...shareForm, location: e.target.value })}
                placeholder="Var kan man hämta detta?"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent text-base"
              />
            </div>

            {/* Notes (Optional) */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Anteckningar <span className="text-gray-400 font-normal">(valfritt)</span>
              </label>
              <textarea
                value={shareForm.notes}
                onChange={(e) => setShareForm({ ...shareForm, notes: e.target.value })}
                placeholder="Några särskilda detaljer..."
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent resize-none text-base"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-6 bg-[#3D4A2B] text-white font-bold py-4 px-6 rounded-xl hover:bg-[#2A331E] transition-all touch-manipulation active:scale-98 flex items-center justify-center gap-2"
          >
            <CheckCircle size={20} />
            Dela resurs
          </button>
        </form>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3D4A2B] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('resources')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all touch-manipulation active:scale-98 ${
            activeTab === 'resources'
              ? 'bg-[#3D4A2B] text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          Resurser ({sharedResources.length})
        </button>
        <button
          onClick={() => setActiveTab('help')}
          className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all touch-manipulation active:scale-98 ${
            activeTab === 'help'
              ? 'bg-[#3D4A2B] text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          Hjälp ({helpRequests.length})
        </button>
      </div>

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          {/* Share Button */}
          <button
            onClick={() => setShowShareSheet(true)}
            className="w-full bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all touch-manipulation active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-3">
                <Plus size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-lg">Dela en resurs</h3>
                <p className="text-white/80 text-sm">Hjälp någon i behov</p>
              </div>
              <ChevronRight size={24} />
            </div>
          </button>

          {/* Resources List */}
          {sharedResources.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <Package size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Inga resurser än</h3>
              <p className="text-gray-600 text-sm">Bli den första att dela något!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sharedResources.map((resource) => (
                <div
                  key={resource.id}
                  className="bg-white rounded-2xl border-2 border-gray-100 p-5 shadow-md"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`text-3xl w-14 h-14 flex items-center justify-center rounded-2xl bg-gradient-to-br ${getCategoryColor(resource.category)}`}>
                      <span className="drop-shadow-sm">{getCategoryIcon(resource.category)}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900 mb-1">
                        {resource.resource_name}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-semibold">{resource.quantity} {resource.unit}</span>
                        {resource.status === 'requested' && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                            Förfrågad
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {resource.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <MapPin size={14} />
                      <span>{resource.location}</span>
                    </div>
                  )}

                  {resource.notes && (
                    <p className="text-sm text-gray-700 mb-3 bg-gray-50 rounded-lg p-3">
                      {resource.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <UserIcon size={14} />
                      <span>{resource.sharer_name || 'Okänd'}</span>
                    </div>
                    
                    {resource.user_id !== user.id && resource.status === 'available' && (
                      <button
                        onClick={() => handleRequestResource(resource)}
                        className="px-4 py-2 bg-[#3D4A2B] text-white text-sm font-bold rounded-lg hover:bg-[#2A331E] transition-all touch-manipulation active:scale-95"
                      >
                        Begär
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Help Tab */}
      {activeTab === 'help' && (
        <div className="space-y-4">
          <button
            onClick={() => setShowHelpSheet(true)}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl p-5 shadow-xl hover:shadow-2xl transition-all touch-manipulation active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-full p-3">
                <AlertCircle size={24} strokeWidth={2.5} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-lg">Be om hjälp</h3>
                <p className="text-white/80 text-sm">Någon kan hjälpa dig</p>
              </div>
              <ChevronRight size={24} />
            </div>
          </button>

          {helpRequests.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <Heart size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Inga förfrågningar</h3>
              <p className="text-gray-600 text-sm">Bra! Alla verkar ha det de behöver</p>
            </div>
          ) : (
            <div className="space-y-3">
              {helpRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-2xl border-2 border-gray-100 p-5 shadow-md"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-bold text-lg text-gray-900">{request.title}</h4>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      request.urgency === 'critical' ? 'bg-red-100 text-red-700' :
                      request.urgency === 'high' ? 'bg-orange-100 text-orange-700' :
                      request.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {request.urgency === 'critical' ? 'Kritisk' :
                       request.urgency === 'high' ? 'Hög' :
                       request.urgency === 'medium' ? 'Medel' : 'Låg'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mb-4">{request.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <UserIcon size={14} />
                      <span>{request.requester_name || 'Okänd'}</span>
                    </div>
                    
                    {request.user_id !== user.id && (
                      <button
                        onClick={() => {
                          if (onSendMessage) {
                            onSendMessage(`Hej! Jag kan hjälpa till med: "${request.title}"`);
                          }
                        }}
                        className="px-4 py-2 bg-[#3D4A2B] text-white text-sm font-bold rounded-lg hover:bg-[#2A331E] transition-all touch-manipulation active:scale-95 flex items-center gap-1"
                      >
                        <Send size={14} />
                        Svara
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ShareSheet />
    </div>
  );
}

