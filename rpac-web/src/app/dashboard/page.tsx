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
import { MessagingSystemV2 } from '@/components/messaging-system-v2';
import { ExternalCommunication } from '@/components/external-communication';
import { WeatherCard } from '@/components/weather-card';
import { WeatherRibbon } from '@/components/weather-ribbon';
import { DashboardResponsive } from '@/components/dashboard-responsive';
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

  const desktopContent = (
    <div className="relative" style={{ background: 'var(--bg-primary)' }}>
      {/* Weather Ribbon - Full width, above all content */}
      <WeatherRibbon user={user} />
      
      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Dashboard Content */}
        <div className="space-y-6">

          {/* Modern Information Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
            {/* Mitt hem - Beredskap */}
            <div 
              className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-[#3D4A2B]/30 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => router.push('/individual')}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#3D4A2B] to-[#2A331E] flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#3D4A2B]">-</div>
                  <div className="text-xs text-gray-500">Beredskapspoäng</div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Mitt hem</h3>
              <p className="text-sm text-gray-600 mb-4">
                Din personliga beredskap och resurser
              </p>
              <div className="flex items-center text-sm text-[#3D4A2B] font-medium">
                <span>Se detaljer</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Lokalt samhälle */}
            <div 
              className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-[#3D4A2B]/30 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => router.push('/local')}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#5C6B47] to-[#3D4A2B] flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#5C6B47]">
                    {loadingCommunities ? '...' : joinedCommunities.length}
                  </div>
                  <div className="text-xs text-gray-500">Samhällen</div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Lokalt</h3>
              
              {loadingCommunities ? (
                <p className="text-sm text-gray-600 mb-4">Laddar samhällen...</p>
              ) : joinedCommunities.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {joinedCommunities.slice(0, 2).map((community) => (
                    <div 
                      key={community.id} 
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="w-2 h-2 rounded-full bg-[#5C6B47]"></div>
                      <span className="flex-1 truncate text-gray-700">{community.community_name}</span>
                      <span className="text-gray-500 text-xs">{community.member_count || 0}</span>
                    </div>
                  ))}
                  {joinedCommunities.length > 2 && (
                    <p className="text-xs text-gray-500 text-center pt-1">
                      +{joinedCommunities.length - 2} till
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600 mb-4">
                  Hitta och anslut till lokala samhällen
                </p>
              )}
              
              <div className="flex items-center text-sm text-[#5C6B47] font-medium">
                <span>{joinedCommunities.length > 0 ? 'Hantera samhällen' : 'Hitta samhällen'}</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Min odling */}
            <div 
              className="group bg-white rounded-xl p-6 border border-gray-200 hover:border-[#3D4A2B]/30 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => {
                const destination = cultivationProgress.total > 0 
                  ? '/individual?section=cultivation&subsection=calendar'
                  : '/individual?section=cultivation&subsection=ai-planner';
                router.push(destination);
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#A08E5A] to-[#5C6B47] flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#A08E5A]">
                    {cultivationPlan?.self_sufficiency_percent || cultivationPlan?.selfSufficiencyPercent || '0'}%
                  </div>
                  <div className="text-xs text-gray-500">Självförsörjning</div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {cultivationPlan ? cultivationPlan.title || cultivationPlan.name : 'Min odling'}
              </h3>
              
              {cultivationPlan ? (
                <div className="space-y-3 mb-4">
                  {/* Plan Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#A08E5A]"></div>
                      <span className="text-gray-700">{cultivationPlan.crops?.length || 0} grödor</span>
                    </div>
                    {cultivationPlan.estimated_cost && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-[#5C6B47]"></div>
                        <span className="text-gray-700">{Math.round(cultivationPlan.estimated_cost)} kr</span>
                      </div>
                    )}
                  </div>

                  {/* Calendar Progress */}
                  {cultivationProgress.total > 0 && (
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Kalender</span>
                        <span className="text-sm font-bold text-[#A08E5A]">
                          {cultivationProgress.percentage}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-full h-2 bg-gray-100">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-[#A08E5A] to-[#5C6B47] transition-all duration-500" 
                            style={{ width: `${cultivationProgress.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {cultivationProgress.completed}/{cultivationProgress.total}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600 mb-4">
                  Skapa din första odlingsplan med AI
                </p>
              )}
              
              <div className="flex items-center text-sm text-[#A08E5A] font-medium">
                <span>{cultivationPlan ? 'Se odlingsplan' : 'Skapa plan'}</span>
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Advanced Communication Hub - Enhanced & Resizable */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
            <div className="xl:col-span-1">
              {user && joinedCommunities.length > 0 && (
                <MessagingSystemV2 user={user} communityId={joinedCommunities[0].id} />
              )}
              {user && joinedCommunities.length === 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                  <MessageCircle className="mx-auto mb-4 text-gray-400" size={48} />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Gå med i ett samhälle för att börja kommunicera
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Hitta och anslut till lokala samhällen via fliken "Samhälle"
                  </p>
                  <button
                    onClick={() => router.push('/local')}
                    className="px-4 py-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-colors"
                  >
                    Hitta samhällen
                  </button>
                </div>
              )}
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

  return (
    <DashboardResponsive user={user} desktopContent={desktopContent} />
  );
}