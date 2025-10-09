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
  Cloud,
  CloudRain,
  Snowflake,
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
  Sparkles
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


export function StunningDashboard({ user }: { user: User | null }) {
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
        
        console.log('📊 MSB Fulfillment Calculation (Desktop):', {
          totalResources: resources?.length || 0,
          msbRecommended: resources?.filter(r => r.is_msb_recommended).length || 0,
          msbWithQuantity: msbResourcesAdded.length,
          categoriesCovered: Array.from(msbCategoriesWithResources),
          fulfillmentPercent: msbFulfillmentPercent,
          resourceDetails: msbResourcesAdded.map(r => ({ name: r.name, category: r.category, quantity: r.quantity, is_msb: r.is_msb_recommended }))
        });
        
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
            const householdSize = profile?.household_size || 2; // Use actual household size, default to 2
            console.log('🏠 Dashboard household size:', {
              profileHouseholdSize: profile?.household_size,
              usedHouseholdSize: householdSize,
              cropsCount: cultivationPlans.crops.length
            });
            const nutrition = calculatePlanNutrition(cultivationPlans, householdSize, 30);
            console.log('📊 Dashboard nutrition calculation:', {
              totalKcal: nutrition.totalKcal,
              kcalPerDay: nutrition.kcalPerDay,
              targetKcalPerDay: nutrition.targetKcalPerDay,
              percentOfTarget: nutrition.percentOfTarget,
              householdSize
            });
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
    <div className="min-h-screen bg-gradient-to-br from-[#2A331E]/5 via-[#3D4A2B]/3 to-[#4A5239]/8">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#3D4A2B]/5 via-[#5C6B47]/5 to-[#707C5F]/5"></div>
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#3D4A2B]/5 to-transparent"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-12">

          {/* Welcome Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {getTimeOfDayGreeting()}, {userName}!
            </h1>
          </div>

          {/* Key Metrics Grid - Enhanced with Section Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Activity className="w-6 h-6 text-[#3D4A2B]" />
              Översikt
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
             {/* Min odling - Cultivation Progress */}
             <div className="group bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-[#3D4A2B]/30">
               {/* Header with icon and metric */}
               <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5C6B47] to-[#707C5F] flex items-center justify-center flex-shrink-0">
                     <Leaf className="w-5 h-5 text-white" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <h3 className="font-semibold text-gray-900 text-sm leading-tight">{metrics.planName || 'Min odling'}</h3>
                     <p className="text-xs text-gray-500">Självförsörjning</p>
                   </div>
                 </div>
                 <div className="text-right flex-shrink-0 ml-3">
                   <div className="text-xl font-bold text-gray-900">{metrics.cultivationProgress}%</div>
                   <div className="text-xs text-gray-500">av behov</div>
                 </div>
               </div>
               
               {/* Content section */}
               <div className="mb-3">
                 <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                   {metrics.planName 
                     ? `${metrics.cropCount} grödor i planen`
                     : 'Börja planera din odling'}
                 </p>
                 
                 {/* Progress bar */}
                 <div className="w-full bg-gray-200 rounded-full h-1.5">
                   <div
                     className="h-1.5 rounded-full transition-all duration-500"
                     style={{ 
                       backgroundColor: metrics.cultivationProgress >= 80 ? '#10B981' : metrics.cultivationProgress >= 60 ? '#3D4A2B' : metrics.cultivationProgress >= 40 ? '#F59E0B' : '#EF4444',
                       width: `${Math.min(100, metrics.cultivationProgress)}%`
                     }}
                   />
                 </div>
               </div>
               
               {/* Action button */}
               <button 
                 onClick={() => router.push('/individual?section=cultivation')}
                 className="text-xs text-[#3D4A2B] hover:text-[#2A331E] font-medium flex items-center"
               >
                 <span>Hantera odling</span>
                 <ChevronRight className="w-3 h-3 ml-1" />
               </button>
             </div>

             {/* Mina resurser */}
             <div className="group bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-[#3D4A2B]/30">
               {/* Header with icon and metric */}
               <div className="flex items-center justify-between mb-3">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3D4A2B] to-[#5C6B47] flex items-center justify-center flex-shrink-0">
                     <Shield className="w-5 h-5 text-white" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <h3 className="font-semibold text-gray-900 text-sm leading-tight">Mina resurser</h3>
                     <p className="text-xs text-gray-500">MSB-beredskap</p>
                   </div>
                 </div>
                 <div className="text-right flex-shrink-0 ml-3">
                   <div className="text-xl font-bold text-gray-900">{metrics.msbFulfillmentPercent}%</div>
                   <div className="text-xs text-gray-500">MSB %</div>
                 </div>
               </div>
               
               {/* Content section */}
               <div className="mb-3">
                 <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                   {metrics.resourceCount} resurser tillagda{metrics.expiringResources > 0 ? `, ${metrics.expiringResources} förfallna` : ''}
                 </p>
                 
                 {/* Progress bar */}
                 <div className="w-full bg-gray-200 rounded-full h-1.5">
                   <div
                     className="h-1.5 rounded-full transition-all duration-500"
                     style={{ 
                       backgroundColor: metrics.msbFulfillmentPercent >= 80 ? '#10B981' : metrics.msbFulfillmentPercent >= 60 ? '#3D4A2B' : metrics.msbFulfillmentPercent >= 40 ? '#F59E0B' : '#EF4444',
                       width: `${Math.min(100, metrics.msbFulfillmentPercent)}%`
                     }}
                   />
                 </div>
               </div>
               
               {/* Action button */}
               <button 
                 onClick={() => router.push('/individual?section=resources')}
                 className="text-xs text-[#3D4A2B] hover:text-[#2A331E] font-medium flex items-center"
               >
                 <span>Hantera resurser</span>
                 <ChevronRight className="w-3 h-3 ml-1" />
               </button>
             </div>

            {/* Community Connections */}
            <div className="group bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-[#3D4A2B]/30">
              {/* Header with icon and metric */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A5239] to-[#707C5F] flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">Lokalt nätverk</h3>
                    <p className="text-xs text-gray-500">Samhällsanslutning</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="text-xl font-bold text-gray-900">{metrics.communityConnections}</div>
                  <div className="text-xs text-gray-500">samhällen</div>
                </div>
              </div>
              
              {/* Content section */}
              <div className="mb-3">
                <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                  {metrics.communityConnections > 0 
                    ? 'Ansluten till lokala samhällen' 
                    : 'Gå med i ditt närområde'}
                </p>
                
                {/* Status indicator */}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${metrics.communityConnections > 0 ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                  <span className="text-xs text-gray-500">
                    {metrics.communityConnections > 0 ? 'Aktiv anslutning' : 'Behöver anslutning'}
                  </span>
                </div>
              </div>
              
              {/* Action button */}
              <button 
                onClick={() => router.push('/local')}
                className="text-xs text-[#3D4A2B] hover:text-[#2A331E] font-medium flex items-center"
              >
                <span>{metrics.communityConnections > 0 ? 'Hantera' : 'Hitta samhällen'}</span>
                <ChevronRight className="w-3 h-3 ml-1" />
              </button>
            </div>

            {/* Meddelanden */}
            <div className="group bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-100 hover:border-[#3D4A2B]/30">
              {/* Header with icon and metric */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A5239] to-[#707C5F] flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">Meddelanden</h3>
                    <p className="text-xs text-gray-500">Kommunikation</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="text-xl font-bold text-gray-900">{metrics.unreadMessages}</div>
                  <div className="text-xs text-gray-500">olästa</div>
                </div>
              </div>
              
              {/* Content section */}
              <div className="mb-3">
                <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                  {metrics.unreadMessages > 0 
                    ? `Du har ${metrics.unreadMessages} olästa meddelanden` 
                    : 'Inga nya meddelanden'}
                </p>
                
                {/* Status indicator */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${metrics.unreadMessages > 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <span className="text-xs text-gray-500">
                    {metrics.unreadMessages > 0 ? 'Nya meddelanden' : 'Alla lästa'}
                  </span>
                </div>
                
                {/* Separate message type buttons */}
                <div className="space-y-2">
                  <button 
                    onClick={() => router.push('/local')}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-[#3D4A2B]/5 hover:bg-[#3D4A2B]/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#3D4A2B]" />
                      <span className="text-xs font-medium text-gray-900">Samhälle</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {metrics.unreadMessages > 0 && (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/local/messages')}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-[#3D4A2B]/5 hover:bg-[#3D4A2B]/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-[#3D4A2B]" />
                      <span className="text-xs font-medium text-gray-900">Privat</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {metrics.unreadMessages > 0 && (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Weather & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            {/* Weather Card */}
            <div className="bg-gradient-to-br from-[#3D4A2B]/5 to-[#5C6B47]/10 rounded-2xl p-6 border border-[#3D4A2B]/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#3D4A2B] flex items-center justify-center">
                    {(() => {
                      if (weatherLoading || !weather) {
                        return <Sun className="w-5 h-5 text-white" />;
                      }
                      
                      // Get appropriate weather icon based on current conditions
                      const getCurrentWeatherIcon = (forecast: string) => {
                        const forecastLower = forecast.toLowerCase();
                        if (forecastLower.includes('sol') || forecastLower.includes('klar') || forecastLower.includes('sunny')) {
                          return <Sun className="w-5 h-5 text-white" />;
                        } else if (forecastLower.includes('regn') || forecastLower.includes('rain')) {
                          return <CloudRain className="w-5 h-5 text-white" />;
                        } else if (forecastLower.includes('snö') || forecastLower.includes('snow')) {
                          return <Snowflake className="w-5 h-5 text-white" />;
                        } else if (forecastLower.includes('moln') || forecastLower.includes('cloud')) {
                          return <Cloud className="w-5 h-5 text-white" />;
                        }
                        return <Sun className="w-5 h-5 text-white" />; // Default fallback
                      };
                      
                      return getCurrentWeatherIcon(weather.forecast);
                    })()}
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
              
              {/* 5-Day Forecast */}
              {forecast && forecast.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#3D4A2B]/20">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">5-dagars prognos</h4>
                  <div className="space-y-2">
                    {forecast.slice(0, 5).map((day, index) => {
                      const date = new Date(day.date);
                      const dayName = date.toLocaleDateString('sv-SE', { weekday: 'short' });
                      const isToday = index === 0;
                      
                      // Get appropriate weather icon based on forecast
                      const getWeatherIcon = (weather: string) => {
                        const weatherLower = weather.toLowerCase();
                        if (weatherLower.includes('sol') || weatherLower.includes('klar') || weatherLower.includes('sunny')) {
                          return Sun;
                        } else if (weatherLower.includes('regn') || weatherLower.includes('rain')) {
                          return CloudRain;
                        } else if (weatherLower.includes('snö') || weatherLower.includes('snow')) {
                          return Snowflake;
                        } else if (weatherLower.includes('moln') || weatherLower.includes('cloud')) {
                          return Cloud;
                        }
                        return Sun; // Default fallback
                      };
                      
                      const WeatherIcon = getWeatherIcon(day.weather);
                      
                      return (
                        <div key={index} className="flex items-center justify-between py-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 text-xs font-medium text-gray-600">
                              {isToday ? 'Idag' : dayName}
                            </div>
                            <div className="w-6 h-6 flex items-center justify-center">
                              <WeatherIcon className="w-4 h-4 text-[#3D4A2B]" />
                            </div>
                            <div className="text-xs text-gray-500">
                              {day.weather}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-xs text-gray-500">
                              {Math.round(day.temperature.min)}°
                            </div>
                            <div className="w-8 h-1 bg-gray-200 rounded-full">
                              <div 
                                className="h-1 bg-[#3D4A2B] rounded-full"
                                style={{ 
                                  width: `${Math.min(100, Math.max(20, ((day.temperature.max - day.temperature.min) / 20) * 100))}%` 
                                }}
                              />
                            </div>
                            <div className="text-xs font-medium text-gray-900">
                              {Math.round(day.temperature.max)}°
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 text-[#3D4A2B] mr-2" />
                Snabba åtgärder
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {metrics.nextActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (action.includes('resurser')) router.push('/individual?section=resources');
                      else if (action.includes('odling')) router.push('/individual?section=cultivation');
                      else if (action.includes('samhälle')) router.push('/local');
                    }}
                    className="group p-4 rounded-xl border border-gray-200 hover:border-[#3D4A2B]/30 hover:bg-[#3D4A2B]/5 transition-all duration-200 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 group-hover:text-[#3D4A2B]">
                          {action}
                        </div>
                        <div className="text-sm text-gray-500">
                          {index === 0 ? 'Förbättra din beredskap' : 
                           index === 1 ? 'Planera för framtiden' : 
                           'Bygg lokalt nätverk'}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#3D4A2B] group-hover:translate-x-1 transition-all" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mitt hem */}
            <button 
              onClick={() => router.push('/individual')}
              className="group bg-gradient-to-br from-[#3D4A2B] to-[#5C6B47] rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Shield className="w-8 h-8" />
                </div>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Mitt hem</h3>
              <p className="text-white/90 mb-6 leading-relaxed">
                Din personliga beredskap, resurser och odling. Här håller du koll på allt som rör ditt hem.
              </p>
              <div className="flex items-center text-sm font-medium">
                <span>Kom igång</span>
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Lokalt */}
            <button 
              onClick={() => router.push('/local')}
              className="group bg-gradient-to-br from-[#4A5239] to-[#707C5F] rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Users className="w-8 h-8" />
                </div>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Lokalt</h3>
              <p className="text-white/90 mb-6 leading-relaxed">
                Anslut till ditt närområde. Dela resurser, kommunicera och bygg ett starkt lokalt nätverk.
              </p>
              <div className="flex items-center text-sm font-medium">
                <span>Upptäck samhällen</span>
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Regionalt */}
            <button 
              onClick={() => router.push('/regional')}
              className="group bg-gradient-to-br from-[#2A331E] to-[#3D4A2B] rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Globe className="w-8 h-8" />
                </div>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Regionalt</h3>
              <p className="text-white/90 mb-6 leading-relaxed">
                Regional översikt och koordination. Se hur din region är förberedd för kriser.
              </p>
              <div className="flex items-center text-sm font-medium">
                <span>Se översikt</span>
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}