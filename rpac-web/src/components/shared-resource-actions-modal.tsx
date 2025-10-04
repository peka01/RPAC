'use client';

import { useState } from 'react';
import { X, Edit2, Trash2, ToggleLeft, ToggleRight, AlertCircle, Check } from 'lucide-react';
import type { SharedResource } from '@/lib/resource-sharing-service';

interface SharedResourceActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: SharedResource | null;
  onUpdate: (updates: Partial<SharedResource>) => Promise<void>;
  onDelete: () => Promise<void>;
}

export function SharedResourceActionsModal({
  isOpen,
  onClose,
  resource,
  onUpdate,
  onDelete
}: SharedResourceActionsModalProps) {
  const [mode, setMode] = useState<'menu' | 'edit' | 'delete' | 'toggle'>('menu');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    quantity: resource?.shared_quantity || 0,
    availableUntil: resource?.available_until || '',
    location: resource?.location || '',
    notes: resource?.notes || ''
  });

  if (!isOpen || !resource) return null;

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onUpdate({
        shared_quantity: editForm.quantity,
        available_until: editForm.availableUntil || undefined,
        location: editForm.location || undefined,
        notes: editForm.notes || undefined
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error updating resource:', err);
      setError('Kunde inte uppdatera resurs');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    setLoading(true);
    setError(null);

    try {
      const newStatus = resource.status === 'available' ? 'reserved' : 'available';
      await onUpdate({ status: newStatus });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error toggling availability:', err);
      setError('Kunde inte ändra tillgänglighet');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      await onDelete();
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error deleting resource:', err);
      setError('Kunde inte ta bort resurs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {mode === 'menu' && 'Hantera delad resurs'}
                {mode === 'edit' && 'Redigera resurs'}
                {mode === 'delete' && 'Ta bort resurs'}
                {mode === 'toggle' && 'Ändra tillgänglighet'}
              </h2>
              <p className="text-white/80">{resource.resource_name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-3">
              <Check size={20} className="flex-shrink-0" />
              <span>Ändringarna har sparats!</span>
            </div>
          )}

          {/* Menu Mode */}
          {mode === 'menu' && (
            <div className="space-y-3">
              <button
                onClick={() => setMode('edit')}
                className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-left group"
              >
                <div className="w-12 h-12 bg-[#5C6B47]/20 rounded-lg flex items-center justify-center group-hover:bg-[#5C6B47]/30 transition-colors">
                  <Edit2 size={24} className="text-[#3D4A2B]" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Redigera detaljer</div>
                  <div className="text-sm text-gray-600">Ändra antal, plats eller anteckningar</div>
                </div>
              </button>

              <button
                onClick={() => setMode('toggle')}
                className="w-full flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-left group"
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                  resource.status === 'available' 
                    ? 'bg-green-100 group-hover:bg-green-200' 
                    : 'bg-gray-200 group-hover:bg-gray-300'
                }`}>
                  {resource.status === 'available' ? (
                    <ToggleRight size={24} className="text-green-600" />
                  ) : (
                    <ToggleLeft size={24} className="text-gray-600" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-gray-900">
                    {resource.status === 'available' ? 'Markera som ej tillgänglig' : 'Markera som tillgänglig'}
                  </div>
                  <div className="text-sm text-gray-600">
                    Status: <span className="font-semibold">{resource.status === 'available' ? 'Tillgänglig' : 'Ej tillgänglig'}</span>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode('delete')}
                className="w-full flex items-center gap-4 p-4 bg-red-50 hover:bg-red-100 rounded-xl transition-all text-left group"
              >
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <Trash2 size={24} className="text-red-600" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">Ta bort från delning</div>
                  <div className="text-sm text-gray-600">Resursen kommer inte längre vara delad</div>
                </div>
              </button>
            </div>
          )}

          {/* Edit Mode */}
          {mode === 'edit' && (
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Antal delat
                </label>
                <input
                  type="number"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })}
                  min="1"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Tillgänglig till (valfritt)
                </label>
                <input
                  type="date"
                  value={editForm.availableUntil}
                  onChange={(e) => setEditForm({ ...editForm, availableUntil: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Plats (valfritt)
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="T.ex. mitt garage, 123 Gatan"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Anteckningar (valfritt)
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={3}
                  placeholder="T.ex. kontakta mig innan, kan leverera"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMode('menu')}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Tillbaka
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Sparar...' : 'Spara ändringar'}
                </button>
              </div>
            </form>
          )}

          {/* Toggle Mode */}
          {mode === 'toggle' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-6 text-center">
                <p className="text-gray-900 mb-2">
                  Vill du ändra tillgängligheten för denna resurs?
                </p>
                <p className="text-sm text-gray-600">
                  {resource.status === 'available' 
                    ? 'Resursen kommer att markeras som ej tillgänglig för tillfället'
                    : 'Resursen kommer att bli tillgänglig för andra medlemmar igen'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMode('menu')}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleToggleAvailability}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-br from-[#556B2F] to-[#3D4A2B] text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Ändrar...' : 'Bekräfta'}
                </button>
              </div>
            </div>
          )}

          {/* Delete Mode */}
          {mode === 'delete' && (
            <div className="space-y-4">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-red-900 mb-2">
                      Är du säker på att du vill ta bort denna delning?
                    </p>
                    <p className="text-sm text-red-700">
                      Resursen kommer inte längre vara synlig för samhället. Detta går inte att ångra.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMode('menu')}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all"
                >
                  Avbryt
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Tar bort...' : 'Ta bort'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

