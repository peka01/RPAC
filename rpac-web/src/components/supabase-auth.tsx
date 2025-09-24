'use client';

import { useState, useEffect } from 'react';
import { supabase, authService } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface SupabaseAuthProps {
  onAuthChange: (user: User | null) => void;
}

export function SupabaseAuth({ onAuthChange }: SupabaseAuthProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setUser(session?.user ?? null);
          onAuthChange(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setUser(session?.user ?? null);
        onAuthChange(session?.user ?? null);
        setLoading(false);

        // Create user profile if new user
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const existingProfile = await authService.getUserProfile(session.user.id);
            if (!existingProfile) {
              await authService.createUserProfile(session.user.id, {
                email: session.user.email || '',
                name: session.user.user_metadata?.name || '',
                location: ''
              });
            }
          } catch (error) {
            console.error('Error creating user profile:', error);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Remove onAuthChange dependency to prevent loops

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await authService.signUp(email, password, name);
        setError(null);
        // Don't set loading to false here - wait for auth state change
      } else {
        await authService.signIn(email, password);
        setError(null);
        // Don't set loading to false here - wait for auth state change
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Ett oväntat fel inträffade');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Ett oväntat fel inträffade');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg" style={{ color: 'var(--text-primary)' }}>Laddar...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Välkommen, {user.user_metadata?.name || user.email}!
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Du är inloggad och redo att använda RPAC.
          </p>
          <button
            onClick={handleSignOut}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Logga ut
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {isSignUp ? 'Skapa konto' : 'Logga in'}
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          {isSignUp ? 'Skapa ett konto för att komma igång' : 'Logga in på ditt befintliga konto'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        {isSignUp && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Namn
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={isSignUp}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ditt fullständiga namn"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            E-post
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="din@epost.se"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Lösenord
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Minst 6 tecken"
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Bearbetar...' : (isSignUp ? 'Skapa konto' : 'Logga in')}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
          }}
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          {isSignUp ? 'Har du redan ett konto? Logga in' : 'Behöver du ett konto? Skapa ett här'}
        </button>
      </div>
    </div>
  );
}
