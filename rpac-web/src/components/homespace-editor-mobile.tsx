'use client';

import { useState, useEffect, useRef } from 'react';
import { t } from '@/lib/locales';
import { 
  Save, Globe, Lock, Unlock, Eye, EyeOff, Settings as SettingsIcon,
  Check, X, Edit3, Link as LinkIcon, Copy, Plus, Trash2, Upload,
  Image as ImageIcon, Palette, Wand2, Shield, GripVertical, ExternalLink,
  ArrowLeft, Menu, ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MarkdownToolbar from './markdown-toolbar';
import HomepageContactSection from './homepage-contact-section';
import HomepageGallerySection from './homepage-gallery-section';
import HomepageEventsSection from './homepage-events-section';

interface HomespaceEditorMobileProps {
  communityId: string;
  initialData?: any;
  onClose?: () => void;
}

interface Invitation {
  id: string;
  invitation_code: string;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  is_active: boolean;
  description: string | null;
  created_at: string;
}

interface GalleryImage {
  id: string;
  image_url: string;
  caption?: string;
  display_order: number;
}

interface CommunityEvent {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  event_end_date?: string;
  location?: string;
  is_recurring: boolean;
  show_on_homepage: boolean;
}

export default function HomespaceEditorMobile({ communityId, initialData, onClose }: HomespaceEditorMobileProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
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
    communities: initialData?.communities || {},
    section_order: initialData?.section_order || ['current_info', 'about', 'gallery', 'events', 'contact', 'resources', 'preparedness', 'activities', 'skills', 'membership']
  });

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingBanner, setEditingBanner] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showInvitations, setShowInvitations] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  // Load gallery images
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

  // Load events
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

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (editingSection === null) {
        handleSave(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [homespace]);

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

  const handleSave = async (silent = false) => {
    if (!silent) setSaving(true);

    try {
      const updateData: any = {
        slug: homespace.slug,
        about_text: homespace.about_text,
        current_info: homespace.current_info,
        membership_criteria: homespace.membership_criteria,
        latest_updates_text: homespace.latest_updates_text,
        custom_banner_url: homespace.custom_banner_url,
        banner_pattern: homespace.banner_pattern,
        accent_color: homespace.accent_color,
        show_current_info_public: homespace.show_current_info_public,
        show_resources_public: homespace.show_resources_public,
        show_preparedness_score_public: homespace.show_preparedness_score_public,
        show_member_activities: homespace.show_member_activities,
        show_skills_public: homespace.show_skills_public,
        show_latest_updates: homespace.show_latest_updates,
        show_admin_contact: homespace.show_admin_contact,
        published: homespace.published,
        last_updated: new Date().toISOString()
      };

      try {
        updateData.banner_type = homespace.banner_type;
        updateData.logo_url = homespace.logo_url;
        updateData.contact_email = homespace.contact_email;
        updateData.contact_phone = homespace.contact_phone;
        updateData.contact_address = homespace.contact_address;
        updateData.social_facebook = homespace.social_facebook;
        updateData.social_instagram = homespace.social_instagram;
        updateData.show_contact_section = homespace.show_contact_section;
        updateData.section_order = homespace.section_order;
      } catch (e) {
        console.log('Some new columns not available yet');
      }

      const { error } = await supabase
        .from('community_homespaces')
        .update(updateData)
        .eq('community_id', communityId);

      if (error) {
        console.error('Database error details:', error);
        throw error;
      }
      setLastSaved(new Date());
    } catch (error: any) {
      console.error('Save error:', error);
      if (!silent && error?.message) {
        alert(`Kunde inte spara: ${error.message}\n\nKontakta support om problemet kvarstår.`);
      }
    } finally {
      if (!silent) setSaving(false);
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

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Mobile Header */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 -ml-2 touch-manipulation active:scale-98 transition-all"
                >
                  <ArrowLeft size={24} className="text-gray-600" />
                </button>
              )}
              <div>
                <h1 className="text-lg font-bold text-[#3D4A2B]">
                  {t('homespace.editor.title')}
                </h1>
                <p className="text-sm text-gray-600">
                  {homespace.communities?.community_name}
                </p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-2">
              {lastSaved && (
                <div className="text-xs text-gray-500 px-2">
                  <Check size={14} className="text-green-600 inline mr-1" />
                  {lastSaved.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 touch-manipulation active:scale-98 transition-all bg-gray-100 rounded-lg"
              >
                <SettingsIcon size={20} />
              </button>

              <button
                onClick={() => setHomespace({ ...homespace, published: !homespace.published })}
                className={`px-3 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 touch-manipulation active:scale-98 ${
                  homespace.published
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {homespace.published ? <Unlock size={16} /> : <Lock size={16} />}
                <span className="hidden sm:inline">
                  {homespace.published ? 'Publicerad' : 'Utkast'}
                </span>
              </button>
            </div>
          </div>

          {/* Mobile Tab Navigation */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all touch-manipulation active:scale-98 ${
                activeTab === 'editor'
                  ? 'bg-[#3D4A2B] text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <SettingsIcon size={18} className="inline mr-2" />
              Redigera
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all touch-manipulation active:scale-98 ${
                activeTab === 'preview'
                  ? 'bg-[#3D4A2B] text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Eye size={18} className="inline mr-2" />
              Förhandsvisa
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

      {/* Settings Bottom Sheet */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end">
          <div className="bg-white rounded-t-3xl p-6 w-full max-h-[90vh] overflow-y-auto animate-slide-in-bottom">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Inställningar</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 touch-manipulation active:scale-98 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Section Visibility */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Synliga sektioner</h4>
              
              {[
                { key: 'show_current_info_public', label: '📢 Aktuellt' },
                { key: 'show_latest_updates', label: '📰 Senaste uppdateringar' },
                { key: 'show_resources_public', label: '🛠️ Våra resurser' },
                { key: 'show_preparedness_score_public', label: '📊 Samhällets beredskap' },
                { key: 'show_member_activities', label: '🎯 Medlemsaktiviteter' },
                { key: 'show_skills_public', label: '🎓 Våra kompetenser' },
                { key: 'show_admin_contact', label: '💬 Kontakt & Bli medlem' },
                { key: 'show_contact_section', label: '📞 Kontaktinformation' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer touch-manipulation">
                  <input
                    type="checkbox"
                    checked={homespace[key as keyof typeof homespace] as boolean}
                    onChange={(e) => setHomespace({ ...homespace, [key]: e.target.checked })}
                    className="w-5 h-5 text-[#5C6B47] border-gray-300 rounded focus:ring-[#5C6B47]"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t">
              <button
                onClick={() => {
                  setShowSettings(false);
                  handleSave();
                }}
                className="w-full px-6 py-3 bg-[#3D4A2B] text-white rounded-xl font-semibold hover:bg-[#2A331E] transition-all touch-manipulation active:scale-98 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Spara inställningar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-6 py-6">
        {activeTab === 'editor' ? (
          <div className="space-y-6">
            {/* Banner Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#3D4A2B]">🎨 Banner</h2>
                <button
                  onClick={() => setEditingBanner(true)}
                  className="p-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-all touch-manipulation active:scale-98"
                >
                  <Wand2 size={18} />
                </button>
              </div>

              {/* Banner Preview */}
              <div
                className="h-32 rounded-xl overflow-hidden mb-4"
                style={getBannerStyle()}
              >
                <div className="h-full flex flex-col justify-center px-4 text-white">
                  {homespace.banner_type === 'shield' && (
                    <Shield size={40} className="mb-2 opacity-30" />
                  )}
                  <h3 className="text-lg font-bold">
                    {homespace.communities?.community_name || 'Ditt Samhälle'}
                  </h3>
                  <p className="text-sm opacity-90">
                    {homespace.communities?.county || 'Sverige'}
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Klicka på pennikonen för att anpassa banner
              </p>
            </div>

            {/* Content Sections */}
            <div className="space-y-4">
              {/* Current Info */}
              {homespace.show_current_info_public && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-[#3D4A2B]">📢 Aktuellt</h2>
                    <button
                      onClick={() => setEditingSection('current_info')}
                      className="p-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-all touch-manipulation active:scale-98"
                    >
                      <Edit3 size={18} />
                    </button>
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
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 touch-manipulation active:scale-98"
                        >
                          <Check size={16} />
                          Klar
                        </button>
                        <button
                          onClick={() => setEditingSection(null)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 touch-manipulation active:scale-98"
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
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-[#3D4A2B]">Om oss</h2>
                  <button
                    onClick={() => setEditingSection('about')}
                    className="p-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-all touch-manipulation active:scale-98"
                  >
                    <Edit3 size={18} />
                  </button>
                </div>

                {editingSection === 'about' ? (
                  <div>
                    <MarkdownToolbar
                      value={homespace.about_text}
                      onChange={(value) => setHomespace({ ...homespace, about_text: value })}
                      placeholder="Berätta om ert samhälle..."
                      rows={8}
                      label="Om oss"
                      helpText="Beskriv ert samhälle, era värderingar och vad ni gör tillsammans"
                    />
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => {
                          setEditingSection(null);
                          handleSave();
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 touch-manipulation active:scale-98"
                      >
                        <Check size={16} />
                        Klar
                      </button>
                      <button
                        onClick={() => setEditingSection(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 touch-manipulation active:scale-98"
                      >
                        Stäng
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {homespace.about_text || '*Klicka på pennikonen för att lägga till text...*'}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Membership Section */}
              <div className="bg-gradient-to-br from-[#5C6B47]/10 to-[#4A5239]/5 rounded-2xl shadow-lg p-6 border-2 border-[#5C6B47]/30">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-[#3D4A2B]">💬 Bli medlem</h2>
                  <button
                    onClick={() => setEditingSection('membership')}
                    className="p-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-all touch-manipulation active:scale-98"
                  >
                    <Edit3 size={18} />
                  </button>
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
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 touch-manipulation active:scale-98"
                      >
                        <Check size={16} />
                        Klar
                      </button>
                      <button
                        onClick={() => setEditingSection(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 touch-manipulation active:scale-98"
                      >
                        Stäng
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {homespace.membership_criteria || '*Klicka på pennikonen för att beskriva medlemskriterier...*'}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Preview mode - actual homepage preview
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Homepage Preview Header */}
            <div className={`relative overflow-hidden ${
              homespace.banner_type === 'gradient' 
                ? `bg-gradient-to-r ${homespace.banner_pattern === 'olive-gradient' ? 'from-[#3D4A2B] to-[#5C6B47]' : 'from-[#5C6B47] to-[#707C5F]'}`
                : 'bg-gray-100'
            }`}>
              {homespace.custom_banner_url && (
                <img 
                  src={homespace.custom_banner_url} 
                  alt="Banner" 
                  className="w-full h-32 object-cover"
                />
              )}
              <div className="p-6 text-white">
                <div className="flex items-center gap-3 mb-3">
                  {homespace.logo_url && (
                    <img 
                      src={homespace.logo_url} 
                      alt="Logo" 
                      className="w-12 h-12 rounded-lg object-cover bg-white/20"
                    />
                  )}
                  <div>
                    <h1 className="text-xl font-bold">{homespace.communities?.community_name || 'Samhälle'}</h1>
                    <p className="text-white/80 text-sm">Lokalt samhälle</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Content */}
            <div className="p-6 space-y-6">
              {/* Current Info Section */}
              {homespace.show_current_info_public && homespace.current_info && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Aktuell information</h3>
                  <div className="prose prose-sm max-w-none text-blue-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {homespace.current_info}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* About Section */}
              {homespace.about_text && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Om vårt samhälle</h3>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {homespace.about_text}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Membership Criteria */}
              {homespace.membership_criteria && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Medlemskriterier</h3>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {homespace.membership_criteria}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Contact Section */}
              {homespace.show_contact_section && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Kontakt</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    {homespace.contact_email && (
                      <p>📧 {homespace.contact_email}</p>
                    )}
                    {homespace.contact_phone && (
                      <p>📞 {homespace.contact_phone}</p>
                    )}
                    {homespace.contact_address && (
                      <p>📍 {homespace.contact_address}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Footer */}
              <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
                <p>Förhandsvisning av hemsidan</p>
                <p className="text-xs mt-1">
                  {homespace.published ? 'Publicerad' : 'Utkast'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Banner Editor Modal - Mobile Optimized */}
      {editingBanner && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end">
          <div className="bg-white rounded-t-3xl p-6 w-full max-h-[90vh] overflow-y-auto animate-slide-in-bottom">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Wand2 size={24} className="text-[#5C6B47]" />
                Anpassa banner
              </h3>
              <button
                onClick={() => setEditingBanner(false)}
                className="p-2 touch-manipulation active:scale-98 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Banner Type Selection */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-900">
                  Banner typ
                </label>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => setHomespace({ ...homespace, banner_type: 'gradient' })}
                    className={`p-4 rounded-xl border-2 transition-all touch-manipulation active:scale-98 ${
                      homespace.banner_type === 'gradient'
                        ? 'border-[#5C6B47] bg-[#5C6B47]/10'
                        : 'border-gray-200 hover:border-[#5C6B47]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Palette size={24} className="text-[#5C6B47]" />
                      <div>
                        <div className="font-semibold text-sm">Gradient</div>
                        <div className="text-xs text-gray-500">Olivegröna färger</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-4 rounded-xl border-2 transition-all touch-manipulation active:scale-98 ${
                      homespace.banner_type === 'image'
                        ? 'border-[#5C6B47] bg-[#5C6B47]/10'
                        : 'border-gray-200 hover:border-[#5C6B47]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ImageIcon size={24} className="text-[#5C6B47]" />
                      <div>
                        <div className="font-semibold text-sm">Egen bild</div>
                        <div className="text-xs text-gray-500">Ladda upp bild</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setHomespace({ ...homespace, banner_type: 'shield' })}
                    className={`p-4 rounded-xl border-2 transition-all touch-manipulation active:scale-98 ${
                      homespace.banner_type === 'shield'
                        ? 'border-[#5C6B47] bg-[#5C6B47]/10'
                        : 'border-gray-200 hover:border-[#5C6B47]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Shield size={24} className="text-[#5C6B47]" />
                      <div>
                        <div className="font-semibold text-sm">BeReady Sköld</div>
                        <div className="text-xs text-gray-500">Officiell sköld</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-900">
                  Förhandsvisning
                </label>
                <div
                  className="aspect-[21/9] rounded-xl overflow-hidden shadow-lg"
                  style={getBannerStyle()}
                >
                  <div className="h-full flex flex-col justify-center px-4 text-white">
                    {homespace.banner_type === 'shield' && (
                      <Shield size={40} className="mb-2 opacity-30" />
                    )}
                    <h2 className="text-lg font-bold">
                      {homespace.communities?.community_name || 'Ditt Samhälle'}
                    </h2>
                    <p className="text-sm opacity-90">
                      {homespace.communities?.county || 'Sverige'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t flex gap-3">
              <button
                onClick={() => setEditingBanner(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors touch-manipulation active:scale-98"
              >
                Avbryt
              </button>
              <button
                onClick={() => {
                  setEditingBanner(false);
                  handleSave();
                }}
                className="flex-1 px-6 py-3 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors flex items-center justify-center gap-2 touch-manipulation active:scale-98"
              >
                <Check size={18} />
                Spara
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

