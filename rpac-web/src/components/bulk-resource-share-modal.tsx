'use client';

import { useState, useEffect } from 'react';
import { X, Share2, Users, CheckCircle, AlertCircle, Loader, ChevronRight, Shield } from 'lucide-react';
import { t } from '@/lib/locales';
import { Resource } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

interface Community {
  id: string;
  name: string;
  description: string;
  member_count: number;
  postal_code?: string;
}

interface SelectedResource extends Resource {
  shareQuantity: number;
}

interface BulkResourceShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: Resource[];
  userId: string;
  onSuccess: () => void;
}

export function BulkResourceShareModal({
  isOpen,
  onClose,
  resources,
  userId,
  onSuccess
}: BulkResourceShareModalProps) {
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [selectedResources, setSelectedResources] = useState<Map<string, SelectedResource>>(new Map());
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');
  const [commonAvailableUntil, setCommonAvailableUntil] = useState('');
  const [commonLocation, setCommonLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Filter to only filled resources
  const availableResources = resources.filter(r => r.is_filled && r.quantity > 0);

  useEffect(() => {
    if (isOpen) {
      loadUserCommunities();
      setStep('select');
      setSelectedResources(new Map());
      setSelectedCommunityId('');
      setCommonAvailableUntil('');
      setCommonLocation('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  const loadUserCommunities = async () => {
    try {
      setLoadingCommunities(true);
      
      const { data: memberships, error: membershipError } = await supabase
        .from('community_memberships')
        .select(`
          community_id,
          local_communities!inner(
            id,
            community_name,
            description,
            postal_code
          )
        `)
        .eq('user_id', userId);

      if (membershipError) throw membershipError;

      const communityIds = (memberships || []).map(m => m.community_id);
      const { data: counts } = await supabase
        .from('community_memberships')
        .select('community_id')
        .in('community_id', communityIds);

      const memberCounts = (counts || []).reduce((acc, item) => {
        acc[item.community_id] = (acc[item.community_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const communitiesList = (memberships || []).map(m => {
        const comm = m.local_communities as any;
        return {
          id: comm.id,
          name: comm.community_name,
          description: comm.description,
          postal_code: comm.postal_code,
          member_count: memberCounts[comm.id] || 0
        };
      });

      setCommunities(communitiesList);
    } catch (err) {
      console.error('Error loading communities:', err);
      setError('Kunde inte ladda dina samhällen');
    } finally {
      setLoadingCommunities(false);
    }
  };

  const toggleResource = (resource: Resource) => {
    const newSelected = new Map(selectedResources);
    if (newSelected.has(resource.id)) {
      newSelected.delete(resource.id);
    } else {
      newSelected.set(resource.id, {
        ...resource,
        shareQuantity: resource.quantity
      });
    }
    setSelectedResources(newSelected);
  };

  const selectAll = () => {
    const newSelected = new Map<string, SelectedResource>();
    availableResources.forEach(resource => {
      newSelected.set(resource.id, {
        ...resource,
        shareQuantity: resource.quantity
      });
    });
    setSelectedResources(newSelected);
  };

  const deselectAll = () => {
    setSelectedResources(new Map());
  };

  const updateShareQuantity = (resourceId: string, quantity: number) => {
    const newSelected = new Map(selectedResources);
    const resource = newSelected.get(resourceId);
    if (resource) {
      resource.shareQuantity = quantity;
      newSelected.set(resourceId, resource);
      setSelectedResources(newSelected);
    }
  };

  const handleNext = () => {
    if (selectedResources.size === 0) {
      setError('Välj minst en resurs att dela');
      return;
    }
    setError(null);
    setStep('configure');
  };

  const handleBack = () => {
    setStep('select');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedCommunityId) {
      setError('Välj ett samhälle att dela med');
      return;
    }

    if (selectedResources.size === 0) {
      setError('Inga resurser valda');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const sharePromises = Array.from(selectedResources.values()).map(resource => {
        return supabase.from('resource_sharing').insert([{
          user_id: userId,
          community_id: selectedCommunityId,
          resource_name: resource.name,
          category: resource.category,
          resource_category: resource.category,
          unit: resource.unit,
          resource_unit: resource.unit,
          quantity: resource.shareQuantity,
          shared_quantity: resource.shareQuantity,
          available_until: commonAvailableUntil || null,
          location: commonLocation || null,
          notes: null,
          status: 'available'
        }]);
      });

      const results = await Promise.all(sharePromises);
      
      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error('Kunde inte dela alla resurser');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error sharing resources:', err);
      setError('Kunde inte dela resurser. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] rounded-xl flex items-center justify-center">
              <Share2 size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Dela resurser med samhället
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {step === 'select' 
                  ? 'Välj resurser att dela' 
                  : `Dela ${selectedResources.size} resurser`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Resurser delade!
              </h3>
              <p className="text-gray-600">
                {selectedResources.size} resurser har delats med samhället
              </p>
            </div>
          ) : step === 'select' ? (
            <>
              {/* Selection Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-gray-600">
                  {selectedResources.size} av {availableResources.length} valda
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="px-4 py-2 text-sm font-medium text-[#3D4A2B] bg-[#3D4A2B]/10 rounded-lg hover:bg-[#3D4A2B]/20 transition-colors"
                  >
                    Välj alla
                  </button>
                  <button
                    onClick={deselectAll}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Avmarkera alla
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-900">{error}</p>
                </div>
              )}

              {/* Resource List */}
              <div className="space-y-2">
                {availableResources.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📦</div>
                    <p className="text-gray-600">
                      Du har inga ifyllda resurser att dela än
                    </p>
                  </div>
                ) : (
                  availableResources.map(resource => {
                    const isSelected = selectedResources.has(resource.id);
                    return (
                      <button
                        key={resource.id}
                        onClick={() => toggleResource(resource)}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-[#3D4A2B] bg-[#3D4A2B]/5'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                            isSelected 
                              ? 'border-[#3D4A2B] bg-[#3D4A2B]' 
                              : 'border-gray-300'
                          }`}>
                            {isSelected && <CheckCircle size={18} className="text-white" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-gray-900">{resource.name}</h4>
                              {resource.is_msb_recommended && (
                                <span className="text-xs bg-[#556B2F]/10 text-[#556B2F] px-2 py-1 rounded">
                                  MSB
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {resource.quantity} {resource.unit} tillgängligt
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <>
              {/* Configure Step */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-900">{error}</p>
                </div>
              )}

              {/* Community Selection */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  <Users size={16} className="inline mr-2" />
                  Välj samhälle
                </label>
                {loadingCommunities ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="animate-spin text-[#3D4A2B]" size={24} />
                  </div>
                ) : communities.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                      Du är inte medlem i något samhälle än. Gå med i ett samhälle för att kunna dela resurser.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {communities.map(community => (
                      <button
                        key={community.id}
                        type="button"
                        onClick={() => setSelectedCommunityId(community.id)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          selectedCommunityId === community.id
                            ? 'border-[#3D4A2B] bg-[#3D4A2B]/5'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-1">{community.name}</h4>
                            {community.description && (
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {community.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              {community.member_count} {community.member_count === 1 ? 'medlem' : 'medlemmar'}
                            </p>
                          </div>
                          {selectedCommunityId === community.id && (
                            <CheckCircle size={24} className="text-[#3D4A2B] flex-shrink-0 ml-3" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Common Parameters */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Tillgänglig till (valfritt)
                  </label>
                  <input
                    type="date"
                    value={commonAvailableUntil}
                    onChange={(e) => setCommonAvailableUntil(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Plats (valfritt)
                  </label>
                  <input
                    type="text"
                    value={commonLocation}
                    onChange={(e) => setCommonLocation(e.target.value)}
                    placeholder="T.ex. Min adress, Samlingspunkt A..."
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Selected Resources with Quantity Adjustment */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  Valda resurser ({selectedResources.size})
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Array.from(selectedResources.values()).map(resource => (
                    <div key={resource.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900">{resource.name}</h4>
                        <span className="text-sm text-gray-600">
                          Max: {resource.quantity} {resource.unit}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          value={resource.shareQuantity}
                          onChange={(e) => updateShareQuantity(resource.id, Number(e.target.value))}
                          min="0.1"
                          max={resource.quantity}
                          step="0.1"
                          className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                        />
                        <span className="text-sm font-medium text-gray-700">{resource.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200">
            {step === 'select' ? (
              <>
                <button
                  onClick={onClose}
                  className="px-6 py-3 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleNext}
                  disabled={selectedResources.size === 0}
                  className="px-6 py-3 bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Nästa
                  <ChevronRight size={20} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleBack}
                  disabled={loading}
                  className="px-6 py-3 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  Tillbaka
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !selectedCommunityId}
                  className="px-6 py-3 bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin" size={20} />
                      Delar resurser...
                    </>
                  ) : (
                    <>
                      <Share2 size={20} />
                      Dela {selectedResources.size} resurser
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

