'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ResourceManagementHubResponsive } from '@/components/resource-management-hub-responsive';
import { IndividualDashboard } from '@/components/individual-dashboard';
import { SimpleCultivationResponsive } from '@/components/simple-cultivation-responsive';
import { useUserProfile } from '@/lib/useUserProfile';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { t } from '@/lib/locales';
import { Home, Sprout, BookOpen, Users } from 'lucide-react';

function IndividualPageContent() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('home');
  const [activeSubsection, setActiveSubsection] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const { profile, loading: profileLoading } = useUserProfile(user);

  // Navigation structure
  const navigationSections = [
    {
      id: 'home',
      title: t('individual.home_status'),
      icon: Home,
      description: t('individual.home_description')
    },
    {
      id: 'cultivation',
      title: t('individual.cultivation_planning'),
      icon: Sprout,
      description: t('individual.cultivation_description')
    },
    {
      id: 'resources',
      title: t('individual.resources_development'),
      icon: BookOpen,
      description: t('individual.resources_description')
    }
  ];

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        router.push('/');
      }
    };
    checkUser();
  }, [router]);

  // Handle URL parameters
  useEffect(() => {
    const section = searchParams.get('section');
    const subsection = searchParams.get('subsection');
    
    if (section) {
      setActiveSection(section);
    }
    if (subsection) {
      setActiveSubsection(subsection);
    }
  }, [searchParams]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <ShieldProgressSpinner variant="bounce" size="lg" color="olive" message={t('individual.loading_profile')} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p style={{ color: 'var(--text-secondary)' }}>{t('individual.login_required')}</p>
        </div>
      </div>
    );
  }

  const handleSectionChange = (sectionId: string, subsectionId?: string) => {
    setActiveSection(sectionId);
    if (subsectionId) {
      setActiveSubsection(subsectionId);
    } else {
      // Clear subsection to show landing page
      setActiveSubsection('');
    }
  };

  // Calculate climate zone from county
  const getClimateZone = (county: string) => {
    const countyToClimateZone: Record<string, 'gotaland' | 'svealand' | 'norrland'> = {
      stockholm: 'svealand',
      uppsala: 'svealand',
      sodermanland: 'svealand',
      ostergotland: 'gotaland',
      jonkoping: 'gotaland',
      kronoberg: 'gotaland',
      kalmar: 'gotaland',
      blekinge: 'gotaland',
      skane: 'gotaland',
      halland: 'gotaland',
      vastra_gotaland: 'gotaland',
      varmland: 'svealand',
      orebro: 'svealand',
      vastmanland: 'svealand',
      dalarna: 'svealand',
      gavleborg: 'svealand',
      vasternorrland: 'norrland',
      jamtland: 'norrland',
      vasterbotten: 'norrland',
      norrbotten: 'norrland'
    };
    return countyToClimateZone[county] || 'svealand';
  };

  const handleNavigationFromDashboard = (section: string, subsection?: string) => {
    console.log('Dashboard navigation:', section, subsection);
    if (section === 'resources') {
      setActiveSection('resources');
      setActiveSubsection(subsection || 'inventory');
    } else if (section === 'cultivation') {
      setActiveSection('cultivation');
      setActiveSubsection('');
    }
  };

  const renderContent = () => {
    // Home Section - Show IndividualDashboard when home is clicked
    if (activeSection === 'home') {
      return (
        <IndividualDashboard 
          user={{ id: user.id, email: user.email }} 
          onNavigate={handleNavigationFromDashboard}
        />
      );
    }

    // Cultivation Section - Show the simple cultivation responsive component
    if (activeSection === 'cultivation') {
      return (
        <SimpleCultivationResponsive 
          userId={user.id}
          householdSize={profile?.household_size || 2}
        />
      );
    }

    // Resources Section - Specialized landing page focused on resource management
    if (activeSection === 'resources' && !activeSubsection) {
      return (
        <ResourceManagementHubResponsive user={{ id: user.id }} />
      );
    }

    // Handle subsection navigation for resources
    if (activeSection === 'resources' && activeSubsection) {
      if (activeSubsection === 'inventory') {
        return <ResourceManagementHubResponsive user={{ id: user.id }} />;
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2A331E]/5 via-[#3D4A2B]/3 to-[#4A5239]/8">
      {/* Desktop Header */}
      <div className="hidden md:block bg-gradient-to-r from-[#3D4A2B] to-[#2A331E] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {activeSection === 'cultivation' ? 'Min odling' : 
                 activeSection === 'resources' ? 'Resurser' : 
                 t('individual.title')}
              </h1>
              <p className="text-[#C8D5B9]">
                {activeSection === 'cultivation' ? 'Din personliga odlingscentral' :
                 activeSection === 'resources' ? 'Hantera dina resurser och verktyg' :
                 t('individual.subtitle')}
              </p>
            </div>
            {profile?.household_size && profile.household_size > 1 && (
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users size={16} />
                  <span>{profile.household_size} personer i hushållet</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden bg-gradient-to-r from-[#3D4A2B] to-[#2A331E] text-white shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold mb-1">
                {activeSection === 'cultivation' ? 'Min odling' : 
                 activeSection === 'resources' ? 'Resurser' : 
                 t('individual.title')}
              </h1>
              <p className="text-[#C8D5B9] text-sm">
                {activeSection === 'cultivation' ? 'Din personliga odlingscentral' :
                 activeSection === 'resources' ? 'Hantera dina resurser och verktyg' :
                 t('individual.subtitle')}
              </p>
            </div>
            {profile?.household_size && profile.household_size > 1 && (
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-xs">
                  <Users size={14} />
                  <span>{profile.household_size} personer</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {renderContent()}
      </div>
    </div>
  );
}

export default function IndividualPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <IndividualPageContent />
    </Suspense>
  );
}

