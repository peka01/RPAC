'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/locales';
import { useWeather } from '@/contexts/WeatherContext';
import { 
  Shield, 
  Users, 
  Leaf, 
  Heart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Zap,
  Globe,
  MessageCircle,
  Radio,
  Sun,
  Droplets,
  Wind,
  Thermometer,
  Calendar,
  BarChart3,
  ArrowRight,
  ChevronRight,
  Star,
  Award,
  Activity,
  Sparkles,
  Menu,
  Bell
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


export function StunningDashboardMobile({ user }: { user: User | null }) {
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
          .select('display_name, first_name, last_name, name_display_preference')
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
        const { data: cultivationPlans } = await supabase
          .from('cultivation_plans')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .single();

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
            const nutrition = calculatePlanNutrition(cultivationPlans, 2, 30); // Default household size 2, 30 days
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
           cultivationProgress,
           householdNeedsCoverage: 0, // Not used anymore
           resourceCount,
           unreadMessages: messages?.length || 0,
           weatherStatus: 'optimal',
           nextActions: [
             resourceCount < 10 ? 'Lägg till fler resurser' : 'Uppdatera resurser',
             cultivationProgress < 30 ? 'Planera din odling' : 'Skörda grödor',
             communityConnections === 0 ? 'Gå med i samhälle' : 'Dela resurser'
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

  const userName = getUserDisplayName();

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
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3D4A2B] to-[#5C6B47] flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Beready</h1>
              <p className="text-xs text-gray-500">Din beredskap</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            <button className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>


      {/* Hero Section */}
      <div className="px-6 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {getTimeOfDayGreeting()}, {userName}!
          </h2>
        </div>

        {/* Key Metrics - Mobile Optimized with Section Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#3D4A2B]" />
            Din beredskap
          </h2>
          <p className="text-gray-600 text-sm">Översikt över din personliga beredskap och aktivitet</p>
        </div>
        
        <div className="space-y-4 mb-8">
          {/* Min odling - Cultivation Progress */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5C6B47] to-[#707C5F] flex items-center justify-center flex-shrink-0">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">{metrics.planName || 'Min odling'}</h3>
                  <p className="text-xs text-gray-500">
                    {metrics.planName 
                      ? `${metrics.cropCount} grödor i planen`
                      : 'Börja planera'}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <div className="text-xl font-bold text-gray-900">{metrics.cultivationProgress}%</div>
                <div className="text-xs text-gray-500">av hushållsbehov</div>
              </div>
            </div>
            <button 
              onClick={() => router.push('/individual?section=cultivation')}
              className="w-full text-sm text-[#3D4A2B] hover:text-[#2A331E] font-medium flex items-center justify-center py-2 border border-[#3D4A2B]/20 rounded-lg hover:bg-[#3D4A2B]/5 transition-all"
            >
              <span>Hantera odling</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          {/* Secondary Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Mina resurser */}
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3D4A2B] to-[#5C6B47] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{metrics.msbFulfillmentPercent}%</div>
                  <div className="text-xs text-gray-500">av MSB:s rekommendationer</div>
                </div>
              </div>
              <h4 className="font-medium text-gray-900 text-sm">Mina resurser</h4>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.resourceCount} resurser tillagda{metrics.expiringResources > 0 ? `, ${metrics.expiringResources} förfallna` : ''}
              </p>
            </div>

            {/* Meddelanden */}
            <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A5239] to-[#707C5F] flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{metrics.unreadMessages}</div>
                  <div className="text-xs text-gray-500">olästa</div>
                </div>
              </div>
              <h4 className="font-medium text-gray-900 text-sm">Meddelanden</h4>
            </div>
          </div>

          {/* Community Connections */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A5239] to-[#707C5F] flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Lokalt nätverk</h4>
                  <p className="text-sm text-gray-500">
                    {metrics.communityConnections > 0 ? 'Ansluten' : 'Gå med i samhälle'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{metrics.communityConnections}</div>
                <div className="text-xs text-gray-500">samhällen</div>
              </div>
            </div>
          </div>
        </div>

        {/* Weather Card */}
        <div className="bg-gradient-to-br from-[#3D4A2B]/5 to-[#5C6B47]/10 rounded-2xl p-6 border border-[#3D4A2B]/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3D4A2B] flex items-center justify-center">
                <Sun className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Väder</h3>
                <p className="text-sm text-gray-600">
                  {weatherLoading ? 'Laddar...' : weather ? weather.forecast : 'Ej tillgängligt'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {weatherLoading ? '--' : weather ? `${Math.round(weather.temperature)}°C` : '--°C'}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Droplets className="w-5 h-5 text-[#3D4A2B] mx-auto mb-1" />
              <div className="text-sm font-medium text-gray-900">
                {weatherLoading ? '--' : weather ? `${weather.humidity}%` : '--%'}
              </div>
              <div className="text-xs text-gray-500">Luftfuktighet</div>
            </div>
            <div>
              <Wind className="w-5 h-5 text-[#3D4A2B] mx-auto mb-1" />
              <div className="text-sm font-medium text-gray-900">
                {weatherLoading ? '--' : weather ? `${weather.windSpeed} m/s` : '-- m/s'}
              </div>
              <div className="text-xs text-gray-500">Vind</div>
            </div>
            <div>
              <Thermometer className="w-5 h-5 text-[#3D4A2B] mx-auto mb-1" />
              <div className="text-sm font-medium text-gray-900">Mild</div>
              <div className="text-xs text-gray-500">Temperatur</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Zap className="w-5 h-5 text-[#3D4A2B] mr-2" />
            Snabba åtgärder
          </h3>
          <div className="space-y-3">
            {metrics.nextActions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  if (action.includes('resurser')) router.push('/individual?section=resources');
                  else if (action.includes('odling')) router.push('/individual?section=cultivation');
                  else if (action.includes('samhälle')) router.push('/local');
                }}
                className="w-full p-4 rounded-xl border border-gray-200 hover:border-[#3D4A2B]/30 hover:bg-[#3D4A2B]/5 transition-all duration-200 text-left touch-manipulation active:scale-98"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {action}
                    </div>
                    <div className="text-sm text-gray-500">
                      {index === 0 ? 'Förbättra din beredskap' : 
                       index === 1 ? 'Planera för framtiden' : 
                       'Bygg lokalt nätverk'}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Navigation Cards */}
        <div className="space-y-4">
          {/* Mitt hem */}
          <button 
            onClick={() => router.push('/individual')}
            className="w-full group bg-gradient-to-br from-[#3D4A2B] to-[#5C6B47] rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 touch-manipulation active:scale-98"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold mb-2">Mitt hem</h3>
            <p className="text-white/90 text-sm leading-relaxed">
              Din personliga beredskap, resurser och odling
            </p>
          </button>

          {/* Lokalt */}
          <button 
            onClick={() => router.push('/local')}
            className="w-full group bg-gradient-to-br from-[#4A5239] to-[#707C5F] rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 touch-manipulation active:scale-98"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold mb-2">Lokalt</h3>
            <p className="text-white/90 text-sm leading-relaxed">
              Anslut till ditt närområde och bygg lokalt nätverk
            </p>
          </button>

          {/* Regionalt */}
          <button 
            onClick={() => router.push('/regional')}
            className="w-full group bg-gradient-to-br from-[#2A331E] to-[#3D4A2B] rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 touch-manipulation active:scale-98"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold mb-2">Regionalt</h3>
            <p className="text-white/90 text-sm leading-relaxed">
              Regional översikt och koordination
            </p>
          </button>
        </div>

      </div>
    </div>
  );
}