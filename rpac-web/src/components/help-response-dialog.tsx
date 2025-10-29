'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Loader2, HeartHandshake, MessageSquareHeart } from 'lucide-react';
import { t } from '@/lib/locales';
import type { HelpRequest } from '@/lib/services';

interface HelpResponseDialogProps {
  isOpen: boolean;
  request: HelpRequest | null;
  onClose: () => void;
  onSend: (message: string) => Promise<void>;
  responderName: string;
}

const MESSAGE_LIMIT = 400;

export function HelpResponseDialog({
  isOpen,
  request,
  onClose,
  onSend,
  responderName
}: HelpResponseDialogProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestedMessage = useMemo(() => {
    if (!request) {
      return t('community_resources.help.respond.default_message_generic');
    }
    return t('community_resources.help.respond.default_message', {
      responder: responderName,
      title: request.title
    });
  }, [request, responderName]);

  useEffect(() => {
    if (isOpen) {
      setMessage(suggestedMessage);
      setError(null);
      setIsSending(false);
    }
  }, [isOpen, suggestedMessage]);

  if (!isOpen || !request) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) {
      setError(t('community_resources.help.respond.validation_required'));
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await onSend(message.trim());
      onClose();
    } catch (sendError) {
      console.error('Failed to send help offer', sendError);
      setError(t('community_resources.help.respond.send_error'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white md:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="relative bg-gradient-to-r from-[#3D4A2B] to-[#556B2F] text-white p-6">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-white/80 hover:bg-white/10"
            aria-label={t('community_resources.help.respond.close')}
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
              <HeartHandshake className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-white/80 font-semibold">
                {t('community_resources.help.respond.kicker')}
              </p>
              <h2 className="text-xl font-bold">
                {t('community_resources.help.respond.hero_title', { title: request.title })}
              </h2>
              <p className="mt-2 text-sm text-white/80">
                {t('community_resources.help.respond.hero_description')}
              </p>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900">
              {t('community_resources.help.respond.message_label')}
            </label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={MESSAGE_LIMIT}
              rows={5}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-base shadow-sm focus:border-[#3D4A2B] focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]/20"
            />
            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
              <span>{t('community_resources.help.respond.message_helper')}</span>
              <span>{message.length}/{MESSAGE_LIMIT}</span>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MessageSquareHeart className="w-4 h-4 text-[#3D4A2B]" />
              <span>{t('community_resources.help.respond.commitment_note')}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border-2 border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                {t('community_resources.help.respond.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSending}
                className="inline-flex items-center gap-2 rounded-xl bg-[#3D4A2B] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2A331E] disabled:opacity-60"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('community_resources.help.respond.sending')}
                  </>
                ) : (
                  t('community_resources.help.respond.send')
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
