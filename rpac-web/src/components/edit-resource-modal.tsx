'use client';

import { useState } from 'react';
import { X, Save, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { resourceService, Resource } from '@/lib/supabase';

interface EditResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource;
  onSuccess: () => void;
}

export function EditResourceModal({
  isOpen,
  onClose,
  resource,
  onSuccess
}: EditResourceModalProps) {
  const [form, setForm] = useState({
    name: resource.name,
    quantity: resource.quantity,
    unit: resource.unit,
    days_remaining: resource.days_remaining,
    is_filled: resource.is_filled
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      setError('Namn krävs');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await resourceService.updateResource(resource.id, form);
      
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error updating resource:', err);
      setError('Kunde inte uppdatera resurs. Försök igen.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Redigera resurs
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Uppdatera detaljer för {resource.name}
            </p>
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
                Resurs uppdaterad!
              </h3>
              <p className="text-gray-600">
                Ändringarna har sparats
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-900">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Namn på resurs *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Antal *
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Enhet *
                    </label>
                    <input
                      type="text"
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Hållbarhet (dagar) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.days_remaining === 0 ? '' : form.days_remaining}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm({ ...form, days_remaining: val === '' ? 0 : parseInt(val) });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    T.ex. 365 = 1 år, 730 = 2 år, 99999 = obegränsad
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !form.name.trim()}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin" size={20} />
                        Sparar...
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        Spara ändringar
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

