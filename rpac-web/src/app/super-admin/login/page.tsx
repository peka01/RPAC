'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/locales';
import { Shield, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Sign in with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // ===== DEBUG LOGGING =====
      console.log('🔍 AUTH SUCCESS - User ID from Supabase:', authData.user.id);
      console.log('🔍 User email:', authData.user.email);
      console.log('🔍 Full auth data:', authData);
      // ===== END DEBUG =====

      // Check if user is super admin
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_tier, license_type, is_license_active')
        .eq('user_id', authData.user.id)
        .single();

      if (profileError || !profile) {
        // Sign out the user
        await supabase.auth.signOut();
        setError('Inget användarkonto hittades. Kontakta systemadministratören.');
        setLoading(false);
        return;
      }

      if (profile.user_tier !== 'super_admin') {
        // Sign out the user
        await supabase.auth.signOut();
        setError('Du har inte behörighet att komma åt systemadministrationen.');
        setLoading(false);
        return;
      }

      // Success! Redirect to super admin dashboard
      router.push('/super-admin');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Inloggningen misslyckades. Kontrollera dina uppgifter.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2A331E] via-[#3D4A2B] to-[#2A331E] flex items-center justify-center p-6">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}></div>
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Shield logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-3xl mb-6">
            <Shield className="w-12 h-12 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Systemadministration
          </h1>
          <p className="text-white/80 text-sm">
            Endast för superadministratörer
          </p>
        </div>

        {/* Login form */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Inloggning misslyckades</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-postadress
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@beready.se"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent transition-all"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Lösenord
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent transition-all"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#2A331E] to-[#3D4A2B] text-white font-semibold rounded-lg hover:from-[#3D4A2B] hover:to-[#2A331E] focus:ring-4 focus:ring-[#3D4A2B]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Loggar in...</span>
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  <span>Logga in som admin</span>
                </>
              )}
            </button>
          </form>

          {/* Info message */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-2 text-xs text-gray-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>
                Endast användare med superadministratörsbehörighet kan logga in här. 
                Kontakta systemadministratören om du behöver åtkomst.
              </p>
            </div>
          </div>

          {/* Back to main site */}
          <div className="mt-4 text-center">
            <a
              href="/"
              className="text-sm text-[#3D4A2B] hover:underline"
            >
              ← Tillbaka till BeReady
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

