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
  Shield,
  MapPin,
  Phone,
  Home,
  Heart,
  Users,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Edit3
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { validateUserProfile, sanitizeHtml } from '@/lib/validation';
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
  location_privacy: string;
  
  // Emergency
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  
  // Medical
  medical_conditions: string;
  medications: string;
  allergies: string;
  blood_type: string;
  special_needs: string;
  
  // Household
  household_size: number;
  has_children: boolean;
  has_elderly: boolean;
  has_pets: boolean;
  pet_types: string;
}

// Define Section component OUTSIDE to prevent re-creation on every render
const SectionComponent = ({ 
  title, 
  icon: Icon, 
  sectionKey,
  expandedSections,
  toggleSection,
  children 
}: { 
  title: string; 
  icon: any; 
  sectionKey: string;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;
  children: React.ReactNode 
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
    <button
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
      type="button"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3D4A2B] to-[#5C6B47] flex items-center justify-center">
          <Icon size={20} className="text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {expandedSections[sectionKey] ? (
        <ChevronUp className="text-gray-400" size={20} />
      ) : (
        <ChevronDown className="text-gray-400" size={20} />
      )}
    </button>
    {expandedSections[sectionKey] && (
      <div className="p-6 pt-0 border-t border-gray-100">
        {children}
      </div>
    )}
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
    location_privacy: 'county_only',
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
    pet_types: ''
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    identity: true,
    location: false,
    emergency: false,
    medical: false,
    household: false
  });
  
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
          location_privacy: localLocationPrivacy || 'county_only',
          emergency_contact_name: data.emergency_contact_name || '',
          emergency_contact_phone: data.emergency_contact_phone || '',
          emergency_contact_relation: data.emergency_contact_relation || '',
          medical_conditions: data.medical_conditions || '',
          medications: data.medications || '',
          allergies: data.allergies || '',
          blood_type: data.blood_type || '',
          special_needs: data.special_needs || '',
          household_size: data.household_size || 1,
          has_children: data.has_children || false,
          has_elderly: data.has_elderly || false,
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
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || '',
        emergency_contact_relation: profile.emergency_contact_relation || '',
        medical_conditions: profile.medical_conditions || '',
        medications: profile.medications || '',
        allergies: profile.allergies || '',
        blood_type: profile.blood_type || '',
        special_needs: profile.special_needs || '',
        household_size: profile.household_size || 1,
        has_children: profile.has_children || false,
        has_elderly: profile.has_elderly || false,
        has_pets: profile.has_pets || false,
        pet_types: profile.pet_types || ''
      };

      const validatedData = validateUserProfile(profileData);

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

      // Save location privacy to localStorage
      if (profile.location_privacy) {
        localStorage.setItem(`user_${user.id}_location_privacy`, profile.location_privacy);
      }

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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3D4A2B]"></div>
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

      {/* Identity & Privacy Section - Always Visible */}
      <SectionComponent 
        title="Identitet & Integritet" 
        icon={User} 
        sectionKey="identity"
        expandedSections={expandedSections}
        toggleSection={toggleSection}
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
                Välj en profilbild som representerar dig. Max 2MB (JPG, PNG, GIF).
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

          {/* Privacy Preferences */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-5 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="text-[#3D4A2B]" size={18} />
              <h4 className="font-semibold text-gray-900">Synlighet</h4>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Välj hur ditt namn visas för andra användare
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { value: 'display_name', label: 'Visningsnamn', emoji: '👤' },
                { value: 'first_last', label: 'För- & efternamn', emoji: '👥' },
                { value: 'initials', label: 'Initialer', emoji: '🔒' },
                { value: 'email', label: 'E-postprefix', emoji: '📧' }
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    profile.name_display_preference === option.value
                      ? 'border-[#3D4A2B] bg-white shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="name_display_preference"
                    value={option.value}
                    checked={profile.name_display_preference === option.value}
                    onChange={handleInputChange('name_display_preference')}
                    className="text-[#3D4A2B] focus:ring-[#3D4A2B]"
                  />
                  <span className="text-xl">{option.emoji}</span>
                  <span className="text-sm font-medium text-gray-900">{option.label}</span>
                </label>
              ))}
            </div>

            {/* Preview */}
            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500 mb-2">Förhandsgranskning:</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#3D4A2B] to-[#5C6B47] flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} className="text-white" />
                  )}
                </div>
                <span className="font-medium text-gray-900">{getDisplayNamePreview()}</span>
              </div>
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
        </div>
      </SectionComponent>

      {/* Location Section */}
      <SectionComponent 
        title="Plats & Bostadsinformation" 
        icon={MapPin} 
        sectionKey="location"
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      >
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
                type="text"
                value={profile.postal_code}
                onChange={handleInputChange('postal_code')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Län</label>
              <input
                type="text"
                value={profile.county}
                onChange={handleInputChange('county')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                placeholder="Stockholms län"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Shield size={16} className="inline mr-2" />
              Platsintegritet
            </label>
            <select
              value={profile.location_privacy}
              onChange={handleInputChange('location_privacy')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
            >
              <option value="exact">Exakt adress (max öppenhet)</option>
              <option value="city_only">Endast stad</option>
              <option value="county_only">Endast län (rekommenderat)</option>
              <option value="hidden">Dölj plats helt</option>
            </select>
          </div>
        </div>
      </SectionComponent>

      {/* Emergency Contact */}
      <SectionComponent 
        title="Akutkontakt" 
        icon={AlertTriangle} 
        sectionKey="emergency"
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kontaktperson</label>
            <input
              type="text"
              value={profile.emergency_contact_name}
              onChange={handleInputChange('emergency_contact_name')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
              placeholder="Namn på närstående"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telefonnummer</label>
              <input
                type="tel"
                value={profile.emergency_contact_phone}
                onChange={handleInputChange('emergency_contact_phone')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                placeholder="+46 70 123 45 67"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Relation</label>
              <input
                type="text"
                value={profile.emergency_contact_relation}
                onChange={handleInputChange('emergency_contact_relation')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                placeholder="t.ex. make/maka, barn, förälder"
              />
            </div>
          </div>
        </div>
      </SectionComponent>

      {/* Medical Information */}
      <SectionComponent 
        title="Medicinsk information" 
        icon={Heart} 
        sectionKey="medical"
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Medicinska tillstånd</label>
              <textarea
                value={profile.medical_conditions}
                onChange={handleInputChange('medical_conditions')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                rows={2}
                placeholder="t.ex. diabetes, astma..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mediciner</label>
              <textarea
                value={profile.medications}
                onChange={handleInputChange('medications')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                rows={2}
                placeholder="Regelbunden medicinering..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Allergier</label>
              <input
                type="text"
                value={profile.allergies}
                onChange={handleInputChange('allergies')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                placeholder="Födoämnen, medicin..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Blodgrupp</label>
              <select
                value={profile.blood_type}
                onChange={handleInputChange('blood_type')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
              >
                <option value="">Välj blodgrupp</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Särskilda behov</label>
              <textarea
                value={profile.special_needs}
                onChange={handleInputChange('special_needs')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
                rows={2}
                placeholder="Funktionsvariationer, hjälpbehov..."
              />
            </div>
          </div>
        </div>
      </SectionComponent>

      {/* Household */}
      <SectionComponent 
        title="Hushållsinformation" 
        icon={Users} 
        sectionKey="household"
        expandedSections={expandedSections}
        toggleSection={toggleSection}
      >
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
                checked={profile.has_children}
                onChange={handleCheckboxChange('has_children')}
                className="w-5 h-5 text-[#3D4A2B] rounded focus:ring-[#3D4A2B]"
              />
              <span className="text-sm font-medium text-gray-900">Barn i hushållet</span>
            </label>

            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.has_elderly}
                onChange={handleCheckboxChange('has_elderly')}
                className="w-5 h-5 text-[#3D4A2B] rounded focus:ring-[#3D4A2B]"
              />
              <span className="text-sm font-medium text-gray-900">Äldre i hushållet</span>
            </label>

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

