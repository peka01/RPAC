'use client';

import { useState, useEffect } from 'react';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { supabase } from '@/lib/supabase';
import { 
  User, 
  Users, 
  Heart, 
  ArrowRight,
  CheckCircle,
  Globe
} from 'lucide-react';
import { t } from '@/lib/locales';

interface Feature {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  description: string;
  color: string;
}

const features: Feature[] = [
  {
    icon: User,
    title: t('welcome.personal_preparedness'),
    description: t('welcome.personal_description'),
    color: 'var(--color-crisis-blue)'
  },
  {
    icon: Users,
    title: t('welcome.local_community'),
    description: t('welcome.local_description'),
    color: 'var(--color-crisis-orange)'
  },
  {
    icon: Heart,
    title: t('welcome.regional_help'),
    description: t('welcome.regional_description'),
    color: 'var(--color-crisis-red)'
  }
];

export function WelcomeScreen() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ShieldProgressSpinner variant="bounce" size="lg" color="olive" message={t('loading.loading')} />
      </div>
    );
  }

  if (user) {
    return null; // Don't show welcome screen if user is logged in
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-6xl mx-auto text-center">
          {/* Modern Logo and Title */}
          <div className="mb-16">
            <div className="relative mb-8">
              <div className="w-32 h-32 mx-auto rounded-3xl flex items-center justify-center shadow-2xl bg-white p-6">
                <img 
                  src="/beready-logo2.png" 
                  alt="BE READY" 
                  className="h-20 w-auto"
                />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full animate-bounce"></div>
              <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse"></div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight"
                style={{ 
                  background: 'linear-gradient(135deg, #3D4A2B 0%, #2C4A5C 50%, #4A4A4A 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
              {t('welcome.app_title')}
            </h1>
            <p className="text-2xl md:text-3xl mb-4 text-slate-600 dark:text-slate-400 font-light">
              {t('welcome.tagline')}
            </p>
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-500">
              {t('welcome.description')}
            </p>
          </div>

          {/* Modern Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group modern-card p-8 text-center hover:scale-105 transition-all duration-300">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300"
                       style={{ background: 'linear-gradient(135deg, #3D4A2B 0%, #2A331E 100%)' }}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Modern Call to Action */}
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200">
              {t('welcome.ready_to_start')}
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              {t('welcome.create_account_description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button
                onClick={() => {
                  const authButton = document.querySelector('[data-auth-trigger]') as HTMLButtonElement;
                  if (authButton) authButton.click();
                }}
                className="group modern-button flex items-center space-x-3 text-lg px-10 py-5 text-white"
                style={{ 
                  background: 'linear-gradient(135deg, #3D4A2B 0%, #2A331E 100%)',
                  border: 'none'
                }}
              >
                <span>{t('welcome.get_started')}</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => {
                  const authButton = document.querySelector('[data-auth-trigger]') as HTMLButtonElement;
                  if (authButton) authButton.click();
                }}
                className="group modern-button-secondary flex items-center space-x-3 text-lg px-10 py-5"
                style={{ 
                  border: '2px solid #3D4A2B',
                  color: '#3D4A2B',
                  backgroundColor: 'transparent'
                }}
              >
                <span>{t('welcome.learn_more')}</span>
                <Globe className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </div>

          {/* Modern Trust Indicators */}
          <div className="mt-20 pt-12 border-t border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center justify-center space-x-3 p-4 rounded-xl bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  {t('welcome.secure_private')}
                </span>
              </div>
              <div className="flex items-center justify-center space-x-3 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  {t('welcome.works_offline')}
                </span>
              </div>
              <div className="flex items-center justify-center space-x-3 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/20 dark:to-slate-800/20">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-slate-700 dark:text-slate-300 font-semibold">
                  {t('welcome.completely_free')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
