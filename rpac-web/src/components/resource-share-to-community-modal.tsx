'use client';

import { useState, useEffect } from 'react';
import { X, Share2, Users, Calendar, MapPin, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { t } from '@/lib/locales';
import { resourceSharingService } from '@/lib/resource-sharing-service';
import { Resource } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

interface Community {
  id: string;
  name: string;
  description: string;
  member_count: number;
  postal_code?: string;
}

interface ResourceShareToCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource;
  userId: string;
  onSuccess: () => void;
}

export function ResourceShareToCommunityModal({
  isOpen,
  onClose,
  resource,
  userId,
  onSuccess
}: ResourceShareToCommunityModalProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [shareForm, setShareForm] = useState({
    communityId: '',
    sharedQuantity: resource.quantity,
    availableUntil: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadUserCommunities();
      // Reset form when opening
      setShareForm({
        communityId: '',
        sharedQuantity: resource.quantity,
        availableUntil: '',
        location: '',
        notes: ''
      });
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, resource.quantity]);

  const loadUserCommunities = async () => {
    try {
      setLoading(true);
      
      // Get communities user is a member of
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

      // Get member counts for each community
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
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shareForm.communityId) {
      setError('Välj ett samhälle att dela med');
      return;
    }

    if (shareForm.sharedQuantity <= 0 || shareForm.sharedQuantity > resource.quantity) {
      setError(`Ange ett antal mellan 1 och ${resource.quantity}`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Share resource directly (without needing resource_id in resources table)
      const { supabase } = await import('@/lib/supabase');
      const { error: shareError } = await supabase
        .from('resource_sharing')
        .insert([{
          user_id: userId,
          community_id: shareForm.communityId,
          resource_name: resource.name,
          category: resource.category,
          resource_category: resource.category,
          unit: resource.unit,
          resource_unit: resource.unit,
          quantity: shareForm.sharedQuantity,
          shared_quantity: shareForm.sharedQuantity,
          available_until: shareForm.availableUntil || null,
          location: shareForm.location || null,
          notes: shareForm.notes || null,
          status: 'available'
        }]);

      if (shareError) throw shareError;

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error sharing resource:', err);
      setError('Kunde inte dela resurs. Försök igen.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]"
      onClick={(e) => {
        // Prevent backdrop clicks from closing
        e.stopPropagation();
      }}
    >
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#3D4A2B]/10 rounded-xl flex items-center justify-center">
              <Share2 size={24} className="text-[#3D4A2B]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {t('resources.sharing.share_with_community')}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Dela "{resource.name}" med dina samhällen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Resource Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{resource.name}</h3>
                <p className="text-sm text-gray-600">
                  {t('resources.categories.' + resource.category)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#3D4A2B]">
                  {resource.quantity} {resource.unit}
                </div>
                <p className="text-xs text-gray-600">Tillgängligt</p>
              </div>
            </div>
          </div>

          {/* Community Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              <Users size={16} className="inline mr-2" />
              Välj samhälle
            </label>
            {loading ? (
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
                    onClick={() => setShareForm({ ...shareForm, communityId: community.id })}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      shareForm.communityId === community.id
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
                      {shareForm.communityId === community.id && (
                        <CheckCircle size={24} className="text-[#3D4A2B] flex-shrink-0 ml-3" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Antal att dela
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={shareForm.sharedQuantity}
                onChange={(e) => setShareForm({ ...shareForm, sharedQuantity: Number(e.target.value) })}
                min="1"
                max={resource.quantity}
                step="0.1"
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent text-lg font-bold"
                required
              />
              <span className="text-lg font-bold text-gray-600">{resource.unit}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Max: {resource.quantity} {resource.unit}
            </p>
          </div>

          {/* Available Until */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              <Calendar size={16} className="inline mr-2" />
              Tillgänglig till (valfritt)
            </label>
            <input
              type="date"
              value={shareForm.availableUntil}
              onChange={(e) => setShareForm({ ...shareForm, availableUntil: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              <MapPin size={16} className="inline mr-2" />
              Plats (valfritt)
            </label>
            <input
              type="text"
              value={shareForm.location}
              onChange={(e) => setShareForm({ ...shareForm, location: e.target.value })}
              placeholder="t.ex. Hemma hos mig, Centrala torget"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Anteckning (valfritt)
            </label>
            <textarea
              value={shareForm.notes}
              onChange={(e) => setShareForm({ ...shareForm, notes: e.target.value })}
              rows={3}
              placeholder="Eventuella detaljer eller instruktioner..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-800 text-sm font-bold">
                Resurs delad med samhället! 🎉
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-bold disabled:opacity-50"
          >
            {t('community.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || communities.length === 0 || success}
            className="flex-1 px-6 py-3 bg-[#3D4A2B] text-white rounded-xl hover:bg-[#2A331E] transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader className="animate-spin" size={20} />
                <span>Delar...</span>
              </>
            ) : success ? (
              <>
                <CheckCircle size={20} />
                <span>Delad!</span>
              </>
            ) : (
              <>
                <Share2 size={20} />
                <span>Dela resurs</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

