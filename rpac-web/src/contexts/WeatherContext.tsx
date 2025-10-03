'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { WeatherService, WeatherData, WeatherForecast } from '@/lib/weather-service';
import type { User } from '@supabase/supabase-js';
import { useUserProfile } from '@/lib/useUserProfile';

interface WeatherContextType {
  weather: WeatherData | null;
  forecast: WeatherForecast[];
  extremeWeatherWarnings: string[];
  loading: boolean;
  refreshWeather: () => Promise<void>;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

interface WeatherProviderProps {
  children: ReactNode;
  user: User | null;
}

export function WeatherProvider({ children, user }: WeatherProviderProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [extremeWeatherWarnings, setExtremeWeatherWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use the proven useUserProfile hook pattern
  const { profile } = useUserProfile(user);

  const fetchWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get location info from user profile
      const userProfile = profile ? {
        county: profile.county,
        city: profile.city
      } : undefined;

      // Fetch current weather and forecast
      const [weatherData, forecastData] = await Promise.all([
        WeatherService.getCurrentWeather(undefined, undefined, userProfile),
        WeatherService.getWeatherForecast(undefined, undefined, userProfile)
      ]);

      setWeather(weatherData);
      setForecast(forecastData);

      // Get extreme weather warnings
      const warnings = WeatherService.getExtremeWeatherWarnings(forecastData);
      setExtremeWeatherWarnings(warnings);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Set fallback data on error
      setWeather(null);
      setForecast([]);
      setExtremeWeatherWarnings([]);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchWeatherData();

    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeatherData, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchWeatherData]);

  const value: WeatherContextType = {
    weather,
    forecast,
    extremeWeatherWarnings,
    loading,
    refreshWeather: fetchWeatherData
  };

  return (
    <WeatherContext.Provider value={value}>
      {children}
    </WeatherContext.Provider>
  );
}

export function useWeather() {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
}

