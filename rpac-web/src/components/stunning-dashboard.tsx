'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/locales';
import { useWeather } from '@/contexts/WeatherContext';
import { WeatherBar } from '@/components/weather-bar';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { 
  Activity, 
  Leaf, 
  Package, 
  Users, 
  Sun, 
  CloudRain, 
  Cloud,
  Snowflake,
  Shield, 
  MapPin, 
  Globe, 
  ArrowRight,
  ChevronRight,
  Zap
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calculatePlanNutrition } from '@/lib/cultivation-plan-service';
import type { User } from '@supabase/supabase-js';

interface DashboardMetrics {
  cultivationProgress: number;
  msbFulfillmentPercent: number;
  communityConnections: number;
  planName: string | null;
  cropCount: number;
  expiringResources: number;
  unreadMessages: number;
  communityNames: string[];
  availableResources: number;
  totalResources: number;
}

interface StunningDashboardProps {
  user: User | null;
}

export default function StunningDashboard({ user }: StunningDashboardProps) {
  const router = useRouter();
  const { weather, forecast, loading: weatherLoading } = useWeather();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    cultivationProgress: 0,
    msbFulfillmentPercent: 0,
    communityConnections: 0,
    planName: null,
    cropCount: 0,
    expiringResources: 0,
    unreadMessages: 0,
    communityNames: [],
    availableResources: 0,
    totalResources: 0
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load user profile data
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [user]);

  // Get user display name based on profile preference
  const getUserDisplayName = () => {
    if (!user) return t('dashboard.default_user');
    if (!userProfile) return user.email?.split('@')[0] || t('dashboard.default_user');
    
    if (userProfile.name_preference === 'full_name') {
        if (userProfile.first_name && userProfile.last_name) {
          return `${userProfile.first_name} ${userProfile.last_name}`;
        }
        return userProfile.display_name || user.email?.split('@')[0] || t('dashboard.default_user');
    } else if (userProfile.name_preference === 'initials') {
        if (userProfile.first_name && userProfile.last_name) {
          return `${userProfile.first_name[0]}${userProfile.last_name[0]}`.toUpperCase();
      } else if (userProfile.display_name) {
          return userProfile.display_name.substring(0, 2).toUpperCase();
        }
        return user.email?.split('@')[0] || t('dashboard.default_user');
    } else {
        return userProfile.display_name || user.email?.split('@')[0] || t('dashboard.default_user');
    }
  };

  const userName = getUserDisplayName();

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      
      try {
        // Load user profile data
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        // Load user resources using the same service as other components
        let resources: any[] = [];
        try {
          // Import and use the same resourceService as other components
          const { resourceService } = await import('@/lib/supabase');
          resources = await resourceService.getResources(user.id);
        } catch (error) {
          console.warn('Could not load resources:', error);
          resources = [];
        }

        // Load cultivation data from main table
        let plan = null;
        
        // Try cultivation_plans first (same as individual-dashboard)
        try {
          const { data: planData, error: planError } = await supabase
            .from('cultivation_plans')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_primary', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (planError && planError.code !== 'PGRST116') {
          } else {
            plan = planData;
          }
        } catch (error) {
          console.warn('Cultivation plans table may not exist:', error);
        }
        
        // Load cultivation data from main cultivation_plans table only
        if (!plan) {
          try {
            const { data: planData } = await supabase
              .from('cultivation_plans')
              .select('*')
              .eq('user_id', user.id);
            plan = planData?.[0] || null;
          } catch (error) {
            console.warn('Error fetching cultivation plans:', error);
          }
        }

        // Load community memberships with names - use correct column name
        const { data: memberships, error: membershipError } = await supabase
          .from('community_memberships')
          .select(`
            community_id,
            local_communities!inner (
              community_name
            )
          `)
          .eq('user_id', user.id);

        if (membershipError) {
          console.error('Error fetching community memberships:', membershipError);
        }

        // Calculate metrics
        let cropCount = 0;
        let planName = null;
        
        if (plan) {
          // Handle cultivation_plans structure (has crops array)
          if (plan.crops && Array.isArray(plan.crops)) {
            cropCount = plan.crops.length;
            planName = plan.name || plan.plan_name || plan.title;

          }
          // Handle single crop name
          else if (plan.crop_name) {
            cropCount = 1;
            planName = plan.name || plan.plan_name;
          }
        }
        

        const communityNames = memberships?.map(m => m.local_communities?.[0]?.community_name).filter(Boolean) || [];
        
        // Calculate MSB fulfillment using the same logic as other components
        const msbCategories = ['food', 'water', 'medicine', 'energy', 'tools', 'other'];
        const msbResourcesAdded = resources.filter(r => r.is_msb_recommended && r.quantity > 0);
        const msbCategoriesWithResources = new Set(msbResourcesAdded.map(r => r.category));
        const msbFulfillmentPercent = Math.round((msbCategoriesWithResources.size / msbCategories.length) * 100);
        

        
        // Calculate expiring resources using the same logic as other components
        const expiringResources = resources.filter(r => 
          r.quantity > 0 && r.days_remaining < 30 && r.days_remaining < 99999
        ).length;
        
        // Calculate available resources from community resources (same logic as community page)
        let availableResources = 0;
        if (memberships && memberships.length > 0) {
          try {
            // Import resource sharing service
            const { resourceSharingService } = await import('@/lib/resource-sharing-service');
            
            // Get resources from all user's communities
            const communityResources = await Promise.all(
              memberships.map(membership => 
                resourceSharingService.getCommunityResources(membership.community_id)
              )
            );
            
            // Flatten and count available resources (status === 'available')
            const allCommunityResources = communityResources.flat();
            availableResources = allCommunityResources.filter(r => r.status === 'available').length;
          } catch (error) {
            console.warn('Could not load community resources:', error);
            availableResources = 0;
          }
        }
        
        // Calculate cultivation progress using dynamic calculation (same as individual dashboard)
        let cultivationProgress = 0;
        
        if (plan && plan.crops && Array.isArray(plan.crops)) {
          // Use the same calculation as individual dashboard
          const householdSize = profile?.family_size || 2;
          const targetDays = 30;
          
          const cultivationPlanForCalc = {
            id: plan.id,
            user_id: plan.user_id,
            plan_name: plan.title || plan.name || plan.plan_name,
            description: plan.description || '',
            crops: plan.crops,
            is_primary: plan.is_primary,
            created_at: plan.created_at,
            updated_at: plan.updated_at
          };
          
          const nutrition = calculatePlanNutrition(cultivationPlanForCalc, householdSize, targetDays);
          cultivationProgress = nutrition.percentOfTarget;

        } else if (plan) {
          // Fallback to stored value if no crops array
          cultivationProgress = plan.self_sufficiency_percent || 0;
        } else {
          // No cultivation data available
          cultivationProgress = 0;
        }
        


        // Load unread messages - make it optional to avoid errors
        let messages = [];
        try {
          const { data: messagesData } = await supabase
          .from('messages')
          .select('id')
            .eq('receiver_id', user.id)
          .eq('is_read', false);
          messages = messagesData || [];
        } catch (error) {
          console.warn('Messages table may not exist:', error);
          messages = [];
        }

         setMetrics({
           cultivationProgress,
          msbFulfillmentPercent,
          communityConnections: memberships?.length || 0,
          planName: planName,
          cropCount,
          expiringResources,
          availableResources,
          totalResources: resources.length,
           unreadMessages: messages?.length || 0,
          communityNames
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setMetrics({
          cultivationProgress: 0,
          msbFulfillmentPercent: 0,
          communityConnections: 0,
          planName: null,
          cropCount: 0,
          expiringResources: 0,
          availableResources: 0,
          totalResources: 0,
          unreadMessages: 0,
          communityNames: []
        });
      }
    };

    loadDashboardData();
  }, [user]);

    // Update time every minute
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  const getTimeOfDayGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return t('dashboard.good_night');
    if (hour < 12) return t('dashboard.good_morning');
    if (hour < 18) return t('dashboard.good_day');
    return t('dashboard.good_evening');
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <ShieldProgressSpinner size="xl" color="olive" message="Laddar ditt hem" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#2A331E]/5 via-[#3D4A2B]/3 to-[#4A5239]/8">
      <div className="max-w-7xl mx-auto px-6 pt-6 pb-12">
          {/* Welcome Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {getTimeOfDayGreeting()}, {userName}!
            </h1>
          </div>

          {/* Weather Bar */}
          <div className="mb-6">
            <WeatherBar />
          </div>

          {/* Key Metrics Grid - Enhanced with Section Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Activity className="w-6 h-6 text-[#3D4A2B]" />
              Översikt
            </h2>
          </div>

        {/* Score Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
             {/* Min odling - Cultivation Progress */}
             <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#3D4A2B]/30 hover:-translate-y-1">
               {/* Header - Improved spacing and alignment */}
               <div className="flex items-start justify-between mb-4">
                 <div className="flex items-center gap-3 flex-1 min-w-0">
                   <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5C6B47] to-[#707C5F] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md">
                     <Leaf className="w-6 h-6 text-white" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <h3 className="font-bold text-gray-900 text-base leading-tight mb-0.5 truncate">{metrics.planName || 'Min odling'}</h3>
                     <p className="text-xs text-gray-500 font-medium truncate">Självförsörjning</p>
                   </div>
                 </div>
                 <div className="text-right flex-shrink-0 ml-4">
                   <div className="text-3xl font-bold text-gray-900 mb-0.5">{metrics.cultivationProgress}%</div>
                   <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold whitespace-nowrap">Behov</div>
                 </div>
               </div>
               
               {/* Content - Improved readability */}
               <div className="mb-4">
                 <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                   {metrics.planName 
                     ? metrics.cropCount === 1 
                       ? '1 gröda i planen'
                       : `${metrics.cropCount} grödor i planen`
                     : 'Börja planera din odling'}
                 </p>
                 
                 {/* Enhanced progress bar with gradient */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#5C6B47] to-[#707C5F] rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${Math.min(100, metrics.cultivationProgress)}%` }}
                  >
                    {/* Shimmer effect */}
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                   </div>
                 </div>
               </div>
               
               {/* Action button - Enhanced styling */}
               <button 
              onClick={() => router.push(metrics.planName 
                  ? '/individual?section=cultivation&plan=current' 
                  : '/individual?section=cultivation'
              )}
                 className="w-full py-2.5 px-4 rounded-lg bg-[#3D4A2B]/5 hover:bg-[#3D4A2B]/10 border border-[#3D4A2B]/20 hover:border-[#3D4A2B]/40 text-sm text-[#3D4A2B] hover:text-[#2A331E] font-semibold flex items-center justify-center gap-2 transition-all duration-200"
               >
              <span>{metrics.planName ? 'Hantera aktuell plan' : 'Skapa plan'}</span>
                 <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
               </button>
             </div>

             {/* Mina resurser */}
             <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#3D4A2B]/30 hover:-translate-y-1">
            {/* Header */}
               <div className="flex items-start justify-between mb-4">
                 <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4A5239] to-[#707C5F] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <Package className="w-6 h-6 text-white" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <h3 className="font-bold text-gray-900 text-base leading-tight mb-0.5 truncate">Mina resurser</h3>
                  <p className="text-xs text-gray-500 font-medium truncate">MSB rekommendationer</p>
                   </div>
                 </div>
                 <div className="text-right flex-shrink-0 ml-4">
                   <div className="text-3xl font-bold text-gray-900 mb-0.5">{metrics.msbFulfillmentPercent}%</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold whitespace-nowrap">Uppfylld</div>
                 </div>
               </div>
               
            {/* Content */}
               <div className="mb-4">
                 <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                {metrics.totalResources === 1 
                  ? '1 resurs tillagd'
                  : `${metrics.totalResources} resurser tillagda`}
              </p>
              
              {/* Progress bar */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#4A5239] to-[#707C5F] rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${Math.min(100, metrics.msbFulfillmentPercent)}%` }}
                  >
                    {/* Shimmer effect */}
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                   </div>
                 </div>
               </div>
               
            {/* Action button */}
               <button 
              onClick={() => router.push('/individual')}
                 className="w-full py-2.5 px-4 rounded-lg bg-[#3D4A2B]/5 hover:bg-[#3D4A2B]/10 border border-[#3D4A2B]/20 hover:border-[#3D4A2B]/40 text-sm text-[#3D4A2B] hover:text-[#2A331E] font-semibold flex items-center justify-center gap-2 transition-all duration-200"
               >
                 <span>Hantera resurser</span>
                 <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
               </button>
             </div>

            {/* Community Connections */}
            <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-[#3D4A2B]/30 hover:-translate-y-1">
            {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#707C5F] to-[#4A5239] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-base leading-tight mb-0.5 truncate">Lokalt nätverk</h3>
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
                  <div className="text-3xl font-bold text-gray-900 mb-0.5">{metrics.communityConnections}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold whitespace-nowrap">Samhällen</div>
                </div>
              </div>
              
            {/* Content */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                {metrics.communityConnections === 0 
                  ? 'Anslut dig till lokala samhällen för bättre beredskap'
                  : metrics.availableResources === 1 
                    ? '1 gemensam resurs'
                    : `${metrics.availableResources} gemensamma resurser`}
              </p>
              
              {/* Progress bar */}
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#707C5F] to-[#4A5239] rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                    style={{ width: `${Math.min(100, (metrics.communityConnections / 3) * 100)}%` }}
                  >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                  </div>
                </div>
              </div>
              
            {/* Action button */}
              <button 
                onClick={() => router.push('/local')}
                className="w-full py-2.5 px-4 rounded-lg bg-[#4A5239]/5 hover:bg-[#4A5239]/10 border border-[#4A5239]/20 hover:border-[#4A5239]/40 text-sm text-[#4A5239] hover:text-[#2A331E] font-semibold flex items-center justify-center gap-2 transition-all duration-200"
              >
              <span>{metrics.communityConnections > 0 ? 'Gå till samhälle' : 'Hitta samhällen'}</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
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
            onClick={() => router.push('/local/discover')}
              className="group bg-gradient-to-br from-[#4A5239] to-[#707C5F] rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <MapPin className="w-8 h-8" />
                </div>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Lokalt</h3>
              <p className="text-white/90 mb-6 leading-relaxed">
              Upptäck lokala samhällen, dela resurser och koordinera med grannar för bättre beredskap.
              </p>
              <div className="flex items-center text-sm font-medium">
              <span>Utforska</span>
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
  );
}