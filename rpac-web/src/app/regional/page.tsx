'use client';

import { useState, useEffect } from 'react';
import { MapPin, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from '@/components/loading-spinner';
import { t } from '@/lib/locales';
import type { User } from '@supabase/supabase-js';

export default function RegionalPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Always use demo mode for now
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('RegionalPage: Using demo mode');
      const demoUser = {
        id: 'demo-user',
        email: 'demo@rpac.se',
        user_metadata: { name: 'Demo Användare' }
      } as unknown as User;
      setUser(demoUser);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <LoadingSpinner size="xl" text="Laddar" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <LoadingSpinner size="xl" text="Startar" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">
            {t('regional.title')}
          </h1>
        </div>

      {/* Regional Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center gap-3 mb-3">
            <MapPin size={24} className="text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              {t('regional.active_communities')}
            </h3>
          </div>
          <p className="text-3xl font-bold mb-2 text-blue-600">
            12
          </p>
          <p className="text-sm text-gray-600">
            {t('regional.registered_communities')}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center gap-3 mb-3">
            <Users size={24} className="text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              {t('regional.active_users')}
            </h3>
          </div>
          <p className="text-3xl font-bold mb-2 text-green-600">
            247
          </p>
          <p className="text-sm text-gray-600">
            {t('regional.registered_users')}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp size={24} className="text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              {t('regional.preparedness_score')}
            </h3>
          </div>
          <p className="text-3xl font-bold mb-2 text-purple-600">
            8.2
          </p>
          <p className="text-sm text-gray-600">
            {t('regional.average_score')}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle size={24} className="text-red-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              {t('regional.help_requests')}
            </h3>
          </div>
          <p className="text-3xl font-bold mb-2 text-red-600">
            3
          </p>
          <p className="text-sm text-gray-600">
            {t('regional.open_requests')}
          </p>
        </div>
      </div>

      {/* Regional Map Placeholder */}
      <div className="bg-white rounded-lg shadow-md p-8 border">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {t('regional.regional_map')}
        </h2>
        <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
          <p className="text-gray-600">
            {t('regional.map_coming_soon')}
          </p>
        </div>
      </div>

      {/* Regional News/Updates */}
      <div className="bg-white rounded-lg shadow-md p-6 border">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          {t('regional.regional_updates')}
        </h2>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-medium text-gray-800">
              {t('regional.new_community_registered')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('regional.malmo_centrum_registered')}
            </p>
            <p className="text-xs text-gray-500">2 {t('regional.hours_ago')}</p>
          </div>
          
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-medium text-gray-800">
              {t('regional.preparedness_exercise_completed')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('regional.gothenburg_exercise')}
            </p>
            <p className="text-xs text-gray-500">1 {t('regional.day_ago')}</p>
          </div>
          
          <div className="border-l-4 border-yellow-500 pl-4">
            <h3 className="font-medium text-gray-800">
              {t('regional.weather_warning')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('regional.stockholm_winds')}
            </p>
            <p className="text-xs text-gray-500">3 {t('regional.hours_ago')}</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
