'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/locales';
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
  county: string;
  municipality?: string;
  postal_code?: string;
  climate_zone: 'gotaland' | 'svealand' | 'norrland';
  experience_level: 'beginner' | 'intermediate' | 'expert';
  garden_size: 'none' | 'balcony' | 'small' | 'medium' | 'large' | 'farm';
  growing_preferences: string[];
  location_privacy: 'full' | 'county_only' | 'climate_zone_only';
  family_size: number;
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

const plantPreferences = [
  'potatoes', 'carrots', 'cabbage', 'onions', 'lettuce', 'radishes',
  'peas', 'beans', 'tomatoes', 'cucumbers', 'herbs', 'spinach',
  'kale', 'leeks', 'beets'
];

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
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    county: 'stockholm',
    climate_zone: 'svealand',
    experience_level: 'beginner',
    garden_size: 'medium',
    growing_preferences: ['potatoes', 'carrots', 'lettuce'],
    location_privacy: 'county_only',
    family_size: 1,
    pets: [],
    ...initialProfile
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Auto-detect climate zone when county changes
  useEffect(() => {
    if (profile.county) {
      const climateZone = countyToClimateZone[profile.county];
      if (climateZone) {
        setProfile(prev => ({ ...prev, climate_zone: climateZone }));
      }
    }
  }, [profile.county]);

  // Load profile from localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem(`userProfile_${user.id}`);
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        // Convert string dates back to Date objects
        const profileWithDates = {
          ...parsed,
          created_at: parsed.created_at ? new Date(parsed.created_at) : new Date(),
          updated_at: parsed.updated_at ? new Date(parsed.updated_at) : new Date()
        };
        setProfile(prev => ({ ...prev, ...profileWithDates }));
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    }
  }, [user.id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage (in production this would be Supabase)
      const profileToSave: UserProfile = {
        id: profile.id || `profile_${user.id}`,
        user_id: user.id,
        county: profile.county || '',
        municipality: profile.municipality,
        postal_code: profile.postal_code,
        climate_zone: profile.climate_zone || 'svealand',
        experience_level: profile.experience_level || 'beginner',
        garden_size: profile.garden_size || 'none',
        growing_preferences: profile.growing_preferences || [],
        location_privacy: profile.location_privacy || 'county_only',
        family_size: profile.family_size || 1,
        pets: profile.pets || [],
        created_at: profile.created_at || new Date(),
        updated_at: new Date()
      };
      
      // For localStorage, we need to convert dates to strings
      const profileForStorage = {
        ...profileToSave,
        created_at: profileToSave.created_at?.toISOString() || new Date().toISOString(),
        updated_at: profileToSave.updated_at.toISOString()
      };
      
      localStorage.setItem(`userProfile_${user.id}`, JSON.stringify(profileForStorage));
      
      // Call callback if provided
      onProfileUpdate?.(profileToSave);
      
      setSaveMessage(t('profile.profile_saved'));
      setIsEditing(false);
      
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveMessage('Ett fel uppstod vid sparande');
    } finally {
      setIsSaving(false);
    }
  };

  const getLocationDisplayText = () => {
    if (profile.location_privacy === 'climate_zone_only') {
      return t(`cultivation.climate_zones.${profile.climate_zone}`);
    } else if (profile.location_privacy === 'county_only') {
      return t(`profile.counties.${profile.county}`);
    } else {
      return `${t(`profile.counties.${profile.county}`)}${profile.municipality ? `, ${profile.municipality}` : ''}`;
    }
  };

  const getPrivacyIcon = () => {
    switch (profile.location_privacy) {
      case 'full': return Globe;
      case 'county_only': return MapPin;
      case 'climate_zone_only': return Shield;
      default: return MapPin;
    }
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
            {t(`profile.experience_levels.${profile.experience_level}`)} • {t(`profile.garden_sizes.${profile.garden_size}`)}
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
                  {Object.keys(countyToClimateZone).map(county => (
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

            {/* Climate Zone (Auto-detected) */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('profile.climate_zone')}
              </label>
              <div className="p-3 rounded-lg flex items-center space-x-2" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
                <span style={{ color: 'var(--text-primary)' }}>
                  {t(`cultivation.climate_zones.${profile.climate_zone}`)}
                </span>
                <div className="text-xs px-2 py-1 rounded" style={{
                  backgroundColor: 'var(--color-sage)',
                  color: 'white'
                }}>
                  Auto
                </div>
              </div>
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
                  value={profile.municipality || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, municipality: e.target.value }))}
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

        {/* Experience and Garden */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Experience Level */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('profile.experience_level')}
            </label>
            {isEditing ? (
              <select
                value={profile.experience_level}
                onChange={(e) => setProfile(prev => ({ ...prev, experience_level: e.target.value as any }))}
                className="w-full p-3 border rounded-lg"
                style={{ borderColor: 'var(--color-secondary)' }}
              >
                <option value="beginner">{t('profile.experience_levels.beginner')}</option>
                <option value="intermediate">{t('profile.experience_levels.intermediate')}</option>
                <option value="expert">{t('profile.experience_levels.expert')}</option>
              </select>
            ) : (
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
                <span style={{ color: 'var(--text-primary)' }}>
                  {t(`profile.experience_levels.${profile.experience_level}`)}
                </span>
              </div>
            )}
          </div>

          {/* Garden Size */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              {t('profile.garden_size')}
            </label>
            {isEditing ? (
              <select
                value={profile.garden_size}
                onChange={(e) => setProfile(prev => ({ ...prev, garden_size: e.target.value as any }))}
                className="w-full p-3 border rounded-lg"
                style={{ borderColor: 'var(--color-secondary)' }}
              >
                <option value="none">{t('profile.garden_sizes.none')}</option>
                <option value="balcony">{t('profile.garden_sizes.balcony')}</option>
                <option value="small">{t('profile.garden_sizes.small')}</option>
                <option value="medium">{t('profile.garden_sizes.medium')}</option>
                <option value="large">{t('profile.garden_sizes.large')}</option>
                <option value="farm">{t('profile.garden_sizes.farm')}</option>
              </select>
            ) : (
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
                <span style={{ color: 'var(--text-primary)' }}>
                  {t(`profile.garden_sizes.${profile.garden_size}`)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Family Size */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('profile.family_size')}
          </label>
          {isEditing ? (
            <select
              value={profile.family_size || 1}
              onChange={(e) => setProfile(prev => ({ ...prev, family_size: parseInt(e.target.value) }))}
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
                      checked={profile.pets?.includes(petType) || false}
                      onChange={(e) => {
                        const pets = profile.pets || [];
                        if (e.target.checked) {
                          setProfile(prev => ({ 
                            ...prev, 
                            pets: [...pets, petType] 
                          }));
                        } else {
                          setProfile(prev => ({ 
                            ...prev, 
                            pets: pets.filter(p => p !== petType) 
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
              {profile.pets && profile.pets.length > 0 && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
                  <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                    Dina husdjur:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.pets.map(pet => (
                      <span 
                        key={pet}
                        className="px-2 py-1 rounded text-xs"
                        style={{
                          backgroundColor: 'var(--color-sage)',
                          color: 'white'
                        }}
                      >
                        {pet}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
              {profile.pets && profile.pets.length > 0 ? (
                <div>
                  <span style={{ color: 'var(--text-primary)' }}>
                    {profile.pets.length} {profile.pets.length === 1 ? 'husdjur' : 'husdjur'}
                  </span>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {profile.pets.map(pet => (
                      <span 
                        key={pet}
                        className="px-2 py-1 rounded text-xs"
                        style={{
                          backgroundColor: 'var(--color-sage)',
                          color: 'white'
                        }}
                      >
                        {pet}
                      </span>
                    ))}
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

        {/* Growing Preferences */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('profile.growing_preferences')}
          </label>
          {isEditing ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {plantPreferences.map(plant => (
                <label key={plant} className="flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={profile.growing_preferences?.includes(plant) || false}
                    onChange={(e) => {
                      const preferences = profile.growing_preferences || [];
                      if (e.target.checked) {
                        setProfile(prev => ({ 
                          ...prev, 
                          growing_preferences: [...preferences, plant] 
                        }));
                      } else {
                        setProfile(prev => ({ 
                          ...prev, 
                          growing_preferences: preferences.filter(p => p !== plant) 
                        }));
                      }
                    }}
                  />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {t(`cultivation.plants.${plant}`)}
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.growing_preferences?.map(plant => (
                <span 
                  key={plant}
                  className="px-2 py-1 rounded text-xs"
                  style={{
                    backgroundColor: 'var(--color-sage)',
                    color: 'white'
                  }}
                >
                  {t(`cultivation.plants.${plant}`)}
                </span>
              ))}
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
                    onChange={(e) => setProfile(prev => ({ ...prev, location_privacy: e.target.value as any }))}
                  />
                  <option.icon className="w-4 h-4" style={{ color: 'var(--color-sage)' }} />
                  <span style={{ color: 'var(--text-primary)' }}>{option.label}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg flex items-center space-x-2" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
              {(() => {
                const PrivacyIcon = getPrivacyIcon();
                return <PrivacyIcon className="w-4 h-4" style={{ color: 'var(--color-sage)' }} />;
              })()}
              <span style={{ color: 'var(--text-primary)' }}>
                {profile.location_privacy === 'climate_zone_only' ? 'Bara klimatzon' :
                 profile.location_privacy === 'county_only' ? 'Län' : 'Full plats'}
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
