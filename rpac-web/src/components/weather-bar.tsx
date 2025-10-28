'use client';

import { useState, useEffect } from 'react';
import { 
  Sun, 
  CloudRain, 
  Cloud, 
  Snowflake, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  MapPin,
  Thermometer,
  Wind,
  Droplets,
  Eye
} from 'lucide-react';
import { useWeather } from '@/contexts/WeatherContext';

interface WeatherBarProps {
  className?: string;
}

export function WeatherBar({ className = '' }: WeatherBarProps) {
  const { weather, forecast, extremeWeatherWarnings, loading } = useWeather();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Get appropriate weather icon
  const getWeatherIcon = (forecastText: string) => {
    const forecastLower = forecastText.toLowerCase();
    if (forecastLower.includes('sol') || forecastLower.includes('klar') || forecastLower.includes('sunny')) {
      return <Sun className="w-5 h-5" />;
    } else if (forecastLower.includes('regn') || forecastLower.includes('rain')) {
      return <CloudRain className="w-5 h-5" />;
    } else if (forecastLower.includes('moln') || forecastLower.includes('cloud')) {
      return <Cloud className="w-5 h-5" />;
    } else if (forecastLower.includes('snö') || forecastLower.includes('snow')) {
      return <Snowflake className="w-5 h-5" />;
    }
    return <Sun className="w-5 h-5" />;
  };

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get location display name
  const getLocationName = () => {
    // This would ideally come from user profile, but for now we'll use a default
    return 'Stockholm';
  };

  if (loading) {
    return (
      <div className={`bg-gradient-to-r from-[#3D4A2B]/10 to-[#5C6B47]/10 border border-[#3D4A2B]/20 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#3D4A2B]/20 flex items-center justify-center">
              <Sun className="w-4 h-4 text-[#3D4A2B]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-700">Laddar väderdata...</div>
              <div className="text-xs text-gray-500">Hämtar från SMHI</div>
            </div>
          </div>
          <div className="text-sm text-gray-500">{formatTime(currentTime)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-[#3D4A2B]/10 to-[#5C6B47]/10 border border-[#3D4A2B]/20 rounded-lg overflow-hidden transition-all duration-300 ${className}`}>
      {/* Weather Warnings - Show prominently if any */}
      {extremeWeatherWarnings && extremeWeatherWarnings.length > 0 && (
        <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-b border-red-500/30 px-4 py-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <div className="text-sm font-semibold text-red-800">
              Vädervarning: {extremeWeatherWarnings.join(', ')}
            </div>
          </div>
        </div>
      )}

      {/* Main Weather Bar */}
      <div 
        className="p-3 cursor-pointer hover:bg-[#3D4A2B]/5 transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          {/* Left side - Weather info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#3D4A2B]/20 flex items-center justify-center">
              {weather ? getWeatherIcon(weather.forecast) : <Sun className="w-4 h-4 text-[#3D4A2B]" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="text-sm font-semibold text-gray-700">
                  {weather ? `${Math.round(weather.temperature)}°C` : '--°C'}
                </div>
                <div className="text-xs text-gray-500">
                  {weather?.forecast || 'Laddar...'}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3" />
                <span>{getLocationName()}</span>
              </div>
            </div>
          </div>

          {/* Right side - Time and expand button */}
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">{formatTime(currentTime)}</div>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-[#3D4A2B]/20 bg-white/50">
          <div className="p-4 space-y-4">
            {/* Current Conditions Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-[#3D4A2B]" />
                <div>
                  <div className="text-xs text-gray-500">Temperatur</div>
                  <div className="text-sm font-semibold text-gray-700">
                    {weather ? `${Math.round(weather.temperature)}°C` : '--°C'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-[#3D4A2B]" />
                <div>
                  <div className="text-xs text-gray-500">Vind</div>
                  <div className="text-sm font-semibold text-gray-700">
                    {weather ? `${Math.round(weather.windSpeed)} m/s` : '-- m/s'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-[#3D4A2B]" />
                <div>
                  <div className="text-xs text-gray-500">Luftfuktighet</div>
                  <div className="text-sm font-semibold text-gray-700">
                    {weather ? `${Math.round(weather.humidity)}%` : '--%'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#3D4A2B]" />
                <div>
                  <div className="text-xs text-gray-500">Tryck</div>
                  <div className="text-sm font-semibold text-gray-700">
                    {weather ? `${Math.round(weather.pressure)} hPa` : '-- hPa'}
                  </div>
                </div>
              </div>
            </div>

            {/* 3-Day Forecast */}
            {forecast && forecast.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">3-dagars prognos</h4>
                <div className="space-y-2">
                  {forecast.slice(0, 3).map((day, index) => (
                    <div key={index} className="flex items-center justify-between bg-white/70 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-md bg-[#3D4A2B]/10 flex items-center justify-center">
                          {getWeatherIcon(day.weather)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">
                            {new Date(day.date).toLocaleDateString('sv-SE', { 
                              weekday: 'short', 
                              day: 'numeric', 
                              month: 'short' 
                            })}
                          </div>
                          <div className="text-xs text-gray-500">{day.weather}</div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-700">
                        {Math.round(day.temperature.max)}°/{Math.round(day.temperature.min)}°
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Source Info */}
            <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-200">
              Väderdata från SMHI • Uppdaterad {weather?.lastUpdated ? 
                new Date(weather.lastUpdated).toLocaleTimeString('sv-SE') : 
                'Okänt'
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
