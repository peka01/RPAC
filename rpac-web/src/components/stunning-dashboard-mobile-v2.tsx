'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/locales';
import { useWeather } from '@/contexts/WeatherContext';
import { 
  Shield, 
  Users, 
  Leaf, 
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  Globe,
  MessageCircle,
  Sun,
  Droplets,
  Wind,
  Thermometer,
  ArrowRight,
  ChevronRight,
  Activity,
  Menu
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface DashboardMetrics {
  communityConnections: number;
  cultivationProgress: number;
  householdNeedsCoverage: number;
  resourceCount: number;
  unreadMessages: number;
  weatherStatus: string;
  nextActions: string[];
  recentActivity: any[];
  planName: string;
  cropCount: number;
  msbFulfillmentPercent: number;
  expiringResources: number;
}


export function StunningDashboardMobileV2({ user }: { user: User | null }) {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    communityConnections: 0,
    cultivationProgress: 0,
    householdNeedsCoverage: 0,
    resourceCount: 0,
    unreadMessages: 0,
    weatherStatus: 'optimal',
    nextActions: [],
    recentActivity: [],
    planName: '',
    cropCount: 0,
    msbFulfillmentPercent: 0,
    expiringResources: 0
  });
  const { weather, forecast, loading: weatherLoading } = useWeather();
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userProfile, setUserProfile] = useState<any>(null);
  const router = useRouter();

  // Get user display name based on profile preference
  const getUserDisplayName = () => {
    if (!user) return t('dashboard.default_user');
    if (!userProfile) return user.email?.split('@')[0] || t('dashboard.default_user');
    
    const preference = userProfile.name_display_preference || 'display_name';
    
    switch (preference) {
      case 'display_name':
        return userProfile.display_name || user.email?.split('@')[0] || t('dashboard.default_user');
      case 'first_last':
        if (userProfile.first_name && userProfile.last_name) {
          return `${userProfile.first_name} ${userProfile.last_name}`;
        }
        return userProfile.display_name || user.email?.split('@')[0] || t('dashboard.default_user');
      case 'initials':
        if (userProfile.first_name && userProfile.last_name) {
          return `${userProfile.first_name[0]}${userProfile.last_name[0]}`.toUpperCase();
        }
        if (userProfile.display_name) {
          return userProfile.display_name.substring(0, 2).toUpperCase();
        }
        return user.email?.split('@')[0] || t('dashboard.default_user');
      default:
        return userProfile.display_name || user.email?.split('@')[0] || t('dashboard.default_user');
    }
  };

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      
      try {
        // Load user profile data
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('display_name, first_name, last_name, name_display_preference, household_size')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile);
        }
        // Load user resources
        const { data: resources } = await supabase
          .from('resources')
          .select('*')
          .eq('user_id', user.id);

        // Load cultivation plan data and calculate nutrition like SimpleCultivationManager
        let cultivationPlans = null;
        try {
          const { data: planData, error: planError } = await supabase
            .from('cultivation_plans')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_primary', true)
            .single();
          
          if (planError && planError.code !== 'PGRST116') { // PGRST116 = no rows found
            console.warn('Error fetching cultivation plan:', planError);
          } else {
            cultivationPlans = planData;
          }
        } catch (err) {
          console.warn('Failed to fetch cultivation plan:', err);
        }

        // Load community memberships
        const { data: memberships } = await supabase
          .from('community_memberships')
          .select('community_id')
          .eq('user_id', user.id);

        // Calculate metrics
        const resourceCount = resources?.length || 0;
        const communityConnections = memberships?.length || 0;
        
        // Calculate MSB fulfillment percentage
        const msbCategories = ['food', 'water', 'medicine', 'energy', 'tools', 'other'];
        const msbResourcesAdded = resources?.filter(r => r.is_msb_recommended && r.quantity > 0) || [];
        const msbCategoriesWithResources = new Set(msbResourcesAdded.map(r => r.category));
        const msbFulfillmentPercent = Math.round((msbCategoriesWithResources.size / msbCategories.length) * 100);
        
        // Calculate expiring resources (within 30 days)
        const expiringResources = resources?.filter(r => 
          r.quantity > 0 && r.days_remaining < 30 && r.days_remaining < 99999
        ).length || 0;
        
        // Calculate cultivation progress using the same logic as SimpleCultivationManager
        let cultivationProgress = 0;
        let planName = '';
        let cropCount = 0;
        if (cultivationPlans) {
          planName = cultivationPlans.title || 'Min odling';
          cropCount = cultivationPlans.crops?.length || 0;
          if (cultivationPlans.crops && cultivationPlans.crops.length > 0) {
            // Import the nutrition calculation function
            const { calculatePlanNutrition } = await import('@/lib/cultivation-plan-service');
            const householdSize = profile?.household_size || 2;
            const nutrition = calculatePlanNutrition(cultivationPlans, householdSize, 30);
            cultivationProgress = nutrition.percentOfTarget;
          }
        }

        // Load unread messages
        const { data: messages } = await supabase
          .from('messages')
          .select('id')
          .eq('receiver_id', user.id)
          .eq('is_read', false);

         setMetrics({
           communityConnections,
           cultivationProgress: Math.round(cultivationProgress),
           householdNeedsCoverage: 0,
           resourceCount,
           unreadMessages: messages?.length || 0,
           weatherStatus: 'optimal',
           nextActions: [
             ...(resourceCount < 5 ? ['Lägg till fler resurser'] : []),
             ...(cultivationProgress < 50 ? ['Planera din odling'] : []),
             ...(communityConnections === 0 ? ['Anslut till ett samhälle'] : [])
           ],
           recentActivity: [],
           planName,
           cropCount,
           msbFulfillmentPercent,
           expiringResources
         });
         
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setLoading(false);
      }
    };

    loadDashboardData();

    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, [user]);

  const getTimeOfDayGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return t('dashboard.good_night');
    if (hour < 12) return t('dashboard.good_morning');
    if (hour < 18) return t('dashboard.good_day');
    return t('dashboard.good_evening');
  };

  const greeting = getTimeOfDayGreeting();

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#3D4A2B]/20 border-t-[#3D4A2B] rounded-full animate-spin"></div>
          <Shield className="w-8 h-8 text-[#3D4A2B] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="mt-4 text-[#3D4A2B] font-medium">Laddar ditt hem</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="px-6 py-8">
        
        {/* Header - Cleaner, no boxes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 leading-tight">{greeting}</h1>
              <p className="text-gray-600 text-base mt-1">
                {getUserDisplayName()}
              </p>
            </div>
            <button 
              onClick={() => router.push('/settings')}
              className="w-11 h-11 rounded-full bg-[#3D4A2B]/10 flex items-center justify-center hover:bg-[#3D4A2B]/20 transition-colors touch-manipulation active:scale-95"
            >
              <Menu className="w-5 h-5 text-[#3D4A2B]" />
            </button>
          </div>
          
          {/* Quick Stats - Inline, not boxed */}
          <div className="flex items-center gap-6 mt-5 text-sm">
            <div>
              <span className="font-bold text-gray-900 text-lg">{metrics.msbFulfillmentPercent}%</span>
              <span className="text-gray-500 ml-1.5">MSB</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div>
              <span className="font-bold text-gray-900 text-lg">{metrics.cultivationProgress}%</span>
              <span className="text-gray-500 ml-1.5">Odling</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div>
              <span className="font-bold text-gray-900 text-lg">{metrics.communityConnections}</span>
              <span className="text-gray-500 ml-1.5">Nätverk</span>
            </div>
          </div>
        </div>

        {/* Main Navigation - List style instead of heavy cards */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
            Navigation
          </h3>
          <div className="space-y-2">
            {/* Mitt hem */}
            <button 
              onClick={() => router.push('/individual')}
              className="w-full group bg-gradient-to-r from-[#3D4A2B] to-[#5C6B47] rounded-2xl p-5 text-white shadow-md hover:shadow-lg transition-all duration-200 touch-manipulation active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-bold">Mitt hem</h3>
                    <p className="text-white/80 text-xs mt-0.5">
                      Beredskap • Resurser • Odling
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            {/* Lokalt */}
            <button 
              onClick={() => router.push('/local')}
              className="w-full group bg-gradient-to-r from-[#4A5239] to-[#707C5F] rounded-2xl p-5 text-white shadow-md hover:shadow-lg transition-all duration-200 touch-manipulation active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center relative">
                    <Users className="w-5 h-5" />
                    {metrics.unreadMessages > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-[10px] font-bold">
                          {metrics.unreadMessages}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-bold">Lokalt</h3>
                    <p className="text-white/80 text-xs mt-0.5">
                      {metrics.communityConnections > 0 ? 'Ansluten till samhälle' : 'Anslut till närområde'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            {/* Regionalt */}
            <button 
              onClick={() => router.push('/regional')}
              className="w-full group bg-gradient-to-r from-[#2A331E] to-[#3D4A2B] rounded-2xl p-5 text-white shadow-md hover:shadow-lg transition-all duration-200 touch-manipulation active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-bold">Regionalt</h3>
                    <p className="text-white/80 text-xs mt-0.5">
                      Regional översikt
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </button>

            {/* Meddelanden */}
            <button 
              onClick={() => router.push('/local/messages/community')}
              className="w-full group bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#3D4A2B]/30 transition-all duration-200 touch-manipulation active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#3D4A2B]/10 flex items-center justify-center relative">
                    <MessageCircle className="w-5 h-5 text-[#3D4A2B]" />
                    {metrics.unreadMessages > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        <span className="text-white text-[10px] font-bold">
                          {metrics.unreadMessages}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-bold text-gray-900">Meddelanden</h3>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {metrics.unreadMessages > 0 ? `${metrics.unreadMessages} olästa` : 'Alla lästa'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#3D4A2B] group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          </div>
        </div>

        {/* My Cultivation - Clean list item */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
            Min odling
          </h3>
          <button 
            onClick={() => router.push(metrics.planName 
              ? '/individual?section=cultivation&plan=current' 
              : '/individual?section=cultivation'
            )}
            className="w-full bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#3D4A2B]/30 transition-all duration-200 touch-manipulation active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#3D4A2B]/10 flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-[#3D4A2B]" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-gray-900">
                    {metrics.planName || 'Min odling'}
                  </h4>
                  <p className="text-gray-600 text-xs mt-0.5">
                    {metrics.cropCount > 0 ? `${metrics.cropCount} grödor planterade` : 'Starta din odling'}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
            {/* Progress bar */}
            <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#3D4A2B] to-[#5C6B47] transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.cultivationProgress)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">Självförsörjning</span>
              <span className="text-xs font-semibold text-gray-900">{metrics.cultivationProgress}%</span>
            </div>
          </button>
        </div>

        {/* Resources Overview */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
            Översikt resurser
          </h3>
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#3D4A2B]/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#3D4A2B]" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">Mina resurser</h4>
                  <p className="text-gray-600 text-xs mt-0.5">{metrics.resourceCount} st registrerade</p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/individual?section=resources')}
                className="text-[#3D4A2B] font-medium text-sm hover:underline"
              >
                Visa
              </button>
            </div>
            {metrics.expiringResources > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-900">
                  <span className="font-semibold">{metrics.expiringResources}</span> resurser utgår snart
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Weather - Compact inline */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
            Väder
          </h3>
          <div className="bg-gradient-to-br from-[#3D4A2B]/5 to-[#5C6B47]/10 border-2 border-[#3D4A2B]/20 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Sun className="w-6 h-6 text-[#3D4A2B]" />
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {weatherLoading ? '--°C' : weather ? `${Math.round(weather.temperature)}°C` : '--°C'}
                  </h4>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {weatherLoading ? 'Laddar...' : weather ? weather.forecast : 'Ej tillgängligt'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-around text-center border-t border-[#3D4A2B]/10 pt-4">
              <div>
                <Droplets className="w-4 h-4 text-[#3D4A2B] mx-auto mb-1" />
                <div className="text-sm font-medium text-gray-900">
                  {weatherLoading ? '--' : weather ? `${weather.humidity}%` : '--%'}
                </div>
              </div>
              <div className="w-px h-8 bg-[#3D4A2B]/10" />
              <div>
                <Wind className="w-4 h-4 text-[#3D4A2B] mx-auto mb-1" />
                <div className="text-sm font-medium text-gray-900">
                  {weatherLoading ? '--' : weather ? `${weather.windSpeed} m/s` : '-- m/s'}
                </div>
              </div>
              <div className="w-px h-8 bg-[#3D4A2B]/10" />
              <div>
                <Thermometer className="w-4 h-4 text-[#3D4A2B] mx-auto mb-1" />
                <div className="text-sm font-medium text-gray-900">Mild</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions - Minimal, list-based */}
        {metrics.nextActions.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1 flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Rekommenderade åtgärder
            </h3>
            <div className="space-y-2">
              {metrics.nextActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (action.includes('resurser')) router.push('/individual?section=resources');
                    else if (action.includes('odling')) router.push('/individual?section=cultivation');
                    else if (action.includes('samhälle')) router.push('/local');
                  }}
                  className="w-full bg-white border border-gray-200 rounded-xl p-4 hover:border-[#3D4A2B]/30 hover:bg-[#3D4A2B]/5 transition-all duration-200 text-left touch-manipulation active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-gray-900 text-sm">
                      {action}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

