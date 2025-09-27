'use client';

import { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Bell, 
  Shield, 
  MapPin, 
  Phone,
  Camera,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor,
  Sprout,
  Home,
  Thermometer,
  Droplets,
  Sun as SunIcon
} from 'lucide-react';
import { RPACLogo } from '@/components/rpac-logo';
import { UserProfile } from '@/components/user-profile';
import { useUserProfile } from '@/lib/useUserProfile';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/locales';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Cultivation-specific state
  const [cultivationProfile, setCultivationProfile] = useState({
    climateZone: 'svealand' as 'gotaland' | 'svealand' | 'norrland',
    experienceLevel: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    gardenSize: 'medium' as 'small' | 'medium' | 'large',
    gardenType: 'outdoor' as 'indoor' | 'outdoor' | 'greenhouse' | 'mixed',
    soilType: 'clay' as 'clay' | 'sandy' | 'loamy' | 'unknown',
    sunExposure: 'partial' as 'full' | 'partial' | 'shade',
    waterAccess: 'good' as 'excellent' | 'good' | 'limited',
    timeAvailable: 'moderate' as 'limited' | 'moderate' | 'extensive',
    budget: 'medium' as 'low' | 'medium' | 'high',
    goals: [] as string[],
    preferences: [] as string[],
    challenges: [] as string[]
  });

  // User profile hook
  const { profile } = useUserProfile(user);

  // Auto-detect climate zone from user's location
  const getClimateZoneFromLocation = (county?: string): 'gotaland' | 'svealand' | 'norrland' => {
    if (!county) return 'svealand';
    
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
    
    return countyToClimateZone[county] || 'svealand';
  };

  // Update climate zone when profile changes
  useEffect(() => {
    if (profile?.county) {
      const detectedClimateZone = getClimateZoneFromLocation(profile.county);
      setCultivationProfile(prev => ({
        ...prev,
        climateZone: detectedClimateZone
      }));
    }
  }, [profile?.county]);

  // Load user on component mount
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    checkUser();
  }, []);
  
  // Form states
  const [profileData, setProfileData] = useState({
    name: 'Användare',
    email: 'user@example.com',
    phone: '+46 70 123 45 67',
    location: 'Stockholm, Sverige',
    bio: t('placeholders.default_bio'),
    avatar: null as File | null
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'sv',
    notifications: {
      email: true,
      push: true,
      sms: false,
      crisis: true
    },
    privacy: {
      profileVisible: true,
      locationSharing: false,
      dataCollection: true
    }
  });

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'cultivation', label: 'Odlingsprofil', icon: Sprout },
    { id: 'security', label: 'Säkerhet', icon: Lock },
    { id: 'notifications', label: 'Notifieringar', icon: Bell },
    { id: 'privacy', label: 'Integritet', icon: Shield },
    { id: 'preferences', label: 'Inställningar', icon: SettingsIcon }
  ];

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSaving(false);
    setSaveStatus('success');
    
    // Reset status after 3 seconds
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileData(prev => ({ ...prev, avatar: file }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" 
               style={{ borderColor: 'var(--color-sage)' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Laddar inställningar...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p style={{ color: 'var(--text-secondary)' }}>Du måste vara inloggad för att komma åt inställningar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Inställningar
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Hantera din profil, säkerhet och preferenser
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="modern-card p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'text-white shadow-lg'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      style={activeTab === tab.id ? { 
                        background: 'linear-gradient(135deg, #3D4A2B 0%, #2A331E 100%)'
                      } : {}}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <UserProfile 
                  user={user}
                  initialProfile={profile || undefined}
                  onProfileUpdate={(updatedProfile) => {
                    console.log('Profile updated:', updatedProfile);
                    // The profile is automatically saved by the component
                  }}
                />
              </div>
            )}

            {/* Cultivation Tab */}
            {activeTab === 'cultivation' && (
              <div className="space-y-6">
                <div className="modern-card p-8">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                    Odlingsprofil
                  </h2>
                  <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                    Ange dina odlingsförutsättningar för personlig planering
                  </p>

                  <div className="space-y-6">
                    {/* Climate Zone - Auto-detected from location */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Klimatzon
                      </label>
                      <div className="flex items-center space-x-2">
                        <select
                          value={cultivationProfile.climateZone}
                          onChange={(e) => setCultivationProfile(prev => ({ 
                            ...prev, 
                            climateZone: e.target.value as any 
                          }))}
                          className="flex-1 px-3 py-2 border rounded-lg"
                          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-secondary)' }}
                        >
                          <option value="gotaland">Götaland (Sydligaste Sverige)</option>
                          <option value="svealand">Svealand (Mellersta Sverige)</option>
                          <option value="norrland">Norrland (Norra Sverige)</option>
                        </select>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          Auto-detekterat från: {profile?.county || 'Okänd plats'}
                        </span>
                      </div>
                    </div>

                    {/* Experience Level */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Erfarenhetsnivå
                      </label>
                      <select
                        value={cultivationProfile.experienceLevel}
                        onChange={(e) => setCultivationProfile(prev => ({ 
                          ...prev, 
                          experienceLevel: e.target.value as any 
                        }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-secondary)' }}
                      >
                        <option value="beginner">Nybörjare</option>
                        <option value="intermediate">Mellannivå</option>
                        <option value="advanced">Avancerad</option>
                      </select>
                    </div>

                    {/* Garden Size */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Trädgårdsstorlek
                      </label>
                      <select
                        value={cultivationProfile.gardenSize}
                        onChange={(e) => setCultivationProfile(prev => ({ 
                          ...prev, 
                          gardenSize: e.target.value as any 
                        }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-secondary)' }}
                      >
                        <option value="small">Liten (0-50 m²)</option>
                        <option value="medium">Medium (50-200 m²)</option>
                        <option value="large">Stor (200+ m²)</option>
                      </select>
                    </div>

                    {/* Garden Type */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Trädgårdstyp
                      </label>
                      <select
                        value={cultivationProfile.gardenType}
                        onChange={(e) => setCultivationProfile(prev => ({ 
                          ...prev, 
                          gardenType: e.target.value as any 
                        }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-secondary)' }}
                      >
                        <option value="indoor">Inomhus</option>
                        <option value="outdoor">Utomhus</option>
                        <option value="greenhouse">Växthus</option>
                        <option value="mixed">Blandat</option>
                      </select>
                    </div>

                    {/* Soil Type */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Jordtyp
                      </label>
                      <select
                        value={cultivationProfile.soilType}
                        onChange={(e) => setCultivationProfile(prev => ({ 
                          ...prev, 
                          soilType: e.target.value as any 
                        }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-secondary)' }}
                      >
                        <option value="clay">Lerjord</option>
                        <option value="sandy">Sandjord</option>
                        <option value="loamy">Lerjord</option>
                        <option value="unknown">Okänd</option>
                      </select>
                    </div>

                    {/* Sun Exposure */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Solförhållanden
                      </label>
                      <select
                        value={cultivationProfile.sunExposure}
                        onChange={(e) => setCultivationProfile(prev => ({ 
                          ...prev, 
                          sunExposure: e.target.value as any 
                        }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-secondary)' }}
                      >
                        <option value="full">Full sol (6+ timmar)</option>
                        <option value="partial">Delvis sol (3-6 timmar)</option>
                        <option value="shade">Skugga (0-3 timmar)</option>
                      </select>
                    </div>

                    {/* Water Access */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Vattentillgång
                      </label>
                      <select
                        value={cultivationProfile.waterAccess}
                        onChange={(e) => setCultivationProfile(prev => ({ 
                          ...prev, 
                          waterAccess: e.target.value as any 
                        }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-secondary)' }}
                      >
                        <option value="excellent">Utmärkt (kranvatten nära)</option>
                        <option value="good">Bra (vattentank/brunn)</option>
                        <option value="limited">Begränsad (regnvattensamling)</option>
                      </select>
                    </div>

                    {/* Time Available */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Tid tillgänglig per vecka
                      </label>
                      <select
                        value={cultivationProfile.timeAvailable}
                        onChange={(e) => setCultivationProfile(prev => ({ 
                          ...prev, 
                          timeAvailable: e.target.value as any 
                        }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-secondary)' }}
                      >
                        <option value="limited">Begränsad (1-3 timmar)</option>
                        <option value="moderate">Måttlig (3-8 timmar)</option>
                        <option value="extensive">Omfattande (8+ timmar)</option>
                      </select>
                    </div>

                    {/* Budget */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Budget per år
                      </label>
                      <select
                        value={cultivationProfile.budget}
                        onChange={(e) => setCultivationProfile(prev => ({ 
                          ...prev, 
                          budget: e.target.value as any 
                        }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-secondary)' }}
                      >
                        <option value="low">Låg (0-2000 kr)</option>
                        <option value="medium">Medium (2000-5000 kr)</option>
                        <option value="high">Hög (5000+ kr)</option>
                      </select>
                    </div>

                    {/* Goals */}
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Odlingsmål
                      </label>
                      <div className="space-y-2">
                        {[
                          'Självförsörjning',
                          'Hälsosam mat',
                          'Kostnadsbesparing',
                          'Hobby & avkoppling',
                          'Miljövänlig livsstil',
                          'Krisberedskap'
                        ].map(goal => (
                          <label key={goal} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={cultivationProfile.goals.includes(goal)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCultivationProfile(prev => ({
                                    ...prev,
                                    goals: [...prev.goals, goal]
                                  }));
                                } else {
                                  setCultivationProfile(prev => ({
                                    ...prev,
                                    goals: prev.goals.filter(g => g !== goal)
                                  }));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm">{goal}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4">
                      <button
                        onClick={async () => {
                          if (!user?.id) return;
                          
                          setIsSaving(true);
                          try {
                            const { error } = await supabase
                              .from('cultivation_profiles')
                              .upsert({
                                user_id: user.id,
                                climate_zone: cultivationProfile.climateZone,
                                experience_level: cultivationProfile.experienceLevel,
                                garden_size: cultivationProfile.gardenSize,
                                garden_type: cultivationProfile.gardenType,
                                soil_type: cultivationProfile.soilType,
                                sun_exposure: cultivationProfile.sunExposure,
                                water_access: cultivationProfile.waterAccess,
                                time_available: cultivationProfile.timeAvailable,
                                budget: cultivationProfile.budget,
                                goals: cultivationProfile.goals,
                                preferences: cultivationProfile.preferences,
                                challenges: cultivationProfile.challenges,
                                updated_at: new Date().toISOString()
                              });

                            if (error) throw error;
                            setSaveStatus('success');
                          } catch (error) {
                            console.error('Error saving cultivation profile:', error);
                            setSaveStatus('error');
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        disabled={isSaving}
                        className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50"
                        style={{ 
                          backgroundColor: 'var(--color-sage)', 
                          color: 'white' 
                        }}
                      >
                        {isSaving ? 'Sparar...' : 'Spara Odlingsprofil'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="modern-card p-8">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                    Säkerhet & Lösenord
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Nuvarande lösenord
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={securityData.currentPassword}
                          onChange={(e) => setSecurityData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full pl-10 pr-12 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-800"
                          placeholder={t('placeholders.current_password')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Nytt lösenord
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={securityData.newPassword}
                          onChange={(e) => setSecurityData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full pl-10 pr-12 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-800"
                          placeholder={t('placeholders.new_password')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Bekräfta nytt lösenord
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="password"
                          value={securityData.confirmPassword}
                          onChange={(e) => setSecurityData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-800"
                          placeholder={t('placeholders.confirm_password')}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleSave()}
                      disabled={isSaving}
                      className="modern-button flex items-center space-x-2 px-6 py-3 text-white disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #3D4A2B 0%, #2A331E 100%)' }}
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? 'Uppdaterar...' : 'Uppdatera lösenord'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="modern-card p-8">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                    Notifieringar
                  </h2>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-slate-600" />
                        <div>
                          <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            E-postnotifieringar
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Få uppdateringar via e-post
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.notifications.email}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, email: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Bell className="w-5 h-5 text-slate-600" />
                        <div>
                          <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            Push-notifieringar
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Få notifieringar i webbläsaren
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.notifications.push}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, push: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-slate-600" />
                        <div>
                          <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            SMS-notifieringar
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Få viktiga meddelanden via SMS
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.notifications.sms}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, sms: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        <div>
                          <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            Krisnotifieringar
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Viktiga säkerhetsmeddelanden
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.notifications.crisis}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, crisis: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div className="modern-card p-8">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                    Integritet & Dataskydd
                  </h2>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-slate-600" />
                        <div>
                          <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            Synlig profil
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Låt andra användare se din profil
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.privacy.profileVisible}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, profileVisible: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-slate-600" />
                        <div>
                          <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            Platsdelning
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Dela din plats med andra användare
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.privacy.locationSharing}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, locationSharing: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-green-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-slate-600" />
                        <div>
                          <h3 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                            Datainsamling
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {t('settings.allow_data_collection')}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.privacy.dataCollection}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            privacy: { ...prev.privacy, dataCollection: e.target.checked }
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-green-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div className="modern-card p-8">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                    Applikationsinställningar
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                        Tema
                      </label>
                      <div className="flex space-x-4">
                        {[
                          { id: 'light', label: 'Ljust', icon: Sun },
                          { id: 'dark', label: 'Mörkt', icon: Moon },
                          { id: 'system', label: 'System', icon: Monitor }
                        ].map((theme) => {
                          const Icon = theme.icon;
                          return (
                            <button
                              key={theme.id}
                              onClick={() => setPreferences(prev => ({ ...prev, theme: theme.id }))}
                              className={`flex items-center space-x-2 px-4 py-3 rounded-lg border transition-all ${
                                preferences.theme === theme.id
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span className="text-sm font-medium">{theme.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
                        Språk
                      </label>
                      <select
                        value={preferences.language}
                        onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-800"
                      >
                        <option value="sv">Svenska</option>
                        <option value="en">English</option>
                        <option value="no">Norsk</option>
                        <option value="da">Dansk</option>
                      </select>
                    </div>

                    <button
                      onClick={() => handleSave()}
                      disabled={isSaving}
                      className="modern-button flex items-center space-x-2 px-6 py-3 text-white disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #3D4A2B 0%, #2A331E 100%)' }}
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? 'Sparar...' : 'Spara inställningar'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
