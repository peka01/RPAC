'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SupabaseResourceInventory } from '@/components/supabase-resource-inventory';
import { PlantDiagnosis } from '@/components/plant-diagnosis';
import { PersonalDashboard } from '@/components/personal-dashboard';
import { CultivationCalendar } from '@/components/cultivation-calendar';
import { AICultivationAdvisor } from '@/components/ai-cultivation-advisor';
import { AICultivationPlanner } from '@/components/ai-cultivation-planner';
import { EnhancedCultivationPlanner } from '@/components/enhanced-cultivation-planner';
import { SuperbOdlingsplanerare } from '@/components/superb-odlingsplanerare-refactored';
import { CultivationReminders } from '@/components/cultivation-reminders';
import { CrisisCultivation } from '@/components/crisis-cultivation';
import { PersonalAICoach } from '@/components/personal-ai-coach';
import { ExistingCultivationPlans } from '@/components/existing-cultivation-plans';
import { useUserProfile } from '@/lib/useUserProfile';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { t } from '@/lib/locales';
import { Home, Sprout, BookOpen, Bot } from 'lucide-react';

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
      description: t('individual.resources_description'),
      subsections: [
        {
          id: 'inventory',
          title: t('individual.resource_inventory'),
          description: t('individual.inventory_description'),
          priority: 'high' as const
        },
        {
          id: 'ai-coach',
          title: 'Personlig AI-coach',
          description: 'Få personliga råd och tips för din beredskap och odling',
          priority: 'high' as const
        }
      ]
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

  const renderContent = () => {
    // Home Section - Show PersonalDashboard when home is clicked
    if (activeSection === 'home') {
      return (
        <div className="modern-card">
          <PersonalDashboard user={user} />
        </div>
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

    // Resources Section - Landing page (only when no subsection selected)
    if (activeSection === 'resources' && !activeSubsection) {
      return (
        <div className="space-y-6">
          <div className="modern-card p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                {t('individual.resources_development')}
              </h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                {t('individual.resources_description')}
              </p>
            </div>
            
            {/* Resources Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="text-center p-6 rounded-lg border" style={{ 
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--color-quaternary)'
              }}>
                <BookOpen className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-primary)' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {t('individual.resource_inventory')}
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {t('individual.inventory_description')}
                </p>
                <button
                  onClick={() => handleSectionChange('resources', 'inventory')}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                  style={{ 
                    backgroundColor: 'var(--color-primary)',
                    color: 'white'
                  }}
                >
                  Visa inventering
                </button>
              </div>
              
              <div className="text-center p-6 rounded-lg border" style={{ 
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--color-quaternary)'
              }}>
                <Bot className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--color-sage)' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Personlig AI-coach
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Få personliga råd och tips för din beredskap och odling
                </p>
                <button
                  onClick={() => handleSectionChange('resources', 'ai-coach')}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                  style={{ 
                    backgroundColor: 'var(--color-sage)',
                    color: 'white'
                  }}
                >
                  Starta AI-coach
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Handle subsection navigation for cultivation
    if (activeSection === 'cultivation' && activeSubsection) {
      if (activeSubsection === 'ai-planner') {
        return (
          <div className="space-y-6">
            {/* AI Planner Component */}
            <SuperbOdlingsplanerare user={user} selectedPlan={selectedPlan} />
            
            {/* Existing Cultivation Plans - Moved to bottom */}
            <div className="modern-card p-6">
              <ExistingCultivationPlans 
                user={user}
                onViewPlan={(plan) => {
                  console.log('Viewing plan:', plan);
                  setSelectedPlan(plan);
                }}
                onEditPlan={(plan) => {
                  console.log('Editing plan:', plan);
                  setSelectedPlan(plan);
                }}
              />
            </div>
          </div>
        );
      }
      if (activeSubsection === 'calendar') {
        console.log('Profile data:', profile);
        console.log('County:', profile?.county);
        const climateZone = profile?.county ? getClimateZone(profile.county) : 'svealand';
        console.log('Calculated climate zone:', climateZone);
        const gardenSize = 'medium'; // Default value since garden_size is in cultivation_profiles table
        const experienceLevel = 'beginner'; // Default value since experience_level is in cultivation_profiles table

        return (
          <div className="space-y-8">
            <div className="modern-card">
              <CultivationCalendar 
                climateZone={climateZone}
                gardenSize={gardenSize}
                crisisMode={false}
              />
            </div>
            <div className="modern-card">
              <AICultivationAdvisor 
                user={user}
                crisisMode={false}
              />
            </div>
          </div>
        );
      }
      if (activeSubsection === 'reminders') {
        return (
          <div className="modern-card">
            <CultivationReminders 
              user={user}
              climateZone={profile?.county ? getClimateZone(profile.county) : 'svealand'}
              crisisMode={false}
            />
          </div>
        );
      }
      if (activeSubsection === 'crisis') {
        return (
          <div className="modern-card">
            <CrisisCultivation 
              urgencyLevel="medium"
              availableSpace="both"
              timeframe={30}
            />
          </div>
        );
      }
      if (activeSubsection === 'diagnosis') {
        return (
          <div className="modern-card">
            <PlantDiagnosis />
          </div>
        );
      }
    }

    // Handle subsection navigation for resources
    if (activeSection === 'resources' && activeSubsection) {
      if (activeSubsection === 'inventory') {
        return (
          <div className="modern-card">
            <SupabaseResourceInventory user={{ id: user.id }} />
          </div>
        );
      }
      if (activeSubsection === 'ai-coach') {
        return (
          <div className="space-y-6">
            <PersonalAICoach user={user} userProfile={profile || {}} />
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('individual.title')}
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            {t('individual.subtitle')}
          </p>
        </div>

        {/* Main Content with Navigation */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <div className="modern-card p-6">
              <nav className="space-y-2">
                {navigationSections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  
                  return (
                    <div key={section.id} className="space-y-1">
                      <button
                        onClick={() => handleSectionChange(section.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                          isActive
                            ? 'text-white shadow-lg'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        style={isActive ? { 
                          background: 'linear-gradient(135deg, #3D4A2B 0%, #2A331E 100%)'
                        } : {}}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{section.title}</span>
                      </button>
                      
                      {/* Subsections */}
                      {isActive && section.subsections && section.subsections.length > 0 && (
                        <div className="ml-6 space-y-1">
                          {section.subsections.map((subsection) => (
                            <button
                              key={subsection.id}
                              onClick={() => handleSectionChange(section.id, subsection.id)}
                              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-sm transition-all duration-200 ${
                                activeSubsection === subsection.id
                                  ? 'text-white shadow-md'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                              style={activeSubsection === subsection.id ? { 
                                background: 'linear-gradient(135deg, #5C6B47 0%, #4A5239 100%)'
                              } : {}}
                            >
                              <span className="font-medium">{subsection.title}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
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

