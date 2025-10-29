'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  AlertTriangle,
  Eye,
  HeartHandshake,
  Loader2,
  Pencil,
  Trash,
  Image
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { t } from '@/lib/locales';
import { HelpRequestComposer, type HelpRequestFormValues } from './help-request-composer';
import { HelpRequestDetailSheet } from './help-request-detail-sheet';
import {
  helpRequestStatusConfig,
  helpRequestUrgencyConfig,
  helpStatusFilters
} from '@/constants/help-requests';
import { resourceSharingService, type HelpRequest, notificationService } from '@/lib/services';
import { useUserProfile } from '@/lib/useUserProfile';

interface HelpRequestsExperienceProps {
  user: User;
  communityId: string;
  communityName: string;
  requests: HelpRequest[];
  setRequests: React.Dispatch<React.SetStateAction<HelpRequest[]>>;
  isAdmin?: boolean;
  statusFilter?: 'all' | HelpRequest['status'];
  setStatusFilter?: (filter: 'all' | HelpRequest['status']) => void;
  searchQuery?: string;
  viewMode?: 'cards' | 'table';
  setViewMode?: (mode: 'cards' | 'table') => void;
}

const urgencyOrder: Record<HelpRequest['urgency'], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

export function HelpRequestsExperience({
  user,
  communityId,
  communityName,
  requests,
  setRequests,
  isAdmin = false,
  statusFilter: externalStatusFilter,
  setStatusFilter: externalSetStatusFilter,
  searchQuery: externalSearchQuery = '',
  viewMode: externalViewMode,
  setViewMode: externalSetViewMode
}: HelpRequestsExperienceProps) {
  const { profile } = useUserProfile(user);
  const [showComposer, setShowComposer] = useState(false);
  const [editingRequest, setEditingRequest] = useState<HelpRequest | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [internalStatusFilter, setInternalStatusFilter] = useState<'all' | HelpRequest['status']>('open');
  const [internalViewMode, setInternalViewMode] = useState<'cards' | 'table'>('cards');
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  
  // Use external state if provided, otherwise use internal
  const statusFilter = externalStatusFilter !== undefined ? externalStatusFilter : internalStatusFilter;
  const setStatusFilter = externalSetStatusFilter || setInternalStatusFilter;
  const searchQuery = externalSearchQuery || internalSearchQuery;
  const viewMode = externalViewMode !== undefined ? externalViewMode : internalViewMode;
  const setViewMode = externalSetViewMode || setInternalViewMode;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const handledQueryParam = useRef(false);

  // Listen for event from parent to open composer
  useEffect(() => {
    const handleOpenComposer = () => {
      setShowComposer(true);
    };

    window.addEventListener('openHelpComposer', handleOpenComposer);
    return () => window.removeEventListener('openHelpComposer', handleOpenComposer);
  }, []);

  useEffect(() => {
    if (handledQueryParam.current || typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    const queryId = url.searchParams.get('helpRequest');

    if (queryId) {
      const match = requests.find((request) => request.id === queryId);
      if (match) {
        setSelectedRequest(match);
        url.searchParams.delete('helpRequest');
        window.history.replaceState({}, '', url.toString());
        handledQueryParam.current = true;
      }
    }
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return requests
      .filter((request) => statusFilter === 'all' || request.status === statusFilter)
      .filter((request) => {
        if (!query) {
          return true;
        }
        return (
          request.title.toLowerCase().includes(query) ||
          request.description.toLowerCase().includes(query) ||
          (request.location?.toLowerCase().includes(query) ?? false)
        );
      })
      .sort((a, b) => {
        if (a.status === b.status) {
          const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
          if (urgencyDiff !== 0) {
            return urgencyDiff;
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        const statusRank: Record<HelpRequest['status'], number> = {
          open: 3,
          in_progress: 2,
          resolved: 1,
          closed: 0
        };
        return statusRank[b.status] - statusRank[a.status];
      });
  }, [requests, statusFilter, searchQuery]);

  const handleCreateRequest = async (values: HelpRequestFormValues) => {
    setIsSubmitting(true);
    setActionError(null);

    try {
      // If editing, update instead of create
      if (editingRequest) {
        const updated = await resourceSharingService.updateHelpRequest(editingRequest.id, user.id, {
          title: values.title,
          description: values.description,
          urgency: values.urgency,
          location: values.location,
          imageUrl: values.imageUrl
        });

        setRequests((previous) =>
          previous.map((request) =>
            request.id === editingRequest.id ? updated : request
          )
        );
        setSelectedRequest((current) => (current?.id === editingRequest.id ? updated : current));
        setEditingRequest(null);
      } else {
        const created = await resourceSharingService.createHelpRequest({
          userId: user.id,
          communityId,
          title: values.title,
          description: values.description,
          urgency: values.urgency,
          location: values.location,
          imageUrl: values.imageUrl
        });

        setRequests((previous) => {
          const withoutDuplicate = previous.filter((request) => request.id !== created.id);
          return [created, ...withoutDuplicate];
        });
      }
    } catch (error) {
      console.error('Failed to create/update help request', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        error
      });
      setActionError(t('community_resources.help.feedback.create_error'));
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (request: HelpRequest, status: HelpRequest['status']) => {
    setActionError(null);
    try {
      await resourceSharingService.updateHelpRequestStatus(request.id, user.id, status);
      setRequests((previous) =>
        previous.map((item) =>
          item.id === request.id
            ? {
                ...item,
                status,
                updated_at: new Date().toISOString()
              }
            : item
        )
      );
      setSelectedRequest((current) => (current?.id === request.id ? { ...current, status } : current));
    } catch (error) {
      console.error('Failed to update help request status', error);
      setActionError(t('community_resources.help.feedback.status_error'));
      throw error;
    }
  };

  const handleDeleteRequest = async (request: HelpRequest) => {
    setActionError(null);
    const confirmed = window.confirm(t('community_resources.help.feedback.delete_confirm'));
    if (!confirmed) {
      return;
    }

    try {
      await resourceSharingService.deleteHelpRequest(request.id, user.id);
      setRequests((previous) => previous.filter((item) => item.id !== request.id));
      setSelectedRequest((current) => (current?.id === request.id ? null : current));
    } catch (error) {
      console.error('Failed to delete help request', error);
      setActionError(t('community_resources.help.feedback.delete_error'));
      throw error;
    }
  };

  const handleSendResponse = async (message: string, request: HelpRequest) => {
    setActionError(null);
    const responderName = profile?.display_name || user.email || t('community_resources.help.respond.anonymous_helper');

    try {
      // Create the help response record
      await resourceSharingService.createHelpResponse(
        request.id,
        user.id,
        message,
        true // can_help
      );

      // Send notification to requestor
      await notificationService.createHelpResponseNotification({
        requestId: request.id,
        requestTitle: request.title,
        requesterId: request.user_id,
        responderId: user.id,
        responderName,
        notificationTitle: t('notifications.help_response_title', { responder: responderName }),
        notificationContent: message // Use the actual response message
      });

      // Update request status to in_progress
      setRequests((previous) =>
        previous.map((item) =>
          item.id === request.id && item.status === 'open'
            ? { ...item, status: 'in_progress', updated_at: new Date().toISOString() }
            : item
        )
      );
    } catch (error) {
      console.error('Failed to send help response', error);
      setActionError(t('community_resources.help.feedback.response_error'));
      throw error;
    }
  };

  const renderTableActions = (request: HelpRequest) => {
    const isOwner = request.user_id === user.id;

    return (
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={() => setSelectedRequest(request)}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:border-[#3D4A2B] hover:bg-gray-50"
        >
          <Eye className="w-3.5 h-3.5" />
          Visa
        </button>
        {isOwner && (
          <>
            <button
              onClick={() => setEditingRequest(request)}
              className="flex items-center gap-1 rounded-lg border border-[#3D4A2B]/30 bg-[#3D4A2B]/5 px-3 py-1.5 text-xs font-semibold text-[#3D4A2B] transition-colors hover:bg-[#3D4A2B]/10"
            >
              <Pencil className="w-3.5 h-3.5" />
              Redigera
            </button>
            <button
              onClick={() => handleDeleteRequest(request)}
              className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
            >
              <Trash className="w-3.5 h-3.5" />
              Ta bort
            </button>
          </>
        )}
      </div>
    );
  };

  const formatRelativeTime = (timestamp: string) => {
    const created = new Date(timestamp);
    return created.toLocaleDateString('sv-SE', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {/* Cards or Table View */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-dashed border-[#3D4A2B]/30 bg-white px-8 py-12 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-[#3D4A2B]" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                {t('community_resources.help.empty.title')}
              </h3>
              <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
                {t('community_resources.help.empty.description')}
              </p>
            </div>
          ) : (
            filteredRequests.map((request) => {
              const urgencyMeta = helpRequestUrgencyConfig[request.urgency];
              const statusMeta = helpRequestStatusConfig[request.status];
              const isOwner = request.user_id === user.id;

              return (
                <div key={request.id} className="flex h-full flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-[#3D4A2B]/40 hover:shadow-md">
                  <div>
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs">
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${statusMeta.badgeClass}`}>
                            <span className={`h-2 w-2 rounded-full ${statusMeta.dotClass}`} />
                            {t(statusMeta.labelKey)}
                          </span>
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${urgencyMeta.badgeClass}`}>
                            <span className={`h-2 w-2 rounded-full ${urgencyMeta.dotClass}`} />
                            {t(urgencyMeta.labelKey)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 line-clamp-3 text-sm text-gray-600">{request.description}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span>{request.requester_name ?? t('community_resources.help.detail.anonymous_member')}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(request.created_at)}</span>
                      {request.location && (
                        <>
                          <span>•</span>
                          <span>{request.location}</span>
                        </>
                      )}
                      {request.image_url && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 text-[#3D4A2B]">
                            <Image className="w-3.5 h-3.5" />
                            Bild
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#3D4A2B] hover:bg-gray-50"
                    >
                      Visa detaljer
                    </button>
                    {isOwner && (
                      <>
                        <button
                          onClick={() => setEditingRequest(request)}
                          className="rounded-xl border border-[#3D4A2B]/30 bg-[#3D4A2B]/5 px-4 py-2 text-sm font-semibold text-[#3D4A2B] transition-colors hover:bg-[#3D4A2B]/10"
                          title="Redigera"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(request)}
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
                          title="Ta bort"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('community_resources.help.table.headers.request')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('community_resources.help.table.headers.requester')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('community_resources.help.table.headers.urgency')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('community_resources.help.table.headers.created')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    {t('community_resources.help.table.headers.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <AlertTriangle className="mx-auto h-12 w-12 text-[#3D4A2B]" />
                      <h3 className="mt-4 text-lg font-semibold text-gray-900">
                        {t('community_resources.help.empty.title')}
                      </h3>
                      <p className="mt-2 text-sm text-gray-600">
                        {t('community_resources.help.empty.description')}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => {
                    const urgencyMeta = helpRequestUrgencyConfig[request.urgency];
                    const statusMeta = helpRequestStatusConfig[request.status];
                    const isOwner = request.user_id === user.id;

                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">{request.title}</p>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-semibold ${statusMeta.badgeClass}`}>
                                <span className={`h-2 w-2 rounded-full ${statusMeta.dotClass}`} />
                                {t(statusMeta.labelKey)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <p className="font-semibold">{request.requester_name ?? t('community_resources.help.detail.anonymous_member')}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${urgencyMeta.badgeClass}`}>
                            <span className={`h-2 w-2 rounded-full ${urgencyMeta.dotClass}`} />
                            {t(urgencyMeta.labelKey)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {formatRelativeTime(request.created_at)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setSelectedRequest(request)}
                              className="text-[#3D4A2B] hover:text-[#2A331E] font-semibold text-sm"
                            >
                              Visa
                            </button>
                            {isOwner && (
                              <>
                                <button
                                  onClick={() => setEditingRequest(request)}
                                  className="text-[#3D4A2B] hover:text-[#2A331E] font-semibold text-sm"
                                >
                                  Redigera
                                </button>
                                <button
                                  onClick={() => handleDeleteRequest(request)}
                                  className="text-red-600 hover:text-red-700 font-semibold text-sm"
                                >
                                  Ta bort
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <HelpRequestComposer
        isOpen={showComposer || Boolean(editingRequest)}
        onClose={() => {
          setShowComposer(false);
          setEditingRequest(null);
        }}
        onSubmit={handleCreateRequest}
        defaultLocation={profile?.city ?? null}
        communityName={communityName}
        existingRequest={editingRequest}
      />

      <HelpRequestDetailSheet
        isOpen={Boolean(selectedRequest)}
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onEdit={() => {
          if (selectedRequest) {
            setEditingRequest(selectedRequest);
            setSelectedRequest(null);
          }
        }}
        onOfferHelp={async (message: string) => {
          if (!selectedRequest) return;
          await handleSendResponse(message, selectedRequest);
          setSelectedRequest(null);
        }}
        onStatusChange={async (status) => {
          if (!selectedRequest) return;
          await handleStatusChange(selectedRequest, status);
        }}
        onDelete={async () => {
          if (!selectedRequest) return;
          await handleDeleteRequest(selectedRequest);
        }}
        currentUserId={user.id}
        isAdmin={isAdmin}
      />

      {isSubmitting && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl bg-white px-6 py-4 shadow-lg">
            <Loader2 className="h-5 w-5 animate-spin text-[#3D4A2B]" />
            <span className="text-sm font-semibold text-gray-700">
              {t('community_resources.help.feedback.creating')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
