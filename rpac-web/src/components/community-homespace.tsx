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

/**
 * Privacy-aware activity aggregation for public homepage
 * - Anonymizes user names (shows "En medlem" instead of real names)
 * - Removes specific resource names/quantities
 * - Groups similar activities within time windows
 * - Limits to diverse activity types (not just resource spam)
 */
function aggregateActivitiesForPublic(rawActivities: any[]): any[] {
  if (!rawActivities || rawActivities.length === 0) return [];

  // Category name mapping (Swedish)
  const categoryNames: Record<string, string> = {
    'food': 'mat',
    'water': 'vatten',
    'shelter': 'skydd',
    'energy': 'energi',
    'medicine': 'medicin',
    'tools': 'verktyg',
    'communication': 'kommunikation',
    'transport': 'transport',
    'other': 'övrigt'
  };

  // Activity type priority (show diverse activity types)
  const activityTypePriority: Record<string, number> = {
    'member_joined': 3,
    'help_requested': 2,
    'milestone': 1,
    'exercise': 1,
    'resource_added': 4,
    'resource_shared': 5,
    'custom': 2
  };

  // Step 1: Anonymize and redact sensitive info
  const anonymized = rawActivities.map(activity => {
    const categoryName = categoryNames[activity.resource_category as string] || activity.resource_category || 'resurser';
    
    let anonymizedTitle = activity.title;
    let anonymizedDescription = activity.description;

    // Anonymize based on activity type
    switch (activity.activity_type) {
      case 'resource_shared':
        anonymizedTitle = 'Resurs delad med samhället';
        anonymizedDescription = `En medlem delade en resurs i ${categoryName}-kategorin`;
        break;
      
      case 'resource_added':
        anonymizedTitle = 'Samhällsresurs tillagd';
        anonymizedDescription = `En samhällsresurs lades till i ${categoryName}-kategorin`;
        break;
      
      case 'member_joined':
        anonymizedTitle = 'Ny medlem välkommen';
        anonymizedDescription = 'En ny medlem gick med i samhället';
        break;
      
      case 'help_requested':
        anonymizedTitle = 'Hjälpförfrågan skapad';
        anonymizedDescription = `En medlem begärde hjälp i ${categoryName}-kategorin`;
        break;
      
      case 'milestone':
      case 'exercise':
      case 'custom':
        // Keep as-is for these types (admin-created content)
        break;
    }

    return {
      ...activity,
      title: anonymizedTitle,
      description: anonymizedDescription,
      priority: activityTypePriority[activity.activity_type] || 5
    };
  });

  // Step 2: Group similar activities within 24-hour windows
  const grouped: Map<string, any[]> = new Map();
  
  anonymized.forEach(activity => {
    const date = new Date(activity.created_at).toDateString();
    const groupKey = `${date}-${activity.activity_type}-${activity.resource_category || 'none'}`;
    
    if (!grouped.has(groupKey)) {
      grouped.set(groupKey, []);
    }
    grouped.get(groupKey)!.push(activity);
  });

  // Step 3: Create aggregated entries
  const aggregated: any[] = [];
  
  grouped.forEach((activities, key) => {
    if (activities.length === 1) {
      // Single activity - show as-is (already anonymized)
      aggregated.push(activities[0]);
    } else {
      // Multiple similar activities - create summary
      const first = activities[0];
      const count = activities.length;
      const categoryName = categoryNames[first.resource_category as string] || first.resource_category || 'resurser';
      
      let summaryTitle = first.title;
      let summaryDescription = first.description;

      if (first.activity_type === 'resource_shared') {
        summaryTitle = `${count} resurser delade`;
        summaryDescription = `Medlemmar delade ${count} resurser i ${categoryName}-kategorin`;
      } else if (first.activity_type === 'resource_added') {
        summaryTitle = `${count} samhällsresurser tillagda`;
        summaryDescription = `${count} samhällsresurser lades till i ${categoryName}-kategorin`;
      } else if (first.activity_type === 'member_joined') {
        summaryTitle = `${count} nya medlemmar`;
        summaryDescription = `${count} nya medlemmar gick med i samhället`;
      }

      aggregated.push({
        ...first,
        title: summaryTitle,
        description: summaryDescription,
        aggregated_count: count
      });
    }
  });

  // Step 4: Sort by priority and date, limit to 5 diverse entries
  const sorted = aggregated
    .sort((a, b) => {
      // First by priority (lower = higher priority)
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // Then by date (newer first)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, 8); // Take top 8

  // Step 5: Ensure diversity - limit consecutive same-type activities
  const diverse: any[] = [];
  let lastType = '';
  let typeCount = 0;

  for (const activity of sorted) {
    if (activity.activity_type === lastType) {
      typeCount++;
      if (typeCount > 2) continue; // Skip if more than 2 consecutive of same type
    } else {
      lastType = activity.activity_type;
      typeCount = 1;
    }
    
    diverse.push(activity);
    if (diverse.length >= 5) break; // Limit to 5 total
  }

  return diverse;
}

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

  // Load resource statistics (anonymized - category counts only)
  useEffect(() => {
    const loadResourceStats = async () => {
      setLoadingResources(true);
      try {
        // Fetch community-owned resources
        const { data: communityResources, error: communityError } = await supabase
          .from('community_resources')
          .select('category')
          .eq('community_id', homespace.communities.id)
          .eq('status', 'available');

        // Fetch shared resources (from individual members)
        const { data: sharedResources, error: sharedError } = await supabase
          .from('resource_sharing')
          .select('resource_category')
          .eq('community_id', homespace.communities.id)
          .eq('is_available', true);

        if (communityError) throw communityError;
        if (sharedError) throw sharedError;

        // Aggregate counts by category (anonymized)
        const categoryCounts: Record<string, number> = {};
        
        // Count community resources
        (communityResources || []).forEach((resource: any) => {
          const category = resource.category;
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        // Count shared resources
        (sharedResources || []).forEach((resource: any) => {
          const category = resource.resource_category;
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        setResourceStats(Object.keys(categoryCounts).length > 0 ? categoryCounts : null);
      } catch (error) {
        console.error('Error loading resource stats:', error);
        setResourceStats(null);
      } finally {
        setLoadingResources(false);
      }
    };

    loadResourceStats();
  }, [homespace.communities.id]);

  // Load recent community activities (privacy-aware aggregation)
  useEffect(() => {
    const loadActivities = async () => {
      setLoadingActivities(true);
      try {
        const { data, error } = await supabase
          .from('homespace_activity_log')
          .select('*')
          .eq('community_id', homespace.communities.id)
          .eq('visible_public', true)
          .order('created_at', { ascending: false })
          .limit(50); // Fetch more to aggregate intelligently

        if (error) throw error;
        
        // Privacy-aware aggregation: anonymize and group similar activities
        const anonymizedActivities = aggregateActivitiesForPublic(data || []);
        setCommunityActivities(anonymizedActivities);
      } catch (error) {
        console.error('Error loading activities:', error);
        setCommunityActivities([]);
      } finally {
        setLoadingActivities(false);
      }
    };

    loadActivities();
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

  // Real resource data will be fetched from database
  const [resourceStats, setResourceStats] = useState<Record<string, number> | null>(null);
  const [communityActivities, setCommunityActivities] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);

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
              {loadingResources ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">⏳</div>
                  <p className="text-gray-600">Laddar resurser...</p>
                </div>
              ) : resourceStats && Object.keys(resourceStats).length > 0 ? (
                <>
                  <h3 className="text-xl font-semibold text-[#3D4A2B] mb-6">
                    Våra tillgängliga resurskategorier
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                    {Object.entries(resourceStats).map(([category, count]) => {
                      const categoryEmojis: Record<string, string> = {
                        food: '🍞',
                        water: '💧',
                        medicine: '💊',
                        energy: '⚡',
                        tools: '🔧',
                        machinery: '🚜',
                        other: '✨'
                      };
                      const categoryLabels: Record<string, string> = {
                        food: 'Mat',
                        water: 'Vatten',
                        medicine: 'Medicin',
                        energy: 'Energi',
                        tools: 'Verktyg',
                        machinery: 'Maskiner',
                        other: 'Övrigt'
                      };
                      return (
                        <div key={category} className="bg-gradient-to-br from-[#5C6B47]/10 to-[#3D4A2B]/5 rounded-xl p-4 text-center">
                          <div className="text-3xl mb-2">
                            {categoryEmojis[category] || '📦'}
                          </div>
                          <div className="text-2xl font-bold text-[#3D4A2B]">{count}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {categoryLabels[category] || category}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-sm text-gray-500 text-center">
                    Antal resurskategorier som finns tillgängliga i samhället. Medlemmar kan se detaljer.
                  </p>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🛠️</div>
                  <h3 className="text-2xl font-bold text-[#3D4A2B] mb-2">Inga resurser ännu</h3>
                  <p className="text-gray-600">Samhället har inte delat några resurser än</p>
                </div>
              )}
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
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-2xl font-bold text-[#3D4A2B] mb-2">Kommer snart</h3>
                <p className="text-gray-600">Beredskapspoäng och analys kommer att visas här</p>
              </div>
            </div>
          </section>
        )}

        {/* Activities Section */}
        {homespace.show_member_activities && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-[#3D4A2B] mb-6 flex items-center gap-3">
              📰 {t('homespace.sections.activities')}
            </h2>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              {loadingActivities ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">⏳</div>
                  <p className="text-gray-600">Laddar aktiviteter...</p>
                </div>
              ) : communityActivities.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {communityActivities.map((activity, index) => (
                      <div key={activity.id || index} className="flex items-start gap-4 border-l-4 border-[#5C6B47] pl-4 py-2">
                        <span className="text-2xl">{activity.icon}</span>
                        <div className="flex-1">
                          <div className="text-sm text-gray-500">
                            {new Date(activity.created_at).toLocaleDateString('sv-SE', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                            {activity.aggregated_count && activity.aggregated_count > 1 && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#5C6B47]/20 text-[#3D4A2B]">
                                {activity.aggregated_count} aktiviteter
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-gray-800">{activity.title}</div>
                          <div className="text-sm text-gray-600">{activity.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-6 text-center text-sm text-gray-500">
                    Anonymiserade aktiviteter från samhället. Medlemmar kan se fullständig historik.
                  </p>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📰</div>
                  <h3 className="text-2xl font-bold text-[#3D4A2B] mb-2">Inga aktiviteter ännu</h3>
                  <p className="text-gray-600">Samhället har inte loggat några aktiviteter än</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Skills Section */}
        {homespace.show_skills_public && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-[#3D4A2B] mb-6 flex items-center gap-3">
              🎓 {t('homespace.sections.skills')}
            </h2>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎓</div>
                <h3 className="text-2xl font-bold text-[#3D4A2B] mb-2">Kommer snart</h3>
                <p className="text-gray-600">Medlemmarnas kompetenser kommer att visas här</p>
              </div>
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

