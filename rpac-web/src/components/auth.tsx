'use client';

import { useState, useEffect } from 'react';
import { supabase, authService } from '@/lib/supabase';
import { User, LogIn, LogOut, UserPlus } from 'lucide-react';
import { t } from '@/lib/locales';

export function Auth() {
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { name?: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isSignUp) {
        await authService.signUp(formData.email, formData.password, formData.name);
      } else {
        await authService.signIn(formData.email, formData.password);
      }
      setShowAuthForm(false);
      setFormData({ email: '', password: '', name: '' });
    } catch (error) {
      console.error('Auth error:', error);
      alert(t('errors.generic_error'));
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        <span className="text-sm">Laddar...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4" />
          <span className="text-sm font-medium">
            {user.user_metadata?.name || user.email}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="crisis-button text-sm whitespace-nowrap"
          style={{ background: 'linear-gradient(135deg, #3D4A2B 0%, #2A331E 100%)', color: 'white' }}
        >
          <LogOut className="w-4 h-4 mr-1" />
          Logga ut
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => {
          setShowAuthForm(true);
          setIsSignUp(false);
        }}
        className="crisis-button text-sm"
        style={{ backgroundColor: 'var(--color-crisis-blue)', color: 'white' }}
      >
        <LogIn className="w-4 h-4 mr-1" />
        Logga in
      </button>
      <button
        onClick={() => {
          setShowAuthForm(true);
          setIsSignUp(true);
        }}
        className="crisis-button text-sm"
        style={{ backgroundColor: 'var(--color-crisis-green)', color: 'white' }}
      >
        <UserPlus className="w-4 h-4 mr-1" />
        Registrera
      </button>

      {/* Auth Form Modal */}
      {showAuthForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="crisis-card max-w-md w-full">
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              {isSignUp ? 'Registrera konto' : 'Logga in'}
            </h3>
            
            <form onSubmit={handleAuth} className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Namn
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-3 border-2 rounded-lg"
                    style={{ borderColor: 'var(--color-crisis-grey)' }}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  E-post
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full p-3 border-2 rounded-lg"
                  style={{ borderColor: 'var(--color-crisis-grey)' }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                  Lösenord
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full p-3 border-2 rounded-lg"
                  style={{ borderColor: 'var(--color-crisis-grey)' }}
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="crisis-button flex-1"
                  style={{ backgroundColor: 'var(--color-crisis-green)', color: 'white' }}
                >
                  {isSignUp ? 'Registrera' : 'Logga in'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAuthForm(false)}
                  className="crisis-button flex-1"
                  style={{ backgroundColor: 'var(--color-crisis-grey)', color: 'white' }}
                >
                  Avbryt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
