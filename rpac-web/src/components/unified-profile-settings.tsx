'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  User,
  Camera,
  Save,
  AlertCircle,
  CheckCircle,
  Upload,
  X,
  MapPin,
  Users
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { validateUserProfile, sanitizeHtml } from '@/lib/validation';
import { geographicService } from '@/lib/geographic-service';
import { t } from '@/lib/locales';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UnifiedProfileSettingsProps {
  user: SupabaseUser;
  onSave?: () => void;
}

interface ProfileData {
  // Identity
  display_name: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  name_display_preference: 'email' | 'display_name' | 'first_last' | 'initials';
  
  // Contact
  email: string;
  phone: string;
  
  // Location
  address: string;
  postal_code: string;
  city: string;
  county: string;
  
  // Household
  household_size: number;
  has_pets: boolean;
  pet_types: string;
}

// Section component - all sections always visible
const SectionComponent = ({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string; 
  icon: React.ComponentType<{ className?: string }>; 
  children: React.ReactNode 
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <div className="flex items-center gap-3 p-5 bg-gradient-to-r from-[#3D4A2B]/5 to-[#5C6B47]/5 border-b border-gray-100">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3D4A2B] to-[#5C6B47] flex items-center justify-center">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

const UnifiedProfileSettingsComponent = ({ user, onSave }: UnifiedProfileSettingsProps) => {
  const [profile, setProfile] = useState<ProfileData>({
    display_name: '',
    first_name: '',
    last_name: '',
    avatar_url: null,
    name_display_preference: 'display_name',
    email: user.email || '',
    phone: '',
    address: '',
    postal_code: '',
    city: '',
    county: '',
    household_size: 1,
    has_pets: false,
    pet_types: ''
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  // All sections always expanded - no dropdowns
  const [highlightPostalCode, setHighlightPostalCode] = useState(false);
  
  const postalCodeRef = useRef<HTMLInputElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile on mount
  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const localLocationPrivacy = localStorage.getItem(`user_${user.id}_location_privacy`);
        
        setProfile({
          display_name: data.display_name || user.email?.split('@')[0] || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          avatar_url: data.avatar_url || null,
          name_display_preference: data.name_display_preference || 'display_name',
          email: user.email || '',
          phone: data.phone || '',
          address: data.address || '',
          postal_code: data.postal_code || '',
          city: data.city || '',
          county: data.county || '',
          household_size: data.household_size || 1,
          has_pets: data.has_pets || false,
          pet_types: data.pet_types || ''
        });
        
        if (data.avatar_url) {
          setAvatarPreview(data.avatar_url);
        }
      } else {
        setProfile(prev => ({
          ...prev,
          display_name: user.email?.split('@')[0] || ''
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Kunde inte ladda profil' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Auto-fill county based on postal code
  useEffect(() => {
    if (profile.postal_code && profile.postal_code.length === 5) {
      const derivedCountyName = geographicService.getCountyFromPostalCode(profile.postal_code);
      
      // Convert Swedish county name to database code format
      const countyNameToCode: Record<string, string> = {
        'Stockholm län': 'stockholm',
        'Uppsala län': 'uppsala',
        'Södermanland län': 'sodermanland',
        'Östergötland län': 'ostergotland',
        'Jönköping län': 'jonkoping',
        'Kronoberg län': 'kronoberg',
        'Kalmar län': 'kalmar',
        'Blekinge län': 'blekinge',
        'Skåne län': 'skane',
        'Halland län': 'halland',
        'Västra Götaland län': 'vastra_gotaland',
        'Värmland län': 'varmland',
        'Örebro län': 'orebro',
        'Västmanland län': 'vastmanland',
        'Dalarna län': 'dalarna',
        'Gävleborg län': 'gavleborg',
        'Västernorrland län': 'vasternorrland',
        'Jämtland län': 'jamtland',
        'Västerbotten län': 'vasterbotten',
        'Norrbotten län': 'norrbotten'
      };
      
      const countyCode = countyNameToCode[derivedCountyName];
      if (countyCode && countyCode !== profile.county) {
        setProfile(prev => ({ ...prev, county: countyCode }));
      }
    }
  }, [profile.postal_code]); // Run when postal code changes

  // Separate effect for highlighting - runs after loading completes
  useEffect(() => {
    if (loading) return; // Don't run while loading
    
    // Check if we should highlight postal code field (from URL parameter)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const highlightParam = params.get('highlight');
      
      if (highlightParam === 'postal_code') {
        setHighlightPostalCode(true);
        
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const element = postalCodeRef.current;
            
            if (element) {
              // Scroll into view
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              
              // Focus after scroll animation completes
              setTimeout(() => {
                element.focus();
                element.select();
              }, 600);
            }
          });
        });
        
        // Remove highlight after 4 seconds
        setTimeout(() => setHighlightPostalCode(false), 4600);
      }
    }
  }, [loading]); // Run when loading state changes

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Bilden är för stor (max 2MB)' });
      return;
    }

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Endast bilder är tillåtna' });
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return profile.avatar_url;

    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.warn('Avatar upload skipped:', uploadError.message);
        // Don't show error to user, just skip avatar upload and save the rest
        // This allows profile to save even if avatar bucket isn't set up yet
        return profile.avatar_url;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.warn('Avatar upload failed:', error);
      // Don't throw error, just return existing avatar and let profile save
      return profile.avatar_url;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const avatarUrl = await uploadAvatar();

      // Prepare and validate data
      const profileData = {
        display_name: profile.display_name.trim() || user.email?.split('@')[0] || 'Användare',
        email: profile.email || user.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        postal_code: profile.postal_code || '',
        city: profile.city || '',
        county: profile.county ? profile.county.toLowerCase() : '', // Normalize to lowercase before validation
        household_size: profile.household_size || 1,
        has_pets: profile.has_pets || false,
        pet_types: profile.pet_types || ''
      };

      const validatedData = validateUserProfile(profileData);

      const sanitizedData = {
        ...validatedData,
        display_name: sanitizeHtml(validatedData.display_name),
        address: validatedData.address ? sanitizeHtml(validatedData.address) : '',
        pet_types: validatedData.pet_types ? sanitizeHtml(validatedData.pet_types) : ''
      };

      const profileToSave = {
        user_id: user.id,
        ...sanitizedData,
        first_name: profile.first_name.trim() || null,
        last_name: profile.last_name.trim() || null,
        avatar_url: avatarUrl,
        name_display_preference: profile.name_display_preference,
        updated_at: new Date().toISOString()
      };

      // Check if profile exists first
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let error;
      if (existingProfile) {
        // Update existing profile
        const result = await supabase
          .from('user_profiles')
          .update(profileToSave)
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // Insert new profile
        const result = await supabase
          .from('user_profiles')
          .insert([profileToSave]);
        error = result.error;
      }

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profil sparad!' });
      setAvatarFile(null);
      
      if (onSave) onSave();

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Kunde inte spara profil' });
    } finally {
      setSaving(false);
    }
  };

  // No toggle needed - all sections always visible

  // Stable input change handlers
  const handleInputChange = useCallback((field: keyof ProfileData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setProfile(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCheckboxChange = useCallback((field: keyof ProfileData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const checked = e.target.checked;
    setProfile(prev => ({ ...prev, [field]: checked }));
  }, []);

  const handleNumberChange = useCallback((field: keyof ProfileData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseInt(e.target.value) || 1;
    setProfile(prev => ({ ...prev, [field]: value }));
  }, []);

  const getDisplayNamePreview = () => {
    switch (profile.name_display_preference) {
      case 'email':
        return user.email?.split('@')[0] || 'användare';
      case 'display_name':
        return profile.display_name || user.email?.split('@')[0] || 'användare';
      case 'first_last':
        if (profile.first_name && profile.last_name) {
          return `${profile.first_name} ${profile.last_name}`;
        }
        return profile.display_name || user.email?.split('@')[0] || 'användare';
      case 'initials':
        if (profile.first_name && profile.last_name) {
          return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
        }
        return (profile.display_name || user.email?.split('@')[0] || 'U').substring(0, 2).toUpperCase();
      default:
        return profile.display_name || user.email?.split('@')[0] || 'användare';
    }
  };

  const getCountyDisplayName = (countyCode: string) => {
    if (!countyCode) return '';
    
    const countyMap: Record<string, string> = {
      'stockholm': 'Stockholms län',
      'uppsala': 'Uppsala län',
      'sodermanland': 'Södermanlands län',
      'ostergotland': 'Östergötlands län',
      'jonkoping': 'Jönköpings län',
      'kronoberg': 'Kronobergs län',
      'kalmar': 'Kalmars län',
      'blekinge': 'Blekinges län',
      'skane': 'Skånes län',
      'halland': 'Hallands län',
      'vastra_gotaland': 'Västra Götalands län',
      'varmland': 'Värmlands län',
      'orebro': 'Örebro län',
      'vastmanland': 'Västmanlands län',
      'dalarna': 'Dalarnas län',
      'gavleborg': 'Gävleborgs län',
      'vasternorrland': 'Västernorrlands län',
      'jamtland': 'Jämtlands län',
      'vasterbotten': 'Västerbottens län',
      'norrbotten': 'Norrbottens län'
    };
    
    return countyMap[countyCode] || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ShieldProgressSpinner size="md" color="olive" message="Laddar" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message Display */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Profile Section */}
      <SectionComponent 
        title="Profil" 
        icon={User}
      >
        <div className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-[#3D4A2B] to-[#5C6B47] flex items-center justify-center ring-4 ring-gray-100">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Profilbild" className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-white" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-[#3D4A2B] text-white p-2.5 rounded-full hover:bg-[#2A331E] transition-all shadow-lg hover:shadow-xl"
                title="Ändra profilbild"
              >
                <Camera size={16} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="flex-1 space-y-3">
              <p className="text-sm text-gray-600">
                Välj en profilbild. Max 2MB (JPG, PNG, GIF).
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#5C6B47] text-white rounded-lg hover:bg-[#4A5239] transition-colors text-sm flex items-center gap-2"
                >
                  <Upload size={16} />
                  Ladda upp
                </button>
                {avatarPreview && profile.avatar_url && (
                  <button
                    onClick={() => {
                      setAvatarPreview(null);
                      setAvatarFile(null);
                      setProfile(prev => ({ ...prev, avatar_url: null }));
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
                  >
                    <X size={16} />
                    Ta bort
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visningsnamn <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={profile.display_name}
                onChange={handleInputChange('display_name')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                placeholder="t.ex. användare, min_nickname"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Förnamn
              </label>
              <input
                type="text"
                value={profile.first_name}
                onChange={handleInputChange('first_name')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                placeholder="Ditt förnamn"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Efternamn
              </label>
              <input
                type="text"
                value={profile.last_name}
                onChange={handleInputChange('last_name')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                placeholder="Ditt efternamn"
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-post
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={handleInputChange('phone')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                placeholder="+46 70 123 45 67"
              />
            </div>
          </div>

          {/* Location Information */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Platsinformation
            </h4>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adress</label>
                  <input
                    type="text"
                    value={profile.address}
                    onChange={handleInputChange('address')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                    placeholder="Gatuadress"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postnummer</label>
                  <input
                    ref={postalCodeRef}
                    type="text"
                    value={profile.postal_code}
                    onChange={handleInputChange('postal_code')}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] transition-all duration-300 ${
                      highlightPostalCode 
                        ? 'border-[#3D4A2B] ring-4 ring-[#3D4A2B]/20 bg-[#5C6B47]/5' 
                        : 'border-gray-300'
                    }`}
                    placeholder="123 45"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stad</label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={handleInputChange('city')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                    placeholder="Stockholm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Län
                    {profile.county && <span className="text-xs text-gray-500 ml-2">(fylls i automatiskt)</span>}
                  </label>
                  <input
                    type="text"
                    value={getCountyDisplayName(profile.county)}
                    readOnly
                    disabled
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                    placeholder="Fylls i automatiskt från postnummer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Household Information */}
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Hushållsinformation
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Antal personer i hushållet</label>
                <input
                  type="number"
                  min="1"
                  value={profile.household_size}
                  onChange={handleNumberChange('household_size')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={profile.has_pets}
                    onChange={handleCheckboxChange('has_pets')}
                    className="w-5 h-5 text-[#3D4A2B] rounded focus:ring-[#3D4A2B]"
                  />
                  <span className="text-sm font-medium text-gray-900">Husdjur</span>
                </label>
              </div>

              {profile.has_pets && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Typ av husdjur</label>
                  <input
                    type="text"
                    value={profile.pet_types}
                    onChange={handleInputChange('pet_types')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                    placeholder="t.ex. hund, katt, kanin..."
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </SectionComponent>


      {/* Save Button - Sticky */}
      <div className="sticky bottom-6 z-10">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <button
            onClick={handleSave}
            disabled={saving || !profile.display_name.trim()}
            className="w-full px-6 py-3.5 bg-gradient-to-r from-[#3D4A2B] to-[#2A331E] text-white rounded-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-semibold text-lg"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Sparar profil...
              </>
            ) : (
              <>
                <Save size={20} />
                Spara all profilinformation
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export const UnifiedProfileSettings = memo(UnifiedProfileSettingsComponent);

