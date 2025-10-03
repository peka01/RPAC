'use client';

import { useEffect, useState } from 'react';
import { CommunityHubMobileEnhanced } from '@/components/community-hub-mobile-enhanced';
import { createClient } from '@/lib/supabase-client';

export default function TestMobilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    // Get current user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#3D4A2B] border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in</h1>
          <a href="/" className="px-6 py-3 bg-[#3D4A2B] text-white rounded-xl">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return <CommunityHubMobileEnhanced user={user} />;
}

