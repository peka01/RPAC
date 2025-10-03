'use client';

import { useState, useEffect, useRef } from 'react';
import {
  User,
  Camera,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Upload,
  X,
  Shield,
  Globe
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface EnhancedProfileEditorProps {
  user: SupabaseUser;
  onSave?: () => void;
}

interface ProfileData {
  display_name: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  name_display_preference: 'email' | 'display_name' | 'first_last' | 'initials';
}

export function EnhancedProfileEditor({ user, onSave }: EnhancedProfileEditorProps) {
  const [profile, setProfile] = useState<ProfileData>({
    display_name: '',
    first_name: '',
    last_name: '',
    avatar_url: null,
    name_display_preference: 'display_name'
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, [user.id]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('display_name, first_name, last_name, avatar_url, name_display_preference')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setProfile({
          display_name: data.display_name || user.email?.split('@')[0] || '',
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          avatar_url: data.avatar_url || null,
          name_display_preference: data.name_display_preference || 'display_name'
        });
        
        if (data.avatar_url) {
          setAvatarPreview(data.avatar_url);
        }
      } else {
        // No profile yet, use email as default
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Bilden är för stor (max 2MB)' });
      return;
    }

    // Validate file type
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
      // Create unique filename
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        
        // If bucket doesn't exist, return current avatar
        if (uploadError.message.includes('not found') || uploadError.message.includes('does not exist')) {
          setMessage({ 
            type: 'error', 
            text: 'Avatar-lagring är inte konfigurerad än. Profilen sparas utan bild.' 
          });
          return profile.avatar_url;
        }
        
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setMessage({ type: 'error', text: 'Kunde inte ladda upp profilbild' });
      return profile.avatar_url;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Upload avatar if changed
      const avatarUrl = await uploadAvatar();

      // Save profile to database
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          display_name: profile.display_name.trim() || user.email?.split('@')[0] || 'Användare',
          first_name: profile.first_name.trim() || null,
          last_name: profile.last_name.trim() || null,
          avatar_url: avatarUrl,
          name_display_preference: profile.name_display_preference,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profil sparad!' });
      
      // Clear avatar file after successful save
      setAvatarFile(null);
      
      if (onSave) onSave();

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Kunde inte spara profil' });
    } finally {
      setSaving(false);
    }
  };

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
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profilinformation</h2>
            <p className="text-gray-600">Anpassa hur ditt namn och profilbild visas för andra</p>
          </div>
          <User size={32} className="text-[#3D4A2B]" />
        </div>

        {/* Avatar Upload */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Profilbild
          </label>
          <div className="flex items-center gap-6">
            {/* Avatar Preview */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-[#3D4A2B] to-[#5C6B47] flex items-center justify-center">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Profilbild" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-white" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-[#3D4A2B] text-white p-2 rounded-full hover:bg-[#2A331E] transition-colors shadow-lg"
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

            {/* Upload Instructions */}
            <div className="flex-1">
              <p className="text-sm text-gray-700 mb-2">
                Välj en profilbild som representerar dig. Max 2MB.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-[#5C6B47] text-white rounded-lg hover:bg-[#4A5239] transition-colors text-sm flex items-center gap-2"
                >
                  <Upload size={16} />
                  Ladda upp bild
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
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Display Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visningsnamn *
            </label>
            <input
              type="text"
              value={profile.display_name}
              onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
              placeholder="t.ex. användare, min_nickname"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Detta namn visas som standard i meddelanden och samhällen
            </p>
          </div>

          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Förnamn (valfritt)
            </label>
            <input
              type="text"
              value={profile.first_name}
              onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
              placeholder="Ditt förnamn"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Efternamn (valfritt)
            </label>
            <input
              type="text"
              value={profile.last_name}
              onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3D4A2B]"
              placeholder="Ditt efternamn"
            />
          </div>
        </div>

        {/* Privacy: Name Display Preference */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="text-[#3D4A2B] flex-shrink-0 mt-1" size={20} />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-2">Integritetsinställningar</h3>
              <p className="text-sm text-gray-600 mb-4">
                Välj vad andra användare ska se när de tittar på din profil
              </p>
              
              <div className="space-y-3">
                {[
                  { 
                    value: 'display_name', 
                    label: 'Visningsnamn', 
                    description: 'Visa ditt valda visningsnamn',
                    icon: Globe
                  },
                  { 
                    value: 'first_last', 
                    label: 'För- och efternamn', 
                    description: 'Visa ditt fullständiga namn (om angivet)',
                    icon: User
                  },
                  { 
                    value: 'initials', 
                    label: 'Initialer', 
                    description: 'Visa endast initialer (max integritet)',
                    icon: Shield
                  },
                  { 
                    value: 'email', 
                    label: 'E-postprefix', 
                    description: 'Visa delen före @ i din e-post',
                    icon: Globe
                  }
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        profile.name_display_preference === option.value
                          ? 'border-[#3D4A2B] bg-[#3D4A2B]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="name_display_preference"
                        value={option.value}
                        checked={profile.name_display_preference === option.value}
                        onChange={(e) => setProfile(prev => ({ 
                          ...prev, 
                          name_display_preference: e.target.value as any 
                        }))}
                        className="mt-1"
                      />
                      <Icon size={20} className="text-gray-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Preview */}
              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-xs font-medium text-gray-600 mb-2">Förhandsgranskning:</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[#3D4A2B] to-[#5C6B47] flex items-center justify-center">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{getDisplayNamePreview()}</p>
                    <p className="text-xs text-gray-500">Så här ser andra ditt namn</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`flex items-center gap-2 p-4 rounded-lg mb-4 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            disabled={saving || !profile.display_name.trim()}
            className="px-6 py-3 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#2A331E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sparar...
              </>
            ) : (
              <>
                <Save size={18} />
                Spara profil
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

