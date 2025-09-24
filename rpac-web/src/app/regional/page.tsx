'use client';

import { useState, useEffect } from 'react';
import { MapPin, Users, TrendingUp, AlertTriangle } from 'lucide-react';

export default function RegionalPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Always use demo mode for now
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('RegionalPage: Using demo mode');
      const demoUser = {
        id: 'demo-user',
        email: 'demo@rpac.se',
        user_metadata: { name: 'Demo Användare' }
      };
      setUser(demoUser);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Laddar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700">Initialiserar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2 text-gray-800">
            Regional Översikt
          </h1>
          <p className="text-lg text-gray-600">
            Regional samordning och krisberedskap
          </p>
        </div>

      {/* Regional Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center gap-3 mb-3">
            <MapPin size={24} className="text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Aktiva Samhällen
            </h3>
          </div>
          <p className="text-3xl font-bold mb-2 text-blue-600">
            12
          </p>
          <p className="text-sm text-gray-600">
            Registrerade lokala samhällen
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center gap-3 mb-3">
            <Users size={24} className="text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Aktiva Användare
            </h3>
          </div>
          <p className="text-3xl font-bold mb-2 text-green-600">
            247
          </p>
          <p className="text-sm text-gray-600">
            Registrerade användare
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp size={24} className="text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Beredskapspoäng
            </h3>
          </div>
          <p className="text-3xl font-bold mb-2 text-purple-600">
            8.2
          </p>
          <p className="text-sm text-gray-600">
            Genomsnittlig poäng
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle size={24} className="text-red-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              Aktiva Hjälpförfrågningar
            </h3>
          </div>
          <p className="text-3xl font-bold mb-2 text-red-600">
            3
          </p>
          <p className="text-sm text-gray-600">
            Öppna förfrågningar
          </p>
        </div>
      </div>

      {/* Regional Map Placeholder */}
      <div className="bg-white rounded-lg shadow-md p-8 border">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Regional Karta
        </h2>
        <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
          <p className="text-gray-600">
            Karta kommer att implementeras i framtida version
          </p>
        </div>
      </div>

      {/* Regional News/Updates */}
      <div className="bg-white rounded-lg shadow-md p-6 border">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Regionala Uppdateringar
        </h2>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-medium text-gray-800">
              Nytt samhälle registrerat
            </h3>
            <p className="text-sm text-gray-600">
              Malmö Centrum har registrerat sig som lokalt samhälle
            </p>
            <p className="text-xs text-gray-500">2 timmar sedan</p>
          </div>
          
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-medium text-gray-800">
              Beredskapsövning genomförd
            </h3>
            <p className="text-sm text-gray-600">
              Göteborgsregionen genomförde framgångsrik beredskapsövning
            </p>
            <p className="text-xs text-gray-500">1 dag sedan</p>
          </div>
          
          <div className="border-l-4 border-yellow-500 pl-4">
            <h3 className="font-medium text-gray-800">
              Vädervarning
            </h3>
            <p className="text-sm text-gray-600">
              Kraftiga vindar förväntas i Stockholmsregionen
            </p>
            <p className="text-xs text-gray-500">3 timmar sedan</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
