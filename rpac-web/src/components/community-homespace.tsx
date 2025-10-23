'use client';

import { t } from '@/lib/locales';
import { MapPin, Users, Calendar, ExternalLink, Mail, Shield, Wrench, Droplet, Heart, Zap, Activity, Eye, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';
import HomepageContactSection from './homepage-contact-section';
import HomepageGallerySection from './homepage-gallery-section';
import HomepageEventsSection from './homepage-events-section';

interface CommunityHomespaceProps {
  homespace: {
    id: string;
    slug: string;
    about_text: string | null;
    current_info: string | null;
    membership_criteria: string | null;
    custom_banner_url: string | null;
    logo_url?: string | null;
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
  const [isPreviewMode, setIsPreviewMode] = useState(isPreview);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  // Detect preview mode from URL parameter
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const previewParam = urlParams.get('preview');
    setIsPreviewMode(isPreview || previewParam === 'true');
  }, [isPreview]);

  // Load gallery images
  useEffect(() => {
    const loadGalleryImages = async () => {
      try {
        const { data, error } = await supabase
          .from('community_gallery_images')
          .select('*')
          .eq('community_id', homespace.communities.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setGalleryImages(data || []);
      } catch (error) {
        console.error('Error loading gallery images:', error);
      }
    };

    loadGalleryImages();
  }, [homespace.communities.id]);

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('community_events')
          .select('*')
          .eq('community_id', homespace.communities.id)
          .order('event_date', { ascending: true });
        
        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };

    loadEvents();
  }, [homespace.communities.id]);

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
        try {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('display_name, first_name, last_name')
            .eq('user_id', community.created_by)
            .single();

          if (error) {
            console.error('Error fetching admin profile:', error);
            return;
          }

          if (profile) {
            // Construct name from available fields
            const name = profile.display_name || 
                        (profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : null) ||
                        profile.first_name || 
                        'Administratör';
            
            setAdminContact({
              name: name,
              email: '' // Email is not available in user_profiles, would need to get from auth.users
            });
          }
        } catch (error) {
          console.error('Error in admin contact fetch:', error);
        }
      }
    };

    fetchAdminContact();
  }, [homespace.communities.id, homespace.show_admin_contact]);

  // Copy link to clipboard
  const copyLink = () => {
    if (typeof window === 'undefined') return;
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
      {/* Preview Banner with Close Button */}
      {isPreviewMode && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-6 py-4 relative shadow-lg z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Eye size={20} />
              </div>
              <div>
                <div className="font-bold text-lg">Förhandsgranskning</div>
                <div className="text-sm text-white/90">Osparade ändringar</div>
              </div>
            </div>
            <button
              onClick={() => typeof window !== 'undefined' && window.close()}
              className="flex items-center gap-2 px-6 py-3 bg-white text-amber-600 hover:bg-amber-50 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg border-2 border-white"
            >
              <X size={20} />
              <span>Stäng förhandsgranskning</span>
            </button>
          </div>
        </div>
      )}

      {/* Hero Section - Ultra Modern Design */}
      <div 
        className={`${bannerClass} text-white px-4 md:px-6 py-16 md:py-24 relative overflow-hidden`}
        style={homespace.custom_banner_url ? {
          backgroundImage: `url(${homespace.custom_banner_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
      >
        {/* Conditional overlays based on banner type */}
        {homespace.custom_banner_url ? (
          // Custom image - subtle dark overlay to ensure text readability
          <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/75" />
        ) : (
          // Gradient banner - animated olive green overlay
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[#3D4A2B]/95 via-[#2A331E]/90 to-[#4A5239]/95"></div>
            {/* Decorative geometric shapes - only for gradient banners */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#5C6B47]/20 rounded-full blur-2xl"></div>
          </>
        )}
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Main Content - Horizontal Layout on Desktop */}
          <div className="flex flex-col md:flex-row md:items-center md:gap-12">
            
            {/* Logo Section - Left Side on Desktop */}
            {(homespace as any).logo_url && (
              <div className="flex-shrink-0 mb-8 md:mb-0 mx-auto md:mx-0">
                <div className="relative group">
                  {/* Glow effect behind logo */}
                  <div className="absolute inset-0 bg-white/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                  
                  {/* Logo container with ultra-modern glass effect */}
                  <div className="relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/30 shadow-2xl hover:shadow-white/20 hover:scale-105 transition-all duration-500 hover:border-white/50">
                    <img 
                      src={(homespace as any).logo_url} 
                      alt={`${homespace.communities.community_name} logotyp`}
                      className="w-28 h-28 md:w-40 md:h-40 object-contain filter drop-shadow-2xl"
                    />
                    {/* Subtle shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Text Content - Right Side on Desktop */}
            <div className="flex-1 text-center md:text-left">
              {/* Community Name with gradient text */}
              <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight">
                <span className="bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent drop-shadow-2xl">
                  {homespace.communities.community_name}
                </span>
              </h1>
              
              {/* Location with icon */}
              <div className="flex items-center gap-3 text-white/95 text-xl md:text-2xl mb-8 justify-center md:justify-start group">
                <div className="p-2 bg-white/10 backdrop-blur-sm rounded-xl group-hover:bg-white/20 transition-all">
                  <MapPin size={24} className="group-hover:scale-110 transition-transform" />
                </div>
                <span className="font-medium">{homespace.communities.county}</span>
              </div>

              {/* Stats Cards - Modern glassmorphism */}
              <div className="flex flex-wrap gap-4 mb-10 justify-center md:justify-start">
                {/* Members stat */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#5C6B47]/30 to-[#4A5239]/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                  <div className="relative flex items-center gap-3 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/30 hover:border-white/50 hover:scale-105 transition-all duration-300 shadow-xl">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <Users size={24} />
                    </div>
                    <div className="text-left">
                      <div className="text-3xl font-black">{homespace.communities.member_count}</div>
                      <div className="text-sm text-white/80 font-medium">
                        {homespace.communities.member_count === 1 ? t('homespace.hero.member') : t('homespace.hero.members')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active since stat */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#5C6B47]/30 to-[#4A5239]/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
                  <div className="relative flex items-center gap-3 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/30 hover:border-white/50 hover:scale-105 transition-all duration-300 shadow-xl">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <Calendar size={24} />
                    </div>
                    <div className="text-left">
                      <div className="text-2xl font-black">{foundedYear}</div>
                      <div className="text-sm text-white/80 font-medium">{t('homespace.hero.active_since')}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons - Refined & Organized */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                {/* Primary CTA - Join (Most Important) */}
                <button
                  className="group relative bg-white text-[#3D4A2B] px-6 py-3 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                  onClick={() => typeof window !== 'undefined' && (window.location.href = '/settings')}
                >
                  <Users size={18} />
                  <span>{t('homespace.hero.apply_membership')}</span>
                </button>

                {/* Secondary Actions - Grouped */}
                <div className="flex gap-2">
                  {/* Contact */}
                  <button
                    className="group bg-white/15 backdrop-blur-sm text-white px-4 py-3 rounded-xl font-semibold text-sm border border-white/30 hover:border-white/50 hover:bg-white/25 transition-all duration-300 flex items-center gap-2 hover:scale-105 active:scale-95"
                    onClick={() => setShowContactForm(true)}
                  >
                    <Mail size={16} />
                    <span className="hidden sm:inline">{t('homespace.hero.contact_admin')}</span>
                    <span className="sm:hidden">Kontakt</span>
                  </button>

                  {/* Copy Link */}
                  <button
                    className="group bg-white/10 backdrop-blur-sm text-white px-4 py-3 rounded-xl font-semibold text-sm border border-white/20 hover:border-white/40 hover:bg-white/20 transition-all duration-300 flex items-center gap-2 hover:scale-105 active:scale-95"
                    onClick={copyLink}
                  >
                    <ExternalLink size={16} className="group-hover:rotate-45 transition-transform duration-300" />
                    <span className="hidden sm:inline">{linkCopied ? t('homespace.link_copied') : t('homespace.copy_link')}</span>
                    <span className="sm:hidden">Länk</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Current Info Section - Overlapping Banner */}
        {homespace.show_current_info_public && homespace.current_info && (
          <section className="mb-12 -mt-16 relative z-20">
            <div className="bg-white/95 backdrop-blur-md border-2 border-white/50 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60 rounded-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-gradient-to-br from-[#5C6B47] to-[#3D4A2B] text-white p-3 rounded-xl shadow-lg">
                    <span className="text-2xl">📢</span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {t('homespace.sections.current_info')}
                  </h2>
                </div>
                <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-[#5C6B47] prose-strong:text-gray-900 prose-p:text-gray-700">
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

        {/* Photo Gallery Section */}
        <HomepageGallerySection
          communityId={homespace.communities.id}
          images={galleryImages}
          onImagesChange={setGalleryImages}
          isEditing={false}
          onEdit={() => {}}
          onSave={() => {}}
          onCancel={() => {}}
        />

        {/* Events Calendar Section */}
        <HomepageEventsSection
          communityId={homespace.communities.id}
          events={events}
          onEventsChange={setEvents}
          isEditing={false}
          onEdit={() => {}}
          onSave={() => {}}
          onCancel={() => {}}
        />

        {/* Contact Information Section */}
        {(homespace as any).show_contact_section && (
          <HomepageContactSection
            contactInfo={{
              email: (homespace as any).contact_email,
              phone: (homespace as any).contact_phone,
              address: (homespace as any).contact_address,
              facebook: (homespace as any).social_facebook,
              instagram: (homespace as any).social_instagram
            }}
            onUpdate={() => {}}
            isEditing={false}
            onEdit={() => {}}
            onSave={() => {}}
            onCancel={() => {}}
          />
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
                onClick={() => typeof window !== 'undefined' && (window.location.href = '/settings')}
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

