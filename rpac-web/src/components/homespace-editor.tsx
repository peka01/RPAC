'use client';

import { useState, useEffect, useRef } from 'react';
import { t } from '@/lib/locales';
import { 
  Save, Eye, Globe, ExternalLink, Upload, Palette, 
  Settings as SettingsIcon, Lock, Unlock, RotateCcw, Copy, Check,
  Edit3, Wand2, Shield, Trash2, X, Plus, Link as LinkIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CommunityHomespace from './community-homespace';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MarkdownToolbar from './markdown-toolbar';
import HomepageContactSection from './homepage-contact-section';
import HomepageGallerySection from './homepage-gallery-section';
import HomepageEventsSection from './homepage-events-section';

interface HomespaceEditorProps {
  communityId: string;
  initialData?: any;
}

export default function HomespaceEditor({ communityId, initialData }: HomespaceEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  // Editor state
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingBanner, setEditingBanner] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInvitations, setShowInvitations] = useState(false);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  
  // Homespace data
  const [homespace, setHomespace] = useState({
    id: initialData?.id || '',
    slug: initialData?.slug || '',
    about_text: initialData?.about_text || '',
    current_info: initialData?.current_info || '',
    membership_criteria: initialData?.membership_criteria || '',
    latest_updates_text: initialData?.latest_updates_text || '',
    custom_banner_url: initialData?.custom_banner_url || null,
    logo_url: initialData?.logo_url || null,
    banner_pattern: initialData?.banner_pattern || 'olive-gradient',
    banner_type: initialData?.banner_type || 'gradient',
    accent_color: initialData?.accent_color || '#5C6B47',
    contact_email: initialData?.contact_email || '',
    contact_phone: initialData?.contact_phone || '',
    contact_address: initialData?.contact_address || '',
    social_facebook: initialData?.social_facebook || '',
    social_instagram: initialData?.social_instagram || '',
    show_current_info_public: initialData?.show_current_info_public ?? true,
    show_resources_public: initialData?.show_resources_public ?? true,
    show_preparedness_score_public: initialData?.show_preparedness_score_public ?? true,
    show_member_activities: initialData?.show_member_activities ?? true,
    show_skills_public: initialData?.show_skills_public ?? true,
    show_latest_updates: initialData?.show_latest_updates ?? true,
    show_admin_contact: initialData?.show_admin_contact ?? true,
    show_contact_section: initialData?.show_contact_section ?? true,
    published: initialData?.published ?? false,
    views_count: initialData?.views_count || 0,
    created_at: initialData?.created_at || new Date().toISOString(),
    communities: initialData?.communities || {},
    section_order: initialData?.section_order || ['current_info', 'about', 'gallery', 'events', 'contact', 'resources', 'preparedness', 'activities', 'skills', 'membership']
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load gallery images and events
  useEffect(() => {
    const loadGalleryImages = async () => {
      const { data, error } = await supabase
        .from('community_gallery_images')
        .select('*')
        .eq('community_id', communityId)
        .order('display_order');
      
      if (!error && data) {
        setGalleryImages(data);
      }
    };
    loadGalleryImages();
  }, [communityId]);

  useEffect(() => {
    const loadEvents = async () => {
      const { data, error } = await supabase
        .from('community_events')
        .select('*')
        .eq('community_id', communityId)
        .order('event_date');
      
      if (!error && data) {
        setEvents(data);
      }
    };
    loadEvents();
  }, [communityId]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (activeTab === 'editor') {
        handleSave(true); // silent save
      }
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, [homespace, activeTab]);

  // Validate slug
  const validateSlug = (slug: string) => {
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return t('homespace.editor.slug_error');
    }
    return null;
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${communityId}-banner-${Date.now()}.${fileExt}`;
      const filePath = `community-banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath);

      setHomespace({ 
        ...homespace, 
        custom_banner_url: publicUrl,
        banner_type: 'image'
      });
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Kunde inte ladda upp bilden. Försök igen.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${communityId}-logo-${Date.now()}.${fileExt}`;
      const filePath = `community-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath);

      setHomespace({ ...homespace, logo_url: publicUrl });
      await handleSave(true);
    } catch (error) {
      console.error('Logo upload error:', error);
      alert('Kunde inte ladda upp logotypen. Försök igen.');
    } finally {
      setUploadingImage(false);
    }
  };

  const getBannerStyle = () => {
    if (homespace.banner_type === 'image' && homespace.custom_banner_url) {
      return {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${homespace.custom_banner_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }

    if (homespace.banner_type === 'shield') {
      return {
        background: `linear-gradient(135deg, #2A331E 0%, #3D4A2B 50%, #556B2F 100%)`,
      };
    }

    const gradients: Record<string, string> = {
      'olive-gradient': 'linear-gradient(135deg, #556B2F 0%, #3D4A2B 100%)',
      'dark-olive': 'linear-gradient(135deg, #2A331E 0%, #1A1F13 100%)',
      'warm-olive': 'linear-gradient(135deg, #6B7B4F 0%, #5C6B47 100%)',
      'olive-mesh': 'radial-gradient(circle at 20% 50%, #6B7B4F 0%, transparent 50%), radial-gradient(circle at 80% 80%, #5C6B47 0%, transparent 50%), linear-gradient(135deg, #3D4A2B 0%, #2A331E 100%)',
      'olive-waves': 'linear-gradient(110deg, #556B2F 0%, #3D4A2B 50%, #5C6B47 100%)',
    };

    return {
      background: gradients[homespace.banner_pattern] || gradients['olive-gradient']
    };
  };

  // Handle save
  const handleSave = async (silent = false) => {
    if (!silent) setSaving(true);
    setErrors({});

    // Validate
    const slugError = validateSlug(homespace.slug);
    if (slugError) {
      setErrors({ slug: slugError });
      if (!silent) setSaving(false);
      return;
    }

    try {
      const updateData: any = {
        slug: homespace.slug,
        about_text: homespace.about_text,
        current_info: homespace.current_info,
        membership_criteria: homespace.membership_criteria,
        custom_banner_url: homespace.custom_banner_url,
        banner_pattern: homespace.banner_pattern,
        banner_type: homespace.banner_type,
        logo_url: homespace.logo_url,
        accent_color: homespace.accent_color,
        contact_email: homespace.contact_email,
        contact_phone: homespace.contact_phone,
        contact_address: homespace.contact_address,
        social_facebook: homespace.social_facebook,
        social_instagram: homespace.social_instagram,
        section_order: homespace.section_order,
        show_current_info_public: homespace.show_current_info_public,
        show_resources_public: homespace.show_resources_public,
        show_preparedness_score_public: homespace.show_preparedness_score_public,
        show_member_activities: homespace.show_member_activities,
        show_admin_contact: homespace.show_admin_contact,
        show_skills_public: homespace.show_skills_public,
        show_contact_section: homespace.show_contact_section,
        published: homespace.published,
        last_updated: new Date().toISOString()
      };

      // Update current_info timestamp if current_info was changed
      if (homespace.current_info !== initialData?.current_info) {
        updateData.current_info_updated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('community_homespaces')
        .update(updateData)
        .eq('community_id', communityId);

      if (error) throw error;

      setLastSaved(new Date());
      if (!silent) {
        setTimeout(() => setSaving(false), 500);
      }
    } catch (error: any) {
      console.error('Save error:', error);
      if (!silent) {
        setErrors({ save: t('homespace.errors.save_failed') });
        setSaving(false);
      }
    }
  };

  // Handle publish toggle
  const handlePublishToggle = async () => {
    const newPublishedState = !homespace.published;
    setHomespace({ ...homespace, published: newPublishedState });
    
    try {
      await supabase
        .from('community_homespaces')
        .update({ published: newPublishedState })
        .eq('community_id', communityId);
    } catch (error) {
      console.error('Publish toggle error:', error);
      // Revert on error
      setHomespace({ ...homespace, published: !newPublishedState });
    }
  };

  // Copy public link
  const copyPublicLink = () => {
    const url = `${window.location.origin}/${homespace.slug}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Reset to default template
  const handleReset = () => {
    if (!confirm(t('homespace.reset_confirm'))) return;
    
    const defaultAbout = `# Välkommen till ${homespace.communities?.community_name}!\n\nVi är ett lokalt beredskapssamhälle i ${homespace.communities?.county || 'Sverige'} som arbetar tillsammans för att stärka vår gemensamma motståndskraft.\n\n## Våra värderingar\n- Ömsesidig hjälp och respekt\n- Lokal självförsörjning\n- Transparent resursdelning\n- Svenskt krisberedskapstänk enligt MSB\n\n## Vad vi gör tillsammans\n- Dela resurser och kompetenser\n- Planera för självförsörjning\n- Träna för krislägen\n- Stödja varandra i vardagen\n\n*Redigera denna text för att berätta om just ert samhälle.*`;
    
    const defaultCriteria = `## Vem kan gå med?\n- Boende i närområdet\n- Engagerad i lokal beredskap\n- Dela våra värderingar om ömsesidig hjälp`;
    
    setHomespace({
      ...homespace,
      about_text: defaultAbout,
      membership_criteria: defaultCriteria,
      banner_pattern: 'olive-gradient',
      accent_color: '#5C6B47'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#3D4A2B]">
                {t('homespace.editor.title')}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {homespace.communities?.community_name}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Last saved indicator */}
              {lastSaved && (
                <div className="text-sm text-gray-500">
                  {t('homespace.saved')} {lastSaved.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}

              {/* Save button */}
              <button
                onClick={() => handleSave()}
                disabled={saving}
                className="bg-[#3D4A2B] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#2A331E] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? t('homespace.saving') : t('homespace.save_changes')}
              </button>

              {/* Publish toggle */}
              <button
                onClick={handlePublishToggle}
                className={`px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  homespace.published
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {homespace.published ? <Unlock size={18} /> : <Lock size={18} />}
                {homespace.published ? t('homespace.published') : t('homespace.draft')}
              </button>

              {/* View public button */}
              {homespace.published && (
                <a
                  href={`/${homespace.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#5C6B47] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#4A5239] transition-all flex items-center gap-2"
                >
                  <Globe size={18} />
                  {t('homespace.view_public')}
                </a>
              )}
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex gap-4 mt-4 border-t pt-4">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'editor'
                  ? 'bg-[#3D4A2B] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <SettingsIcon size={18} className="inline mr-2" />
              {t('homespace.editor.editor_view')}
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                activeTab === 'preview'
                  ? 'bg-[#3D4A2B] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Eye size={18} className="inline mr-2" />
              {t('homespace.editor.live_preview')}
            </button>
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
        }}
        className="hidden"
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleLogoUpload(file);
        }}
        className="hidden"
      />

      {/* Floating Toolbar */}
      <div className="fixed top-4 right-4 z-20 flex items-center gap-2 bg-white shadow-2xl rounded-xl p-2 border-2 border-[#3D4A2B]">
        {/* Auto-save indicator */}
        {lastSaved && (
          <div className="text-xs text-gray-500 px-2 flex items-center gap-1">
            <Check size={14} className="text-green-600" />
            Sparad {lastSaved.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}

        {/* Preview Button */}
        <button
          onClick={() => window.open(`/${homespace.slug}?preview=true`, '_blank')}
          className="px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          title={t('homespace.editor.preview_as_visitor')}
        >
          <Eye size={18} />
          <span className="text-sm font-medium">{t('homespace.editor.preview_homepage')}</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Inställningar"
        >
          <SettingsIcon size={20} />
        </button>

        {/* Publish Toggle */}
        <button
          onClick={() => setHomespace({ ...homespace, published: !homespace.published })}
          className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
            homespace.published
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          {homespace.published ? <Unlock size={16} /> : <Lock size={16} />}
          {homespace.published ? 'Publicerad' : 'Utkast'}
        </button>

        {/* View Public */}
        {homespace.published && (
          <a
            href={`/${homespace.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-[#5C6B47] text-white rounded-lg hover:bg-[#4A5239] transition-colors"
            title="Visa publik sida"
          >
            <Globe size={20} />
          </a>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed top-20 right-4 z-20 w-80 max-h-[600px] overflow-y-auto bg-white shadow-2xl rounded-xl p-6 border-2 border-[#3D4A2B]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Inställningar</h3>
            <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-gray-100 rounded">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {/* Section Visibility */}
            <div>
              <h4 className="font-semibold mb-3 text-sm">Synliga sektioner</h4>
              
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={homespace.show_current_info_public}
                  onChange={(e) => setHomespace({ ...homespace, show_current_info_public: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">📢 Aktuellt</span>
              </label>

              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={homespace.show_latest_updates}
                  onChange={(e) => setHomespace({ ...homespace, show_latest_updates: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">📰 Senaste uppdateringar</span>
              </label>

              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={homespace.show_resources_public}
                  onChange={(e) => setHomespace({ ...homespace, show_resources_public: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">🛠️ Våra resurser</span>
              </label>

              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={homespace.show_preparedness_score_public}
                  onChange={(e) => setHomespace({ ...homespace, show_preparedness_score_public: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">📊 Samhällets beredskap</span>
              </label>

              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={homespace.show_member_activities}
                  onChange={(e) => setHomespace({ ...homespace, show_member_activities: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">🎯 Medlemsaktiviteter</span>
              </label>

              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={homespace.show_skills_public}
                  onChange={(e) => setHomespace({ ...homespace, show_skills_public: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">🎓 Våra kompetenser</span>
              </label>

              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={homespace.show_admin_contact}
                  onChange={(e) => setHomespace({ ...homespace, show_admin_contact: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">💬 Kontakt & Bli medlem</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={homespace.show_contact_section}
                  onChange={(e) => setHomespace({ ...homespace, show_contact_section: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">📞 Kontaktinformation</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Banner Editor Modal */}
      {editingBanner && (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Wand2 size={24} className="text-[#5C6B47]" />
                {t('homespace.editor.customize_banner')}
              </h3>
              <button
                onClick={() => setEditingBanner(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Banner Type Selection */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-900">
                  {t('homespace.editor.banner_type')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setHomespace({ ...homespace, banner_type: 'gradient' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      homespace.banner_type === 'gradient'
                        ? 'border-[#5C6B47] bg-[#5C6B47]/10'
                        : 'border-gray-200 hover:border-[#5C6B47]/50'
                    }`}
                  >
                    <Palette size={32} className="mx-auto mb-2 text-[#5C6B47]" />
                    <div className="font-semibold text-sm">{t('homespace.editor.gradient')}</div>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      homespace.banner_type === 'image'
                        ? 'border-[#5C6B47] bg-[#5C6B47]/10'
                        : 'border-gray-200 hover:border-[#5C6B47]/50'
                    }`}
                  >
                    <Upload size={32} className="mx-auto mb-2 text-[#5C6B47]" />
                    <div className="font-semibold text-sm">{t('homespace.editor.image')}</div>
                  </button>

                  <button
                    onClick={() => setHomespace({ ...homespace, banner_type: 'shield' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      homespace.banner_type === 'shield'
                        ? 'border-[#5C6B47] bg-[#5C6B47]/10'
                        : 'border-gray-200 hover:border-[#5C6B47]/50'
                    }`}
                  >
                    <Shield size={32} className="mx-auto mb-2 text-[#5C6B47]" />
                    <div className="font-semibold text-sm">{t('homespace.editor.beready_shield')}</div>
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-900">
                  {t('homespace.editor.preview')}
                </label>
                <div
                  className="aspect-[21/9] rounded-xl overflow-hidden shadow-lg"
                  style={getBannerStyle()}
                >
                  <div className="h-full flex flex-col justify-center px-8 text-white">
                    {homespace.banner_type === 'shield' && (
                      <Shield size={80} className="mb-4 opacity-20" />
                    )}
                    <h2 className="text-4xl font-bold mb-2">
                      {homespace.communities?.community_name || 'Ditt Samhälle'}
                    </h2>
                    <p className="text-xl opacity-90">
                      {homespace.communities?.county || 'Sverige'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditingBanner(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                {t('buttons.cancel')}
              </button>
              <button
                onClick={() => {
                  setEditingBanner(false);
                  handleSave();
                }}
                className="px-6 py-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors flex items-center gap-2"
              >
                <Check size={18} />
                {t('buttons.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview/Editor */}
      <div className="max-w-5xl mx-auto pb-20">
        {/* Hero Banner - Hover to Edit */}
        <div
          className="text-white px-8 py-16 relative group cursor-pointer"
          style={getBannerStyle()}
          onClick={() => setEditingBanner(true)}
        >
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100">
              <div className="bg-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3">
                <Wand2 size={24} className="text-[#5C6B47]" />
                <span className="text-gray-900 font-semibold text-lg">
                  {t('homespace.editor.click_to_customize_banner')}
                </span>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto relative z-10">
            {/* Logo Upload/Display - Hover to Edit */}
            <div className="mb-6 inline-block group/logo">
              {homespace.logo_url ? (
                // Logo exists - show with edit on hover
                <div className="relative">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border-2 border-white/20 shadow-2xl transition-all group-hover/logo:border-white/40">
                    <img 
                      src={homespace.logo_url} 
                      alt="Community logo"
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                  {/* Hover overlay with actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover/logo:bg-black/60 transition-all rounded-2xl flex items-center justify-center gap-2 opacity-0 group-hover/logo:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        logoInputRef.current?.click();
                      }}
                      className="p-2 bg-white text-[#3D4A2B] rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
                      title={t('homespace.editor.change_logo')}
                    >
                      <Upload size={20} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Ta bort logotyp?')) {
                          setHomespace({ ...homespace, logo_url: null });
                          handleSave(true);
                        }
                      }}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
                      title={t('homespace.editor.remove_logo')}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                // No logo - show upload prompt
                <button
                  onClick={() => logoInputRef.current?.click()}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border-2 border-dashed border-white/30 hover:border-white/60 hover:bg-white/20 shadow-2xl transition-all group/upload"
                >
                  <div className="w-24 h-24 flex flex-col items-center justify-center gap-2 text-white/70 group-hover/upload:text-white transition-colors">
                    <Upload size={32} className="group-hover/upload:scale-110 transition-transform" />
                    <span className="text-xs font-semibold">{t('homespace.editor.logo_upload')}</span>
                  </div>
                </button>
              )}
            </div>
            
            {homespace.banner_type === 'shield' && !homespace.logo_url && (
              <Shield size={96} className="mb-6 opacity-30" />
            )}
            <h1 className="text-5xl font-bold mb-4">
              {homespace.communities?.community_name || 'Ditt Samhälle'}
            </h1>
            <p className="text-xl text-white/90">
              {homespace.communities?.county || 'Sverige'}
            </p>
            <div className="mt-6 text-sm text-white/70">
              beready.se/{homespace.slug || 'ditt-samhalle'}
            </div>
          </div>
        </div>

        {/* Current Info Section - Overlapping Banner */}
        {homespace.show_current_info_public && (
          <div className="bg-white/95 backdrop-blur-md border-2 border-white/50 mx-8 -mt-16 relative z-20 rounded-2xl shadow-2xl p-8 group">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">📢 Aktuellt</h2>
              {editingSection !== 'current_info' && (
                <button
                  onClick={() => setEditingSection('current_info')}
                  className="opacity-0 group-hover:opacity-100 p-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-all"
                >
                  <Edit3 size={16} />
                </button>
              )}
            </div>

            {editingSection === 'current_info' ? (
              <div>
                <MarkdownToolbar
                  value={homespace.current_info}
                  onChange={(value) => setHomespace({ ...homespace, current_info: value })}
                  placeholder="T.ex. 'Nästa möte: 15 nov kl 19:00 på Folkets hus'"
                  rows={4}
                  helpText="Använd verktygsfältet ovan för att formattera texten"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setEditingSection(null);
                      handleSave();
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Check size={16} />
                    Klar
                  </button>
                  <button
                    onClick={() => setEditingSection(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Stäng
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-gray-700 whitespace-pre-wrap">
                {homespace.current_info || 'Klicka på pennikonen för att lägga till aktuell information...'}
              </div>
            )}
          </div>
        )}

        {/* About Section */}
        <div className="bg-white mx-8 mt-8 rounded-2xl shadow-lg p-8 group">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Om oss</h2>
            {editingSection !== 'about' && (
              <button
                onClick={() => setEditingSection('about')}
                className="opacity-0 group-hover:opacity-100 p-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-all"
              >
                <Edit3 size={16} />
              </button>
            )}
          </div>

          {editingSection === 'about' ? (
            <div>
              <MarkdownToolbar
                value={homespace.about_text}
                onChange={(value) => setHomespace({ ...homespace, about_text: value })}
                placeholder="Berätta om ert samhälle..."
                rows={15}
                label="Om oss"
                helpText="Beskriv ert samhälle, era värderingar och vad ni gör tillsammans"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setEditingSection(null);
                    handleSave();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Check size={16} />
                  Klar
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Stäng
                </button>
              </div>
            </div>
          ) : (
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{homespace.about_text || '*Klicka på pennikonen för att lägga till text...*'}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Dynamic Sections Based on Section Order */}
        {homespace.section_order.map((sectionId: string) => {
          // Gallery Section
          if (sectionId === 'gallery') {
            return (
              <HomepageGallerySection
                key="gallery"
                communityId={communityId}
                images={galleryImages}
                onImagesChange={setGalleryImages}
                isEditing={editingSection === 'gallery'}
                onEdit={() => setEditingSection('gallery')}
                onSave={() => setEditingSection(null)}
                onCancel={() => setEditingSection(null)}
              />
            );
          }

          // Events Section
          if (sectionId === 'events') {
            return (
              <HomepageEventsSection
                key="events"
                communityId={communityId}
                events={events}
                onEventsChange={setEvents}
                isEditing={editingSection === 'events'}
                onEdit={() => setEditingSection('events')}
                onSave={() => setEditingSection(null)}
                onCancel={() => setEditingSection(null)}
              />
            );
          }

          // Contact Section
          if (sectionId === 'contact' && homespace.show_contact_section) {
            return (
              <HomepageContactSection
                key="contact"
                contactInfo={{
                  email: homespace.contact_email,
                  phone: homespace.contact_phone,
                  address: homespace.contact_address,
                  facebook: homespace.social_facebook,
                  instagram: homespace.social_instagram
                }}
                onUpdate={(info) => setHomespace({
                  ...homespace,
                  contact_email: info.email || '',
                  contact_phone: info.phone || '',
                  contact_address: info.address || '',
                  social_facebook: info.facebook || '',
                  social_instagram: info.instagram || ''
                })}
                isEditing={editingSection === 'contact'}
                onEdit={() => setEditingSection('contact')}
                onSave={() => {
                  setEditingSection(null);
                  handleSave();
                }}
                onCancel={() => setEditingSection(null)}
              />
            );
          }

          // Latest Updates Section
          if (sectionId === 'latest_updates' && homespace.show_latest_updates) {
            return (
              <div key="latest_updates" className="bg-gradient-to-br from-blue-50 to-indigo-50 mx-8 mt-8 rounded-2xl shadow-lg p-8 border-2 border-blue-200 group">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">📰 Senaste uppdateringar</h2>
                  {editingSection !== 'latest_updates' && (
                    <button
                      onClick={() => setEditingSection('latest_updates')}
                      className="opacity-0 group-hover:opacity-100 p-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-all"
                    >
                      <Edit3 size={16} />
                    </button>
                  )}
                </div>

                {editingSection === 'latest_updates' ? (
                  <div>
                    <MarkdownToolbar
                      value={homespace.latest_updates_text}
                      onChange={(value) => setHomespace({ ...homespace, latest_updates_text: value })}
                      placeholder="Berätta om senaste händelserna..."
                      rows={8}
                      label="Senaste uppdateringar"
                      helpText="Dela nyheter, händelser och viktiga meddelanden"
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          setEditingSection(null);
                          handleSave();
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <Check size={16} />
                        Klar
                      </button>
                      <button
                        onClick={() => setEditingSection(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Stäng
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {homespace.latest_updates_text || '*Klicka på pennikonen för att lägga till uppdateringar...*'}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}

        {/* Resources Placeholder */}
        {homespace.show_resources_public && (
          <div className="bg-white mx-8 mt-8 rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🛠️ Våra resurser</h2>
            <p className="text-gray-600">
              Här visas samhällets delade resurser (genereras automatiskt från databasen).
            </p>
          </div>
        )}

        {/* Preparedness Placeholder */}
        {homespace.show_preparedness_score_public && (
          <div className="bg-white mx-8 mt-8 rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Samhällets beredskap</h2>
            <p className="text-gray-600">
              Här visas beredskapsnivå (genereras automatiskt från databasen).
            </p>
          </div>
        )}

        {/* Activities Placeholder */}
        {homespace.show_member_activities && (
          <div className="bg-white mx-8 mt-8 rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 Medlemsaktiviteter</h2>
            <p className="text-gray-600">
              Här visas senaste aktiviteter (genereras automatiskt från databasen).
            </p>
          </div>
        )}

        {/* Skills Placeholder */}
        {homespace.show_skills_public && (
          <div className="bg-white mx-8 mt-8 rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🎓 Våra gemensamma kompetenser</h2>
            <p className="text-gray-600">
              Här visas medlemmarnas kompetenser (genereras automatiskt från databasen).
            </p>
          </div>
        )}

        {/* Membership Section */}
        <div className="bg-gradient-to-br from-[#5C6B47]/10 to-[#4A5239]/5 mx-8 mt-8 rounded-2xl shadow-lg p-8 border-2 border-[#5C6B47]/30 group">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">💬 Bli medlem</h2>
            {editingSection !== 'membership' && (
              <button
                onClick={() => setEditingSection('membership')}
                className="opacity-0 group-hover:opacity-100 p-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-all"
              >
                <Edit3 size={16} />
              </button>
            )}
          </div>

          {editingSection === 'membership' ? (
            <div>
              <MarkdownToolbar
                value={homespace.membership_criteria}
                onChange={(value) => setHomespace({ ...homespace, membership_criteria: value })}
                placeholder="Beskriv vem som kan gå med..."
                rows={6}
                label="Bli medlem"
                helpText="Förklara vilka som kan gå med och hur man ansöker"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setEditingSection(null);
                    handleSave();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Check size={16} />
                  Klar
                </button>
                <button
                  onClick={() => setEditingSection(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Stäng
                </button>
              </div>
            </div>
          ) : (
            <div className="prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{homespace.membership_criteria || '*Klicka på pennikonen för att beskriva medlemskriterier...*'}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

