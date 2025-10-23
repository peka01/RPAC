'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { RegionalOverviewResponsive } from '@/components/regional-overview-responsive';
import { t } from '@/lib/locales';
import type { User } from '@supabase/supabase-js';

export default function RegionalPage() {
  const [, setUser] = useState<User | null>(null);
  const [county, setCounty] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserAndCounty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserAndCounty = async () => {
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Current user loaded
      
      if (currentUser) {
        setUser(currentUser);
        
        // Get user profile to find their county
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('county, postal_code, city')
          .eq('user_id', currentUser.id)
          .single();

        // User profile loaded

        if (profile?.county) {
          // Using county from profile
          setCounty(profile.county);
        } else if (profile?.postal_code) {
          // If no county set, try to derive from postal code
          const derivedCounty = getCountyFromPostalCode(profile.postal_code);
          // Derived county from postal code
          setCounty(derivedCounty);
        } else {
          // Default to Stockholm if no location data
          // No location data, defaulting to Stockholm
          setCounty('Stockholm');
        }
      } else {
        // For demo/non-logged in users, default to Stockholm
        // No user, defaulting to Stockholm
        setCounty('Stockholm');
      }
    } catch (error) {
      console.error('[RegionalPage] Error loading user and county:', error);
      // Fallback to Stockholm
      setCounty('Stockholm');
    } finally {
      setLoading(false);
    }
  };

  // Simple postal code to county mapping (simplified version)
  const getCountyFromPostalCode = (postalCode: string): string => {
    const code = postalCode.replace(/\s/g, '').substring(0, 3);
    const firstTwo = parseInt(code.substring(0, 2));

    // Simplified mapping based on postal code ranges
    if (firstTwo >= 10 && firstTwo <= 19) return 'Stockholm';
    if (firstTwo >= 20 && firstTwo <= 26) return 'Skåne';
    if (firstTwo >= 30 && firstTwo <= 31) return 'Halland';
    if (firstTwo >= 40 && firstTwo <= 49) return 'Västra Götaland';
    if (firstTwo >= 50 && firstTwo <= 59) return 'Östergötland';
    if (firstTwo >= 60 && firstTwo <= 64) return 'Jönköping';
    if (firstTwo >= 65 && firstTwo <= 69) return 'Kronoberg';
    if (firstTwo >= 70 && firstTwo <= 74) return 'Örebro';
    if (firstTwo >= 75 && firstTwo <= 77) return 'Södermanland';
    if (firstTwo >= 80 && firstTwo <= 83) return 'Gävleborg';
    if (firstTwo >= 84 && firstTwo <= 86) return 'Västernorrland';
    if (firstTwo >= 87 && firstTwo <= 89) return 'Jämtland';
    if (firstTwo >= 90 && firstTwo <= 94) return 'Västerbotten';
    if (firstTwo >= 95 && firstTwo <= 98) return 'Norrbotten';
    
    return 'Stockholm'; // Default fallback
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <ShieldProgressSpinner 
          variant="bounce" 
          size="xl" 
          color="olive" 
          message={t('regional.loading_county_data')}
        />
      </div>
    );
  }

  return <RegionalOverviewResponsive county={county} />;
}
