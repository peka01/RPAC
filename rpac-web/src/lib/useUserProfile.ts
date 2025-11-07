import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  user_id: string;
  display_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  county?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  medical_conditions?: string;
  medications?: string;
  allergies?: string;
  blood_type?: string;
  special_needs?: string;
  family_size?: number;
  has_children?: boolean;
  has_elderly?: boolean;
  has_pets?: boolean;
  pet_types?: string;
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
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
    display_name: '',
    email: '',
    phone: '',
    address: '',
    postal_code: '',
    city: '',
    county: 'stockholm',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    medical_conditions: '',
    medications: '',
    allergies: '',
    blood_type: '',
    special_needs: '',
    family_size: 1,
    has_children: false,
    has_elderly: false,
    has_pets: false,
    pet_types: ''
  });

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // Skip database queries for demo user (not a valid UUID)
    if (user.id === 'demo-user') {
      const defaultProfile = {
        id: `profile_demo-user`,
        user_id: 'demo-user',
        ...getDefaultProfile(),
        created_at: new Date(),
        updated_at: new Date()
      } as UserProfile;
      setProfile(defaultProfile);
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading user profile:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          console.error('Error details:', error.details);
          
          // If it's a 406 error, it's likely an RLS issue
          if (error.code === 'PGRST301' || error.message?.includes('406')) {
            console.error('❌ RLS Policy Issue: User cannot access user_profiles table');
            console.error('Please check RLS policies in Supabase dashboard');
          }
          return;
        }

        if (data) {
          setProfile({
            ...data,
            created_at: new Date(data.created_at),
            updated_at: new Date(data.updated_at)
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

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile || !user) return;

    // No auto-update logic needed for the new interface

    const updatedProfile = {
      ...profile,
      ...updates,
      updated_at: new Date()
    };

    setProfile(updatedProfile);
    
    // Save to Supabase
    try {
      const profileToSave = {
        user_id: user.id,
        display_name: updatedProfile.display_name || '',
        email: updatedProfile.email || user.email || '',
        phone: updatedProfile.phone || '',
        address: updatedProfile.address || '',
        postal_code: updatedProfile.postal_code || '',
        city: updatedProfile.city || '',
        county: updatedProfile.county || '',
        emergency_contact_name: updatedProfile.emergency_contact_name || '',
        emergency_contact_phone: updatedProfile.emergency_contact_phone || '',
        emergency_contact_relation: updatedProfile.emergency_contact_relation || '',
        medical_conditions: updatedProfile.medical_conditions || '',
        medications: updatedProfile.medications || '',
        allergies: updatedProfile.allergies || '',
        blood_type: updatedProfile.blood_type || '',
        special_needs: updatedProfile.special_needs || '',
        family_size: updatedProfile.family_size || 1,
        has_children: updatedProfile.has_children || false,
        has_elderly: updatedProfile.has_elderly || false,
        has_pets: updatedProfile.has_pets || false,
        pet_types: updatedProfile.pet_types || '',
        updated_at: new Date().toISOString()
      };

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existingProfile) {
        // Update existing profile
        await supabase
          .from('user_profiles')
          .update(profileToSave)
          .eq('user_id', user.id);
      } else {
        // Create new profile
        await supabase
          .from('user_profiles')
          .insert([profileToSave]);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const getLocationInfo = () => {
    if (!profile) return null;
    
    return {
      county: profile.county,
      city: profile.city,
      postal_code: profile.postal_code,
      address: profile.address
    };
  };

  const getCultivationContext = () => {
    if (!profile) return null;

    return {
      county: profile.county,
      family_size: profile.family_size,
      has_pets: profile.has_pets,
      pet_types: profile.pet_types
    };
  };

  const getCommunityContext = () => {
    if (!profile) return null;

    // Return community context based on privacy settings
    return {
      county: profile.county,
      city: profile.city,
      postal_code: profile.postal_code,
      level: 'county' as const
    };
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error refreshing user profile:', error);
        return;
      }

      if (data) {
        setProfile({
          ...data,
          created_at: new Date(data.created_at),
          updated_at: new Date(data.updated_at)
        });
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  return {
    profile,
    loading,
    updateProfile,
    refreshProfile,
    getLocationInfo,
    getCultivationContext,
    getCommunityContext
  };
}
