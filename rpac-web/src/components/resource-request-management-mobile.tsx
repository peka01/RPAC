'use client';

import { useState, useEffect } from 'react';
import { X, User, MessageSquare, CheckCircle, Clock, AlertCircle, Users, Mail, Calendar } from 'lucide-react';
import type { SharedResource, ResourceRequest } from '@/lib/resource-sharing-service';
import { resourceSharingService } from '@/lib/resource-sharing-service';

interface ResourceRequestManagementMobileProps {
  isOpen: boolean;
  onClose: () => void;
  resource: SharedResource | null;
  onUpdate: () => void;
}

export function ResourceRequestManagementMobile({
  isOpen,
  onClose,
  resource,
  onUpdate
}: ResourceRequestManagementMobileProps) {
  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ResourceRequest | null>(null);
  const [responseMessage, setResponseMessage] = useState('');

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
      onUpdate();
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
      onUpdate();
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
      onUpdate();
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
      <div className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">Hantera förfrågningar</h2>
              <p className="text-white/80 text-sm">{resource.resource_name}</p>
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
              <CheckCircle size={20} className="flex-shrink-0" />
              <span>Ändringarna har sparats!</span>
            </div>
          )}

          {requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">Inga förfrågningar än</p>
              <p className="text-sm text-gray-400 mt-2">När någon begär din resurs kommer den att visas här</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={20} className="text-[#5C6B47]" />
                    <span className="font-semibold text-gray-900">Sammanfattning</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-gray-600">{requests.filter(r => r.status === 'pending').length} väntande</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">{requests.filter(r => r.status === 'approved').length} godkända</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Requests List */}
              <div className="space-y-3">
                {requests.map((request) => (
                  <div key={request.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
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
                      <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
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
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
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
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveRequest(request.id)}
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-all disabled:opacity-50 min-h-[44px] touch-manipulation"
                          >
                            Godkänn
                          </button>
                          <button
                            onClick={() => handleDenyRequest(request.id)}
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all disabled:opacity-50 min-h-[44px] touch-manipulation"
                          >
                            Neka
                          </button>
                        </div>
                        
                        <textarea
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                          placeholder="Lägg till meddelande (valfritt)..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5C6B47] focus:border-transparent resize-none"
                          rows={2}
                        />
                      </div>
                    )}

                    {request.status === 'approved' && (
                      <div className="space-y-3">
                        <button
                          onClick={() => handleCompleteRequest(request.id)}
                          disabled={loading}
                          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 min-h-[44px] touch-manipulation"
                        >
                          Markera som slutförd
                        </button>
                        
                        <textarea
                          value={responseMessage}
                          onChange={(e) => setResponseMessage(e.target.value)}
                          placeholder="Lägg till meddelande (valfritt)..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5C6B47] focus:border-transparent resize-none"
                          rows={2}
                        />
                      </div>
                    )}

                    {request.status === 'completed' && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle size={16} />
                        <span>Slutförd {request.completed_at && new Date(request.completed_at).toLocaleDateString('sv-SE')}</span>
                      </div>
                    )}

                    {request.status === 'denied' && (
                      <div className="flex items-center gap-2 text-sm text-red-600">
                        <AlertCircle size={16} />
                        <span>Nekad {request.responded_at && new Date(request.responded_at).toLocaleDateString('sv-SE')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
