'use client';

import { useState, useCallback } from 'react';
import { CommunityHub } from '@/components/community-hub';
import { User } from '@supabase/supabase-js';
import { SupabaseAuth } from '@/components/supabase-auth';

export default function LocalPage() {
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
          Lokalt Samhälle
        </h1>
        <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
          Samarbeta med ditt lokala samhälle för ömsesidig hjälp och resursdelning
        </p>
      </div>

      <CommunityHub user={user} />
    </div>
  );
}
