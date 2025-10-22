'use client';

import { useState, useEffect, useRef } from 'react';
import { t } from '@/lib/locales';
import { 
  Save, Globe, Lock, Unlock, Eye, EyeOff, Settings as SettingsIcon,
  Check, X, Edit3, Link as LinkIcon, Copy, Plus, Trash2, Upload,
  Image as ImageIcon, Palette, Wand2, Shield, GripVertical, ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import MarkdownToolbar from './markdown-toolbar';
import HomepageContactSection from './homepage-contact-section';
import HomepageGallerySection from './homepage-gallery-section';
import HomepageEventsSection from './homepage-events-section';

interface HomespaceEditorLiveProps {
  communityId: string;
  initialData?: any;
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

export default function HomespaceEditorLive({ communityId, initialData }: HomespaceEditorLiveProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDropRef = useRef<HTMLDivElement>(null);
  
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
    banner_type: initialData?.banner_type || 'gradient', // 'gradient', 'image', 'shield'
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
  const [isDragging, setIsDragging] = useState(false);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  // Drag and drop handlers
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (e.target === dragDropRef.current) {
        setIsDragging(false);
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
          await handleImageUpload(file);
        }
      }
    };

    const element = dragDropRef.current;
    if (element) {
      element.addEventListener('dragover', handleDragOver);
      element.addEventListener('dragleave', handleDragLeave);
      element.addEventListener('drop', handleDrop);

      return () => {
        element.removeEventListener('dragover', handleDragOver);
        element.removeEventListener('dragleave', handleDragLeave);
        element.removeEventListener('drop', handleDrop);
      };
    }
  }, []);

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${communityId}-banner-${Date.now()}.${fileExt}`;
      const filePath = `community-banners/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath);

      // Update homespace with new image
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleSave = async (silent = false) => {
    if (!silent) setSaving(true);

    try {
      // Build update object, conditionally including new fields if supported
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

      // Try to include new Phase 1 fields (will work after migration)
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
        // Columns might not exist yet, skip them
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

  const loadInvitations = async () => {
    setLoadingInvites(true);
    try {
      const { data, error } = await supabase
        .from('community_invitations')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setInvitations(data);
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoadingInvites(false);
    }
  };

  const createInvitation = async () => {
    try {
      const code = await generateInvitationCode();
      
      const { error } = await supabase
        .from('community_invitations')
        .insert({
          community_id: communityId,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          invitation_code: code,
          description: 'Genererad från hemsida'
        });

      if (!error) {
        loadInvitations();
      }
    } catch (error) {
      console.error('Error creating invitation:', error);
    }
  };

  const generateInvitationCode = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('generate_invitation_code');
    if (error || !data) {
      // Fallback to client-side generation
      return Math.random().toString(36).substr(2, 8).toUpperCase();
    }
    return data;
  };

  const toggleInvitation = async (id: string, isActive: boolean) => {
    await supabase
      .from('community_invitations')
      .update({ is_active: !isActive })
      .eq('id', id);
    
    loadInvitations();
  };

  const deleteInvitation = async (id: string) => {
    if (confirm('Radera denna inbjudningslänk?')) {
      await supabase
        .from('community_invitations')
        .delete()
        .eq('id', id);
      
      loadInvitations();
    }
  };

  const copyInvitationLink = (code: string) => {
    const url = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(url);
    alert('Inbjudningslänk kopierad!');
  };

  useEffect(() => {
    if (showInvitations) {
      loadInvitations();
    }
  }, [showInvitations]);

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

    // Gradient patterns
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

  const bannerGradients = [
    { id: 'olive-gradient', name: 'Olivgrön Gradient', preview: 'linear-gradient(135deg, #556B2F 0%, #3D4A2B 100%)' },
    { id: 'dark-olive', name: 'Mörk Oliv', preview: 'linear-gradient(135deg, #2A331E 0%, #1A1F13 100%)' },
    { id: 'warm-olive', name: 'Varm Oliv', preview: 'linear-gradient(135deg, #6B7B4F 0%, #5C6B47 100%)' },
    { id: 'olive-mesh', name: 'Olivgrön Mesh', preview: 'radial-gradient(circle at 20% 50%, #6B7B4F 0%, transparent 50%), radial-gradient(circle at 80% 80%, #5C6B47 0%, transparent 50%), linear-gradient(135deg, #3D4A2B 0%, #2A331E 100%)' },
    { id: 'olive-waves', name: 'Olivgröna Vågor', preview: 'linear-gradient(110deg, #556B2F 0%, #3D4A2B 50%, #5C6B47 100%)' },
  ];

  return (
    <div ref={dragDropRef} className="min-h-screen bg-gray-50 relative">
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-[#3D4A2B]/90 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl p-12 shadow-2xl text-center max-w-md">
            <ImageIcon size={64} className="mx-auto text-[#5C6B47] mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {t('homespace.editor.drop_image')}
            </h3>
            <p className="text-gray-600">
              {t('homespace.editor.drop_image_description')}
            </p>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
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

        {/* Invitations */}
        <button
          onClick={() => setShowInvitations(!showInvitations)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Inbjudningslänkar"
        >
          <LinkIcon size={20} />
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

      {/* Invitations Panel */}
      {showInvitations && (
        <div className="fixed top-20 right-4 z-20 w-96 max-h-[600px] overflow-y-auto bg-white shadow-2xl rounded-xl p-6 border-2 border-[#3D4A2B]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <LinkIcon size={20} />
              Inbjudningslänkar
            </h3>
            <button onClick={() => setShowInvitations(false)} className="p-1 hover:bg-gray-100 rounded">
              <X size={20} />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Skapa inbjudningslänkar som automatiskt godkänner nya medlemmar när de registrerar sig.
          </p>

          <button
            onClick={createInvitation}
            className="w-full mb-4 px-4 py-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Skapa ny inbjudningslänk
          </button>

          {loadingInvites ? (
            <div className="text-center py-4 text-gray-500">Laddar...</div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Inga inbjudningslänkar än.
            </div>
          ) : (
            <div className="space-y-3">
              {invitations.map(invite => (
                <div key={invite.id} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-mono text-sm font-semibold">{invite.invitation_code}</div>
                      <div className="text-xs text-gray-500">
                        Använd: {invite.current_uses}{invite.max_uses ? `/${invite.max_uses}` : ''}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => copyInvitationLink(invite.invitation_code)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Kopiera länk"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => toggleInvitation(invite.id, invite.is_active)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title={invite.is_active ? 'Inaktivera' : 'Aktivera'}
                      >
                        {invite.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button
                        onClick={() => deleteInvitation(invite.id)}
                        className="p-1 hover:bg-red-100 text-red-600 rounded"
                        title="Radera"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    beready.se/invite/{invite.invitation_code}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

            {/* Section Ordering */}
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
                <GripVertical size={16} />
                {t('homespace.editor.reorder_sections')}
              </h4>
              <p className="text-xs text-gray-500 mb-3">
                {t('homespace.editor.drag_to_reorder')}
              </p>
              <div className="space-y-2">
                {homespace.section_order.map((sectionId: string, index: number) => {
                  const sectionLabels: Record<string, string> = {
                    'current_info': '📢 Aktuellt',
                    'about': 'ℹ️ Om oss',
                    'gallery': '📸 Bildgalleri',
                    'events': '📅 Event',
                    'contact': '📞 Kontakt',
                    'latest_updates': '📰 Uppdateringar',
                    'resources': '🛠️ Resurser',
                    'preparedness': '📊 Beredskap',
                    'activities': '🎯 Aktiviteter',
                    'skills': '🎓 Kompetenser',
                    'membership': '💬 Bli medlem'
                  };
                  
                  return (
                    <div
                      key={sectionId}
                      draggable
                      onDragStart={() => setDraggedSectionIndex(index)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (draggedSectionIndex === null || draggedSectionIndex === index) return;
                        
                        const newOrder = [...homespace.section_order];
                        const draggedSection = newOrder[draggedSectionIndex];
                        newOrder.splice(draggedSectionIndex, 1);
                        newOrder.splice(index, 0, draggedSection);
                        
                        setHomespace({ ...homespace, section_order: newOrder });
                        setDraggedSectionIndex(index);
                      }}
                      onDragEnd={() => {
                        setDraggedSectionIndex(null);
                        handleSave(true);
                      }}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded cursor-move hover:bg-gray-100 border border-gray-200"
                    >
                      <GripVertical size={16} className="text-gray-400" />
                      <span className="text-sm">{sectionLabels[sectionId] || sectionId}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                💡 Dra och släpp för att ändra ordning
              </p>
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
                    <ImageIcon size={32} className="mx-auto mb-2 text-[#5C6B47]" />
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

              {/* Gradient Selection */}
              {homespace.banner_type === 'gradient' && (
                <div>
                  <label className="block text-sm font-semibold mb-3 text-gray-900">
                    {t('homespace.editor.choose_gradient')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {bannerGradients.map((gradient) => (
                      <button
                        key={gradient.id}
                        onClick={() => setHomespace({ ...homespace, banner_pattern: gradient.id })}
                        className={`h-24 rounded-xl border-2 transition-all relative overflow-hidden ${
                          homespace.banner_pattern === gradient.id
                            ? 'border-[#5C6B47] ring-2 ring-[#5C6B47]/50'
                            : 'border-gray-200 hover:border-[#5C6B47]/50'
                        }`}
                        style={{ background: gradient.preview }}
                      >
                        {homespace.banner_pattern === gradient.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <div className="bg-white rounded-full p-2">
                              <Check size={20} className="text-[#5C6B47]" />
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-xs py-1 px-2 font-semibold">
                          {gradient.name}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Upload Status */}
              {homespace.banner_type === 'image' && (
                <div>
                  {uploadingImage ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#5C6B47] border-t-transparent mx-auto mb-4"></div>
                      <p className="text-gray-600">{t('homespace.editor.uploading_image')}</p>
                    </div>
                  ) : homespace.custom_banner_url ? (
                    <div className="space-y-3">
                      <div className="aspect-video rounded-xl overflow-hidden border-2 border-gray-200">
                        <img
                          src={homespace.custom_banner_url}
                          alt="Banner"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-4 py-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors flex items-center justify-center gap-2"
                      >
                        <Upload size={18} />
                        {t('homespace.editor.change_image')}
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-[#5C6B47] hover:bg-[#5C6B47]/5 transition-all"
                    >
                      <Upload size={48} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600 font-semibold mb-1">
                        {t('homespace.editor.click_to_upload')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t('homespace.editor.or_drag_drop')}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Shield Badge Info */}
              {homespace.banner_type === 'shield' && (
                <div className="bg-[#5C6B47]/10 border border-[#5C6B47]/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Shield size={24} className="text-[#5C6B47] flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {t('homespace.editor.beready_shield')}
                      </h4>
                      <p className="text-sm text-gray-700">
                        {t('homespace.editor.shield_description')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
