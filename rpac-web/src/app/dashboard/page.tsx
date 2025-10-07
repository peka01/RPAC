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
  Droplets,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
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
            email: 'demo@beready.se',
            password: 'demo123'
          });
          
          if (signInError) {
            console.log('Demo user not found, creating...');
            const { error: signUpError } = await supabase.auth.signUp({
              email: 'demo@beready.se',
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
              email: 'demo@beready.se',
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

  // Professional loading experience
  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Shield Loading Spinner Only */}
        <ShieldProgressSpinner variant="bounce" size="lg" color="olive" message="Laddar" />
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

        {/* Skip to content link for accessibility */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#3D4A2B] focus:text-white focus:rounded-lg"
        >
          Hoppa till huvudinnehåll
        </a>

        {/* Dashboard Content */}
        <div id="main-content" className="space-y-8">

          {/* Modern Information Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Mitt hem - Beredskap */}
            <button 
              className="group bg-[#5C6B47] rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer text-left w-full min-h-[200px] touch-manipulation active:scale-98"
              onClick={() => router.push('/individual')}
              aria-label="Gå till Mitt hem - din personliga beredskap och resurser"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">-</div>
                  <div className="text-xs text-white/80">MSB-resurser</div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Mitt hem</h3>
              <p className="text-sm text-white/90 mb-4">
                Din personliga beredskap och resurser
              </p>
              <div className="flex items-center text-sm text-white font-medium">
                <span>{t('dashboard.see_details')}</span>
                <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Lokalt samhälle */}
            <button 
              className="group bg-[#5C6B47] rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer text-left w-full min-h-[200px] touch-manipulation active:scale-98"
              onClick={() => router.push('/local')}
              aria-label={joinedCommunities.length > 0 ? `Hantera dina ${joinedCommunities.length} samhällen` : 'Hitta och gå med i lokala samhällen'}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {loadingCommunities ? '...' : joinedCommunities.length}
                  </div>
                  <div className="text-xs text-white/80">Samhällen</div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Lokalt</h3>
              
              {loadingCommunities ? (
                <p className="text-sm text-white/90 mb-4">Laddar samhällen...</p>
              ) : joinedCommunities.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {joinedCommunities.slice(0, 2).map((community) => (
                    <div 
                      key={community.id} 
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      <span className="flex-1 truncate text-white">{community.community_name}</span>
                      <span className="text-white/80 text-xs">{community.member_count || 0}</span>
                    </div>
                  ))}
                  {joinedCommunities.length > 2 && (
                    <p className="text-xs text-white/80 text-center pt-1">
                      +{joinedCommunities.length - 2} till
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-white/90 mb-4">
                  Hitta och anslut till lokala samhällen
                </p>
              )}
              
              <div className="flex items-center text-sm text-white font-medium">
                <span>{joinedCommunities.length > 0 ? t('dashboard.manage_communities') : t('dashboard.find_communities')}</span>
                <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Min odling */}
            <button 
              className="group bg-[#5C6B47] rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer text-left w-full min-h-[200px] touch-manipulation active:scale-98 relative"
              onClick={() => {
                const destination = cultivationProgress.total > 0 
                  ? '/individual?section=cultivation&subsection=calendar'
                  : '/individual?section=cultivation&subsection=ai-planner';
                router.push(destination);
              }}
              aria-label={cultivationPlan ? `Visa din odlingsplan: ${cultivationPlan.title || cultivationPlan.name}` : 'Skapa din första odlingsplan med AI'}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <div className="text-right relative group/tooltip">
                  <div className="text-2xl font-bold text-white">
                    {cultivationPlan?.self_sufficiency_percent || cultivationPlan?.selfSufficiencyPercent || '0'}%
                  </div>
                  <div className="text-xs text-white/80">{t('dashboard.self_sufficiency')}</div>
                  {/* Tooltip */}
                  <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-10">
                    {t('dashboard.self_sufficiency_tooltip')}
                  </div>
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {cultivationPlan ? cultivationPlan.title || cultivationPlan.name : 'Min odling'}
              </h3>
              
              {cultivationPlan ? (
                <div className="space-y-3 mb-4">
                  {/* Plan Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      <span className="text-white font-medium">{cultivationPlan.crops?.length || 0} grödor</span>
                    </div>
                    {cultivationPlan.estimated_cost && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-white/80"></div>
                        <span className="text-white font-medium">{Math.round(cultivationPlan.estimated_cost)} kr</span>
                      </div>
                    )}
                  </div>

                  {/* Calendar Progress */}
                  {cultivationProgress.total > 0 && (
                    <div className="pt-3 border-t border-white/20">
                      <div className="flex items-center justify-between mb-2 group/progress relative">
                        <span className="text-sm font-medium text-white">Kalender</span>
                        <span className="text-sm font-bold text-white">
                          {cultivationProgress.percentage}%
                        </span>
                        {/* Tooltip */}
                        <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover/progress:opacity-100 group-hover/progress:visible transition-all duration-200 z-10">
                          {t('dashboard.calendar_progress_tooltip')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-full h-2.5 bg-white/20">
                          <div 
                            className="h-2.5 rounded-full bg-white transition-all duration-500" 
                            style={{ width: `${cultivationProgress.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-white/90 whitespace-nowrap font-medium">
                          {cultivationProgress.completed}/{cultivationProgress.total}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-white/90 mb-4">
                  Skapa din första odlingsplan med AI
                </p>
              )}
              
              <div className="flex items-center text-sm text-white font-medium">
                <span>{cultivationPlan ? t('dashboard.view_plan') : t('dashboard.create_plan')}</span>
                <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          {/* Advanced Communication Hub - Enhanced & Resizable */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="xl:col-span-1">
              {user && joinedCommunities.length > 0 && (
                <MessagingSystemV2 user={user} communityId={joinedCommunities[0].id} />
              )}
              {user && joinedCommunities.length === 0 && (
                <div className="bg-white rounded-xl shadow-lg p-10 text-center border border-gray-100">
                  {/* Illustration */}
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#5C6B47]/20 to-[#3D4A2B]/10 rounded-full"></div>
                    <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center">
                      <MessageCircle className="text-[#5C6B47]" size={40} strokeWidth={1.5} />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    Gå med i ett samhälle för att börja kommunicera
                  </h3>
                  <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                    {t('dashboard.empty_messages_tip')}. Hitta och anslut till lokala samhällen för att dela meddelanden och resurser.
                  </p>
                  <button
                    onClick={() => router.push('/local')}
                    className="inline-flex items-center px-8 py-4 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] transition-all shadow-md hover:shadow-lg font-semibold text-base border-2 border-[#3D4A2B] hover:border-[#2A331E] min-h-[48px] touch-manipulation active:scale-98"
                    aria-label="Hitta och gå med i lokala samhällen"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    <span>Hitta samhällen</span>
                    <ChevronRight className="w-5 h-5 ml-2" />
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

          {/* Professional Status Update - Light neutral status card */}
          <div className="rounded-xl p-4 bg-gradient-to-br from-amber-50 to-green-50 border border-green-100 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#5C6B47]">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-900">{t('dashboard.daily_update_complete')}</h3>
                <p className="text-xs text-gray-600">{t('dashboard.daily_update_description')}</p>
              </div>
              <div className="text-2xl text-[#5C6B47]">✓</div>
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