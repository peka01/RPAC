'use client';

import { useState, useEffect } from 'react';
import { X, Edit2, Trash2, ToggleLeft, ToggleRight, AlertCircle, Check, Users, Clock, CheckCircle, MessageSquare, User, Mail, Calendar } from 'lucide-react';
import type { SharedResource, ResourceRequest } from '@/lib/resource-sharing-service';
import { resourceSharingService } from '@/lib/resource-sharing-service';

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
  const [mode, setMode] = useState<'menu' | 'edit' | 'delete' | 'toggle' | 'requests'>('menu');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ResourceRequest | null>(null);
  const [responseMessage, setResponseMessage] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState({
    quantity: resource?.shared_quantity || 0,
    availableUntil: resource?.available_until || '',
    location: resource?.location || '',
    notes: resource?.notes || ''
  });

  // Load requests when modal opens
  useEffect(() => {
    if (isOpen && resource) {
      loadRequests();
    }
  }, [isOpen, resource]);

  const loadRequests = async () => {
    if (!resource) return;
    
    try {
      const data = await resourceSharingService.getSharedResourceRequests(resource.id);
      setRequests(data);
    } catch (err) {
      console.error('Error loading requests:', err);
      // If the table doesn't exist yet, just set empty array
      setRequests([]);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setLoading(true);
    setError(null);

    try {
      await resourceSharingService.approveResourceRequest(requestId, responseMessage || undefined);
      setSuccess(true);
      await loadRequests();
      // Notify parent component to reload data
      await onUpdate({});
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error approving request:', err);
      setError('Kunde inte godkänna förfrågan');
    } finally {
      setLoading(false);
    }
  };

  const handleDenyRequest = async (requestId: string) => {
    setLoading(true);
    setError(null);

    try {
      await resourceSharingService.denyResourceRequest(requestId, responseMessage || undefined);
      setSuccess(true);
      await loadRequests();
      // Notify parent component to reload data
      await onUpdate({});
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error denying request:', err);
      setError('Kunde inte neka förfrågan');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRequest = async (requestId: string) => {
    setLoading(true);
    setError(null);

    try {
      await resourceSharingService.completeResourceRequest(requestId);
      setSuccess(true);
      await loadRequests();
      // Notify parent component to reload data
      await onUpdate({});
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error completing request:', err);
      setError('Kunde inte markera som slutförd');
    } finally {
      setLoading(false);
    }
  };

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
      // Toggle between 'available' and 'taken' instead of 'reserved'
      const newStatus = resource.status === 'available' ? 'taken' : 'available';
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
                {mode === 'requests' && 'Hantera förfrågningar'}
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

              {/* Request Management Button */}
              {requests.length > 0 && (
                <button
                  onClick={() => setMode('requests')}
                  className="w-full flex items-center gap-4 p-4 bg-[#5C6B47]/10 hover:bg-[#5C6B47]/20 rounded-xl transition-all text-left group"
                >
                  <div className="w-12 h-12 bg-[#5C6B47]/20 rounded-lg flex items-center justify-center group-hover:bg-[#5C6B47]/30 transition-colors">
                    <Users size={24} className="text-[#5C6B47]" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Hantera förfrågningar</div>
                    <div className="text-sm text-gray-600">
                      {requests.filter(r => r.status === 'pending').length} väntande • {requests.filter(r => r.status === 'approved').length} godkända
                    </div>
                  </div>
                </button>
              )}

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

          {/* Requests Management Mode */}
          {mode === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Förfrågningar för {resource.resource_name}</h3>
                <button
                  onClick={() => setMode('menu')}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Tillbaka
                </button>
              </div>

              {requests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Inga förfrågningar än</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {requests.map((request) => (
                    <div key={request.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#5C6B47]/20 rounded-lg flex items-center justify-center">
                            <User size={20} className="text-[#5C6B47]" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {request.requester_name || 'Okänd användare'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {request.requested_quantity} {resource.resource_unit || 'st'} • {new Date(request.requested_at).toLocaleDateString('sv-SE')}
                            </div>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          request.status === 'approved' ? 'bg-green-100 text-green-700' :
                          request.status === 'denied' ? 'bg-red-100 text-red-700' :
                          request.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {request.status === 'pending' ? 'Väntande' :
                           request.status === 'approved' ? 'Godkänd' :
                           request.status === 'denied' ? 'Nekad' :
                           request.status === 'completed' ? 'Slutförd' :
                           'Avbruten'}
                        </div>
                      </div>

                      {request.message && (
                        <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-start gap-2">
                            <MessageSquare size={16} className="text-gray-400 mt-0.5" />
                            <p className="text-sm text-gray-700">{request.message}</p>
                          </div>
                        </div>
                      )}

                      {request.response_message && (
                        <div className="mb-3 p-3 bg-[#5C6B47]/5 rounded-lg border border-[#5C6B47]/20">
                          <div className="flex items-start gap-2">
                            <CheckCircle size={16} className="text-[#5C6B47] mt-0.5" />
                            <p className="text-sm text-gray-700">{request.response_message}</p>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveRequest(request.id)}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-all disabled:opacity-50"
                          >
                            Godkänn
                          </button>
                          <button
                            onClick={() => handleDenyRequest(request.id)}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all disabled:opacity-50"
                          >
                            Neka
                          </button>
                        </div>
                      )}

                      {request.status === 'approved' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCompleteRequest(request.id)}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all disabled:opacity-50"
                          >
                            Markera som slutförd
                          </button>
                        </div>
                      )}

                      {/* Response Message Input */}
                      {(request.status === 'pending' || request.status === 'approved') && (
                        <div className="mt-3">
                          <textarea
                            value={responseMessage}
                            onChange={(e) => setResponseMessage(e.target.value)}
                            placeholder="Lägg till meddelande (valfritt)..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5C6B47] focus:border-transparent resize-none"
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

