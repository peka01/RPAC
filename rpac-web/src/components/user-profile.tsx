'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/locales';
import { supabase } from '@/lib/supabase';
import { validateUserProfile, sanitizeHtml } from '@/lib/validation';
import { 
  User,
  MapPin,
  Settings,
  Save,
  Edit,
  Shield,
  Globe,
  Home,
  Leaf,
  AlertCircle,
  CheckCircle,
  Navigation,
  Target,
  Info
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UserProfile {
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
  household_size?: number;
  has_children?: boolean;
  has_elderly?: boolean;
  has_pets?: boolean;
  pet_types?: string;
  location_privacy?: string;
  created_at: Date;
  updated_at: Date;
}



interface UserProfileProps {
  user: SupabaseUser;
  onProfileUpdate?: (profile: UserProfile) => void;
  initialProfile?: Partial<UserProfile>;
  compact?: boolean;
}

export function UserProfile({ 
  user, 
  onProfileUpdate, 
  initialProfile,
  compact = false 
}: UserProfileProps) {
  const [profile, setProfile] = useState<Partial<UserProfile>>(() => {
    // Load additional fields from localStorage on initial state
    const localLocationPrivacy = typeof window !== 'undefined' ? localStorage.getItem(`user_${user.id}_location_privacy`) : null;
    
    return {
      display_name: user.user_metadata?.name || user.email?.split('@')[0] || '',
      email: user.email || '',
      phone: '',
      address: '',
      postal_code: '',
      city: '',
      county: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relation: '',
      medical_conditions: '',
      medications: '',
      allergies: '',
      blood_type: '',
      special_needs: '',
      household_size: 1,
      has_children: false,
      has_elderly: false,
      has_pets: false,
      pet_types: '',
      location_privacy: localLocationPrivacy || 'county_only',
      ...initialProfile
    };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [showLocationPicker, setShowLocationPicker] = useState(false);


  // Load profile from Supabase on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading profile:', error);
          return;
        }

        if (data) {
          // Convert string dates back to Date objects
          const profileWithDates = {
            ...data,
            created_at: data.created_at ? new Date(data.created_at) : new Date(),
            updated_at: data.updated_at ? new Date(data.updated_at) : new Date()
          };
          
          // Load additional fields from localStorage
          const localLocationPrivacy = localStorage.getItem(`user_${user.id}_location_privacy`);
          
          setProfile(prev => ({ 
            ...prev, 
            ...profileWithDates,
            location_privacy: localLocationPrivacy || 'county_only'
          }));
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadProfile();
  }, [user.id]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // Prepare data for validation
      const profileData = {
        display_name: profile.display_name || '',
        email: profile.email || user.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        postal_code: profile.postal_code || '',
        city: profile.city || '',
        county: profile.county || '',
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || '',
        emergency_contact_relation: profile.emergency_contact_relation || '',
        medical_conditions: profile.medical_conditions || '',
        medications: profile.medications || '',
        allergies: profile.allergies || '',
        blood_type: profile.blood_type || '',
        special_needs: profile.special_needs || '',
        family_size: profile.family_size || 1,
        has_children: profile.has_children || false,
        has_elderly: profile.has_elderly || false,
        has_pets: profile.has_pets || false,
        pet_types: profile.pet_types || ''
      };

      // Validate input data
      const validatedData = validateUserProfile(profileData);

      // Sanitize HTML content
      const sanitizedData = {
        ...validatedData,
        display_name: sanitizeHtml(validatedData.display_name),
        address: validatedData.address ? sanitizeHtml(validatedData.address) : '',
        emergency_contact_name: validatedData.emergency_contact_name ? sanitizeHtml(validatedData.emergency_contact_name) : '',
        emergency_contact_relation: validatedData.emergency_contact_relation ? sanitizeHtml(validatedData.emergency_contact_relation) : '',
        medical_conditions: validatedData.medical_conditions ? sanitizeHtml(validatedData.medical_conditions) : '',
        medications: validatedData.medications ? sanitizeHtml(validatedData.medications) : '',
        allergies: validatedData.allergies ? sanitizeHtml(validatedData.allergies) : '',
        special_needs: validatedData.special_needs ? sanitizeHtml(validatedData.special_needs) : '',
        pet_types: validatedData.pet_types ? sanitizeHtml(validatedData.pet_types) : ''
      };

      // Only include fields that exist in the database schema
      const profileToSave = {
        user_id: user.id,
        ...sanitizedData,
        updated_at: new Date().toISOString()
      };

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let result;
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('user_profiles')
          .update(profileToSave)
          .eq('user_id', user.id)
          .select()
          .single();
      } else {
        // Create new profile
        result = await supabase
          .from('user_profiles')
          .insert([profileToSave])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Save additional fields to localStorage
      if (profile.location_privacy) {
        localStorage.setItem(`user_${user.id}_location_privacy`, profile.location_privacy);
      }

      // Update local state with the saved data
      setProfile(prev => ({
        ...prev,
        ...result.data,
        created_at: new Date(result.data.created_at),
        updated_at: new Date(result.data.updated_at)
      }));
      
      // Call callback if provided
      onProfileUpdate?.(result.data as UserProfile);
      
      setSaveMessage(t('profile.profile_saved'));
      setIsEditing(false);
      
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      
      // Handle validation errors specifically
      if (error instanceof Error && error.message.includes('validation')) {
        setSaveMessage(`Valideringsfel: ${error.message}`);
      } else if (error instanceof Error && error.message.includes('zod')) {
        setSaveMessage(`Ogiltiga data: ${error.message}`);
      } else {
        setSaveMessage('Ett fel uppstod vid sparande');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getLocationDisplayText = () => {
    if (profile.county) {
      return t(`profile.counties.${profile.county}`);
    }
    return 'Ingen plats angiven';
  };

  const getPrivacyIcon = () => {
    return MapPin; // Default to MapPin since we don't have privacy settings in the new interface
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-3 p-3 rounded-lg" style={{
        backgroundColor: 'var(--bg-olive-light)'
      }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
          backgroundColor: 'var(--color-sage)'
        }}>
          <User className="w-4 h-4 text-white" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <MapPin className="w-3 h-3" style={{ color: 'var(--color-sage)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {getLocationDisplayText()}
            </span>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {profile.county ? t(`profile.counties.${profile.county}`) : 'Ingen plats angiven'}
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="p-2 rounded-lg hover:shadow-sm transition-all duration-200"
          style={{ 
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-secondary)'
          }}
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg p-6 border shadow-lg" style={{ 
      backgroundColor: 'var(--bg-card)',
      borderColor: 'var(--color-sage)'
    }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm" style={{ 
            background: 'linear-gradient(135deg, var(--color-sage) 0%, var(--color-secondary) 100%)' 
          }}>
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {t('profile.title')}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {user.email}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {saveMessage && (
            <div className="flex items-center space-x-2 px-3 py-1 rounded-full text-sm" style={{
              backgroundColor: 'rgba(135, 169, 107, 0.1)',
              color: 'var(--color-sage)'
            }}>
              <CheckCircle className="w-4 h-4" />
              <span>{saveMessage}</span>
            </div>
          )}
          
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg border hover:shadow-sm transition-all duration-200"
            style={{ 
              backgroundColor: isEditing ? 'var(--color-sage)' : 'var(--bg-card)',
              borderColor: 'var(--color-sage)',
              color: isEditing ? 'white' : 'var(--color-sage)'
            }}
          >
            <Edit className="w-4 h-4" />
            <span className="text-sm">
              {isEditing ? 'Avbryt' : t('profile.edit_profile')}
            </span>
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="space-y-6">
        {/* Location Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5" style={{ color: 'var(--color-sage)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('profile.location')}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* County Selection */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('profile.county')}
              </label>
              {isEditing ? (
                <select
                  value={profile.county}
                  onChange={(e) => setProfile(prev => ({ ...prev, county: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                  style={{ borderColor: 'var(--color-secondary)' }}
                >
                  {[
                    'stockholm', 'uppsala', 'sodermanland', 'ostergotland', 'jonkoping', 
                    'kronoberg', 'kalmar', 'blekinge', 'skane', 'halland', 'vastra_gotaland',
                    'varmland', 'orebro', 'vastmanland', 'dalarna', 'gavleborg', 
                    'vasternorrland', 'jamtland', 'vasterbotten', 'norrbotten'
                  ].map(county => (
                    <option key={county} value={county}>
                      {t(`profile.counties.${county}`)}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {t(`profile.counties.${profile.county}`)}
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* Municipality and Postal Code */}
          {isEditing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  {t('profile.municipality')} (valfritt)
                </label>
                <input
                  type="text"
                  value={profile.city || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                  style={{ borderColor: 'var(--color-secondary)' }}
                  placeholder="t.ex. Stockholm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  {t('profile.postal_code')} (valfritt)
                </label>
                <input
                  type="text"
                  value={profile.postal_code || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, postal_code: e.target.value }))}
                  className="w-full p-3 border rounded-lg"
                  style={{ borderColor: 'var(--color-secondary)' }}
                  placeholder="12345"
                />
              </div>
            </div>
          )}
        </div>



        {/* Family Size */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('profile.family_size')}
          </label>
          {isEditing ? (
            <select
              value={profile.family_size || 1}
              onChange={(e) => setProfile(prev => ({ ...prev, household_size: parseInt(e.target.value) }))}
              className="w-full p-3 border rounded-lg"
              style={{ borderColor: 'var(--color-secondary)' }}
            >
              <option value={1}>1 person</option>
              <option value={2}>2 personer</option>
              <option value={3}>3 personer</option>
              <option value={4}>4 personer</option>
              <option value={5}>5 personer</option>
              <option value={6}>6 personer</option>
              <option value={7}>7 personer</option>
              <option value={8}>8 personer</option>
            </select>
          ) : (
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
              <span style={{ color: 'var(--text-primary)' }}>
                {profile.family_size || 1} {profile.family_size === 1 ? 'person' : 'personer'}
              </span>
            </div>
          )}
        </div>

        {/* Pets */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('profile.pets')}
          </label>
          {isEditing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['hund', 'katt', 'kanin', 'hamster', 'fågel', 'fisk', 'reptil', 'annat'].map(petType => (
                  <label key={petType} className="flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={profile.pet_types?.includes(petType) || false}
                      onChange={(e) => {
                        const currentPets = profile.pet_types?.split(',').filter(p => p.trim()) || [];
                        if (e.target.checked) {
                          const newPets = [...currentPets, petType];
                          setProfile(prev => ({ 
                            ...prev, 
                            has_pets: true,
                            pet_types: newPets.join(',')
                          }));
                        } else {
                          const newPets = currentPets.filter(p => p !== petType);
                          setProfile(prev => ({ 
                            ...prev, 
                            has_pets: newPets.length > 0,
                            pet_types: newPets.join(',')
                          }));
                        }
                      }}
                    />
                    <span className="text-sm capitalize" style={{ color: 'var(--text-primary)' }}>
                      {petType}
                    </span>
                  </label>
                ))}
              </div>
              {profile.has_pets && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
                  <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Dina husdjur:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span 
                      className="px-2 py-1 rounded text-xs"
                      style={{
                        backgroundColor: 'var(--color-sage)',
                        color: 'white'
                      }}
                    >
                      {profile.pet_types || 'Husdjur'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
              {profile.has_pets ? (
                <div>
                  <span style={{ color: 'var(--text-primary)' }}>
                    Husdjur registrerade
                  </span>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span 
                      className="px-2 py-1 rounded text-xs"
                      style={{
                        backgroundColor: 'var(--color-sage)',
                        color: 'white'
                      }}
                    >
                      {profile.pet_types || 'Husdjur'}
                    </span>
                  </div>
                </div>
              ) : (
                <span style={{ color: 'var(--text-secondary)' }}>
                  Inga husdjur registrerade
                </span>
              )}
            </div>
          )}
        </div>


        {/* Privacy Settings */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Shield className="w-5 h-5" style={{ color: 'var(--color-sage)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {t('profile.location_privacy')}
            </h3>
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              {[
                { value: 'climate_zone_only', label: 'Bara klimatzon', icon: Shield },
                { value: 'county_only', label: 'Län', icon: MapPin },
                { value: 'full', label: 'Full plats', icon: Globe }
              ].map(option => (
                <label key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:shadow-sm">
                  <input
                    type="radio"
                    name="location_privacy"
                    value={option.value}
                    checked={profile.location_privacy === option.value}
                    onChange={(e) => setProfile(prev => ({ ...prev, location_privacy: e.target.value }))}
                  />
                  <option.icon className="w-4 h-4" style={{ color: 'var(--color-sage)' }} />
                  <span style={{ color: 'var(--text-primary)' }}>{option.label}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg flex items-center space-x-2" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
              {(() => {
                const privacyOptions = [
                  { value: 'climate_zone_only', label: 'Bara klimatzon', icon: Shield },
                  { value: 'county_only', label: 'Län', icon: MapPin },
                  { value: 'full', label: 'Full plats', icon: Globe }
                ];
                const selectedOption = privacyOptions.find(opt => opt.value === profile.location_privacy) || privacyOptions[1];
                const PrivacyIcon = selectedOption.icon;
                return <PrivacyIcon className="w-4 h-4" style={{ color: 'var(--color-sage)' }} />;
              })()}
              <span style={{ color: 'var(--text-primary)' }}>
                {(() => {
                  const privacyOptions = [
                    { value: 'climate_zone_only', label: 'Bara klimatzon' },
                    { value: 'county_only', label: 'Län' },
                    { value: 'full', label: 'Full plats' }
                  ];
                  const selectedOption = privacyOptions.find(opt => opt.value === profile.location_privacy) || privacyOptions[1];
                  return selectedOption.label;
                })()}
              </span>
            </div>
          )}
          
          <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
            {t('profile.location_privacy_description')}
          </p>
        </div>

        {/* Save Button */}
        {isEditing && (
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-6 py-3 rounded-lg font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-sage)' }}
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Sparar...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{t('profile.save_profile')}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
