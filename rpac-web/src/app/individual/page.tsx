'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SupabaseResourceInventory } from '@/components/supabase-resource-inventory';
import { ResourceManagementHub } from '@/components/resource-management-hub';
import { IndividualDashboard } from '@/components/individual-dashboard';
import { PlantDiagnosis } from '@/components/plant-diagnosis';
import { PersonalDashboard } from '@/components/personal-dashboard';
import { PersonalDashboardResponsive } from '@/components/personal-dashboard-responsive';
import { CultivationCalendarV2 } from '@/components/cultivation-calendar-v2';
import { CultivationCalendarMobile } from '@/components/cultivation-calendar-mobile';
import { CultivationPlannerMobile } from '@/components/cultivation-planner-mobile';
import { CultivationResponsiveWrapper } from '@/components/cultivation-responsive-wrapper';
import { AICultivationAdvisor } from '@/components/ai-cultivation-advisor';
import { SuperbOdlingsplanerare } from '@/components/CultivationPlanner';
import { CultivationReminders } from '@/components/cultivation-reminders';
import { CrisisCultivation } from '@/components/crisis-cultivation';
import { PersonalAICoach } from '@/components/personal-ai-coach';
import { ExistingCultivationPlans } from '@/components/existing-cultivation-plans';
import { IndividualMobileNav } from '@/components/individual-mobile-nav';
import { ResponsiveCultivationTool } from '@/components/responsive-cultivation-tools';
import { useUserProfile } from '@/lib/useUserProfile';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { t } from '@/lib/locales';
import { Home, Sprout, BookOpen, Bot, Users } from 'lucide-react';

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
      description: t('individual.cultivation_description'),
      subsections: [
        {
          id: 'ai-planner',
          title: 'Odlingsplanering',
          description: 'Personlig odlingsplan baserad på näringsbehov',
          priority: 'high' as const
        },
        {
          id: 'calendar',
          title: t('individual.calendar_advisor'),
          description: t('individual.calendar_description'),
          priority: 'high' as const
        },
        {
          id: 'reminders',
          title: t('individual.reminders'),
          description: t('individual.reminders_description'),
          priority: 'medium' as const
        },
        {
          id: 'crisis',
          title: t('individual.crisis_cultivation'),
          description: t('individual.crisis_description'),
          priority: 'low' as const
        },
        {
          id: 'diagnosis',
          title: t('individual.plant_diagnosis'),
          description: t('individual.diagnosis_description'),
          priority: 'medium' as const
        }
      ]
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
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" 
               style={{ borderColor: 'var(--color-sage)' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>{t('individual.loading_profile')}</p>
        </div>
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
      setActiveSubsection(subsection || 'calendar');
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

    // Cultivation Section - Landing page (only when no subsection selected)
    if (activeSection === 'cultivation' && !activeSubsection) {
      return (
        <div className="space-y-6">
          <div className="modern-card p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                {t('individual.cultivation_planning')}
              </h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                {t('individual.cultivation_description')}
              </p>
            </div>
            
            {/* Cultivation Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-lg border" style={{ 
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--color-quaternary)'
              }}>
                <Sprout className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-primary)' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  AI Odlingsplanerare
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Personlig odlingsplan baserad på näringsbehov
                </p>
                <button
                  onClick={() => handleSectionChange('cultivation', 'ai-planner')}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                  style={{ 
                    backgroundColor: 'var(--color-primary)',
                    color: 'white'
                  }}
                >
                  Starta planering
                </button>
              </div>
              
              <div className="text-center p-6 rounded-lg border" style={{ 
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--color-quaternary)'
              }}>
                <Sprout className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-primary)' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {t('individual.calendar_advisor')}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {t('individual.calendar_description')}
                </p>
                <button
                  onClick={() => handleSectionChange('cultivation', 'calendar')}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                  style={{ 
                    backgroundColor: 'var(--color-secondary)',
                    color: 'white'
                  }}
                >
                  Öppna kalender
                </button>
              </div>
              
              <div className="text-center p-6 rounded-lg border" style={{ 
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--color-quaternary)'
              }}>
                <Sprout className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-primary)' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {t('individual.reminders')}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {t('individual.reminders_description')}
                </p>
                <button
                  onClick={() => handleSectionChange('cultivation', 'reminders')}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                  style={{ 
                    backgroundColor: 'var(--color-sage)',
                    color: 'white'
                  }}
                >
                  Visa påminnelser
                </button>
              </div>
              
              <div className="text-center p-6 rounded-lg border" style={{ 
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--color-quaternary)'
              }}>
                <Sprout className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-primary)' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {t('individual.crisis_cultivation')}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {t('individual.crisis_description')}
                </p>
                <button
                  onClick={() => handleSectionChange('cultivation', 'crisis')}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                  style={{ 
                    backgroundColor: 'var(--color-warning)',
                    color: 'white'
                  }}
                >
                  Krisodling
                </button>
              </div>
              
              <div className="text-center p-6 rounded-lg border" style={{ 
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--color-quaternary)'
              }}>
                <Sprout className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-primary)' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {t('individual.plant_diagnosis')}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {t('individual.diagnosis_description')}
                </p>
                <button
                  onClick={() => handleSectionChange('cultivation', 'diagnosis')}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                  style={{ 
                    backgroundColor: 'var(--color-crisis-green)',
                    color: 'white'
                  }}
                >
                  Diagnostisera växter
                </button>
              </div>
            </div>
          </div>

        </div>
      );
    }

    // Resources Section - Specialized landing page focused on resource management
    if (activeSection === 'resources' && !activeSubsection) {
      return (
        <ResourceManagementHub user={{ id: user.id }} />
      );
    }

    // Handle subsection navigation for cultivation
    if (activeSection === 'cultivation' && activeSubsection) {
      if (activeSubsection === 'ai-planner') {
        return (
          <CultivationResponsiveWrapper
            mobileComponent={
              <CultivationPlannerMobile 
                user={user}
                onPlanCreated={(plan) => {
                  setSelectedPlan(plan);
                }}
              />
            }
            desktopComponent={
              <div className="space-y-6">
                {/* AI Planner Component */}
                <SuperbOdlingsplanerare user={user} selectedPlan={selectedPlan} />
                
                {/* Existing Cultivation Plans - Moved to bottom */}
                <div className="modern-card p-6">
                  <ExistingCultivationPlans 
                    user={user}
                    onViewPlan={(plan) => {
                      setSelectedPlan(plan);
                    }}
                    onEditPlan={(plan) => {
                      setSelectedPlan(plan);
                    }}
                  />
                </div>
              </div>
            }
          />
        );
      }
      if (activeSubsection === 'calendar') {
        const climateZone = profile?.county ? getClimateZone(profile.county) : 'svealand';
        const gardenSize = 'medium'; // Default value since garden_size is in cultivation_profiles table
        const experienceLevel = 'beginner'; // Default value since experience_level is in cultivation_profiles table

        return (
          <CultivationResponsiveWrapper
            mobileComponent={
              <CultivationCalendarMobile 
                climateZone={climateZone}
                gardenSize={'50'}
              />
            }
            desktopComponent={
              <div className="space-y-8">
                <div className="modern-card">
                  <CultivationCalendarV2 
                    climateZone={climateZone}
                    gardenSize={gardenSize}
                  />
                </div>
                <div className="modern-card">
                  <AICultivationAdvisor 
                    user={user}
                    crisisMode={false}
                  />
                </div>
              </div>
            }
          />
        );
      }
      if (activeSubsection === 'reminders') {
        return (
          <ResponsiveCultivationTool 
            user={user}
            tool="reminders"
            climateZone={profile?.county ? getClimateZone(profile.county) : 'svealand'}
          />
        );
      }
      if (activeSubsection === 'crisis') {
        return (
          <ResponsiveCultivationTool 
            user={user}
            tool="crisis"
          />
        );
      }
      if (activeSubsection === 'diagnosis') {
        return (
          <ResponsiveCultivationTool 
            user={user}
            tool="diagnosis"
          />
        );
      }
    }

    // AI Coach (accessed from main nav button)
    if (activeSection === 'ai-coach') {
      return (
        <div className="space-y-6">
          <PersonalAICoach user={user} userProfile={profile || {}} />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5C6B47]/10 via-white to-[#707C5F]/10">
      {/* Mobile Navigation Component */}
      <div className="lg:hidden">
        <IndividualMobileNav
          navigationSections={navigationSections}
          activeSection={activeSection}
          activeSubsection={activeSubsection}
          onSectionChange={handleSectionChange}
        />
      </div>

      {/* Header with Navigation */}
      <div className="bg-gradient-to-r from-[#3D4A2B] to-[#2A331E] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('individual.title')}</h1>
              <p className="text-[#C8D5B9]">
                {t('individual.subtitle')}
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

          {/* Navigation Tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleSectionChange('home')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeSection === 'home'
                  ? 'bg-white text-[#3D4A2B] shadow-md'
                  : 'bg-[#5C6B47]/30 text-white hover:bg-[#5C6B47]/50'
              }`}
            >
              <Home size={20} />
              {t('individual.home_status')}
            </button>
            <button
              onClick={() => handleSectionChange('cultivation')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeSection === 'cultivation'
                  ? 'bg-white text-[#3D4A2B] shadow-md'
                  : 'bg-[#5C6B47]/30 text-white hover:bg-[#5C6B47]/50'
              }`}
            >
              <Sprout size={20} />
              {t('individual.cultivation_planning')}
            </button>
            <button
              onClick={() => handleSectionChange('resources')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeSection === 'resources'
                  ? 'bg-white text-[#3D4A2B] shadow-md'
                  : 'bg-[#5C6B47]/30 text-white hover:bg-[#5C6B47]/50'
              }`}
            >
              <BookOpen size={20} />
              {t('individual.resources_development')}
            </button>
            <button
              onClick={() => handleSectionChange('ai-coach')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeSection === 'ai-coach'
                  ? 'bg-white text-[#3D4A2B] shadow-md'
                  : 'bg-[#5C6B47]/30 text-white hover:bg-[#5C6B47]/50'
              }`}
            >
              <Bot size={20} />
              AI-coach
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
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

