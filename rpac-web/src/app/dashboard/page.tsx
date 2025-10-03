'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/locales';
import { 
  Heart, 
  Shield, 
  Users, 
  Leaf, 
  Radio, 
  MessageCircle,
  Sun,
  Moon,
  CheckCircle,
  Smile,
  Wind,
  Droplets
} from 'lucide-react';
import { StatusCard } from '@/components/status-card';
import { PreparednessOverview } from '@/components/preparedness-overview';
import { ResourceSummaryCard } from '@/components/resource-summary-card';
import { CommunityCoordinationSummary } from '@/components/community-coordination-summary';
import { MessagingSystem } from '@/components/messaging-system';
import { ExternalCommunication } from '@/components/external-communication';
import { WeatherCard } from '@/components/weather-card';
import { WeatherRibbon } from '@/components/weather-ribbon';
import { supabase, communityService, type LocalCommunity } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cultivationPlan, setCultivationPlan] = useState<any>(null);
  const [cultivationProgress, setCultivationProgress] = useState<{completed: number; total: number; percentage: number}>({
    completed: 0,
    total: 0,
    percentage: 0
  });
  const [joinedCommunities, setJoinedCommunities] = useState<LocalCommunity[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);
  const router = useRouter();


  // Load cultivation calendar progress
  const loadCultivationProgress = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('cultivation_calendar')
        .select('is_completed')
        .eq('user_id', userId);
      
      if (error) {
        return;
      }
      
      const total = data?.length || 0;
      const completed = data?.filter(item => item.is_completed).length || 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      setCultivationProgress({ completed, total, percentage });
    } catch (error) {
      // Silently fail if cultivation calendar doesn't exist yet
    }
  };

  // Load joined communities
  const loadJoinedCommunities = async (userId: string) => {
    setLoadingCommunities(true);
    try {
      // Get user's memberships
      const membershipIds = await communityService.getUserMemberships(userId);
      
      if (membershipIds.length === 0) {
        setJoinedCommunities([]);
        return;
      }

      // Get community details for each membership
      const allCommunities = await communityService.getCommunities();
      const joined = allCommunities.filter(c => membershipIds.includes(c.id));
      setJoinedCommunities(joined);
    } catch (error) {
      console.error('Error loading joined communities:', error);
      setJoinedCommunities([]);
    } finally {
      setLoadingCommunities(false);
    }
  };

  // Load cultivation plan from Supabase
  const loadCultivationPlan = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('cultivation_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('is_primary', true) // Load primary plan first
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data && !error) {
        // If no primary plan, get the most recent plan
        const { data: latestPlan, error: latestError } = await supabase
          .from('cultivation_plans')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (latestPlan && !latestError) {
          // Extract relevant data from plan_data for display
          const planData = latestPlan.plan_data || {};
          const realTimeStats = planData.realTimeStats || {};
          const gardenPlan = planData.gardenPlan || {};
          
          setCultivationPlan({
            id: latestPlan.id,
            title: latestPlan.title || planData.name,
            name: planData.name,
            description: latestPlan.description,
            self_sufficiency_percent: realTimeStats.selfSufficiencyPercent || gardenPlan.selfSufficiencyPercent || 0,
            selfSufficiencyPercent: realTimeStats.selfSufficiencyPercent || gardenPlan.selfSufficiencyPercent || 0,
            crops: gardenPlan.crops || [],
            estimated_cost: realTimeStats.totalCost || gardenPlan.estimatedCost || 0,
            created_at: latestPlan.created_at,
            is_primary: latestPlan.is_primary
          });
        }
      } else if (data && !error) {
        // Extract relevant data from plan_data for display
        const planData = data.plan_data || {};
        const realTimeStats = planData.realTimeStats || {};
        const gardenPlan = planData.gardenPlan || {};
        
        setCultivationPlan({
          id: data.id,
          title: data.title || planData.name,
          name: planData.name,
          description: data.description,
          self_sufficiency_percent: realTimeStats.selfSufficiencyPercent || gardenPlan.selfSufficiencyPercent || 0,
          selfSufficiencyPercent: realTimeStats.selfSufficiencyPercent || gardenPlan.selfSufficiencyPercent || 0,
          crops: gardenPlan.crops || [],
          estimated_cost: realTimeStats.totalCost || gardenPlan.estimatedCost || 0,
          created_at: data.created_at,
          is_primary: data.is_primary
        });
      }
    } catch (error) {
      console.error('Error loading cultivation plan:', error);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        await Promise.all([
          loadCultivationPlan(user.id),
          loadCultivationProgress(user.id),
          loadJoinedCommunities(user.id)
        ]);
        setLoading(false);
      } else {
        // If no user is authenticated, try to authenticate with demo user
        console.log('No user authenticated, trying demo login...');
        try {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: 'demo@rpac.se',
            password: 'demo123'
          });
          
          if (signInError) {
            console.log('Demo user not found, creating...');
            const { error: signUpError } = await supabase.auth.signUp({
              email: 'demo@rpac.se',
              password: 'demo123',
              options: {
                data: {
                  name: t('dashboard.demo_user')
                }
              }
            });
            
            if (signUpError) {
              console.error('Failed to create demo user:', signUpError);
              router.push('/');
              return;
            }
            
            // Wait for user creation and try to sign in again
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const { error: retryError } = await supabase.auth.signInWithPassword({
              email: 'demo@rpac.se',
              password: 'demo123'
            });
            
            if (retryError) {
              console.error('Failed to sign in demo user:', retryError);
              router.push('/');
              return;
            }
          }
          
          // Get the authenticated user
          const { data: { user: authenticatedUser } } = await supabase.auth.getUser();
          if (authenticatedUser) {
            setUser(authenticatedUser);
            setLoading(false);
          } else {
            router.push('/');
          }
        } catch (error) {
          console.error('Authentication error:', error);
          router.push('/');
        }
      }
    };
    checkUser();

    // Update time every minute for natural rhythm
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    // Note: Removed heartbeat animation to prevent flashing

    return () => {
      clearInterval(timeInterval);
    };
  }, [router]);

  // Professional military loading experience
  if (loading) {
    return (
      <div className="h-full overflow-hidden flex items-center justify-center relative" style={{ background: 'var(--bg-primary)' }}>
        {/* Professional background patterns */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-32 h-32 opacity-[0.02]">
            <div className="w-full h-full rounded-full" style={{ backgroundColor: 'var(--color-primary)' }}></div>
          </div>
          <div className="absolute bottom-20 right-20 w-24 h-24 opacity-[0.02]">
            <div className="w-full h-full rounded-full" style={{ backgroundColor: 'var(--color-secondary)' }}></div>
          </div>
        </div>
        
        <div className="text-center z-10 max-w-md mx-auto px-6">
          {/* Military-style loading indicator */}
          <div className="mb-8">
            <div className="w-20 h-20 rounded-lg flex items-center justify-center mx-auto shadow-lg mb-6" style={{ 
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)' 
            }}>
              <Shield className="w-10 h-10 text-white" />
            </div>
            
            {/* Clean progress bar */}
            <div className="w-64 mx-auto">
              <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                <span>{t('dashboard.loading_progress')}</span>
                <span>75%</span>
              </div>
              <div className="h-2 rounded-full border" style={{ 
                backgroundColor: 'var(--bg-card)', 
                borderColor: 'var(--color-secondary)' 
              }}>
                <div 
                  className="h-full rounded-full" 
                  style={{ 
                    background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                    width: '75%',
                    transition: 'none' // Remove animations to prevent flashing
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                <span>{t('dashboard.loading_status_start')}</span>
                <span>{t('dashboard.loading_status_end')}</span>
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('dashboard.loading_title')}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {t('dashboard.loading_description')}
          </p>
        </div>
      </div>
    );
  }

  const getTimeOfDayGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return t('dashboard.good_night');
    if (hour < 12) return t('dashboard.good_morning');
    if (hour < 18) return t('dashboard.good_day');
    return t('dashboard.good_evening');
  };

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || t('dashboard.default_user');

  return (
    <div className="relative" style={{ background: 'var(--bg-primary)' }}>
      {/* Weather Ribbon - Full width, above all content */}
      <WeatherRibbon user={user} />
      
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Dashboard Content */}
        <div className="space-y-6">

          {/* Professional Information Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {/* Preparedness Status Report */}
            <div className="group bg-white/95 rounded-lg p-4 border shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer" style={{ 
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--color-sage)'
            }}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ 
                  background: 'linear-gradient(135deg, var(--color-sage) 0%, var(--color-quaternary) 100%)' 
                }}>
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold" style={{ color: 'var(--color-sage)' }}>92%</div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('dashboard.preparedness_level')}</div>
                </div>
              </div>
              <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{t('dashboard.operational_status_title')}</h3>
              <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.resources_status')}</p>
              <div className="flex space-x-2">
                <div className="flex-1 rounded-full h-2" style={{ backgroundColor: 'rgba(135, 169, 107, 0.2)' }}>
                  <div className="h-2 rounded-full" style={{ width: '92%', backgroundColor: 'var(--color-sage)' }}></div>
                </div>
                <span className="text-xs font-semibold" style={{ color: 'var(--color-sage)' }}>{t('dashboard.optimal')}</span>
              </div>
            </div>

            {/* Network Intelligence */}
            <div 
              className="group bg-white/95 rounded-lg p-4 border shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer" 
              style={{ 
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--color-cool-olive)'
              }}
              onClick={() => router.push('/local')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ 
                  background: 'linear-gradient(135deg, var(--color-cool-olive) 0%, var(--color-tertiary) 100%)' 
                }}>
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold" style={{ color: 'var(--color-cool-olive)' }}>
                    {loadingCommunities ? '...' : joinedCommunities.length}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {t('dashboard.joined_communities')}
                  </div>
                </div>
              </div>
              <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('dashboard.network')}
              </h3>
              
              {loadingCommunities ? (
                <div className="flex items-center space-x-2 mb-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: 'var(--color-cool-olive)' }}></div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Laddar...</p>
                </div>
              ) : joinedCommunities.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {joinedCommunities.slice(0, 2).map((community) => (
                    <div 
                      key={community.id} 
                      className="flex items-center space-x-2 text-xs p-2 rounded" 
                      style={{ backgroundColor: 'rgba(110, 127, 94, 0.05)' }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-cool-olive)' }}></div>
                      <span className="flex-1 font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {community.community_name}
                      </span>
                      <span style={{ color: 'var(--text-tertiary)' }}>
                        {community.member_count || 0} 👥
                      </span>
                    </div>
                  ))}
                  {joinedCommunities.length > 2 && (
                    <p className="text-xs text-center" style={{ color: 'var(--text-tertiary)' }}>
                      +{joinedCommunities.length - 2} till
                    </p>
                  )}
                </div>
              ) : (
                <div className="mb-3">
                  <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {t('dashboard.no_communities')}
                  </p>
                  <div className="bg-gray-50 rounded-lg p-2 border" style={{ 
                    backgroundColor: 'rgba(110, 127, 94, 0.05)',
                    borderColor: 'rgba(110, 127, 94, 0.2)'
                  }}>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {t('dashboard.search_communities')}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-2 text-xs" style={{ color: 'var(--color-cool-olive)' }}>
                <MessageCircle className="w-3 h-3" />
                <span>{t('dashboard.view_communities')} →</span>
              </div>
            </div>

            {/* Cultivation Management */}
            <div 
              className="group bg-white/95 rounded-lg p-4 border shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer lg:col-span-2 xl:col-span-1" 
              style={{ 
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--color-khaki)'
              }}
              onClick={() => {
                // If there's progress, go to calendar, otherwise go to planner
                const destination = cultivationProgress.total > 0 
                  ? '/individual?section=cultivation&subsection=calendar'
                  : '/individual?section=cultivation&subsection=ai-planner';
                router.push(destination);
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ 
                  background: 'linear-gradient(135deg, var(--color-khaki) 0%, var(--color-warm-olive) 100%)' 
                }}>
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: 'var(--color-khaki)' }}>
                    {cultivationPlan?.self_sufficiency_percent || cultivationPlan?.selfSufficiencyPercent || '0'}%
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{t('dashboard.self_sufficiency')}</div>
                </div>
              </div>
              <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                {cultivationPlan ? `Odlingsplan - ${cultivationPlan.title || cultivationPlan.name}` : 'Odlingsplanering'}
              </h3>
              
              {cultivationPlan ? (
                <div className="space-y-2 mb-3">
                  {/* Plan Description */}
                  {cultivationPlan.description && (
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {cultivationPlan.description.length > 60 
                        ? cultivationPlan.description.substring(0, 57) + '...' 
                        : cultivationPlan.description}
                    </p>
                  )}
                  
                  {/* Plan Stats */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-khaki)' }}></div>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {cultivationPlan.crops?.length || 0} grödor
                      </span>
                    </div>
                    {cultivationPlan.estimated_cost && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-sage)' }}></div>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {Math.round(cultivationPlan.estimated_cost)} kr
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Calendar Progress - Only show if tasks exist */}
                  {cultivationProgress.total > 0 && (
                    <div className="pt-2 mt-2 border-t" style={{ borderColor: 'rgba(160, 142, 90, 0.2)' }}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                          {t('dashboard.calendar_progress')}
                        </span>
                        <span className="text-xs font-bold" style={{ color: 'var(--color-khaki)' }}>
                          {cultivationProgress.percentage}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 rounded-full h-1.5" style={{ backgroundColor: 'rgba(160, 142, 90, 0.2)' }}>
                          <div className="h-1.5 rounded-full transition-all duration-500" style={{ 
                            width: `${cultivationProgress.percentage}%`, 
                            backgroundColor: 'var(--color-sage)' 
                          }}></div>
                        </div>
                        <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                          {cultivationProgress.completed}/{cultivationProgress.total}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 mb-3">
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {t('dashboard.no_plan_selected')}
                  </p>
                  
                  {/* How to create plan info */}
                  <div className="bg-gray-50 rounded-lg p-3 border" style={{ 
                    backgroundColor: 'rgba(160, 142, 90, 0.05)',
                    borderColor: 'rgba(160, 142, 90, 0.2)'
                  }}>
                    <div className="flex items-start space-x-2">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center mt-0.5" style={{ 
                        backgroundColor: 'var(--color-khaki)' 
                      }}>
                        <span className="text-white text-xs font-bold">1</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                          Skapa din första odlingsplan
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Fyll i din profil och få en personlig plan anpassad för ditt klimat och trädgårdsstorlek
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Benefits preview */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-sage)' }}></div>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        AI-anpassad plan
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-khaki)' }}></div>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        Kostnadsberäkning
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Advanced Communication Hub - Enhanced & Resizable */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            <div className="xl:col-span-1">
              {user && <MessagingSystem user={user} communityId="demo-community-1" />}
            </div>
            <div className="xl:col-span-1">
              <ExternalCommunication />
            </div>
          </div>


          {/* Resource Summary */}
          {user && (
            <div className="mb-6">
              <ResourceSummaryCard user={user} />
            </div>
          )}

          {/* Community Coordination Summary */}
          <div className="mb-6">
            <CommunityCoordinationSummary />
          </div>

          {/* Core Preparedness (Crisis-Ready) */}
          <div className="mb-6">
            <StatusCard />
          </div>

          {/* Professional Status Update */}
          <div className="rounded-lg p-3 border shadow-sm" style={{ 
            background: 'linear-gradient(135deg, var(--bg-olive-light) 0%, var(--bg-card) 100%)',
            borderColor: 'var(--color-secondary)'
          }}>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{ 
                backgroundColor: 'var(--color-primary)' 
              }}>
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t('dashboard.daily_update_complete')}</h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.daily_update_description')}</p>
              </div>
              <div className="text-lg" style={{ color: 'var(--color-primary)' }}>✓</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}