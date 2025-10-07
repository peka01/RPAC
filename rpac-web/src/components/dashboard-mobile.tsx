'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Shield, 
  Users, 
  Leaf, 
  MessageCircle,
  CheckCircle,
  TrendingUp,
  Calendar,
  ArrowRight,
  Sprout,
  Home,
  Radio,
  Heart,
  ChevronRight,
  Cloud,
  Package,
  Sun,
  CloudRain,
  Thermometer,
  Droplets
} from 'lucide-react';
import { supabase, communityService, type LocalCommunity } from '@/lib/supabase';
import { useWeather } from '@/contexts/WeatherContext';
import type { User } from '@supabase/supabase-js';
import { calculatePlanNutrition } from '@/lib/cultivation-plan-service';

interface DashboardMobileProps {
  user: User | null;
}

export function DashboardMobile({ user }: DashboardMobileProps) {
  const router = useRouter();
  const { weather, loading: weatherLoading } = useWeather();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cultivationPlan, setCultivationPlan] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<LocalCommunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      try {
        // Load cultivation plan
        const { data: planData } = await supabase
          .from('cultivation_plans')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_primary', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (planData) {
          // Extract crops from the JSONB crops column
          const crops = planData.crops || [];
          const cropNames = crops.map((crop: { cropName?: string; name?: string; [key: string]: unknown }) => crop.cropName || crop.name || crop).filter(Boolean);
          
          // Use the exact same calculation as the cultivation plan service
          const householdSize = 2; // Default household size
          const targetDays = 30; // Default target days
          
          // Create a proper CultivationPlan object for calculatePlanNutrition
          const cultivationPlan = {
            id: planData.id,
            user_id: planData.user_id,
            plan_name: planData.title,
            description: planData.description,
            crops: crops,
            is_primary: planData.is_primary,
            created_at: planData.created_at,
            updated_at: planData.updated_at
          };
          
          // Use the exact same function as the cultivation plan service
          const nutrition = calculatePlanNutrition(cultivationPlan, householdSize, targetDays);
          
          setCultivationPlan({
            id: planData.id,
            title: planData.title,
            name: planData.title,
            description: planData.description || 'Din odlingsplan',
            self_sufficiency_percent: nutrition.percentOfTarget,
            selfSufficiencyPercent: nutrition.percentOfTarget,
            crops: cropNames,
            estimated_cost: 0, // Not available in this table
            created_at: planData.created_at,
            is_primary: planData.is_primary,
            plan_id: planData.plan_id
          });
        }

        // Load resources
        const { data: resourcesData } = await supabase
          .from('resources')
          .select('*')
          .eq('user_id', user.id);

        if (resourcesData) {
          setResources(resourcesData);
        }

        // Load joined communities
        const membershipIds = await communityService.getUserMemberships(user.id);
        if (membershipIds.length > 0) {
          const allCommunities = await communityService.getCommunities();
          const joined = allCommunities.filter(c => membershipIds.includes(c.id));
          setJoinedCommunities(joined);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, [user]);

  const getTimeOfDayGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return 'God natt';
    if (hour < 12) return 'God morgon';
    if (hour < 18) return 'God dag';
    return 'God kväll';
  };

  const getTimeEmoji = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return '🌙';
    if (hour < 12) return '☀️';
    if (hour < 18) return '🌤️';
    return '🌆';
  };

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Användare';


  const getWeatherIcon = () => {
    if (!weather) return Cloud;
    const forecastLower = weather.forecast?.toLowerCase() || '';
    if (forecastLower.includes('regn')) return CloudRain;
    if (forecastLower.includes('sol') || forecastLower.includes('klar')) return Sun;
    return Cloud;
  };

  const WeatherIcon = getWeatherIcon();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5C6B47]/10 to-[#707C5F]/10 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-[#3D4A2B] animate-pulse" />
          <p className="text-gray-600 font-medium">Laddar din kontrollpanel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5C6B47]/5 to-[#707C5F]/5 pb-32">
      {/* Hero Header with Beready Logo */}
      <div className="bg-gradient-to-br from-white to-gray-50 px-6 py-8 rounded-b-3xl shadow-2xl mb-6">
        {/* Beready Logo */}
        <div className="flex items-center justify-center mb-6">
          <Image
            src="/beready-logo2.png"
            alt="Beready"
            width={192}
            height={80}
            className="object-contain"
            priority
          />
        </div>

        {/* Weather Bar */}
        {weather && !weatherLoading && (
          <div className="bg-[#3D4A2B]/10 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-[#3D4A2B]/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#3D4A2B]/10 rounded-xl flex items-center justify-center">
                  <WeatherIcon size={24} className="text-[#3D4A2B]" strokeWidth={2} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Thermometer size={16} className="text-[#3D4A2B]" strokeWidth={2} />
                    <span className="text-xl font-bold text-gray-900">{weather.temperature}°C</span>
                  </div>
                  <p className="text-gray-600 text-sm">{weather.forecast || 'Okänt väder'}</p>
                </div>
              </div>
              {weather.humidity && (
                <div className="flex items-center gap-2 text-[#3D4A2B]">
                  <Droplets size={16} strokeWidth={2} />
                  <span className="text-sm font-medium">{weather.humidity}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Greeting */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{getTimeEmoji()}</div>
          <h2 className="text-base font-bold mb-1 text-gray-900 truncate px-2">{getTimeOfDayGreeting()}, {userName}</h2>
          <p className="text-gray-600 text-sm">
            {currentTime.toLocaleDateString('sv-SE', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>

        {/* Enhanced Quick Stats Grid */}
        <div className="grid grid-cols-1 gap-4">
          {/* Combined Resources Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-[#707C5F]/20 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#707C5F]/10 rounded-xl flex items-center justify-center">
                  <Package size={20} className="text-[#707C5F]" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-semibold text-sm">Resurser</h3>
                  <p className="text-gray-600 text-xs">Totalt registrerade</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#707C5F]">
                  {resources.length}
                </div>
              </div>
            </div>
            
            {/* MSB Progress Section */}
            <div className="bg-[#5C6B47]/10 rounded-xl p-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-[#5C6B47]" />
                  <span className="text-gray-900 text-sm font-medium">MSB-rekommenderade</span>
                </div>
                <span className="text-[#5C6B47] font-semibold text-sm">
                  {resources.filter(r => r.is_msb_recommended && r.quantity > 0).length}/{resources.filter(r => r.is_msb_recommended).length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#5C6B47] rounded-full h-2 transition-all duration-500" 
                  style={{ width: `${(resources.filter(r => r.is_msb_recommended && r.quantity > 0).length / resources.filter(r => r.is_msb_recommended).length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Cultivation Card */}
          {cultivationPlan && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-[#3D4A2B]/20 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#3D4A2B]/10 rounded-xl flex items-center justify-center">
                    <Sprout size={20} className="text-[#3D4A2B]" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-semibold text-sm">Odling</h3>
                    <p className="text-gray-600 text-xs">Hushållsbehov</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#3D4A2B]">
                    {cultivationPlan.selfSufficiencyPercent || 0}%
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#3D4A2B] rounded-full h-2 transition-all duration-500" 
                  style={{ width: `${Math.min(cultivationPlan.selfSufficiencyPercent || 0, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 mb-6">
        <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
          <Leaf size={20} className="text-[#3D4A2B]" strokeWidth={2.5} />
          Snabbåtgärder
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/individual')}
            className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98 text-left relative overflow-hidden"
          >
            {/* Subtle warm olive gradient for cultivation */}
            <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ background: 'var(--gradient-olive-warm)' }}></div>
            <div className="w-12 h-12 bg-[#3D4A2B]/10 rounded-xl flex items-center justify-center mb-3 relative z-10">
              <Home size={24} className="text-[#3D4A2B]" strokeWidth={2} />
            </div>
            <h4 className="font-bold text-gray-900 mb-1 relative z-10">Min Odling</h4>
            <p className="text-xs text-gray-600 relative z-10">Planera & följ upp</p>
          </button>

          <button
            onClick={() => router.push('/local')}
            className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98 text-left relative overflow-hidden"
          >
            {/* Subtle olive gradient for community */}
            <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ background: 'var(--gradient-olive-card)' }}></div>
            <div className="w-12 h-12 bg-[#5C6B47]/10 rounded-xl flex items-center justify-center mb-3 relative z-10">
              <Users size={24} className="text-[#5C6B47]" strokeWidth={2} />
            </div>
            <h4 className="font-bold text-gray-900 mb-1 relative z-10">Samhälle</h4>
            <p className="text-xs text-gray-600 relative z-10">Samarbeta lokalt</p>
          </button>

          <button
            onClick={() => router.push('/individual?section=cultivation&subsection=calendar')}
            className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98 text-left relative overflow-hidden"
          >
            {/* Subtle warm gradient for cultivation */}
            <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ background: 'var(--gradient-olive-warm)' }}></div>
            <div className="w-12 h-12 bg-[#707C5F]/10 rounded-xl flex items-center justify-center mb-3 relative z-10">
              <Calendar size={24} className="text-[#707C5F]" strokeWidth={2} />
            </div>
            <h4 className="font-bold text-gray-900 mb-1 relative z-10">Kalender</h4>
            <p className="text-xs text-gray-600 relative z-10">Odlingsuppgifter</p>
          </button>

          <button
            onClick={() => router.push('/individual?section=cultivation&subsection=reminders')}
            className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98 text-left relative overflow-hidden"
          >
            {/* Subtle standard gradient */}
            <div className="absolute inset-0 opacity-50 pointer-events-none" style={{ background: 'var(--gradient-olive-subtle)' }}></div>
            <div className="w-12 h-12 bg-[#4A5239]/10 rounded-xl flex items-center justify-center mb-3 relative z-10">
              <CheckCircle size={24} className="text-[#4A5239]" strokeWidth={2} />
            </div>
            <h4 className="font-bold text-gray-900 mb-1 relative z-10">Påminnelser</h4>
            <p className="text-xs text-gray-600 relative z-10">Kommande uppgifter</p>
          </button>
        </div>
      </div>

      {/* Preparedness Overview */}

      {/* Resources Summary */}
      {resources.length > 0 && (
        <div className="px-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
            {/* Subtle warm gradient for resources theme */}
            <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: 'var(--gradient-olive-warm)' }}></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#5C6B47] to-[#707C5F] rounded-xl flex items-center justify-center">
                  <Heart size={20} className="text-white" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Resurser</h3>
                  <p className="text-xs text-gray-600">{resources.length} registrerade</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#5C6B47]">{resources.filter(r => r.quantity > 0).length}</div>
                <div className="text-xs text-gray-600">Tillgängliga</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4 relative z-10">
              <div className="bg-[#5C6B47]/10 rounded-lg p-2 text-center">
                <div className="text-sm font-bold text-[#5C6B47]">{resources.filter(r => r.is_msb_recommended).length}</div>
                <div className="text-xs text-gray-600">MSB</div>
              </div>
              <div className="bg-[#707C5F]/10 rounded-lg p-2 text-center">
                <div className="text-sm font-bold text-[#707C5F]">{resources.filter(r => r.msb_priority === 'high').length}</div>
                <div className="text-xs text-gray-600">Hög prioritet</div>
              </div>
            </div>

            <button 
              onClick={() => router.push('/individual?section=resources')}
              className="w-full py-3 px-4 bg-[#5C6B47]/10 text-[#5C6B47] font-bold rounded-xl hover:bg-[#5C6B47]/20 transition-all touch-manipulation active:scale-98 flex items-center justify-center gap-2 relative z-10"
            >
              <Heart size={18} strokeWidth={2.5} />
              Hantera resurser
            </button>
          </div>
        </div>
      )}

      {/* Communities */}
      <div className="px-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
          {/* Subtle gradient for community theme */}
          <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: 'var(--gradient-olive-card)' }}></div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#707C5F] to-[#4A5239] rounded-xl flex items-center justify-center">
                <Users size={24} className="text-white" strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Samhällen</h3>
                <p className="text-sm text-gray-600">Ditt nätverk</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-[#707C5F]">{joinedCommunities.length}</div>
            </div>
          </div>

          {joinedCommunities.length > 0 ? (
            <div className="space-y-2 mb-4 relative z-10">
              {joinedCommunities.slice(0, 3).map((community) => (
                <div key={community.id} className="flex items-center justify-between p-3 bg-[#707C5F]/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#707C5F]/10 rounded-lg flex items-center justify-center">
                      <Users size={16} className="text-[#707C5F]" strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">{community.community_name}</h4>
                      <p className="text-xs text-gray-600">{community.location}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" strokeWidth={2} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 mb-4 relative z-10">
              <p className="text-gray-600 text-sm mb-3">Du har inte gått med i några samhällen än</p>
            </div>
          )}

          <button 
            onClick={() => router.push('/local')}
            className="w-full py-3 px-4 bg-[#707C5F]/10 text-[#707C5F] font-bold rounded-xl hover:bg-[#707C5F]/20 transition-all touch-manipulation active:scale-98 flex items-center justify-center gap-2 relative z-10"
          >
            <Users size={18} strokeWidth={2.5} />
            {joinedCommunities.length > 0 ? 'Hantera samhällen' : 'Hitta samhällen'}
          </button>
        </div>
      </div>

      {/* Cultivation Plan */}
      {cultivationPlan && (
        <div className="px-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
            {/* Subtle gradient for cultivation theme */}
            <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: 'var(--gradient-olive-warm)' }}></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#707C5F] to-[#4A5239] rounded-lg flex items-center justify-center">
                  <Sprout size={20} className="text-white" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Odlingsplan</h3>
                  <p className="text-sm text-gray-600">{cultivationPlan.title || 'Din aktiva plan'}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#707C5F]">
                  {cultivationPlan.selfSufficiencyPercent || 0}%
                </div>
                <div className="text-xs text-gray-600">Hushållsbehov</div>
              </div>
            </div>

            {cultivationPlan.crops && cultivationPlan.crops.length > 0 && (
              <div className="mb-4 relative z-10">
                <div className="flex flex-wrap gap-1.5">
                  {cultivationPlan.crops.slice(0, 3).map((crop: { name?: string; [key: string]: unknown }, index: number) => (
                    <span key={index} className="px-2 py-1 bg-[#707C5F]/10 text-[#707C5F] text-xs rounded-md">
                      {typeof crop === 'string' ? crop : crop.name || 'Okänd gröda'}
                    </span>
                  ))}
                  {cultivationPlan.crops.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                      +{cultivationPlan.crops.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}

            <button 
              onClick={() => router.push('/individual?section=cultivation')}
              className="w-full py-3 px-4 bg-[#707C5F]/10 text-[#707C5F] font-bold rounded-xl hover:bg-[#707C5F]/20 transition-all touch-manipulation active:scale-98 flex items-center justify-center gap-2 relative z-10"
            >
              <Sprout size={18} strokeWidth={2.5} />
              Visa odlingsplan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

