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
  AlertCircle,
  AlertTriangle,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor
} from 'lucide-react';
import { UnifiedProfileSettings } from '@/components/unified-profile-settings';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
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
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // User profile hook
  const { profile } = useUserProfile(user);


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

  // Stable callback for profile save
  const handleProfileSave = () => {
    console.log('Profile saved successfully');
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Byt lösenord', icon: Lock },
    { id: 'notifications', label: 'Notifieringar', icon: Bell },
    { id: 'privacy', label: 'Integritet', icon: Shield },
    { id: 'preferences', label: 'Inställningar', icon: SettingsIcon }
  ];

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    setErrorMessage('');
    
    try {
      // Validate current password is provided
      if (!securityData.currentPassword.trim()) {
        throw new Error('Nuvarande lösenord krävs');
      }
      
      // Validate new password is provided
      if (!securityData.newPassword.trim()) {
        throw new Error('Nytt lösenord krävs');
      }
      
      // Validate passwords match
      if (securityData.newPassword !== securityData.confirmPassword) {
        throw new Error('Lösenorden matchar inte. Kontrollera att båda fälten för nytt lösenord är identiska.');
      }
      
      // Validate password strength
      if (securityData.newPassword.length < 8) {
        throw new Error('Lösenordet måste vara minst 8 tecken långt för säkerhet');
      }
      
      // Validate password contains at least one letter and one number
      if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(securityData.newPassword)) {
        throw new Error('Lösenordet måste innehålla minst en bokstav och en siffra');
      }
      
      // Validate new password is different from current
      if (securityData.currentPassword === securityData.newPassword) {
        throw new Error('Nytt lösenord måste vara annorlunda än det nuvarande lösenordet');
      }
      
      // Simulate API call (replace with actual Supabase auth update)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveStatus('success');
      
      // Clear form
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      
      // Provide detailed error information
      if (error instanceof Error) {
        setErrorMessage(error.message);
        console.error('Password change validation error:', error.message);
      } else {
        setErrorMessage('Ett oväntat fel uppstod. Kontrollera din internetanslutning och försök igen.');
        console.error('Password change error:', error);
      }
      
      // Reset status after 7 seconds (longer for users to read the error)
      setTimeout(() => {
        setSaveStatus('idle');
        setErrorMessage('');
      }, 7000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileData(prev => ({ ...prev, avatar: file }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <ShieldProgressSpinner variant="bounce" size="xl" color="olive" message="Laddar" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <p style={{ color: 'var(--text-secondary)' }}>{t('settings.login_required')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2A331E]/5 via-[#3D4A2B]/3 to-[#4A5239]/8">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('settings.title')}
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            {t('settings.subtitle')}
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
            {activeTab === 'profile' && user && (
              <UnifiedProfileSettings 
                key={user.id}
                user={user}
                onSave={handleProfileSave}
              />
            )}


            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="modern-card p-8">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
                    Byt lösenord
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
                      
                      {/* Password Requirements */}
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900 mb-2">Lösenordskrav:</h4>
                        <ul className="text-xs text-blue-800 space-y-1">
                          <li>• Minst 8 tecken långt</li>
                          <li>• Innehålla minst en bokstav och en siffra</li>
                          <li>• Vara annorlunda än ditt nuvarande lösenord</li>
                        </ul>
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

                    {/* Success/Error Message */}
                    {saveStatus === 'success' && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-800 font-medium">Lösenord uppdaterat framgångsrikt!</span>
                      </div>
                    )}
                    {saveStatus === 'error' && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                          <h4 className="text-red-800 font-semibold mb-1">Fel vid lösenordsändring</h4>
                          <p className="text-red-700 text-sm">{errorMessage || 'Ett oväntat fel uppstod. Försök igen.'}</p>
                          <p className="text-red-600 text-xs mt-2">
                            💡 Tips: Kontrollera att alla fält är ifyllda korrekt och att ditt nya lösenord uppfyller kraven ovan.
                          </p>
                        </div>
                        </div>
                      </div>
                    )}
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

                    {/* Success/Error Message */}
                    {saveStatus === 'success' && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-800 font-medium">Inställningar sparade framgångsrikt!</span>
                      </div>
                    )}
                    {saveStatus === 'error' && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                          <h4 className="text-red-800 font-semibold mb-1">Fel vid lösenordsändring</h4>
                          <p className="text-red-700 text-sm">{errorMessage || 'Ett oväntat fel uppstod. Försök igen.'}</p>
                          <p className="text-red-600 text-xs mt-2">
                            💡 Tips: Kontrollera att alla fält är ifyllda korrekt och att ditt nya lösenord uppfyller kraven ovan.
                          </p>
                        </div>
                        </div>
                      </div>
                    )}
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
