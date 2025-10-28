'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/locales';
import { useWeather } from '@/contexts/WeatherContext';
import { WeatherBar } from '@/components/weather-bar';
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
  Menu,
  Package,
  Settings,
  UserCheck,
  BarChart3,
  Edit
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
  availableResources: number;
  totalResources: number;
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
    expiringResources: 0,
    availableResources: 0,
    totalResources: 0
  });
  const { weather, forecast, extremeWeatherWarnings, officialWarnings, loading: weatherLoading } = useWeather();
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCommunities, setAdminCommunities] = useState<any[]>([]);
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
          .select('community_id, role')
          .eq('user_id', user.id);

        // Check for admin status
        const adminMemberships = memberships?.filter(m => m.role === 'admin') || [];
        setIsAdmin(adminMemberships.length > 0);
        
        if (adminMemberships.length > 0) {
          // Load admin community details
          const communityIds = adminMemberships.map(m => m.community_id);
          const { data: communities } = await supabase
            .from('local_communities')
            .select('id, community_name')
            .in('id', communityIds);
          setAdminCommunities(communities || []);
        }

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
           expiringResources,
           availableResources: 0, // TODO: Calculate from community resources
           totalResources: resourceCount
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
    <div className="min-h-screen bg-gradient-to-br from-[#2A331E]/5 via-[#3D4A2B]/3 to-[#4A5239]/8 pb-32">
      <div className="px-4 py-6">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {greeting}, {getUserDisplayName()}!
          </h1>
          <p className="text-sm text-gray-600">
            {new Date().toLocaleDateString('sv-SE', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Weather Bar - Full featured with warnings */}
        <div className="mb-6">
          <WeatherBar />
        </div>

        {/* Overview Section Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#3D4A2B]" />
            Översikt
          </h2>
        </div>

        {/* Score Cards - Mobile optimized */}
        <div className="space-y-4 mb-8">
          {/* Min odling - Cultivation Progress */}
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5C6B47] to-[#707C5F] flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight mb-0.5 truncate">{metrics.planName || 'Min odling'}</h3>
                  <p className="text-xs text-gray-500 font-medium truncate">Självförsörjning</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <div className="text-2xl font-bold text-gray-900 mb-0.5">{metrics.cultivationProgress}%</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold whitespace-nowrap">Behov</div>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                {metrics.planName 
                  ? metrics.cropCount === 1 
                    ? '1 gröda i planen'
                    : `${metrics.cropCount} grödor i planen`
                  : 'Börja planera din odling'}
              </p>
              
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#5C6B47] to-[#707C5F] rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${Math.min(100, metrics.cultivationProgress)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => router.push(metrics.planName 
                  ? '/individual?section=cultivation&plan=current' 
                  : '/individual?section=cultivation'
              )}
              className="w-full py-2 px-4 rounded-lg bg-[#3D4A2B]/5 hover:bg-[#3D4A2B]/10 border border-[#3D4A2B]/20 hover:border-[#3D4A2B]/40 text-xs text-[#3D4A2B] hover:text-[#2A331E] font-semibold flex items-center justify-center gap-2 transition-all duration-200"
            >
              <span>{metrics.planName ? 'Hantera aktuell plan' : 'Skapa plan'}</span>
              <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Mina resurser */}
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A5239] to-[#707C5F] flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight mb-0.5 truncate">Mina resurser</h3>
                  <p className="text-xs text-gray-500 font-medium truncate">MSB rekommendationer</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <div className="text-2xl font-bold text-gray-900 mb-0.5">{metrics.msbFulfillmentPercent}%</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold whitespace-nowrap">Uppfylld</div>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                {metrics.totalResources === 1 
                  ? '1 resurs tillagd'
                  : `${metrics.totalResources} resurser tillagda`}
              </p>
              
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#4A5239] to-[#707C5F] rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${Math.min(100, metrics.msbFulfillmentPercent)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => router.push('/individual')}
              className="w-full py-2 px-4 rounded-lg bg-[#3D4A2B]/5 hover:bg-[#3D4A2B]/10 border border-[#3D4A2B]/20 hover:border-[#3D4A2B]/40 text-xs text-[#3D4A2B] hover:text-[#2A331E] font-semibold flex items-center justify-center gap-2 transition-all duration-200"
            >
              <span>Hantera resurser</span>
              <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Community Connections */}
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#707C5F] to-[#4A5239] flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight mb-0.5 truncate">Lokalt nätverk</h3>
                  <p className="text-xs text-gray-500 font-medium truncate">
                    {metrics.communityConnections === 0 
                      ? 'Gå med i ett samhälle'
                      : metrics.communityConnections === 1 
                        ? `Medlem i 1 samhälle`
                        : `Medlem i ${metrics.communityConnections} samhällen`}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <div className="text-2xl font-bold text-gray-900 mb-0.5">{metrics.communityConnections}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold whitespace-nowrap">Samhällen</div>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                {metrics.communityConnections === 0 
                  ? 'Anslut dig till lokala samhällen för bättre beredskap'
                  : metrics.availableResources === 1 
                    ? '1 gemensam resurs'
                    : `${metrics.availableResources} gemensamma resurser`}
              </p>
              
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#707C5F] to-[#4A5239] rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${Math.min(100, (metrics.communityConnections / 3) * 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => router.push('/local')}
              className="w-full py-2 px-4 rounded-lg bg-[#4A5239]/5 hover:bg-[#4A5239]/10 border border-[#4A5239]/20 hover:border-[#4A5239]/40 text-xs text-[#4A5239] hover:text-[#2A331E] font-semibold flex items-center justify-center gap-2 transition-all duration-200"
            >
              <span>{metrics.communityConnections > 0 ? 'Gå till samhälle' : 'Hitta samhällen'}</span>
              <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Main Navigation - Moved to end */}
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

                {/* Admin Section - Only show if user is admin */}
                {isAdmin && adminCommunities.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
                      Administratörsverktyg
                    </h3>
                    <div className="space-y-2">
                      {adminCommunities.map((community) => (
                        <div key={community.id} className="bg-gradient-to-r from-[#B8860B]/10 to-[#B8860B]/5 rounded-2xl p-5 border border-[#B8860B]/20">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#B8860B]/20 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-[#B8860B]" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 text-sm">{community.community_name}</h4>
                                <p className="text-xs text-[#B8860B] font-medium">Administratör</p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#B8860B]" />
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2">
                            {/* Manage Users */}
                            <button 
                              onClick={() => router.push(`/local?community=${community.id}&tab=members`)}
                              className="flex flex-col items-center gap-2 p-3 bg-white/50 rounded-xl hover:bg-white/80 transition-all active:scale-95 touch-manipulation"
                            >
                              <div className="w-8 h-8 rounded-lg bg-[#3D4A2B]/10 flex items-center justify-center">
                                <Users className="w-4 h-4 text-[#3D4A2B]" />
                              </div>
                              <span className="text-xs font-semibold text-gray-700 text-center">Medlemmar</span>
                            </button>

                            {/* Homepage Editor */}
                            <button 
                              onClick={() => router.push(`/local?community=${community.id}&tab=homepage`)}
                              className="flex flex-col items-center gap-2 p-3 bg-white/50 rounded-xl hover:bg-white/80 transition-all active:scale-95 touch-manipulation"
                            >
                              <div className="w-8 h-8 rounded-lg bg-[#5C6B47]/10 flex items-center justify-center">
                                <Edit className="w-4 h-4 text-[#5C6B47]" />
                              </div>
                              <span className="text-xs font-semibold text-gray-700 text-center">Hemsida</span>
                            </button>

                            {/* Invites & Analytics */}
                            <button 
                              onClick={() => router.push(`/local?community=${community.id}&tab=analytics`)}
                              className="flex flex-col items-center gap-2 p-3 bg-white/50 rounded-xl hover:bg-white/80 transition-all active:scale-95 touch-manipulation"
                            >
                              <div className="w-8 h-8 rounded-lg bg-[#707C5F]/10 flex items-center justify-center">
                                <BarChart3 className="w-4 h-4 text-[#707C5F]" />
                              </div>
                              <span className="text-xs font-semibold text-gray-700 text-center">Inbjudningar</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          );
        }

