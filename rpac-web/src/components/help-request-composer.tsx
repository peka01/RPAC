'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, AlertCircle, Loader2, Sparkles, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useSmartModalClose } from '@/hooks/use-smart-modal-close';
import { t } from '@/lib/locales';
import type { HelpRequest } from '@/lib/services';
import { helpRequestUrgencyConfig } from '@/constants/help-requests';

export interface HelpRequestFormValues {
  title: string;
  description: string;
  urgency: HelpRequest['urgency'];
  location?: string;
  imageUrl?: string;
}

interface HelpRequestComposerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: HelpRequestFormValues) => Promise<void>;
  defaultLocation?: string | null;
  communityName: string;
  existingRequest?: HelpRequest | null;
}

const DESCRIPTION_LIMIT = 600;

export function HelpRequestComposer({
  isOpen,
  onClose,
  onSubmit,
  defaultLocation,
  communityName,
  existingRequest
}: HelpRequestComposerProps) {
  const [form, setForm] = useState<HelpRequestFormValues>({
    title: '',
    description: '',
    urgency: 'medium',
    location: defaultLocation ?? '',
    imageUrl: undefined
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [didSubmit, setDidSubmit] = useState(false);
  const initialFormRef = useRef<HelpRequestFormValues | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const buildInitialForm = useMemo(() => {
    const initial: HelpRequestFormValues = {
      title: existingRequest?.title ?? '',
      description: existingRequest?.description ?? '',
      urgency: existingRequest?.urgency ?? 'medium',
      location: existingRequest?.location ?? defaultLocation ?? '',
      imageUrl: existingRequest?.image_url ?? undefined
    };
    return initial;
  }, [defaultLocation, existingRequest]);

  useEffect(() => {
    if (isOpen) {
      initialFormRef.current = { ...buildInitialForm };
      setForm({ ...buildInitialForm });
      setError(null);
      setIsSubmitting(false);
      setDidSubmit(false);
      setImageFile(null);
      setImagePreview(buildInitialForm.imageUrl ?? null);
      setIsUploadingImage(false);
    }
  }, [isOpen, buildInitialForm]);

  const hasUnsavedData = useMemo(() => {
    const initial = initialFormRef.current;
    if (!initial) {
      return false;
    }
    return (
      form.title.trim() !== initial.title.trim() ||
      form.description.trim() !== initial.description.trim() ||
      (form.location || '').trim() !== (initial.location || '').trim() ||
      form.urgency !== initial.urgency ||
      imageFile !== null ||
      form.imageUrl !== initial.imageUrl
    );
  }, [form, imageFile]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Vänligen välj en giltig bildfil (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Bilden är för stor. Maximal storlek är 5MB.');
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setError(null);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm((prev) => ({ ...prev, imageUrl: undefined }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const { handleClose, isPreventingClose } = useSmartModalClose({
    hasUnsavedWork: hasUnsavedData && !didSubmit,
    modalId: 'help-request-composer',
    onClose
  });

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError(t('community_resources.help.composer.validation_required'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let finalImageUrl = form.imageUrl;

      // Upload image if a new file was selected
      if (imageFile) {
        setIsUploadingImage(true);
        try {
          const { supabase } = await import('@/lib/supabase');
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
          const filePath = `help-requests/${fileName}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('help-request-images')
            .upload(filePath, imageFile, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('help-request-images')
            .getPublicUrl(filePath);

          finalImageUrl = publicUrl;
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          setError('Kunde inte ladda upp bilden. Försöker spara utan bild...');
          // Continue without image
        } finally {
          setIsUploadingImage(false);
        }
      }

      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim(),
        urgency: form.urgency,
        location: form.location?.trim() ? form.location.trim() : undefined,
        imageUrl: finalImageUrl
      });
      setDidSubmit(true);
      setForm({
        title: '',
        description: '',
        urgency: 'medium',
        location: defaultLocation ?? '',
        imageUrl: undefined
      });
      setImageFile(null);
      setImagePreview(null);
      onClose();
    } catch (submitError) {
      console.error('Failed to submit help request', submitError);
      setError(t('community_resources.help.composer.submit_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-6"
      onClick={handleClose}
    >
      <div
        data-modal="help-request-composer"
        className="w-full max-w-3xl bg-white md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col animate-slide-up max-h-[90vh]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="relative bg-gradient-to-r from-[#3D4A2B] to-[#556B2F] text-white p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-white/70 font-semibold mb-2">
                {existingRequest 
                  ? 'Redigera hjälpförfrågan'
                  : t('community_resources.help.composer.hero_kicker', { community: communityName })
                }
              </p>
              <h2 className="text-2xl md:text-3xl font-extrabold leading-tight">
                {existingRequest 
                  ? 'Uppdatera din förfrågan'
                  : t('community_resources.help.composer.hero_title')
                }
              </h2>
              <p className="mt-3 text-sm md:text-base text-white/80 max-w-xl">
                {existingRequest
                  ? 'Ändra titel, beskrivning, prioritet eller plats för din hjälpförfrågan'
                  : t('community_resources.help.composer.hero_description')
                }
              </p>
            </div>
            <button
              onClick={handleClose}
              className={`p-2 rounded-full transition-colors ${
                isPreventingClose
                  ? 'bg-yellow-400/20 text-yellow-200'
                  : 'hover:bg-white/10 text-white'
              }`}
              aria-label={t('community_resources.help.composer.close')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </header>

        <form
          id="help-request-composer-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6"
        >
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              {t('community_resources.help.composer.fields.title_label')}
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder={t('community_resources.help.composer.fields.title_placeholder')}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base shadow-sm focus:border-[#3D4A2B] focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]/20"
              maxLength={120}
              required
            />
            <p className="text-xs text-gray-500">
              {t('community_resources.help.composer.fields.title_helper')}
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              {t('community_resources.help.composer.fields.description_label')}
            </label>
            <textarea
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder={t('community_resources.help.composer.fields.description_placeholder')}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base shadow-sm focus:border-[#3D4A2B] focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]/20 resize-none"
              rows={6}
              maxLength={DESCRIPTION_LIMIT}
              required
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{t('community_resources.help.composer.fields.description_helper')}</span>
              <span>
                {form.description.length}/{DESCRIPTION_LIMIT}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              {t('community_resources.help.composer.fields.urgency_label')}
            </label>
            <select
              value={form.urgency}
              onChange={(event) => setForm((prev) => ({ ...prev, urgency: event.target.value as HelpRequest['urgency'] }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base shadow-sm focus:border-[#3D4A2B] focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]/20"
            >
              {Object.entries(helpRequestUrgencyConfig).map(([key, value]) => (
                <option key={key} value={key}>
                  {t(value.labelKey)}
                </option>
              ))}
            </select>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              Ladda upp bild <span className="text-gray-500 font-normal">(valfritt)</span>
            </label>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {!imagePreview ? (
              <button
                type="button"
                onClick={handleImageUploadClick}
                className="w-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-all hover:border-[#3D4A2B] hover:bg-[#3D4A2B]/5"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3D4A2B]/10">
                  <Upload className="h-6 w-6 text-[#3D4A2B]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900">
                    Klicka för att välja en bild
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF upp till 5MB
                  </p>
                </div>
              </button>
            ) : (
              <div className="relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                <img
                  src={imagePreview}
                  alt="Förhandsvisning"
                  className="w-full h-auto max-h-48 object-contain bg-gray-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-3 right-3 flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-red-700 z-10"
                >
                  <Trash2 className="h-4 w-4" />
                  Ta bort
                </button>
                <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-white/95 backdrop-blur-sm px-3 py-2 shadow-sm z-10">
                  <ImageIcon className="h-4 w-4 text-[#3D4A2B]" />
                  <span className="text-xs font-medium text-gray-700">
                    {imageFile?.name || 'Befintlig bild'}
                  </span>
                </div>
                <div className="absolute top-3 left-3 bg-[#3D4A2B]/90 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs font-medium text-white shadow-sm z-10">
                  Förhandsvisning (samma storlek som i förfrågan)
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500">
              En bild kan hjälpa andra att förstå din situation bättre
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              {t('community_resources.help.composer.fields.location_label')}
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
              placeholder={t('community_resources.help.composer.fields.location_placeholder')}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base shadow-sm focus:border-[#3D4A2B] focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]/20"
            />
            <p className="text-xs text-gray-500">
              {t('community_resources.help.composer.fields.location_helper')}
            </p>
          </div>
        </form>

        <footer className="border-t border-gray-100 bg-gray-50 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Sparkles className="w-4 h-4 text-[#3D4A2B]" />
              <span>{t('community_resources.help.composer.footer_tip')}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border-2 border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100"
              >
                {t('community_resources.help.composer.buttons.cancel')}
              </button>
              <button
                type="submit"
                form="help-request-composer-form"
                disabled={isSubmitting || isUploadingImage}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3D4A2B] px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[#2A331E] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isUploadingImage ? 'Laddar upp bild...' : t('community_resources.help.composer.buttons.submitting')}
                  </>
                ) : (
                  existingRequest ? 'Uppdatera' : t('community_resources.help.composer.buttons.submit')
                )}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
