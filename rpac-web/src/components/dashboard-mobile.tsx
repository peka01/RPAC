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
  Sun,
  CloudRain,
  Thermometer,
  Droplets
} from 'lucide-react';
import { supabase, communityService, type LocalCommunity } from '@/lib/supabase';
import { useWeather } from '@/contexts/WeatherContext';
import type { User } from '@supabase/supabase-js';

interface DashboardMobileProps {
  user: User | null;
}

export function DashboardMobile({ user }: DashboardMobileProps) {
  const router = useRouter();
  const { weather, loading: weatherLoading } = useWeather();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cultivationProgress, setCultivationProgress] = useState<{completed: number; total: number; percentage: number}>({
    completed: 0,
    total: 0,
    percentage: 0
  });
  const [joinedCommunities, setJoinedCommunities] = useState<LocalCommunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      try {
        // Load cultivation progress
        const { data: calendarData } = await supabase
          .from('cultivation_calendar')
          .select('is_completed')
          .eq('user_id', user.id);

        if (calendarData) {
          const total = calendarData.length;
          const completed = calendarData.filter(item => item.is_completed).length;
          const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
          setCultivationProgress({ completed, total, percentage });
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

  const preparednesScore = 92; // Mock score - replace with actual data

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
          <h2 className="text-xl font-bold mb-1 text-gray-900">{getTimeOfDayGreeting()}, {userName}</h2>
          <p className="text-gray-600 text-sm">
            {currentTime.toLocaleDateString('sv-SE', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold mb-1 text-green-700">{preparednesScore}%</div>
            <div className="text-green-600 text-xs font-medium">Beredskap</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold mb-1 text-blue-700">{joinedCommunities.length}</div>
            <div className="text-blue-600 text-xs font-medium">Samhällen</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold mb-1 text-amber-700">{cultivationProgress.percentage}%</div>
            <div className="text-amber-600 text-xs font-medium">Odling</div>
          </div>
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
            className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98 text-left"
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3">
              <Home size={24} className="text-green-600" strokeWidth={2} />
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Min Odling</h4>
            <p className="text-xs text-gray-600">Planera & följ upp</p>
          </button>

          <button
            onClick={() => router.push('/local')}
            className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98 text-left"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
              <Users size={24} className="text-blue-600" strokeWidth={2} />
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Samhälle</h4>
            <p className="text-xs text-gray-600">Samarbeta lokalt</p>
          </button>

          <button
            onClick={() => router.push('/individual?section=cultivation&subsection=calendar')}
            className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98 text-left"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
              <Calendar size={24} className="text-amber-600" strokeWidth={2} />
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Kalender</h4>
            <p className="text-xs text-gray-600">Odlingsuppgifter</p>
          </button>

          <button
            onClick={() => router.push('/individual?section=cultivation&subsection=reminders')}
            className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98 text-left"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
              <CheckCircle size={24} className="text-purple-600" strokeWidth={2} />
            </div>
            <h4 className="font-bold text-gray-900 mb-1">Påminnelser</h4>
            <p className="text-xs text-gray-600">Kommande uppgifter</p>
          </button>
        </div>
      </div>

      {/* Preparedness Overview */}
      <div className="px-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Shield size={24} className="text-white" strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Beredskap</h3>
                <p className="text-sm text-gray-600">Operativ status</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">{preparednesScore}%</div>
              <div className="text-xs text-gray-600">Optimal</div>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
              style={{ width: `${preparednesScore}%` }}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" strokeWidth={2.5} />
              <span className="text-sm text-gray-700">Alla system operativa</span>
            </div>
            <button 
              onClick={() => router.push('/individual')}
              className="text-sm font-bold text-green-600 flex items-center gap-1"
            >
              Detaljer
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Cultivation Progress */}
      {cultivationProgress.total > 0 && (
        <div className="px-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                  <Sprout size={24} className="text-white" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Odlingsframsteg</h3>
                  <p className="text-sm text-gray-600">{cultivationProgress.completed}/{cultivationProgress.total} uppgifter</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">{cultivationProgress.percentage}%</div>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                style={{ width: `${cultivationProgress.percentage}%` }}
              />
            </div>

            <button 
              onClick={() => router.push('/individual?section=cultivation&subsection=calendar')}
              className="w-full py-3 px-4 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-100 transition-all touch-manipulation active:scale-98 flex items-center justify-center gap-2"
            >
              <Calendar size={18} strokeWidth={2.5} />
              Visa kalender
            </button>
          </div>
        </div>
      )}

      {/* Communities */}
      <div className="px-6 mb-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <Users size={24} className="text-white" strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Samhällen</h3>
                <p className="text-sm text-gray-600">Ditt nätverk</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{joinedCommunities.length}</div>
            </div>
          </div>

          {joinedCommunities.length > 0 ? (
            <div className="space-y-2 mb-4">
              {joinedCommunities.slice(0, 3).map((community) => (
                <div key={community.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users size={16} className="text-blue-600" strokeWidth={2} />
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
            <div className="text-center py-4 mb-4">
              <p className="text-gray-600 text-sm mb-3">Du har inte gått med i några samhällen än</p>
            </div>
          )}

          <button 
            onClick={() => router.push('/local')}
            className="w-full py-3 px-4 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition-all touch-manipulation active:scale-98 flex items-center justify-center gap-2"
          >
            <Users size={18} strokeWidth={2.5} />
            {joinedCommunities.length > 0 ? 'Hantera samhällen' : 'Hitta samhällen'}
          </button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="px-6">
        <h3 className="font-bold text-lg text-gray-900 mb-4">Fler funktioner</h3>
        <div className="space-y-3">
          <button
            onClick={() => router.push('/individual?section=resources')}
            className="w-full bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98 text-left flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Heart size={24} className="text-purple-600" strokeWidth={2} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Resursinventering</h4>
                <p className="text-sm text-gray-600">Hantera dina resurser</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-gray-400" strokeWidth={2} />
          </button>

          <button
            onClick={() => router.push('/regional')}
            className="w-full bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all touch-manipulation active:scale-98 text-left flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Radio size={24} className="text-orange-600" strokeWidth={2} />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Regional samordning</h4>
                <p className="text-sm text-gray-600">Större perspektiv</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-gray-400" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

