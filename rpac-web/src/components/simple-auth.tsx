'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { localAuth } from '@/lib/local-auth';
import { t } from '@/lib/locales';
import { 
  User, 
  LogIn, 
  LogOut, 
  UserPlus, 
  ArrowRight,
  ArrowLeft,
  Home,
  Users,
  Heart,
  AlertTriangle,
  ChevronDown,
  Settings
} from 'lucide-react';
import { RPACLogo } from './rpac-logo';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: t('onboarding.welcome_to_ready'),
    description: t('onboarding.welcome_description'),
    icon: Home,
    color: 'var(--color-crisis-green)'
  },
  {
    id: 'personal',
    title: t('onboarding.personal_preparedness_title'),
    description: t('onboarding.personal_preparedness_description'),
    icon: User,
    color: 'var(--color-crisis-blue)'
  },
  {
    id: 'community',
    title: t('onboarding.local_community_title'),
    description: t('onboarding.local_community_description'),
    icon: Users,
    color: 'var(--color-crisis-orange)'
  },
  {
    id: 'regional',
    title: 'Regional hjälp',
    description: 'Få hjälp när du behöver det mest. Ömsesidig hjälp och samordning på regional nivå.',
    icon: Heart,
    color: 'var(--color-crisis-red)'
  }
];

export function SimpleAuth() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string; name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    // Get initial user
    const currentUser = localAuth.getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    // Listen for auth changes
    const unsubscribe = localAuth.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as Element;
        if (!target.closest('.user-menu-container')) {
          setShowUserMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors([]);
    
    try {
      if (isSignUp) {
        await localAuth.signUp(formData.email, formData.password, formData.name);
      } else {
        await localAuth.signIn(formData.email, formData.password);
      }
      setShowAuthForm(false);
      setFormData({ email: '', password: '', name: '' });
    } catch (error: unknown) {
      console.error('Auth error:', error);
      const errorMessage = error instanceof Error ? error.message : t('errors.generic_error');
      setFormErrors([errorMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await localAuth.signOut();
      setShowUserMenu(false);
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
        <span className="text-sm text-slate-800 dark:text-slate-200">{t('loading.loading')}</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="relative user-menu-container">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white p-1">
            <RPACLogo size="sm" className="text-green-700" />
          </div>
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {user.name}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
        </button>
        
        {showUserMenu && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50">
            <button
              onClick={() => {
                setShowUserMenu(false);
                router.push('/settings');
              }}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>{t('navigation.settings')}</span>
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('navigation.sign_out')}</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Show onboarding if not authenticated
  if (!showAuthForm) {
    const step = onboardingSteps[currentStep];
    const Icon = step.icon;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="crisis-card max-w-2xl w-full">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Steg {currentStep + 1} av {onboardingSteps.length}
              </span>
              <button
                onClick={() => setShowAuthForm(true)}
                className="text-sm underline"
                style={{ color: 'var(--color-crisis-blue)' }}
              >
                {t('onboarding.skip')}
              </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ 
                  backgroundColor: step.color,
                  width: `${((currentStep + 1) / onboardingSteps.length) * 100}%`
                }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                 style={{ backgroundColor: step.color + '20' }}>
              <Icon className="w-10 h-10" style={{ color: step.color }} />
            </div>
            
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              {step.title}
            </h2>
            
            <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {step.description}
            </p>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="modern-button flex items-center space-x-2 px-4 py-2"
              style={{ 
                backgroundColor: currentStep === 0 ? '#4A4A4A' : '#2C4A5C',
                color: 'white',
                opacity: currentStep === 0 ? 0.5 : 1
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('onboarding.previous')}</span>
            </button>

            {currentStep === onboardingSteps.length - 1 ? (
              <button
                onClick={() => setShowAuthForm(true)}
                className="modern-button flex items-center space-x-2 px-4 py-2 text-white"
                style={{ background: 'linear-gradient(135deg, #3D4A2B 0%, #2A331E 100%)' }}
              >
                <span>{t('onboarding.get_started')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="modern-button flex items-center space-x-2 px-4 py-2 text-white"
                style={{ background: 'linear-gradient(135deg, #3D4A2B 0%, #2A331E 100%)' }}
              >
                <span>{t('onboarding.next')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show auth form
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="crisis-card max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-white p-3">
            <RPACLogo size="lg" className="text-green-700" />
          </div>
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {isSignUp ? t('auth.create_account') : t('auth.welcome_back')}
          </h3>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            {isSignUp 
              ? t('auth.start_journey') 
              : t('auth.continue')
            }
          </p>
        </div>

        {/* Error Messages */}
        {formErrors.length > 0 && (
          <div className="mb-4 p-3 rounded-lg flex items-center space-x-2"
               style={{ backgroundColor: 'var(--color-crisis-red)20' }}>
            <AlertTriangle className="w-5 h-5" style={{ color: 'var(--color-crisis-red)' }} />
            <div>
              {formErrors.map((error, index) => (
                <p key={index} className="text-sm" style={{ color: 'var(--color-crisis-red)' }}>
                  {error}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('forms.name')}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                style={{ 
                  borderColor: 'var(--color-crisis-grey)',
                }}
                placeholder={t('placeholders.enter_name')}
                required
              />
            </div>
          )}

          <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('forms.email')}
              </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full p-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ 
                borderColor: 'var(--color-crisis-grey)',
              }}
              placeholder={t('placeholders.enter_email')}
              required
            />
          </div>

          <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('forms.password')}
              </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full p-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
              style={{ 
                borderColor: 'var(--color-crisis-grey)',
              }}
              placeholder={isSignUp ? t('placeholders.enter_password_new') : t('placeholders.enter_password')}
              required
            />
            {isSignUp && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                {t('validation.password_min_length')}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full modern-button flex items-center justify-center space-x-2 px-4 py-3 text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #3D4A2B 0%, #2A331E 100%)' }}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{t('forms.processing')}</span>
              </>
            ) : (
              <>
                {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                <span>{isSignUp ? t('auth.create_account') : t('auth.sign_in')}</span>
              </>
            )}
          </button>
        </form>

        {/* Toggle Auth Mode */}
        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isSignUp ? t('auth.already_have_account') : t('auth.need_account')}
          </p>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setFormErrors([]);
              setFormData({ email: '', password: '', name: '' });
            }}
            className="text-sm font-semibold mt-1 underline"
            style={{ color: 'var(--color-crisis-blue)' }}
          >
            {isSignUp ? t('auth.sign_in_instead') : t('auth.create_account_instead')}
          </button>
        </div>

        {/* Back to Onboarding */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAuthForm(false)}
            className="text-sm underline"
            style={{ color: 'var(--text-secondary)' }}
          >
            {t('auth.back_to_intro')}
          </button>
        </div>
      </div>
    </div>
  );
}
