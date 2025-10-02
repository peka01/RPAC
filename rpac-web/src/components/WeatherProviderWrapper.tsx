'use client';

import { WeatherProvider } from '@/contexts/WeatherContext';
import { supabase } from '@/lib/supabase';
import { ReactNode, useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';

interface WeatherProviderWrapperProps {
  children: ReactNode;
}

export function WeatherProviderWrapper({ children }: WeatherProviderWrapperProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  return (
    <WeatherProvider user={user}>
      {children}
    </WeatherProvider>
  );
}
