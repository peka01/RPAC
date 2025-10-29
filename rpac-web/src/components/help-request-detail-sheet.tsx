'use client';

import { useMemo, useState, useRef, useEffect, type ReactNode } from 'react';
import {
  X,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash,
  Loader2,
  MessageCircle,
  Pencil,
  Eye,
  ZoomIn
} from 'lucide-react';
import { t } from '@/lib/locales';
import type { HelpRequest } from '@/lib/services';
import type { HelpResponse } from '@/lib/resource-sharing-service';
import { helpRequestStatusConfig, helpRequestUrgencyConfig } from '@/constants/help-requests';

interface HelpRequestDetailSheetProps {
  isOpen: boolean;
  request: HelpRequest | null;
  onClose: () => void;
  onOfferHelp: (message: string) => Promise<void>;
  onOpenChat?: () => void;
  onEdit?: () => void;
  onStatusChange: (status: HelpRequest['status']) => Promise<void>;
  onDelete: () => Promise<void>;
  currentUserId: string;
  isAdmin?: boolean;
}

export function HelpRequestDetailSheet({
  isOpen,
  request,
  onClose,
  onOfferHelp,
  onOpenChat,
  onEdit,
  onStatusChange,
  onDelete,
  currentUserId,
  isAdmin = false
}: HelpRequestDetailSheetProps) {
  const [updatingStatus, setUpdatingStatus] = useState<HelpRequest['status'] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showHelpForm, setShowHelpForm] = useState(false);
  const [helpMessage, setHelpMessage] = useState('');
  const [submittingHelp, setSubmittingHelp] = useState(false);
  const [showImageLightbox, setShowImageLightbox] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const [responses, setResponses] = useState<HelpResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [editingResponseId, setEditingResponseId] = useState<string | null>(null);
  const [editingResponseText, setEditingResponseText] = useState('');

  const isOwner = request?.user_id === currentUserId;

  // Load responses when modal opens
  useEffect(() => {
    if (isOpen && request) {
      loadResponses();
    }
  }, [isOpen, request?.id]);

  const loadResponses = async () => {
    if (!request) return;
    setLoadingResponses(true);
    try {
      const { resourceSharingService } = await import('@/lib/services');
      const responseData = await resourceSharingService.getHelpRequestResponses(request.id);
      setResponses(responseData);
    } catch (error) {
      console.error('Failed to load responses:', error);
    } finally {
      setLoadingResponses(false);
    }
  };

  const timeline = useMemo(() => {
    if (!request) {
      return [];
    }
    const createdDate = request.created_at ? new Date(request.created_at) : null;
    const updatedDate = request.updated_at ? new Date(request.updated_at) : null;
  const items = [] as Array<{ label: string; timestamp: Date | null; icon: ReactNode; highlight?: boolean }>;

    items.push({
      label: t('community_resources.help.detail.timeline_created'),
      timestamp: createdDate,
      icon: <AlertTriangle className="w-4 h-4" />,
      highlight: true
    });

    if (request.status === 'in_progress') {
      items.push({
        label: t('community_resources.help.detail.timeline_in_progress'),
        timestamp: updatedDate,
        icon: <MessageCircle className="w-4 h-4" />,
        highlight: true
      });
    }

    if (request.status === 'resolved' || request.status === 'closed') {
      items.push({
        label: t('community_resources.help.detail.timeline_resolved'),
        timestamp: updatedDate,
        icon: <CheckCircle2 className="w-4 h-4" />
      });
    }

    return items;
  }, [request]);

  if (!isOpen || !request) {
    return null;
  }

  const urgencyMeta = helpRequestUrgencyConfig[request.urgency];
  const statusMeta = helpRequestStatusConfig[request.status];

  const formatDate = (value?: string | null) => {
    if (!value) {
      return '—';
    }
    const date = new Date(value);
    return date.toLocaleString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusChange = async (status: HelpRequest['status']) => {
    setUpdatingStatus(status);
    try {
      await onStatusChange(status);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  const handleOfferHelp = async () => {
    if (!helpMessage.trim()) return;
    
    setSubmittingHelp(true);
    try {
      await onOfferHelp(helpMessage);
      setHelpMessage('');
      setShowHelpForm(false);
      // Reload responses to show the new response immediately
      await loadResponses();
    } finally {
      setSubmittingHelp(false);
    }
  };

  const handleDeleteResponse = async (responseId: string) => {
    try {
      const { resourceSharingService } = await import('@/lib/services');
      await resourceSharingService.deleteHelpResponse(responseId);
      await loadResponses();
    } catch (error) {
      console.error('Failed to delete response:', error);
    }
  };

  const handleSaveEditResponse = async (responseId: string) => {
    if (!editingResponseText.trim()) return;
    
    try {
      const { resourceSharingService } = await import('@/lib/services');
      await resourceSharingService.updateHelpResponse(responseId, editingResponseText);
      setEditingResponseId(null);
      setEditingResponseText('');
      await loadResponses();
    } catch (error) {
      console.error('Failed to update response:', error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-8" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white md:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <header className="relative bg-gradient-to-r from-[#334026] to-[#3D4A2B] text-white p-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-white/90 hover:bg-white/10 transition-colors"
            aria-label={t('community_resources.help.detail.close')}
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-xl md:text-2xl font-bold pr-10 mb-3">
            {request.title}
          </h2>
          
          {/* Status badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white">
              <span className={`h-2 w-2 rounded-full ${statusMeta.dotClass.replace('bg-', 'bg-white')}`} />
              {t(statusMeta.labelKey)}
            </span>
            <span className="text-white/70">•</span>
            <span className="text-sm text-white/90 font-medium">
              {t(urgencyMeta.labelKey)}
            </span>
          </div>

          {/* Overview information - moved from bottom */}
          <div className="space-y-2 text-sm text-white/80 pt-2 border-t border-white/10">
            <div className="flex justify-between">
              <span className="text-white/60">Begärd av</span>
              <span className="font-medium text-white">{request.requester_name ?? 'Anonym medlem'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Skapad</span>
              <span className="text-white">{formatDate(request.created_at)}</span>
            </div>
            {request.updated_at && request.updated_at !== request.created_at && (
              <div className="flex justify-between">
                <span className="text-white/60">Uppdaterad</span>
                <span className="text-white">{formatDate(request.updated_at)}</span>
              </div>
            )}
            {request.location && (
              <div className="flex justify-between">
                <span className="text-white/60">Plats</span>
                <span className="text-white">{request.location}</span>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Activity Timeline - Compact version at top */}
          <section className="pb-4 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t('community_resources.help.detail.timeline_title')}
            </h3>
            <div className="space-y-2">
              {timeline.map((item, index) => (
                <div key={`${item.label}-${index}`} className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full flex-shrink-0 ${item.highlight ? 'bg-[#3D4A2B]/10 text-[#3D4A2B]' : 'bg-gray-100 text-gray-500'}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0 flex items-baseline gap-2">
                    <p className="text-xs font-medium text-gray-700">{item.label}</p>
                    <p className="text-xs text-gray-500">
                      {item.timestamp ? item.timestamp.toLocaleString('sv-SE', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Description */}
          <p className="text-gray-700 text-sm leading-relaxed pb-2">
            {request.description}
          </p>

          {/* Helper Responses Section */}
          {responses.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#3D4A2B]" />
                Svar från hjälpare ({responses.filter(r => 
                  isOwner || r.responder_id === currentUserId || isAdmin
                ).length})
              </h3>
              <div className="space-y-3">
                {responses
                  .filter(response => 
                    // Show to: requestor (owner), responder (author), and admins
                    isOwner || response.responder_id === currentUserId || isAdmin
                  )
                  .map((response) => {
                    const isResponseAuthor = response.responder_id === currentUserId;
                    const isEditing = editingResponseId === response.id;
                    
                    return (
                      <div 
                        key={response.id} 
                        className="rounded-xl bg-[#3D4A2B]/5 border border-[#3D4A2B]/20 p-4"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-[#3D4A2B]">
                              {response.responder_name}
                            </p>
                            {isResponseAuthor && (
                              <span className="text-xs text-gray-500 italic">(dig)</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500">
                              {new Date(response.created_at).toLocaleString('sv-SE', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {isAdmin && !isEditing && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditingResponseId(response.id);
                                    setEditingResponseText(response.message);
                                  }}
                                  className="p-1 rounded hover:bg-[#3D4A2B]/10 text-[#3D4A2B] transition-colors"
                                  title="Redigera svar"
                                  type="button"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm('Är du säker på att du vill ta bort detta svar?')) {
                                      await handleDeleteResponse(response.id);
                                    }
                                  }}
                                  className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
                                  title="Ta bort svar"
                                  type="button"
                                >
                                  <Trash className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingResponseText}
                              onChange={(e) => setEditingResponseText(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                              rows={3}
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => {
                                  setEditingResponseId(null);
                                  setEditingResponseText('');
                                }}
                                className="px-3 py-1 text-xs rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                                type="button"
                              >
                                Avbryt
                              </button>
                              <button
                                onClick={() => handleSaveEditResponse(response.id)}
                                className="px-3 py-1 text-xs rounded-lg bg-[#3D4A2B] hover:bg-[#334026] text-white transition-colors"
                                type="button"
                              >
                                Spara
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {response.message}
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Image if available */}
          {request.image_url && (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 group cursor-pointer">
              <button
                onClick={() => setShowImageLightbox(true)}
                className="w-full relative block"
                type="button"
              >
                <img 
                  src={request.image_url} 
                  alt="Bild från förfrågan" 
                  className="w-full h-auto max-h-48 object-contain bg-gray-50 transition-transform group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-3 shadow-lg">
                    <ZoomIn className="w-5 h-5 text-gray-900" />
                  </div>
                </div>
              </button>
              <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 text-xs font-medium text-gray-700 shadow-sm flex items-center gap-1">
                <ZoomIn className="w-3 h-3" />
                Klicka för att förstora
              </div>
            </div>
          )}

          {/* Image Lightbox with Zoom */}
          {showImageLightbox && request.image_url && (
            <div 
              className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 animate-in fade-in duration-200"
              onClick={() => {
                setShowImageLightbox(false);
                setImageZoom(1);
                setImagePosition({ x: 0, y: 0 });
              }}
            >
              <button
                onClick={() => {
                  setShowImageLightbox(false);
                  setImageZoom(1);
                  setImagePosition({ x: 0, y: 0 });
                }}
                className="absolute top-6 right-6 z-20 p-3 rounded-full bg-white hover:bg-gray-100 text-gray-900 transition-all shadow-xl"
                aria-label="Stäng"
                type="button"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div 
                className="relative max-w-full max-h-[90vh] overflow-hidden cursor-zoom-in"
                onClick={(e) => e.stopPropagation()}
                onMouseMove={(e) => {
                  if (imageZoom > 1 && imageRef.current) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    setImagePosition({ x, y });
                  }
                }}
                onWheel={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const delta = e.deltaY > 0 ? -0.2 : 0.2;
                  setImageZoom(prev => Math.max(1, Math.min(3, prev + delta)));
                }}
              >
                <img 
                  ref={imageRef}
                  src={request.image_url} 
                  alt="Bild från förfrågan i fullstorlek" 
                  className="max-w-full max-h-[90vh] w-auto h-auto object-contain rounded-lg shadow-2xl bg-white transition-transform duration-100"
                  style={{
                    transform: `scale(${imageZoom})`,
                    transformOrigin: `${imagePosition.x}% ${imagePosition.y}%`
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (imageZoom === 1) {
                      setImageZoom(2);
                    } else {
                      setImageZoom(1);
                      setImagePosition({ x: 50, y: 50 });
                    }
                  }}
                />
              </div>

              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-full px-5 py-2.5 text-sm font-medium text-gray-900 shadow-xl flex items-center gap-2">
                <ZoomIn className="w-4 h-4" />
                {imageZoom > 1 ? (
                  <span>Zoom: {Math.round(imageZoom * 100)}% • Scrolla eller klicka för att zooma</span>
                ) : (
                  <span>Klicka på bilden eller scrolla för att zooma</span>
                )}
              </div>
            </div>
          )}

          {/* Action Cards - Matching "Hantera delad resurs" design */}
          <div className="space-y-3 pt-2">
            {!isOwner && !showHelpForm && (
              <button
                onClick={() => setShowHelpForm(true)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-[#3D4A2B]/5 hover:bg-[#3D4A2B]/10 transition-colors text-left group border-2 border-[#3D4A2B]/20"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3D4A2B]/10 text-[#3D4A2B] group-hover:bg-[#3D4A2B]/20 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">
                    {t('community_resources.help.detail.actions.offer_help')}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Skriv ett meddelande och markera förfrågan som "Pågående"
                  </p>
                </div>
              </button>
            )}

            {!isOwner && showHelpForm && (
              <div className="rounded-xl bg-[#3D4A2B]/5 p-4 border-2 border-[#3D4A2B]/20">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Beskriv hur du kan hjälpa
                </label>
                <textarea
                  value={helpMessage}
                  onChange={(e) => setHelpMessage(e.target.value)}
                  placeholder="T.ex. 'Jag har ett elverk du kan låna. Kontakta mig så fixar vi det!'"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#3D4A2B] focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]/20 min-h-[100px]"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleOfferHelp}
                    disabled={!helpMessage.trim() || submittingHelp}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#3D4A2B] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2A331E] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingHelp ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Skickar...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Skicka hjälp
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowHelpForm(false);
                      setHelpMessage('');
                    }}
                    disabled={submittingHelp}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            )}

            {isOwner && (request.status === 'open' || request.status === 'in_progress') && (
              <button
                onClick={() => handleStatusChange('resolved')}
                disabled={updatingStatus === 'resolved'}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors text-left group disabled:opacity-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-600 group-hover:bg-emerald-600/20 transition-colors">
                  {updatingStatus === 'resolved' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">
                    {t('community_resources.help.detail.actions.mark_resolved')}
                  </p>
                </div>
              </button>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
