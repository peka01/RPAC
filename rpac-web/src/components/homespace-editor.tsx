'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/locales';
import { 
  Save, Eye, Globe, ExternalLink, Upload, Palette, 
  Settings as SettingsIcon, Lock, Unlock, RotateCcw, Copy, Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CommunityHomespace from './community-homespace';

interface HomespaceEditorProps {
  communityId: string;
  initialData?: any;
}

export default function HomespaceEditor({ communityId, initialData }: HomespaceEditorProps) {
  
  // Editor state
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Homespace data
  const [homespace, setHomespace] = useState({
    id: initialData?.id || '',
    slug: initialData?.slug || '',
    about_text: initialData?.about_text || '',
    current_info: initialData?.current_info || '',
    membership_criteria: initialData?.membership_criteria || '',
    custom_banner_url: initialData?.custom_banner_url || null,
    banner_pattern: initialData?.banner_pattern || 'olive-gradient',
    accent_color: initialData?.accent_color || '#5C6B47',
    show_current_info_public: initialData?.show_current_info_public ?? true,
    show_resources_public: initialData?.show_resources_public ?? true,
    show_preparedness_score_public: initialData?.show_preparedness_score_public ?? true,
    show_member_activities: initialData?.show_member_activities ?? false,
    show_admin_contact: initialData?.show_admin_contact ?? true,
    show_skills_public: initialData?.show_skills_public ?? true,
    published: initialData?.published ?? false,
    views_count: initialData?.views_count || 0,
    created_at: initialData?.created_at || new Date().toISOString(),
    communities: initialData?.communities || {}
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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
        accent_color: homespace.accent_color,
        show_current_info_public: homespace.show_current_info_public,
        show_resources_public: homespace.show_resources_public,
        show_preparedness_score_public: homespace.show_preparedness_score_public,
        show_member_activities: homespace.show_member_activities,
        show_admin_contact: homespace.show_admin_contact,
        show_skills_public: homespace.show_skills_public,
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'editor' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left column - Content */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-[#3D4A2B] mb-4 flex items-center gap-2">
                  📝 {t('homespace.editor.content')}
                </h2>

                {/* Current Info */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    📢 {t('homespace.editor.current_info_section')}
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    {t('homespace.editor.current_info_help')}
                  </p>
                  <textarea
                    value={homespace.current_info}
                    onChange={(e) => setHomespace({ ...homespace, current_info: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-[#B8860B]/30 rounded-xl focus:ring-2 focus:ring-[#B8860B] focus:border-transparent font-mono text-sm bg-amber-50/30"
                    placeholder="T.ex. 'Nästa möte: 15 nov kl 19:00 på Folkets hus' eller 'Välkomna till höstmarknad 10 oktober!'"
                  />
                </div>

                {/* About text */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('homespace.editor.about_section')}
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    {t('homespace.editor.about_help')}
                  </p>
                  <textarea
                    value={homespace.about_text}
                    onChange={(e) => setHomespace({ ...homespace, about_text: e.target.value })}
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5C6B47] focus:border-transparent font-mono text-sm"
                    placeholder="Markdown stöds..."
                  />
                </div>

                {/* Membership criteria */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('homespace.editor.membership_criteria')}
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    {t('homespace.editor.membership_help')}
                  </p>
                  <textarea
                    value={homespace.membership_criteria}
                    onChange={(e) => setHomespace({ ...homespace, membership_criteria: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5C6B47] focus:border-transparent font-mono text-sm"
                    placeholder="Markdown stöds..."
                  />
                </div>
              </div>
            </div>

            {/* Right column - Visual & Settings */}
            <div className="space-y-6">
              {/* Visual customization */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-[#3D4A2B] mb-4 flex items-center gap-2">
                  🎨 {t('homespace.editor.visual')}
                </h2>

                {/* Banner pattern */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('homespace.editor.banner_image')}
                  </label>
                  
                  {/* Custom image URL */}
                  <div className="mb-4">
                    <input
                      type="text"
                      value={homespace.custom_banner_url || ''}
                      onChange={(e) => setHomespace({ ...homespace, custom_banner_url: e.target.value || null })}
                      placeholder="https://example.com/image.jpg (valfritt)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5C6B47] focus:border-transparent text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Lägg till en bild-URL, eller välj ett mönster nedan
                    </p>
                  </div>

                  {/* Pattern selection */}
                  <div className="grid grid-cols-2 gap-3">
                    {['olive-gradient', 'olive-mesh', 'olive-waves', 'olive-geometric'].map((pattern) => (
                      <button
                        key={pattern}
                        onClick={() => setHomespace({ ...homespace, banner_pattern: pattern, custom_banner_url: null })}
                        className={`h-20 rounded-xl transition-all ${
                          homespace.banner_pattern === pattern && !homespace.custom_banner_url
                            ? 'ring-4 ring-[#5C6B47] scale-105'
                            : 'hover:scale-105'
                        } ${
                          pattern === 'olive-gradient' ? 'bg-gradient-to-br from-[#5C6B47] to-[#3D4A2B]' :
                          pattern === 'olive-mesh' ? 'bg-gradient-to-br from-[#5C6B47] via-[#4A5239] to-[#3D4A2B]' :
                          pattern === 'olive-waves' ? 'bg-gradient-to-r from-[#5C6B47] via-[#707C5F] to-[#5C6B47]' :
                          'bg-gradient-to-br from-[#3D4A2B] via-[#5C6B47] to-[#2A331E]'
                        }`}
                      />
                    ))}
                  </div>
                  
                  {/* Current banner preview */}
                  {homespace.custom_banner_url && (
                    <div className="mt-3">
                      <div 
                        className="h-24 rounded-xl bg-cover bg-center"
                        style={{ backgroundImage: `url(${homespace.custom_banner_url})` }}
                      />
                    </div>
                  )}
                </div>

                {/* URL slug */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('homespace.editor.url_slug')}
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    {t('homespace.editor.slug_help')}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">beready.se/</span>
                    <input
                      type="text"
                      value={homespace.slug}
                      onChange={(e) => setHomespace({ ...homespace, slug: e.target.value.toLowerCase() })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5C6B47] focus:border-transparent"
                    />
                    <button
                      onClick={copyPublicLink}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
                      title={t('homespace.copy_link')}
                    >
                      {linkCopied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                    </button>
                  </div>
                  {errors.slug && (
                    <p className="text-sm text-red-600 mt-1">{errors.slug}</p>
                  )}
                </div>
              </div>

              {/* Visibility settings */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-[#3D4A2B] mb-4 flex items-center gap-2">
                  🔒 {t('homespace.editor.visibility')}
                </h2>

                <div className="space-y-3">
                  {[
                    { key: 'show_current_info_public', label: t('homespace.editor.show_current_info_public') },
                    { key: 'show_resources_public', label: t('homespace.editor.show_resources_public') },
                    { key: 'show_preparedness_public', label: t('homespace.editor.show_preparedness_public') },
                    { key: 'show_member_activities', label: t('homespace.editor.show_member_activities') },
                    { key: 'show_admin_contact', label: t('homespace.editor.show_admin_contact') },
                    { key: 'show_skills_public', label: t('homespace.editor.show_skills_public') }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={homespace[key as keyof typeof homespace] as boolean}
                        onChange={(e) => setHomespace({ ...homespace, [key]: e.target.checked })}
                        className="w-5 h-5 text-[#5C6B47] border-gray-300 rounded focus:ring-[#5C6B47]"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <button
                  onClick={handleReset}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} />
                  {t('homespace.reset_template')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Preview mode
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <CommunityHomespace homespace={homespace} isPreview={true} />
          </div>
        )}
      </div>
    </div>
  );
}

