'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/locales';
import { User, LogIn, UserPlus, X, AlertTriangle } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // User is already logged in, redirect to dashboard
        router.push('/dashboard');
      } else {
        setShowModal(true);
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name
            }
          }
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      }
      
      // Get the authenticated user and redirect to dashboard
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setShowModal(false);
        router.push('/dashboard');
      }
  } catch (err: unknown) {
      const _message = err instanceof Error ? err.message : t('errors.generic_error');
      setError(_message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      // First try to sign in with demo credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: 'demo@rpac.se',
        password: 'demo123'
      });
      
      if (signInError) {
        // If demo user doesn't exist, try to create it
        console.log('Demo user not found, attempting to create...');
        const { error: signUpError } = await supabase.auth.signUp({
          email: 'demo@rpac.se',
          password: 'demo123',
          options: {
            data: {
              name: 'Demo Användare'
            }
          }
        });
        
        if (signUpError) {
          throw signUpError;
        }
        
        // Wait a moment for user creation, then try to sign in
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email: 'demo@rpac.se',
          password: 'demo123'
        });
        
        if (retryError) throw retryError;
      }
      
      // Get the authenticated user and redirect to dashboard
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setShowModal(false);
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Demo login error:', error);
      setError('Demo-inloggning misslyckades. Prova att skapa ett eget konto istället.');
      setLoading(false);
    }
  };


  // Landing page when not showing modal
  if (!showModal) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center" 
        style={{ 
          background: 'var(--bg-primary)',
          height: '100vh',
          width: '100vw'
        }}
      >
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <img 
              src="/beready-logo2.png" 
              alt="BE READY" 
              className="h-20 w-auto"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="modern-button flex items-center space-x-2 px-8 py-4 text-white mx-auto"
            style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)' }}
          >
            <LogIn className="w-5 h-5" />
            <span>{t('auth.sign_in')}</span>
          </button>
        </div>
      </div>
    );
  }

  // Modal login form
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="crisis-card max-w-md w-full relative">
        {/* Close button */}
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center p-3" 
               style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
            <div className="flex justify-center">
              <img 
                src="/beready-logo2.png" 
                alt="BE READY" 
                className="h-10 w-auto"
              />
            </div>
          </div>
          <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {isSignUp ? t('auth.create_account') : t('auth.welcome_back')}
          </h3>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            {isSignUp ? t('auth.start_journey') : t('auth.continue')}
          </p>
        </div>

        {/* Error Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-lg flex items-center space-x-2"
               style={{ backgroundColor: 'var(--color-danger)20', border: '1px solid var(--color-danger)40' }}>
            <AlertTriangle className="w-5 h-5" style={{ color: 'var(--color-danger)' }} />
            <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {t('forms.name')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
                style={{ 
                  borderColor: 'var(--color-secondary)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  '--tw-ring-color': 'var(--color-primary)'
                } as React.CSSProperties}
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
              style={{ 
                borderColor: 'var(--color-secondary)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--color-primary)'
              } as React.CSSProperties}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors"
              style={{ 
                borderColor: 'var(--color-secondary)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                '--tw-ring-color': 'var(--color-primary)'
              } as React.CSSProperties}
              placeholder={isSignUp ? t('auth.choose_secure_password') : t('auth.your_password')}
              required
            />
            {isSignUp && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                {t('auth.minimum_characters')}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full modern-button flex items-center justify-center space-x-2 px-4 py-3 text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)' }}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{isSignUp ? t('auth.creating_account') : t('auth.signing_in')}</span>
              </>
            ) : (
              <>
                {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                <span>{isSignUp ? t('auth.create_account') : t('auth.sign_in')}</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--color-secondary)' }} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 text-sm" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                {t('auth.or')}
              </span>
            </div>
          </div>

          <button
            onClick={handleDemoLogin}
            disabled={loading}
            className="mt-4 w-full flex justify-center py-3 px-4 border-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              borderColor: 'var(--color-secondary)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)'
            }}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2" style={{ borderColor: 'var(--color-primary)' }}></div>
                {t('loading.loading')}
              </div>
            ) : (
              <>
                <User className="w-4 h-4 mr-2" />
                {t('auth.continue_as_demo')}
              </>
            )}
          </button>
          
          <p className="text-xs text-center mt-2" style={{ color: 'var(--text-tertiary)' }}>
            Demo-kontot skapas automatiskt om det inte finns
          </p>
        </div>

        {/* Toggle Auth Mode */}
        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isSignUp ? t('auth.already_have_account') : t('auth.need_account')}
          </p>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setEmail('');
              setPassword('');
              setName('');
            }}
            className="text-sm font-semibold mt-1 underline transition-colors hover:opacity-80"
            style={{ color: 'var(--color-primary)' }}
          >
            {isSignUp ? t('auth.sign_in_here') : t('auth.register_here')}
          </button>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {t('auth.app_description')}
          </p>
        </div>
      </div>
    </div>
  );
}