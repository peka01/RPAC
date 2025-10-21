'use client';

import { t } from '@/lib/locales';
import { MapPin, Users, Calendar, ExternalLink, Mail, Shield, Wrench, Droplet, Heart, Zap, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';

interface CommunityHomespaceProps {
  homespace: {
    id: string;
    slug: string;
    about_text: string | null;
    current_info: string | null;
    membership_criteria: string | null;
    custom_banner_url: string | null;
    banner_pattern: string;
    accent_color: string;
    show_current_info_public: boolean;
    show_resources_public: boolean;
    show_preparedness_score_public: boolean;
    show_member_activities: boolean;
    show_admin_contact: boolean;
    show_skills_public: boolean;
    published: boolean;
    views_count: number;
    created_at: string;
    communities: {
      id: string;
      community_name: string;
      county: string | null;
      description: string | null;
      created_at: string;
      member_count: number;
    };
  };
  isPreview?: boolean;
}

// Banner pattern backgrounds
const bannerPatterns = {
  'olive-gradient': 'bg-gradient-to-br from-[#5C6B47] to-[#3D4A2B]',
  'olive-mesh': 'bg-gradient-to-br from-[#5C6B47] via-[#4A5239] to-[#3D4A2B]',
  'olive-waves': 'bg-gradient-to-r from-[#5C6B47] via-[#707C5F] to-[#5C6B47]',
  'olive-geometric': 'bg-gradient-to-br from-[#3D4A2B] via-[#5C6B47] to-[#2A331E]'
};

export default function CommunityHomespace({ homespace, isPreview = false }: CommunityHomespaceProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [adminContact, setAdminContact] = useState<{ name: string; email: string } | null>(null);

  const bannerClass = homespace.custom_banner_url 
    ? '' 
    : bannerPatterns[homespace.banner_pattern as keyof typeof bannerPatterns] || bannerPatterns['olive-gradient'];

  // Format date
  const foundedYear = new Date(homespace.communities.created_at).getFullYear();

  // Fetch admin contact info
  useEffect(() => {
    const fetchAdminContact = async () => {
      if (!homespace.show_admin_contact) return;
      
      const { data: community } = await supabase
        .from('local_communities')
        .select('created_by')
        .eq('id', homespace.communities.id)
        .single();

      if (community?.created_by) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('full_name, email')
          .eq('id', community.created_by)
          .single();

        if (profile) {
          setAdminContact({
            name: profile.full_name || 'Administratör',
            email: profile.email || ''
          });
        }
      }
    };

    fetchAdminContact();
  }, [homespace.communities.id, homespace.show_admin_contact]);

  // Copy link to clipboard
  const copyLink = () => {
    const url = `${window.location.origin}/${homespace.slug}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Mock resource data (in real implementation, fetch from database)
  const resourceStats = {
    vehicles: 3,
    tools: 24,
    water: 5,
    food: 12,
    energy: 8,
    medicine: 6
  };

  // Mock preparedness score (in real implementation, calculate from member data)
  const preparednessScore = 78;
  const categoryScores = {
    food: 85,
    water: 92,
    energy: 74,
    tools: 88,
    medicine: 65,
    communication: 80
  };

  const getStatusLabel = (score: number) => {
    if (score >= 80) return t('homespace.preparedness.status.strong');
    if (score >= 60) return t('homespace.preparedness.status.good');
    if (score >= 40) return t('homespace.preparedness.status.developing');
    return t('homespace.preparedness.status.needs_improvement');
  };

  const getStatusColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-[#5C6B47]';
    if (score >= 40) return 'text-amber-600';
    return 'text-orange-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Preview Banner */}
      {isPreview && (
        <div className="bg-amber-500 text-white px-6 py-3 text-center font-medium">
          {t('homespace.preview')} - {t('homespace.editor.unsaved_changes')}
        </div>
      )}

      {/* Hero Section */}
      <div 
        className={`${bannerClass} text-white px-6 py-12 md:py-16 relative`}
        style={homespace.custom_banner_url ? {
          backgroundImage: `url(${homespace.custom_banner_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
      >
        {/* Dark overlay for custom images to ensure text readability */}
        {homespace.custom_banner_url && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        )}
        
        <div className="max-w-5xl mx-auto relative z-10">
          {/* Community Name & Location */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              {homespace.communities.community_name}
            </h1>
            <div className="flex items-center gap-2 text-white/90 text-lg">
              <MapPin size={20} />
              <span>{homespace.communities.county}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-6 mb-8">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Users size={20} />
              <span className="font-semibold">{homespace.communities.member_count}</span>
              <span className="text-sm text-white/80">
                {homespace.communities.member_count === 1 ? t('homespace.hero.member') : t('homespace.hero.members')}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Calendar size={20} />
              <span className="text-sm text-white/80">{t('homespace.hero.active_since')} {foundedYear}</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              className="bg-white text-[#3D4A2B] px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all flex items-center gap-2 shadow-xl hover:shadow-2xl hover:scale-105"
              onClick={() => window.location.href = '/settings'}
            >
              <Users size={20} />
              {t('homespace.hero.apply_membership')}
            </button>
            <button
              className="bg-white/90 backdrop-blur-md text-[#3D4A2B] px-6 py-3 rounded-xl font-semibold hover:bg-white transition-all flex items-center gap-2 border-2 border-white shadow-lg hover:shadow-xl hover:scale-105"
              onClick={() => setShowContactForm(true)}
            >
              <Mail size={20} />
              {t('homespace.hero.contact_admin')}
            </button>
            <button
              className="bg-white/90 backdrop-blur-md text-[#3D4A2B] px-4 py-3 rounded-xl font-semibold hover:bg-white transition-all flex items-center gap-2 border-2 border-white shadow-lg hover:shadow-xl hover:scale-105"
              onClick={copyLink}
            >
              <ExternalLink size={20} />
              {linkCopied ? t('homespace.link_copied') : t('homespace.copy_link')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Current Info Section - Highlighted/Featured */}
        {homespace.show_current_info_public && homespace.current_info && (
          <section className="mb-12">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-2xl shadow-lg p-8 relative overflow-hidden">
              {/* Decorative background pattern */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-100 rounded-full opacity-20 blur-3xl -mr-24 -mt-24" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-100 rounded-full opacity-20 blur-2xl -ml-16 -mb-16" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-amber-500 text-white p-3 rounded-xl shadow-md">
                    <span className="text-2xl">📢</span>
                  </div>
                  <h2 className="text-3xl font-bold text-amber-900">
                    {t('homespace.sections.current_info')}
                  </h2>
                </div>
                <div className="prose prose-lg max-w-none prose-headings:text-amber-900 prose-a:text-amber-700 prose-strong:text-amber-900 prose-p:text-gray-800">
                  <ReactMarkdown>{homespace.current_info}</ReactMarkdown>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* About Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#3D4A2B] mb-6 flex items-center gap-3">
            📖 {t('homespace.sections.about')}
          </h2>
          <div className="bg-white rounded-2xl shadow-lg p-8 prose prose-lg max-w-none prose-headings:text-[#3D4A2B] prose-a:text-[#5C6B47] prose-strong:text-[#3D4A2B]">
            <ReactMarkdown>{homespace.about_text || t('homespace.sections.about')}</ReactMarkdown>
          </div>
        </section>

        {/* Resources Section */}
        {homespace.show_resources_public && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-[#3D4A2B] mb-6 flex items-center gap-3">
              🛠️ {t('homespace.sections.resources')}
            </h2>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-semibold text-[#3D4A2B] mb-6">
                {t('homespace.resources.community_resources')}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {Object.entries(resourceStats).map(([category, count]) => (
                  <div key={category} className="bg-gradient-to-br from-[#5C6B47]/10 to-[#3D4A2B]/5 rounded-xl p-4 text-center">
                    <div className="text-3xl mb-2">
                      {category === 'vehicles' && '🚗'}
                      {category === 'tools' && '🔧'}
                      {category === 'water' && '💧'}
                      {category === 'food' && '🥫'}
                      {category === 'energy' && '⚡'}
                      {category === 'medicine' && '💊'}
                    </div>
                    <div className="text-2xl font-bold text-[#3D4A2B]">{count}</div>
                    <div className="text-sm text-gray-600 mt-1 capitalize">
                      {t(`homespace.resources.categories.${category}`)}
                    </div>
                  </div>
                ))}
              </div>
              <button className="text-[#3D4A2B] font-semibold hover:text-[#2A331E] transition-colors flex items-center gap-2">
                {t('homespace.resources.view_full')}
                <span className="text-sm text-gray-500">({t('homespace.resources.members_only')})</span>
              </button>
            </div>
          </section>
        )}

        {/* Preparedness Score Section */}
        {homespace.show_preparedness_score_public && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-[#3D4A2B] mb-6 flex items-center gap-3">
              📊 {t('homespace.sections.preparedness')}
            </h2>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold text-[#3D4A2B]">
                    {t('homespace.preparedness.score')}
                  </h3>
                  <span className="text-3xl font-bold text-[#3D4A2B]">{preparednessScore}/100</span>
                </div>
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#5C6B47] to-[#3D4A2B] transition-all duration-500"
                    style={{ width: `${preparednessScore}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(categoryScores).map(([category, score]) => (
                  <div key={category} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-700 capitalize">
                        {t(`homespace.preparedness.categories.${category}`)}
                      </span>
                      <span className={`text-sm font-bold ${getStatusColor(score)}`}>
                        {getStatusLabel(score)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#5C6B47] transition-all duration-500"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button className="mt-6 text-[#3D4A2B] font-semibold hover:text-[#2A331E] transition-colors flex items-center gap-2">
                {t('homespace.preparedness.detailed_analysis')}
                <span className="text-sm text-gray-500">({t('homespace.resources.members_only')})</span>
              </button>
            </div>
          </section>
        )}

        {/* Activities Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#3D4A2B] mb-6 flex items-center gap-3">
            📰 {t('homespace.sections.activities')}
          </h2>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="space-y-4">
              {/* Mock activities - in real implementation, fetch from database */}
              <div className="flex items-start gap-4 border-l-4 border-[#5C6B47] pl-4 py-2">
                <span className="text-2xl">🚜</span>
                <div>
                  <div className="text-sm text-gray-500">2024-10-20</div>
                  <div className="font-semibold text-gray-800">Ny gemensam generator installerad</div>
                </div>
              </div>
              <div className="flex items-start gap-4 border-l-4 border-[#5C6B47] pl-4 py-2">
                <span className="text-2xl">👥</span>
                <div>
                  <div className="text-sm text-gray-500">2024-10-15</div>
                  <div className="font-semibold text-gray-800">5 nya medlemmar välkomna!</div>
                </div>
              </div>
              <div className="flex items-start gap-4 border-l-4 border-[#5C6B47] pl-4 py-2">
                <span className="text-2xl">🎯</span>
                <div>
                  <div className="text-sm text-gray-500">2024-10-10</div>
                  <div className="font-semibold text-gray-800">Beredskapsövning genomförd</div>
                </div>
              </div>
              <div className="flex items-start gap-4 border-l-4 border-[#5C6B47] pl-4 py-2">
                <span className="text-2xl">🌱</span>
                <div>
                  <div className="text-sm text-gray-500">2024-10-05</div>
                  <div className="font-semibold text-gray-800">Odlingsplanering för våren påbörjad</div>
                </div>
              </div>
            </div>
            <button className="mt-6 text-[#3D4A2B] font-semibold hover:text-[#2A331E] transition-colors">
              {t('homespace.activities.view_older')}
            </button>
          </div>
        </section>

        {/* Skills Section */}
        {homespace.show_skills_public && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-[#3D4A2B] mb-6 flex items-center gap-3">
              🎓 {t('homespace.sections.skills')}
            </h2>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex flex-wrap gap-3 mb-6">
                {['plumbing', 'electrical', 'gardening', 'first_aid', 'carpentry', 'mechanics', 'cooking', 'radio'].map((skill) => (
                  <div key={skill} className="bg-[#5C6B47] text-white px-4 py-2 rounded-full text-sm font-medium">
                    {t(`homespace.skills.common_skills.${skill}`)}
                  </div>
                ))}
              </div>
              <p className="text-gray-600">
                {t('homespace.skills.available_skills', { count: '24' })}
              </p>
            </div>
          </section>
        )}

        {/* Membership Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-[#3D4A2B] mb-6 flex items-center gap-3">
            💬 {t('homespace.sections.contact')}
          </h2>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-xl font-semibold text-[#3D4A2B] mb-4">
              {t('homespace.membership.who_can_join')}
            </h3>
            <div className="prose prose-lg max-w-none mb-6 prose-headings:text-[#3D4A2B] prose-a:text-[#5C6B47] prose-strong:text-[#3D4A2B]">
              <ReactMarkdown>{homespace.membership_criteria || t('homespace.membership.requirements_default')}</ReactMarkdown>
            </div>

            {homespace.show_admin_contact && adminContact && (
              <div className="border-t pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">{t('homespace.membership.administrator')}</div>
                    <div className="font-semibold text-gray-800">{adminContact.name}</div>
                    {adminContact.email && (
                      <a href={`mailto:${adminContact.email}`} className="text-sm text-[#5C6B47] hover:text-[#3D4A2B] transition-colors">
                        {adminContact.email}
                      </a>
                    )}
                  </div>
                  <button 
                    className="bg-[#3D4A2B] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#2A331E] transition-all flex items-center gap-2"
                    onClick={() => setShowContactForm(true)}
                  >
                    <Mail size={20} />
                    {t('homespace.membership.send_message')}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t">
              <button
                className="w-full bg-gradient-to-r from-[#5C6B47] to-[#3D4A2B] text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                onClick={() => window.location.href = '/settings'}
              >
                <Shield size={24} />
                {t('homespace.hero.apply_membership')}
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowContactForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-[#3D4A2B] mb-6">{t('homespace.hero.contact_admin')}</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ditt namn</label>
                <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5C6B47] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Din e-post</label>
                <input type="email" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5C6B47] focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meddelande</label>
                <textarea rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5C6B47] focus:border-transparent" />
              </div>
              <div className="flex gap-3">
                <button type="button" className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all" onClick={() => setShowContactForm(false)}>
                  Avbryt
                </button>
                <button type="submit" className="flex-1 bg-[#3D4A2B] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#2A331E] transition-all">
                  Skicka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

