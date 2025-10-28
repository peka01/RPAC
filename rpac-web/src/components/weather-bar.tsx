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
  Eye,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
  EyeOff,
  RotateCcw
} from 'lucide-react';
import { WarningSeverityBadge } from '@/components/ui/warning-severity-badge';
import { useWeather } from '@/contexts/WeatherContext';
import { t } from '@/lib/locales';

interface WeatherBarProps {
  className?: string;
}

export function WeatherBar({ className = '' }: WeatherBarProps) {
  const { weather, forecast, extremeWeatherWarnings, officialWarnings, loading } = useWeather();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentWarningIndex, setCurrentWarningIndex] = useState(0);
  const [hiddenWarnings, setHiddenWarnings] = useState<Set<number>>(new Set());
  const [showHiddenWarnings, setShowHiddenWarnings] = useState(false);
  const [warningDismissals, setWarningDismissals] = useState<Map<number, number>>(new Map());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load warning dismissals from localStorage
  useEffect(() => {
    const savedDismissals = localStorage.getItem('rpac-warning-dismissals');
    if (savedDismissals) {
      try {
        const dismissals = JSON.parse(savedDismissals);
        const dismissalMap = new Map(Object.entries(dismissals).map(([id, timestamp]) => [Number(id), Number(timestamp)]));
        setWarningDismissals(dismissalMap);
        
        // Auto-hide warnings dismissed more than 24 hours ago
        const now = Date.now();
        const hiddenSet = new Set<number>();
        dismissalMap.forEach((timestamp, warningId) => {
          if (now - timestamp < 24 * 60 * 60 * 1000) { // 24 hours
            hiddenSet.add(warningId);
          }
        });
        setHiddenWarnings(hiddenSet);
      } catch (error) {
        console.error('Failed to load warning dismissals:', error);
      }
    }
  }, []);

  // Save warning dismissals to localStorage
  useEffect(() => {
    if (warningDismissals.size > 0) {
      const dismissalsObj = Object.fromEntries(warningDismissals);
      localStorage.setItem('rpac-warning-dismissals', JSON.stringify(dismissalsObj));
    }
  }, [warningDismissals]);

  // Reset warning index when warnings change
  useEffect(() => {
    setCurrentWarningIndex(0);
  }, [officialWarnings]);

  // Ensure currentWarningIndex is always within bounds
  useEffect(() => {
    if (officialWarnings && officialWarnings.length > 0) {
      setCurrentWarningIndex(prev => 
        Math.max(0, Math.min(prev, officialWarnings.length - 1))
      );
    }
  }, [officialWarnings, currentWarningIndex]);

  // Navigation functions for warning carousel
  const goToPreviousWarning = () => {
    if (officialWarnings && officialWarnings.length > 0) {
      setCurrentWarningIndex((prev) => {
        const newIndex = prev === 0 ? officialWarnings.length - 1 : prev - 1;
        return Math.max(0, Math.min(newIndex, officialWarnings.length - 1));
      });
    }
  };

  const goToNextWarning = () => {
    if (officialWarnings && officialWarnings.length > 0) {
      setCurrentWarningIndex((prev) => {
        const newIndex = prev === officialWarnings.length - 1 ? 0 : prev + 1;
        return Math.max(0, Math.min(newIndex, officialWarnings.length - 1));
      });
    }
  };

  // Warning management functions
  const hideWarning = (warningId: number) => {
    const now = Date.now();
    setHiddenWarnings(prev => new Set([...prev, warningId]));
    setWarningDismissals(prev => new Map([...prev, [warningId, now]]));
    
    // Adjust current index if we're hiding the current warning
    if (officialWarnings && officialWarnings[currentWarningIndex]?.id === warningId) {
      const visibleWarnings = getVisibleWarnings();
      if (visibleWarnings.length > 0) {
        const nextIndex = Math.min(currentWarningIndex, visibleWarnings.length - 1);
        setCurrentWarningIndex(nextIndex);
      }
    }
  };

  const restoreWarning = (warningId: number) => {
    setHiddenWarnings(prev => {
      const newSet = new Set(prev);
      newSet.delete(warningId);
      return newSet;
    });
    setWarningDismissals(prev => {
      const newMap = new Map(prev);
      newMap.delete(warningId);
      return newMap;
    });
  };

  const dismissAllWarnings = () => {
    if (officialWarnings) {
      const now = Date.now();
      const allIds = officialWarnings.map(w => w.id);
      setHiddenWarnings(new Set(allIds));
      setCurrentWarningIndex(0);
      
      // Add all warnings to dismissals
      const newDismissals = new Map(warningDismissals);
      allIds.forEach(id => newDismissals.set(id, now));
      setWarningDismissals(newDismissals);
    }
  };

  const isNewWarning = (warningId: number) => {
    return !warningDismissals.has(warningId);
  };

  const getVisibleWarnings = () => {
    if (!officialWarnings) return [];
    return officialWarnings.filter(warning => !hiddenWarnings.has(warning.id));
  };

  const getHiddenWarnings = () => {
    if (!officialWarnings) return [];
    return officialWarnings.filter(warning => hiddenWarnings.has(warning.id));
  };

  const isWarningExpiringSoon = (warning: any) => {
    if (!warning.warningAreas?.[0]?.approximateEnd) return false;
    const endTime = new Date(warning.warningAreas[0].approximateEnd);
    const now = new Date();
    const hoursUntilExpiry = (endTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry <= 6; // Expiring within 6 hours
  };

  // Generate SMHI warning link
  const getSMHIWarningLink = (warningId: number) => {
    return `https://www.smhi.se/vader/prognoser-och-varningar/varningar-och-meddelanden/varningar?warningId=${warningId}`;
  };

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
    // Get postal code region name based on first 2 digits
    if (!weather) return 'Laddar...';

    // Check that we have valid location data
    if (!weather._postalCode || typeof weather._postalCode !== 'string') {
      // Fallback to city or county if postal code is missing
      
      // Try city first
      if (weather._city && typeof weather._city === 'string' && weather._city.trim()) {
        return weather._city;
      }
      
      // Then try county
      if (weather._county && typeof weather._county === 'string' && weather._county.trim()) {
        const countyName = weather._county.trim().toLowerCase();
        return `${countyName.charAt(0).toUpperCase() + countyName.slice(1)} län`;
      }
      
      return 'Sverige';
    }

    // Special case for 36334 Tjureda (handle both XXXXX and XXX XX formats)
    if (weather._postalCode === '36334' || weather._postalCode === '363 34' || 
        weather._postalCode?.replace(/\s+/g, '') === '36334') {
      return 'Tjureda, Växjö kommun';
    }

    // Swedish postal code region names
    const postalRegionNames: Record<string, string> = {
      // Kronoberg region (34-36)
      '34': 'Växjö',
      '35': 'Alvesta',
      '36': 'Tingsryd',
      
      // Kalmar region (38-39)
      '38': 'Kalmar',
      '39': 'Oskarshamn',
      
      // Gotland (62)
      '62': 'Visby',
      
      // Stockholm region (10-19)
      '10': 'Stockholm',
      '11': 'Stockholm C',
      '12': 'Söderort',
      '13': 'Västerort',
      '14': 'Östermalm',
      '15': 'Norrmalm',
      '16': 'Bromma',
      '17': 'Farsta',
      '18': 'Sundbyberg',
      '19': 'Lidingö',
      
      // Skåne region (20-29)
      '20': 'Malmö',
      '21': 'Malmö C',
      '22': 'Lund',
      '23': 'Eslöv',
      '24': 'Helsingborg',
      '25': 'Ängelholm',
      '26': 'Hässleholm',
      '27': 'Ystad',
      '28': 'Kristianstad',
      '29': 'Karlskrona',
      
      // Other major regions
      '40': 'Göteborg',
      '41': 'Göteborg C',
      '42': 'Göteborg N',
      '43': 'Göteborg S',
      '44': 'Kungälv',
      '75': 'Uppsala',
      '80': 'Sundsvall',
      '90': 'Umeå',
      '95': 'Luleå'
    };

    // Try to get location name from postal code region
    if (weather._postalCode) {
      const region = weather._postalCode.slice(0, 2);
      const locationName = postalRegionNames[region];
      if (locationName) return locationName;
    }

    // If no postal code match, try city/county
    if (weather._city) return weather._city;
    if (weather._county) return weather._county + ' län';

    return 'Sverige';
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
      {/* SMHI Official Warnings - Smart Management */}
      {officialWarnings && officialWarnings.length > 0 && (() => {
        const visibleWarnings = getVisibleWarnings();
        const hiddenWarningsList = getHiddenWarnings();
        
        return (
          <>
            {/* Visible Warnings */}
            {visibleWarnings.length > 0 && (
              <div className="bg-gradient-to-r from-[#3D4A2B]/15 to-[#5C6B47]/20 px-4 py-2">
                {(() => {
                  const warning = visibleWarnings[currentWarningIndex];
                  
                  if (!warning) {
                    return (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#3D4A2B] flex-shrink-0" />
                        <div className="text-sm text-[#3D4A2B]/80">
                          {t('dashboard.no_warnings')}
                        </div>
                      </div>
                    );
                  }
                  
                  const warningName = warning.event?.sv || 'Varning';
                  const warningDescription = warning.warningAreas?.[0]?.eventDescription ? 
                    (typeof warning.warningAreas[0].eventDescription === 'string' 
                      ? warning.warningAreas[0].eventDescription 
                      : warning.warningAreas[0].eventDescription.sv) : '';
                  const warningLevel = warning.warningAreas?.[0]?.warningLevel ? 
                    (typeof warning.warningAreas[0].warningLevel === 'string' 
                      ? warning.warningAreas[0].warningLevel 
                      : warning.warningAreas[0].warningLevel.sv) : '';
                  const startTime = warning.warningAreas?.[0]?.approximateStart;
                  const endTime = warning.warningAreas?.[0]?.approximateEnd;
                  const isExpiringSoon = isWarningExpiringSoon(warning);
                  const isNew = isNewWarning(warning.id);
                  
                  return (
                    <div className="flex items-start gap-2 relative">
                      <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-1 ${isExpiringSoon ? 'text-orange-600' : 'text-[#3D4A2B]'}`} />
                      <div className="flex-1 min-w-0 pr-8">
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className={`text-sm font-semibold ${isExpiringSoon ? 'text-orange-600' : 'text-[#3D4A2B]'}`}>
                            {warningName}
                          </div>
                          {warningLevel && (
                            <span className={`text-xs px-2 py-1 rounded ${isExpiringSoon ? 'bg-orange-100 text-orange-700' : 'bg-[#3D4A2B]/20 text-[#3D4A2B]'}`}>
                              {warningLevel}
                            </span>
                          )}
                          {isExpiringSoon && (
                            <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">
                              {t('dashboard.warning_expires_soon')}
                            </span>
                          )}
                          {isNew && (
                            <span className="text-xs px-2 py-1 bg-[#5C6B47]/20 text-[#3D4A2B] rounded font-semibold">
                              NY
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${isExpiringSoon ? 'text-orange-600/80' : 'text-[#3D4A2B]/80'}`}>
                          {warningDescription}
                        </p>
                        {startTime && (
                          <div className={`text-xs mt-1 ${isExpiringSoon ? 'text-orange-600/60' : 'text-[#3D4A2B]/60'}`}>
                            {(() => {
                              const startDate = new Date(startTime);
                              const endDate = endTime ? new Date(endTime) : null;
                              
                              const startDay = startDate.getDate();
                              const startMonth = startDate.toLocaleDateString('sv-SE', { month: 'long' });
                              const startTimeStr = startDate.toLocaleTimeString('sv-SE', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false 
                              });
                              
                              if (endDate) {
                                const endDay = endDate.getDate();
                                const endMonth = endDate.toLocaleDateString('sv-SE', { month: 'long' });
                                const endTimeStr = endDate.toLocaleTimeString('sv-SE', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  hour12: false 
                                });
                                
                                if (startMonth === endMonth && startDay === endDay) {
                                  return `Gäller ${startDay} ${startMonth} kl. ${startTimeStr} - ${endTimeStr}`;
                                } else {
                                  return `Gäller ${startDay} ${startMonth} kl. ${startTimeStr} - ${endDay} ${endMonth} kl. ${endTimeStr}`;
                                }
                              } else {
                                return `Gäller ${startDay} ${startMonth} kl. ${startTimeStr} och tills vidare`;
                              }
                            })()}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-xs text-[#3D4A2B]/50">
                            <a 
                              href={getSMHIWarningLink(warning.id)}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:text-[#3D4A2B]/70 underline inline-flex items-center gap-1"
                              title={warning.id >= 8000 ? t('dashboard.test_warning_link') : t('dashboard.view_warning_smhi')}
                            >
                              Se varning på SMHI.se
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                      
                      {/* Close Button - Top Right */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          hideWarning(warning.id);
                        }}
                        className="absolute top-0 right-0 p-1 hover:bg-[#3D4A2B]/20 rounded transition-colors"
                        title={t('dashboard.hide_warning')}
                      >
                        <X className="w-3 h-3 text-[#3D4A2B]/60" />
                      </button>
                      
                      {/* Navigation Controls */}
                      {visibleWarnings.length > 1 && (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentWarningIndex(prev => prev === 0 ? visibleWarnings.length - 1 : prev - 1);
                            }}
                            className="p-1 hover:bg-[#3D4A2B]/20 rounded transition-colors"
                            title={t('dashboard.previous_warning')}
                          >
                            <ChevronLeft className="w-4 h-4 text-[#3D4A2B]" />
                          </button>
                          
                          <span className="text-xs text-[#3D4A2B]/70 px-2">
                            {currentWarningIndex + 1}/{visibleWarnings.length}
                          </span>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentWarningIndex(prev => prev === visibleWarnings.length - 1 ? 0 : prev + 1);
                            }}
                            className="p-1 hover:bg-[#3D4A2B]/20 rounded transition-colors"
                            title={t('dashboard.next_warning')}
                          >
                            <ChevronRight className="w-4 h-4 text-[#3D4A2B]" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
            
            {/* Hidden Warnings Summary */}
            {hiddenWarningsList.length > 0 && (
              <div className="bg-gradient-to-r from-[#4A5239]/10 to-[#707C5F]/15 px-4 py-2 border-b border-[#3D4A2B]/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-[#707C5F]" />
                    <span className="text-sm text-[#707C5F]">
                      {hiddenWarningsList.length} {hiddenWarningsList.length === 1 ? t('dashboard.warnings_hidden_singular') : t('dashboard.warnings_hidden_plural')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowHiddenWarnings(!showHiddenWarnings)}
                      className="text-xs text-[#707C5F] hover:text-[#3D4A2B] underline"
                    >
                      {showHiddenWarnings ? 'Dölj' : (hiddenWarningsList.length === 1 ? t('dashboard.show_hidden_warnings_singular') : t('dashboard.show_hidden_warnings_plural'))}
                    </button>
                    {hiddenWarningsList.length > 1 && (
                      <button
                        onClick={() => {
                          hiddenWarningsList.forEach(warning => restoreWarning(warning.id));
                        }}
                        className="text-xs text-[#707C5F] hover:text-[#3D4A2B] underline"
                      >
                        Återställ alla
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Hidden Warnings List */}
                {showHiddenWarnings && (
                  <div className="mt-2 space-y-2">
                    {hiddenWarningsList.map((warning) => (
                      <div key={warning.id} className="flex items-center justify-between bg-white/50 rounded p-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-3 h-3 text-[#707C5F]" />
                          <span className="text-xs text-[#707C5F]">
                            {warning.event?.sv || 'Varning'}
                          </span>
                        </div>
                        <button
                          onClick={() => restoreWarning(warning.id)}
                          className="p-1 hover:bg-[#3D4A2B]/20 rounded transition-colors"
                          title={t('dashboard.restore_warning')}
                        >
                          <RotateCcw className="w-3 h-3 text-[#707C5F]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        );
      })()}

      {/* Local Weather Warnings - Show after SMHI warnings */}
      {extremeWeatherWarnings && extremeWeatherWarnings.length > 0 && (
        <div className="bg-gradient-to-r from-[#3D4A2B]/15 to-[#5C6B47]/20 border-b border-[#3D4A2B]/30 px-4 py-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#3D4A2B] flex-shrink-0" />
            <div className="text-sm font-semibold text-[#3D4A2B]">
              Lokala varningar: {extremeWeatherWarnings.join(', ')}
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
