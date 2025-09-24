'use client';

import { useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { SupabaseAuth } from '@/components/supabase-auth';
import { MapPin, Users, TrendingUp, AlertTriangle } from 'lucide-react';

export default function RegionalPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const handleAuthChange = useCallback((newUser: User | null) => {
    setUser(newUser);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg" style={{ color: 'var(--text-primary)' }}>Laddar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <SupabaseAuth onAuthChange={handleAuthChange} />;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Regional Översikt
        </h1>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          Regional samordning och krisberedskap
        </p>
      </div>

      {/* Regional Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-3">
            <MapPin size={24} style={{ color: 'var(--text-primary)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Aktiva Samhällen
            </h3>
          </div>
          <p className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            12
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Registrerade lokala samhällen
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Users size={24} style={{ color: 'var(--text-primary)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Aktiva Användare
            </h3>
          </div>
          <p className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            247
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Registrerade användare
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp size={24} style={{ color: 'var(--text-primary)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Beredskapspoäng
            </h3>
          </div>
          <p className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            8.2
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Genomsnittlig poäng
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle size={24} style={{ color: 'var(--text-primary)' }} />
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              Aktiva Hjälpförfrågningar
            </h3>
          </div>
          <p className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            3
          </p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Öppna förfrågningar
          </p>
        </div>
      </div>

      {/* Regional Map Placeholder */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-8">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Regional Karta
        </h2>
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64 flex items-center justify-center">
          <p style={{ color: 'var(--text-secondary)' }}>
            Karta kommer att implementeras i framtida version
          </p>
        </div>
      </div>

      {/* Regional News/Updates */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Regionala Uppdateringar
        </h2>
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
              Nytt samhälle registrerat
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Malmö Centrum har registrerat sig som lokalt samhälle
            </p>
            <p className="text-xs text-gray-500">2 timmar sedan</p>
          </div>
          
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
              Beredskapsövning genomförd
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Göteborgsregionen genomförde framgångsrik beredskapsövning
            </p>
            <p className="text-xs text-gray-500">1 dag sedan</p>
          </div>
          
          <div className="border-l-4 border-yellow-500 pl-4">
            <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
              Vädervarning
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Kraftiga vindar förväntas i Stockholmsregionen
            </p>
            <p className="text-xs text-gray-500">3 timmar sedan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
