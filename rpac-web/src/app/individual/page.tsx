'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SupabaseResourceInventory } from '@/components/supabase-resource-inventory';
import { PlantDiagnosis } from '@/components/plant-diagnosis';
import { PersonalDashboard } from '@/components/personal-dashboard';
import { CultivationCalendar } from '@/components/cultivation-calendar';
import { AICultivationAdvisor } from '@/components/ai-cultivation-advisor';
import { GardenPlanner } from '@/components/garden-planner';
import { CultivationReminders } from '@/components/cultivation-reminders';
import { CrisisCultivation } from '@/components/crisis-cultivation';
import { NutritionCalculator } from '@/components/nutrition-calculator';
import { useUserProfile } from '@/lib/useUserProfile';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { t } from '@/lib/locales';

export default function IndividualPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const { profile, loading: profileLoading } = useUserProfile(user);

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

  return (
    <div style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('individual.title')}
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            {t('individual.subtitle')}
          </p>
        </div>


        {/* Hemöversikt - Personal Dashboard at Top */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('individual.home_overview')}
          </h2>
          <div className="modern-card">
            <PersonalDashboard user={user} />
          </div>
        </div>

        {/* Personal Resources & Tools */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('individual.personal_resources')}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="modern-card">
              <SupabaseResourceInventory user={{ id: user.id }} />
            </div>
            <div className="modern-card">
              <PlantDiagnosis />
            </div>
          </div>
        </div>

        {/* Cultivation Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('individual.cultivation_planning')}
          </h2>
          
          {/* Cultivation Calendar & AI Advisor */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            <div className="xl:col-span-2">
              <CultivationCalendar 
                climateZone={profile?.climate_zone || 'svealand'} 
                gardenSize={profile?.garden_size === 'none' || profile?.garden_size === 'balcony' ? 'small' : 
                          profile?.garden_size === 'farm' ? 'large' : 
                          profile?.garden_size || 'medium'}
                crisisMode={false}
              />
            </div>
            
            <div className="xl:col-span-1">
              <AICultivationAdvisor 
                userProfile={{
                  climateZone: profile?.climate_zone || 'svealand',
                  experienceLevel: profile?.experience_level || 'beginner',
                  gardenSize: profile?.garden_size === 'none' || profile?.garden_size === 'balcony' ? 'small' : 
                             profile?.garden_size === 'farm' ? 'large' : 
                             profile?.garden_size || 'medium',
                  preferences: profile?.growing_preferences || ['potatoes', 'carrots', 'lettuce'],
                  currentCrops: ['tomatoes', 'herbs']
                }}
                crisisMode={false}
              />
            </div>
          </div>

          {/* Garden Planning & Reminders */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            <div>
              <GardenPlanner 
                onSave={(layout) => {
                  console.log('Garden layout saved:', layout);
                }}
                crisisMode={false}
              />
            </div>
            <div>
              <CultivationReminders 
                climateZone={profile?.climate_zone || 'svealand'}
                crisisMode={false}
              />
            </div>
          </div>

          {/* Crisis Cultivation */}
          <div className="mb-6">
            <CrisisCultivation 
              urgencyLevel="medium"
              availableSpace={profile?.garden_size === 'none' || profile?.garden_size === 'balcony' ? 'indoor' : 'both'}
              timeframe={30}
            />
          </div>

          {/* Nutrition Calculator */}
          <div>
            <NutritionCalculator 
              gardenSize={profile?.garden_size === 'none' || profile?.garden_size === 'balcony' ? 'small' : 
                         profile?.garden_size === 'farm' ? 'large' : 
                         profile?.garden_size || 'medium'}
              onCalculationChange={(data) => {
                console.log('Nutrition calculation:', data);
              }}
            />
          </div>
        </div>

        {/* Guides & Personal Development */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('individual.guides_development')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="crisis-card">
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                {t('individual.guides')}
              </h3>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                {t('individual.guides_description')}
              </p>
              <div className="space-y-2">
                <button className="crisis-button w-full text-left" style={{ backgroundColor: 'var(--color-crisis-green)', color: 'white' }}>
                  {t('individual.basic_preparedness')}
                </button>
                <button className="crisis-button w-full text-left" style={{ backgroundColor: 'var(--color-crisis-blue)', color: 'white' }}>
                  {t('individual.gardening_guide')}
                </button>
                <button className="crisis-button w-full text-left" style={{ backgroundColor: 'var(--color-crisis-brown)', color: 'white' }}>
                  {t('individual.home_defense')}
                </button>
              </div>
            </div>

            <div className="crisis-card">
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                {t('individual.personal_coach')}
              </h3>
              <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
                {t('individual.coach_description')}
              </p>
              <div className="space-y-2">
                <button className="crisis-button w-full text-left" style={{ backgroundColor: 'var(--color-crisis-orange)', color: 'white' }}>
                  {t('individual.get_personal_advice')}
                </button>
                <button className="crisis-button w-full text-left" style={{ backgroundColor: 'var(--color-crisis-blue)', color: 'white' }}>
                  {t('individual.analyze_preparedness')}
                </button>
                <button className="crisis-button w-full text-left" style={{ backgroundColor: 'var(--color-crisis-green)', color: 'white' }}>
                  {t('individual.set_preparedness_goals')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

