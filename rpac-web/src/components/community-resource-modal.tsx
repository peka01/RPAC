'use client';

import { useState } from 'react';
import { X, AlertCircle, Check, Building2, Wrench, BookOpen, Info } from 'lucide-react';
import type { CommunityResource } from '@/lib/community-resource-service';

interface CommunityResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (resource: Partial<CommunityResource>) => Promise<void>;
  resource?: CommunityResource; // If editing
  mode: 'add' | 'edit';
}

const resourceTypeConfig = {
  equipment: { icon: Wrench, emoji: '🔧', label: 'Utrustning', description: 'Verktyg, maskiner, redskap' },
  facility: { icon: Building2, emoji: '🏛️', label: 'Facilitet', description: 'Lokaler, utrymmen, platser' },
  skill: { icon: BookOpen, emoji: '📚', label: 'Kompetens', description: 'Kunskap, färdigheter' },
  information: { icon: Info, emoji: 'ℹ️', label: 'Information', description: 'Dokument, guider, kontakter' }
};

const categoryConfig = {
  food: { emoji: '🍞', label: 'Mat' },
  water: { emoji: '💧', label: 'Vatten' },
  medicine: { emoji: '💊', label: 'Medicin' },
  energy: { emoji: '⚡', label: 'Energi' },
  tools: { emoji: '🔧', label: 'Verktyg' },
  other: { emoji: '✨', label: 'Övrigt' }
};

export function CommunityResourceModal({
  isOpen,
  onClose,
  onSubmit,
  resource,
  mode
}: CommunityResourceModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    resource_name: resource?.resource_name || '',
    resource_type: resource?.resource_type || ('equipment' as CommunityResource['resource_type']),
    category: resource?.category || ('tools' as CommunityResource['category']),
    quantity: resource?.quantity || 1,
    unit: resource?.unit || 'st',
    location: resource?.location || '',
    usage_instructions: resource?.usage_instructions || '',
    booking_required: resource?.booking_required || false,
    notes: resource?.notes || ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(form);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error saving community resource:', err);
      setError('Kunde inte spara resurs. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center md:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] md:max-h-[90vh] overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {mode === 'add' ? 'Lägg till samhällsresurs' : 'Redigera samhällsresurs'}
              </h2>
              <p className="text-white/80">Gemensam utrustning och faciliteter</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-3">
              <Check size={20} className="flex-shrink-0" />
              <span>Resursen har sparats!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resource Type Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Typ av resurs *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(resourceTypeConfig) as Array<keyof typeof resourceTypeConfig>).map(type => {
                  const config = resourceTypeConfig[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, resource_type: type })}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        form.resource_type === type
                          ? 'border-[#3D4A2B] bg-[#3D4A2B]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{config.emoji}</span>
                        <span className="font-bold text-gray-900">{config.label}</span>
                      </div>
                      <p className="text-xs text-gray-600">{config.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resource Name */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Namn på resursen *
              </label>
              <input
                type="text"
                value={form.resource_name}
                onChange={(e) => setForm({ ...form, resource_name: e.target.value })}
                placeholder="T.ex. Generator, Samlingslok al, Snickare"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Kategori *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(categoryConfig) as Array<keyof typeof categoryConfig>).map(cat => {
                  const config = categoryConfig[cat];
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        form.category === cat
                          ? 'border-[#3D4A2B] bg-[#3D4A2B]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{config.emoji}</div>
                      <div className="text-xs font-medium text-gray-900">{config.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity & Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Antal
                </label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  min="1"
                  step="0.01"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Enhet
                </label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="st, m², tim"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Plats (valfritt)
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="T.ex. Samlingshuset, Brandstationen"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
              />
            </div>

            {/* Usage Instructions */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Användningsinstruktioner (valfritt)
              </label>
              <textarea
                value={form.usage_instructions}
                onChange={(e) => setForm({ ...form, usage_instructions: e.target.value })}
                rows={3}
                placeholder="Hur används resursen? Vad behöver man tänka på?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent resize-none"
              />
            </div>

            {/* Booking Required */}
            <div className="bg-gray-50 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.booking_required}
                  onChange={(e) => setForm({ ...form, booking_required: e.target.checked })}
                  className="mt-1 w-5 h-5 text-[#3D4A2B] border-gray-300 rounded focus:ring-[#3D4A2B]"
                />
                <div>
                  <div className="font-bold text-gray-900">Bokning krävs</div>
                  <div className="text-sm text-gray-600">
                    Medlemmar måste boka innan de använder resursen
                  </div>
                </div>
              </label>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Anteckningar (valfritt)
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Övrig information, kontaktuppgifter, begränsningar"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent resize-none"
              />
            </div>
          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex-shrink-0">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all"
            >
              Avbryt
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !form.resource_name}
              className="flex-1 px-6 py-3 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Sparar...' : mode === 'add' ? 'Lägg till' : 'Spara ändringar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

