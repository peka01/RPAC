'use client';

import { useState } from 'react';
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
  Monitor
} from 'lucide-react';
import { RPACLogo } from '@/components/rpac-logo';
import { t } from '@/lib/locales';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
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
                <div className="modern-card p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      Profilinformation
                    </h2>
                    <button
                      onClick={() => handleSave()}
                      disabled={isSaving}
                      className="modern-button flex items-center space-x-2 px-6 py-2 text-white disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #3D4A2B 0%, #2A331E 100%)' }}
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSaving ? 'Sparar...' : 'Spara'}</span>
                    </button>
                  </div>

                  {/* Avatar Section */}
                  <div className="flex items-center space-x-6 mb-8">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-white p-2 shadow-lg">
                        <RPACLogo size="lg" className="text-green-700" />
                      </div>
                      <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                        <Camera className="w-4 h-4 text-slate-600" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {profileData.name}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        Ladda upp en ny profilbild
                      </p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Fullständigt namn
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-800"
                          placeholder={t('placeholders.full_name')}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        E-postadress
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-800"
                          placeholder="din@email.se"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Telefonnummer
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-800"
                          placeholder="+46 70 123 45 67"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                        Plats
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          value={profileData.location}
                          onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-800"
                          placeholder={t('placeholders.city_country')}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                      Om mig
                    </label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-slate-800"
                      placeholder={t('placeholders.about_yourself')}
                    />
                  </div>

                  {saveStatus === 'success' && (
                    <div className="mt-4 flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span>Profil sparad framgångsrikt!</span>
                    </div>
                  )}
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
