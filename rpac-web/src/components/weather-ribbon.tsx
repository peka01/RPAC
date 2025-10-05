'use client';

import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Snowflake, 
  Wind, 
  Droplets, 
  Thermometer,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Clock,
  Calendar
} from 'lucide-react';
import { useWeather } from '@/contexts/WeatherContext';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

interface WeatherRibbonProps {
  user: User | null;
}

export function WeatherRibbon({ user }: WeatherRibbonProps) {
  const { weather, forecast, extremeWeatherWarnings, loading, nextWeatherChange } = useWeather();
  const [isExpanded, setIsExpanded] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const router = useRouter();

  // Auto-expand on critical warnings (only if there are warnings) - DISABLED for now
  // The auto-expand feature was causing issues with constant re-expanding
  // Can be re-enabled later with better state management
  /*
  useEffect(() => {
    if (extremeWeatherWarnings.length > 0 && !userInteracted && !isExpanded) {
      // Small delay before auto-expanding to avoid jarring initial page load
      const expandTimer = setTimeout(() => {
        setIsExpanded(true);
        // Auto-collapse after 10 seconds
        const collapseTimer = setTimeout(() => {
          if (!userInteracted) setIsExpanded(false);
        }, 10000);
        return () => clearTimeout(collapseTimer);
      }, 2000);
      return () => clearTimeout(expandTimer);
    }
  }, [extremeWeatherWarnings, userInteracted, isExpanded]);
  */

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    setUserInteracted(true);
  };

  const getWeatherIcon = (forecast: string, rainfall?: number) => {
    // Prioritize rainfall amount if provided
    if (rainfall !== undefined) {
      if (rainfall > 5) return CloudRain; // Heavy rain
      if (rainfall > 1) return CloudRain; // Light rain
    }
    
    const forecastLower = forecast?.toLowerCase() || '';
    if (forecastLower.includes('regn') || forecastLower.includes('regna') || forecastLower.includes('regnigt')) return CloudRain;
    if (forecastLower.includes('snö') || forecastLower.includes('snöa')) return Snowflake;
    if (forecastLower.includes('klar') || forecastLower.includes('sol')) return Sun;
    if (forecastLower.includes('moln')) return Cloud;
    return Cloud;
  };

  const getWeatherBackground = () => {
    if (!weather) return 'linear-gradient(135deg, #707C5F 0%, #5A6B4F 100%)';
    
    const forecastLower = weather.forecast?.toLowerCase() || '';
    const temp = weather.temperature;

    // Frost warning - cool olive with subtle depth
    if (temp < 0 || extremeWeatherWarnings.some(w => w.toLowerCase().includes('frost'))) {
      return 'linear-gradient(135deg, #5C6B47 0%, #4A5239 50%, #3D4A2B 100%)';
    }
    // Sunny - warm olive/khaki with golden tones
    if (forecastLower.includes('klar') || forecastLower.includes('sol')) {
      return 'linear-gradient(135deg, #8B864E 0%, #7A7540 50%, #6B5D3A 100%)';
    }
    // Rainy - muted sage/olive with depth
    if (forecastLower.includes('regn')) {
      return 'linear-gradient(135deg, #6B7F56 0%, #5C6B47 50%, #4A5239 100%)';
    }
    // Cloudy - muted olive gray with subtle transition (default)
    return 'linear-gradient(135deg, #707C5F 0%, #5A6B4F 50%, #4A5239 100%)';
  };

  const getDetailedWeatherInsight = () => {
    if (!weather || !forecast || forecast.length === 0) return null;
    
    const temp = weather.temperature;
    const forecastLower = weather.forecast?.toLowerCase() || '';
    const currentHour = new Date().getHours();
    const todayForecast = forecast[0];
    const tomorrowForecast = forecast[1];

    // Frost warning with timing
    if (temp < 2 || extremeWeatherWarnings.some(w => w.toLowerCase().includes('frost'))) {
      const frostTime = todayForecast?.minTempTime || (currentHour < 6 ? 'ikväll' : 'inatt');
      return `Frost ${frostTime} (${Math.round(todayForecast?.temperature.min || temp)}°C)`;
    }

    // Temperature change today
    if (todayForecast && Math.abs(todayForecast.temperature.max - temp) > 5) {
      if (todayForecast.temperature.max > temp) {
        return `Blir varmare (upp till ${Math.round(todayForecast.temperature.max)}°C)`;
      } else {
        return `Svalare senare (ner till ${Math.round(todayForecast.temperature.min)}°C)`;
      }
    }

    // Rain forecast with timing - ONLY if actual rainfall data confirms it
    if (todayForecast && todayForecast.rainfall > 1) {
      if (currentHour < 12) {
        return `Regn idag (${Math.round(todayForecast.rainfall)}mm) - ingen vattning behövs`;
      } else {
        return `Regn senare idag (${Math.round(todayForecast.rainfall)}mm)`;
      }
    }

    // Tomorrow's significant weather
    if (tomorrowForecast) {
      if (tomorrowForecast.temperature.min < 2) {
        return `Frost imorgon (${Math.round(tomorrowForecast.temperature.min)}°C)`;
      }
      if (tomorrowForecast.rainfall > 1) {
        return `Regn imorgon (${Math.round(tomorrowForecast.rainfall)}mm)`;
      }
      if (tomorrowForecast.temperature.max > 25) {
        return `Varmt imorgon (${Math.round(tomorrowForecast.temperature.max)}°C)`;
      }
    }

    // Perfect weather
    if (temp >= 10 && temp <= 20 && (!todayForecast || todayForecast.rainfall <= 1)) {
      return 'Perfekt väder för odling';
    }

    // Hot weather
    if (temp > 25) {
      return 'Varmt - extra vattning behövs';
    }

    // Default - show tomorrow's weather
    if (tomorrowForecast) {
      const tempDiff = tomorrowForecast.temperature.max - temp;
      if (Math.abs(tempDiff) > 3) {
        return tempDiff > 0 
          ? `Varmare imorgon (+${Math.round(tempDiff)}°C)`
          : `Svalare imorgon (${Math.round(tempDiff)}°C)`;
      }
    }

    return null;
  };

  const getCultivationImpact = () => {
    if (!weather || !forecast || forecast.length === 0) return null;
    
    const temp = weather.temperature;
    const todayForecast = forecast[0];
    const month = new Date().getMonth() + 1; // 1-12
    const isGrowingSeason = month >= 4 && month <= 9; // April-September
    const isAutumn = month >= 9 && month <= 11; // September-November
    const isWinter = month === 12 || month <= 2; // December-February
    const isEarlySpring = month >= 3 && month <= 4; // March-April

    // Frost warning (relevant all year)
    if (temp < 2 || extremeWeatherWarnings.some(w => w.toLowerCase().includes('frost'))) {
      if (isGrowingSeason || isAutumn) {
        return {
          icon: '🌱',
          message: 'Frost varning - skydda växter',
          severity: 'critical',
          action: 'Visa påverkade uppgifter'
        };
      }
    }

    // Rain - skip watering (only during growing season)
    if (todayForecast && todayForecast.rainfall > 1 && (isGrowingSeason || isAutumn)) {
      return {
        icon: '💧',
        message: 'Regn idag - ingen vattning behövs',
        severity: 'info',
        action: null
      };
    }

    // Hot weather - extra watering (only during growing season)
    if (temp > 25 && isGrowingSeason) {
      return {
        icon: '🌡️',
        message: 'Varmt väder - extra vattning behövs',
        severity: 'warning',
        action: 'Visa vattningsbehov'
      };
    }

    // Season-specific advice
    if (isEarlySpring && temp >= 10 && temp <= 20 && (!todayForecast || todayForecast.rainfall <= 1)) {
      return {
        icon: '🌱',
        message: 'Bra väder för försådd och förberedelser',
        severity: 'positive',
        action: 'Visa odlingsuppgifter'
      };
    }

    if (isGrowingSeason && temp >= 10 && temp <= 20 && (!todayForecast || todayForecast.rainfall <= 1)) {
      return {
        icon: '🌱',
        message: 'Perfekt väder för trädgårdsarbete',
        severity: 'positive',
        action: 'Visa odlingsuppgifter'
      };
    }

    if (isAutumn && temp >= 8 && temp <= 15 && (!todayForecast || todayForecast.rainfall <= 1)) {
      return {
        icon: '🍂',
        message: 'Bra väder för höstplantering och skörd',
        severity: 'positive',
        action: 'Visa odlingsuppgifter'
      };
    }

    if (isWinter && temp > 0 && (!todayForecast || todayForecast.rainfall <= 1)) {
      return {
        icon: '🌿',
        message: 'Milt väder - kontrollera vinterskydd',
        severity: 'info',
        action: null
      };
    }

    return null;
  };

  const getTemperatureColor = (temp: number) => {
    if (temp < 0) return '#3B82F6'; // Blue for cold
    if (temp < 10) return '#10B981'; // Green for cool
    if (temp < 20) return '#F59E0B'; // Orange for mild
    return '#EF4444'; // Red for hot
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('sv-SE', { weekday: 'long' });
  };

  if (loading) {
    return (
      <div className="w-full bg-gradient-to-r from-gray-400 to-gray-500 text-white px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Cloud className="w-5 h-5 animate-pulse" />
            <span className="text-sm font-medium">Laddar väder...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  const WeatherIcon = getWeatherIcon(weather.forecast);
  const cultivationImpact = getCultivationImpact();
  // Use the intelligent hourly forecast analysis first, fallback to daily forecast
  const detailedInsight = nextWeatherChange || getDetailedWeatherInsight();

  return (
    <div 
      className="w-full text-white shadow-md transition-all duration-300 relative overflow-hidden"
      style={{ 
        background: getWeatherBackground(),
        height: isExpanded ? 'auto' : '60px'
      }}
    >
      {/* Collapsed State */}
      <div 
        className="max-w-7xl mx-auto px-6 py-3 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          {/* Left: Current Weather + Detailed Insight Combined */}
          <div className="flex items-center space-x-4">
            <WeatherIcon className="w-5 h-5" />
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold">{Math.round(weather.temperature)}°C</span>
                <span className="text-sm font-medium hidden sm:inline">{weather.forecast}</span>
              </div>
              {detailedInsight && !isExpanded && (
                <>
                  <div className="hidden md:block w-px h-4 bg-white/30"></div>
                  <span className="text-sm font-medium hidden md:inline opacity-90">{detailedInsight}</span>
                </>
              )}
            </div>
          </div>

          {/* Warnings badge */}
          {extremeWeatherWarnings.length > 0 && !isExpanded && (
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/80 backdrop-blur-sm">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-semibold">{extremeWeatherWarnings.length} varningar</span>
            </div>
          )}

          {/* Right: Time & Mini Forecast */}
          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center space-x-3">
              {forecast.slice(0, 5).map((day, index) => {
                const DayIcon = getWeatherIcon(day.weather);
                return (
                  <div key={index} className="flex flex-col items-center opacity-70 hover:opacity-100 transition-opacity gap-1">
                    <DayIcon className="w-5 h-5" />
                    <span className="text-sm font-medium">{Math.round(day.temperature.max)}°</span>
                  </div>
                );
              })}
            </div>
            
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{getCurrentTime()}</div>
              <div className="text-xs opacity-80">{getCurrentDate()}</div>
            </div>

            {/* Expand/Collapse indicator */}
            <div className="ml-4">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded State */}
      {isExpanded && (
        <div 
          className="max-w-7xl mx-auto px-6 pb-4 space-y-4 animate-slideDown"
          onClick={handleToggle}
        >
          {/* Cultivation Impact */}
          {cultivationImpact && (
            <div className="bg-white/20 backdrop-blur-md rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{cultivationImpact.icon}</span>
                  <div>
                    <p className="font-semibold">{cultivationImpact.message}</p>
                    <p className="text-xs opacity-80">Baserat på dagens väder</p>
                  </div>
                </div>
                {cultivationImpact.action && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push('/individual?section=cultivation&subsection=calendar');
                    }}
                    className="px-4 py-2 bg-white/30 hover:bg-white/40 rounded-lg text-sm font-medium transition-colors"
                  >
                    {cultivationImpact.action} →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Extreme Weather Warnings */}
          {extremeWeatherWarnings.length > 0 && (
            <div className="bg-red-500/20 backdrop-blur-md rounded-lg p-4 border border-red-300/30">
              <div className="flex items-center space-x-2 mb-3">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">Viktiga vädervarningar</span>
              </div>
              <div className="space-y-2">
                {extremeWeatherWarnings.map((warning, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>{warning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5-Day Forecast */}
          <div className="grid grid-cols-5 gap-2">
            {forecast.slice(0, 5).map((day, index) => {
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString('sv-SE', { weekday: 'short' });
              // Pass rainfall amount to get accurate icon
              const DayIcon = getWeatherIcon(day.weather, day.rainfall);
              
              return (
                <div 
                  key={index}
                  className="bg-white/20 backdrop-blur-md rounded-lg p-3 text-center hover:bg-white/30 transition-colors"
                >
                  <div className="text-xs font-medium opacity-80 mb-2">{dayName}</div>
                  <DayIcon className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-semibold">
                    {Math.round(day.temperature.max)}° | {Math.round(day.temperature.min)}°
                  </div>
                  {/* Show rainfall and wind speed */}
                  <div className="text-xs opacity-70 mt-1">
                    {Math.round(day.rainfall)}mm | {Math.round(day.windSpeed)}m/s
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtle animation for frost warning */}
      {extremeWeatherWarnings.some(w => w.toLowerCase().includes('frost')) && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-blue-400/10 animate-pulse" />
        </div>
      )}
    </div>
  );
}

