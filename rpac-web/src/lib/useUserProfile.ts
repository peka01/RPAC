import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  user_id: string;
  county: string;
  municipality?: string;
  postal_code?: string;
  climate_zone: 'gotaland' | 'svealand' | 'norrland';
  experience_level: 'beginner' | 'intermediate' | 'expert';
  garden_size: 'none' | 'balcony' | 'small' | 'medium' | 'large' | 'farm';
  growing_preferences: string[];
  location_privacy: 'full' | 'county_only' | 'climate_zone_only';
  created_at: Date;
  updated_at: Date;
}

// Swedish county to climate zone mapping
const countyToClimateZone: Record<string, 'gotaland' | 'svealand' | 'norrland'> = {
  stockholm: 'svealand',
  uppsala: 'svealand',
  sodermanland: 'svealand',
  ostergotland: 'gotaland',
  jonkoping: 'gotaland',
  kronoberg: 'gotaland',
  kalmar: 'gotaland',
  blekinge: 'gotaland',
  skane: 'gotaland',
  halland: 'gotaland',
  vastra_gotaland: 'gotaland',
  varmland: 'svealand',
  orebro: 'svealand',
  vastmanland: 'svealand',
  dalarna: 'svealand',
  gavleborg: 'svealand',
  vasternorrland: 'norrland',
  jamtland: 'norrland',
  vasterbotten: 'norrland',
  norrbotten: 'norrland'
};

export function useUserProfile(user: User | null) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Default profile for new users
  const getDefaultProfile = (): Partial<UserProfile> => ({
    county: 'stockholm',
    climate_zone: 'svealand',
    experience_level: 'beginner',
    garden_size: 'medium',
    growing_preferences: ['potatoes', 'carrots', 'lettuce'],
    location_privacy: 'county_only'
  });

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const loadProfile = () => {
      try {
        const savedProfile = localStorage.getItem(`userProfile_${user.id}`);
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          setProfile({
            ...parsed,
            created_at: new Date(parsed.created_at),
            updated_at: new Date(parsed.updated_at)
          });
        } else {
          // Create default profile for new user
          const defaultProfile = {
            id: `profile_${user.id}`,
            user_id: user.id,
            ...getDefaultProfile(),
            created_at: new Date(),
            updated_at: new Date()
          } as UserProfile;
          
          setProfile(defaultProfile);
          // Save default profile
          localStorage.setItem(`userProfile_${user.id}`, JSON.stringify(defaultProfile));
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        // Fallback to default profile
        const defaultProfile = {
          id: `profile_${user.id}`,
          user_id: user.id,
          ...getDefaultProfile(),
          created_at: new Date(),
          updated_at: new Date()
        } as UserProfile;
        setProfile(defaultProfile);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!profile || !user) return;

    // Auto-update climate zone if county changes
    if (updates.county && updates.county !== profile.county) {
      const newClimateZone = countyToClimateZone[updates.county];
      if (newClimateZone) {
        updates.climate_zone = newClimateZone;
      }
    }

    const updatedProfile = {
      ...profile,
      ...updates,
      updated_at: new Date()
    };

    setProfile(updatedProfile);
    
    // Save to localStorage (in production this would be Supabase)
    try {
      localStorage.setItem(`userProfile_${user.id}`, JSON.stringify(updatedProfile));
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const getLocationInfo = () => {
    if (!profile) return null;

    return {
      county: profile.county,
      municipality: profile.municipality,
      postal_code: profile.postal_code,
      climate_zone: profile.climate_zone,
      privacy_level: profile.location_privacy
    };
  };

  const getCultivationContext = () => {
    if (!profile) return null;

    return {
      climate_zone: profile.climate_zone,
      experience_level: profile.experience_level,
      garden_size: profile.garden_size,
      growing_preferences: profile.growing_preferences
    };
  };

  const getCommunityContext = () => {
    if (!profile) return null;

    // Return community context based on privacy settings
    switch (profile.location_privacy) {
      case 'full':
        return {
          county: profile.county,
          municipality: profile.municipality,
          postal_code: profile.postal_code,
          level: 'municipality' as const
        };
      case 'county_only':
        return {
          county: profile.county,
          level: 'county' as const
        };
      case 'climate_zone_only':
        return {
          climate_zone: profile.climate_zone,
          level: 'climate_zone' as const
        };
      default:
        return {
          climate_zone: profile.climate_zone,
          level: 'climate_zone' as const
        };
    }
  };

  return {
    profile,
    loading,
    updateProfile,
    getLocationInfo,
    getCultivationContext,
    getCommunityContext
  };
}
