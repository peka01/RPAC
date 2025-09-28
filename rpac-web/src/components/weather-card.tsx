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
  Eye,
  Sunrise,
  Sunset
} from 'lucide-react';
import { WeatherService, WeatherData, WeatherForecast } from '@/lib/weather-service';
import { useUserProfile } from '@/lib/useUserProfile';
import type { User } from '@supabase/supabase-js';

interface WeatherCardProps {
  user: User | null;
}

export function WeatherCard({ user }: WeatherCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [extremeWeatherWarnings, setExtremeWeatherWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useUserProfile(user);

  useEffect(() => {
    const loadWeather = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Load current weather
        const weatherData = await WeatherService.getCurrentWeather(undefined, undefined, {
          county: profile?.county,
          city: profile?.city
        });
        setWeather(weatherData);
        
        // Load forecast data
        const forecastData = await WeatherService.getWeatherForecast(undefined, undefined, {
          county: profile?.county,
          city: profile?.city
        });
        setForecast(forecastData);
        
        // Generate extreme weather warnings
        const warnings = WeatherService.getExtremeWeatherWarnings(forecastData);
        setExtremeWeatherWarnings(warnings);
      } catch (error) {
        console.error('Error loading weather:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWeather();
  }, [user, profile?.county, profile?.city]);

  const getWeatherIcon = (forecast: string) => {
    const forecastLower = forecast.toLowerCase();
    if (forecastLower.includes('regn') || forecastLower.includes('regna')) {
      return CloudRain;
    } else if (forecastLower.includes('snö') || forecastLower.includes('snöa')) {
      return Snowflake;
    } else if (forecastLower.includes('klar') || forecastLower.includes('sol')) {
      return Sun;
    } else if (forecastLower.includes('moln')) {
      return Cloud;
    }
    return Cloud;
  };

  const getWeatherColor = (forecast: string) => {
    const forecastLower = forecast.toLowerCase();
    if (forecastLower.includes('klar') || forecastLower.includes('sol')) {
      return 'var(--color-crisis-orange)';
    } else if (forecastLower.includes('regn')) {
      return 'var(--color-crisis-blue)';
    } else if (forecastLower.includes('snö')) {
      return 'var(--color-crisis-grey)';
    }
    return 'var(--color-sage)';
  };

  const getTemperatureColor = (temp: number) => {
    if (temp < 0) return 'var(--color-crisis-blue)';
    if (temp < 10) return 'var(--color-crisis-grey)';
    if (temp < 20) return 'var(--color-sage)';
    if (temp < 30) return 'var(--color-crisis-orange)';
    return 'var(--color-crisis-red)';
  };

  if (loading) {
    return (
      <div className="group bg-white/95 rounded-lg p-4 border shadow-md" style={{ 
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--color-sage)'
      }}>
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ 
            background: 'linear-gradient(135deg, var(--color-sage) 0%, var(--color-quaternary) 100%)' 
          }}>
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <div className="text-right">
            <div className="text-xl font-bold" style={{ color: 'var(--color-sage)' }}>--°</div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Laddar...</div>
          </div>
        </div>
        <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Väder</h3>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Hämtar väderdata...</p>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="group bg-white/95 rounded-lg p-4 border shadow-md" style={{ 
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--color-sage)'
      }}>
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-sm" style={{ 
            background: 'linear-gradient(135deg, var(--color-sage) 0%, var(--color-quaternary) 100%)' 
          }}>
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <div className="text-right">
            <div className="text-xl font-bold" style={{ color: 'var(--color-sage)' }}>--°</div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Ej tillgängligt</div>
          </div>
        </div>
        <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Väder</h3>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Kunde inte ladda väderdata</p>
      </div>
    );
  }

  const WeatherIcon = getWeatherIcon(weather.forecast);
  const weatherColor = getWeatherColor(weather.forecast);
  const tempColor = getTemperatureColor(weather.temperature);

  const getWeatherIconForForecast = (weather: string) => {
    const weatherLower = weather.toLowerCase();
    if (weatherLower.includes('sol') || weatherLower.includes('klar')) return Sun;
    if (weatherLower.includes('regn')) return CloudRain;
    if (weatherLower.includes('snö')) return Snowflake;
    if (weatherLower.includes('moln')) return Cloud;
    return Sun;
  };

  const getDayAbbreviation = (date: Date) => {
    return date.toLocaleDateString('sv-SE', { weekday: 'short' }).substring(0, 3);
  };

  const getTemperatureBarColor = (temp: number) => {
    if (temp < 0) return '#3B82F6'; // Blue for cold
    if (temp < 10) return '#10B981'; // Green for cool
    if (temp < 20) return '#F59E0B'; // Orange for mild
    return '#EF4444'; // Red for hot
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border" style={{ 
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--color-quaternary)'
    }}>
      {/* Current Weather & Time */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ 
            backgroundColor: 'var(--color-sage)',
            opacity: 0.1
          }}>
            <WeatherIcon className="w-4 h-4" style={{ color: 'var(--color-sage)' }} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {weather.forecast}, {Math.round(weather.temperature)}°C
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {profile?.city || profile?.county || 'Din plats'}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {new Date().toLocaleDateString('sv-SE', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Extreme Weather Warnings */}
      {extremeWeatherWarnings.length > 0 && (
        <div className="mb-4 p-2 rounded" style={{ 
          backgroundColor: 'var(--color-crisis-red)', 
          color: 'white' 
        }}>
          <div className="text-xs font-bold mb-1">⚠️ Viktiga varningar:</div>
          {extremeWeatherWarnings.slice(0, 2).map((warning, index) => (
            <div key={index} className="text-xs">{warning}</div>
          ))}
          {extremeWeatherWarnings.length > 2 && (
            <div className="text-xs">+{extremeWeatherWarnings.length - 2} fler varningar</div>
          )}
        </div>
      )}
      
      {/* 5-Day Forecast */}
      {forecast.length > 0 && (
        <div className="space-y-1">
          {forecast.slice(0, 5).map((day, index) => {
            const date = new Date(day.date);
            const dayAbbr = getDayAbbreviation(date);
            const ForecastIcon = getWeatherIconForForecast(day.weather);
            const minTemp = Math.round(day.temperature.min);
            const maxTemp = Math.round(day.temperature.max);
            const currentTemp = Math.round(weather.temperature);
            const isToday = index === 0;
            
            return (
              <div key={index} className="flex items-center space-x-3 py-0.5">
                <div className="w-8 text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {dayAbbr}
                </div>
                <div className="w-6 h-6 flex items-center justify-center">
                  <ForecastIcon className="w-4 h-4" style={{ color: 'var(--color-sage)' }} />
                </div>
                <div className="w-8 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {minTemp}°
                </div>
                <div className="flex-1 relative">
                  <div className="h-2 rounded-full" style={{ 
                    backgroundColor: 'var(--color-quaternary)',
                    opacity: 0.3
                  }}>
                    <div 
                      className="h-2 rounded-full relative" 
                      style={{ 
                        backgroundColor: getTemperatureBarColor((minTemp + maxTemp) / 2),
                        width: `${Math.min(100, Math.max(20, ((maxTemp - minTemp) / 30) * 100))}%`,
                        left: `${Math.max(0, Math.min(80, ((minTemp + 10) / 40) * 100))}%`
                      }}
                    >
                      {isToday && (
                        <div 
                          className="absolute w-2 h-2 rounded-full border-2 border-white shadow-sm"
                          style={{ 
                            backgroundColor: 'var(--color-dark-green)',
                            left: `${Math.max(0, Math.min(100, ((currentTemp - minTemp) / (maxTemp - minTemp)) * 100))}%`,
                            top: '-2px'
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-8 text-xs text-right" style={{ color: 'var(--text-secondary)' }}>
                  {maxTemp}°
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
