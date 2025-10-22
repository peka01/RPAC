'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/locales';
import { 
  Save, Globe, Lock, Unlock, Eye, EyeOff, Settings as SettingsIcon,
  Check, X, Edit3, Link as LinkIcon, Copy, Plus, Trash2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';

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

export default function HomespaceEditorLive({ communityId, initialData }: HomespaceEditorLiveProps) {
  const [homespace, setHomespace] = useState({
    id: initialData?.id || '',
    slug: initialData?.slug || '',
    about_text: initialData?.about_text || '',
    current_info: initialData?.current_info || '',
    membership_criteria: initialData?.membership_criteria || '',
    latest_updates_text: initialData?.latest_updates_text || '',
    custom_banner_url: initialData?.custom_banner_url || null,
    banner_pattern: initialData?.banner_pattern || 'olive-gradient',
    accent_color: initialData?.accent_color || '#5C6B47',
    show_current_info_public: initialData?.show_current_info_public ?? true,
    show_resources_public: initialData?.show_resources_public ?? true,
    show_preparedness_score_public: initialData?.show_preparedness_score_public ?? true,
    show_member_activities: initialData?.show_member_activities ?? true,
    show_skills_public: initialData?.show_skills_public ?? true,
    show_latest_updates: initialData?.show_latest_updates ?? true,
    show_admin_contact: initialData?.show_admin_contact ?? true,
    published: initialData?.published ?? false,
    communities: initialData?.communities || {}
  });

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showInvitations, setShowInvitations] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  // Auto-save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (editingSection === null) {
        handleSave(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [homespace]);

  const handleSave = async (silent = false) => {
    if (!silent) setSaving(true);

    try {
      const { error } = await supabase
        .from('community_homespaces')
        .update({
          slug: homespace.slug,
          about_text: homespace.about_text,
          current_info: homespace.current_info,
          membership_criteria: homespace.membership_criteria,
          latest_updates_text: homespace.latest_updates_text,
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
        })
        .eq('community_id', communityId);

      if (error) throw error;
      setLastSaved(new Date());
    } catch (error) {
      console.error('Save error:', error);
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

  const getBannerGradient = () => {
    switch (homespace.banner_pattern) {
      case 'olive-gradient':
        return 'bg-gradient-to-br from-[#556B2F] to-[#3D4A2B]';
      case 'dark-olive':
        return 'bg-gradient-to-br from-[#2A331E] to-[#1A1F13]';
      case 'warm-olive':
        return 'bg-gradient-to-br from-[#6B7B4F] to-[#5C6B47]';
      default:
        return 'bg-gradient-to-br from-[#556B2F] to-[#3D4A2B]';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Floating Toolbar */}
      <div className="fixed top-4 right-4 z-20 flex items-center gap-2 bg-white shadow-2xl rounded-xl p-2 border-2 border-[#3D4A2B]">
        {/* Auto-save indicator */}
        {lastSaved && (
          <div className="text-xs text-gray-500 px-2 flex items-center gap-1">
            <Check size={14} className="text-green-600" />
            Sparad {lastSaved.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}

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
            {/* Banner Pattern */}
            <div>
              <label className="block text-sm font-semibold mb-2">Bannermönster</label>
              <select
                value={homespace.banner_pattern}
                onChange={(e) => setHomespace({ ...homespace, banner_pattern: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="olive-gradient">Olivgrön Gradient</option>
                <option value="dark-olive">Mörk Oliv</option>
                <option value="warm-olive">Varm Oliv</option>
              </select>
            </div>

            {/* Section Visibility */}
            <div className="border-t pt-4">
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

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={homespace.show_admin_contact}
                  onChange={(e) => setHomespace({ ...homespace, show_admin_contact: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm">💬 Kontakt & Bli medlem</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview/Editor */}
      <div className="max-w-5xl mx-auto pb-20">
        {/* Hero Banner */}
        <div className={`${getBannerGradient()} text-white px-8 py-16 relative group`}>
          <div className="max-w-4xl mx-auto">
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

        {/* Current Info Section */}
        {homespace.show_current_info_public && (
          <div className="bg-white mx-8 -mt-8 relative z-10 rounded-2xl shadow-xl p-8 group">
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
                <textarea
                  value={homespace.current_info}
                  onChange={(e) => setHomespace({ ...homespace, current_info: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-[#5C6B47] rounded-xl focus:ring-2 focus:ring-[#5C6B47] font-sans text-base"
                  placeholder="T.ex. 'Nästa möte: 15 nov kl 19:00 på Folkets hus'"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
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
              <textarea
                value={homespace.about_text}
                onChange={(e) => setHomespace({ ...homespace, about_text: e.target.value })}
                rows={15}
                className="w-full px-4 py-3 border-2 border-[#5C6B47] rounded-xl focus:ring-2 focus:ring-[#5C6B47] font-mono text-sm"
                placeholder="Berätta om ert samhälle... (Markdown stöds)"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
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
              <p className="text-xs text-gray-500 mt-2">
                💡 Tips: Använd # för rubriker, ## för underrubriker, - för punktlistor
              </p>
            </div>
          ) : (
            <div className="prose prose-lg max-w-none">
              <ReactMarkdown>{homespace.about_text || '*Klicka på pennikonen för att lägga till text...*'}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Latest Updates Section */}
        {homespace.show_latest_updates && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 mx-8 mt-8 rounded-2xl shadow-lg p-8 border-2 border-blue-200 group">
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
                <textarea
                  value={homespace.latest_updates_text}
                  onChange={(e) => setHomespace({ ...homespace, latest_updates_text: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-3 border-2 border-[#5C6B47] rounded-xl focus:ring-2 focus:ring-[#5C6B47] font-mono text-sm"
                  placeholder="Berätta om senaste händelserna... (Markdown stöds)"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
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
                <ReactMarkdown>{homespace.latest_updates_text || '*Klicka på pennikonen för att lägga till uppdateringar...*'}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

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
              <textarea
                value={homespace.membership_criteria}
                onChange={(e) => setHomespace({ ...homespace, membership_criteria: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 border-2 border-[#5C6B47] rounded-xl focus:ring-2 focus:ring-[#5C6B47] font-mono text-sm"
                placeholder="Vem kan gå med? (Markdown stöds)"
                autoFocus
              />
              <div className="flex gap-2 mt-2">
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
              <ReactMarkdown>{homespace.membership_criteria || '*Klicka på pennikonen för att beskriva medlemskriterier...*'}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
