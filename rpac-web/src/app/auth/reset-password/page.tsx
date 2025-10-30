'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    // Verify user has a valid recovery session
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          setError('Återställningssessionen är ogiltig eller har gått ut. Begär en ny länk för att återställa lösenordet.');
          setCheckingSession(false);
          return;
        }
        
        // Check if this is a recovery session
        const user = session.user;
        if (user && user.recovery_sent_at) {
          setCheckingSession(false);
        } else {
          setError('Ingen återställningssession hittades. Begär en ny länk för att återställa lösenordet.');
          setCheckingSession(false);
        }
      } catch (err) {
        console.error('Error checking session:', err);
        setError('Ett fel uppstod vid verifiering av sessionen.');
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate passwords match
      if (password !== confirmPassword) {
        throw new Error('Lösenorden matchar inte. Kontrollera att båda fälten är identiska.');
      }

      // Validate password strength
      if (password.length < 8) {
        throw new Error('Lösenordet måste vara minst 8 tecken långt för säkerhet');
      }

      // Validate password contains at least one letter and one number
      if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
        throw new Error('Lösenordet måste innehålla minst en bokstav och en siffra');
      }

      // Update password using Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Ett oväntat fel uppstod. Försök igen.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#5C6B47]/10 to-[#707C5F]/10">
        <div className="text-center">
          <ShieldProgressSpinner size="xl" color="olive" message="Verifierar återställningssession" />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#5C6B47]/10 to-[#707C5F]/10">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Lösenord återställt!</h2>
          <p className="text-gray-600 mb-6">
            Ditt lösenord har uppdaterats. Du omdirigeras till din dashboard...
          </p>
          <ShieldProgressSpinner size="md" color="olive" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#5C6B47]/10 to-[#707C5F]/10 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#3D4A2B]/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-[#3D4A2B]" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Återställ lösenord
          </h2>
          <p className="text-gray-600 text-center text-sm">
            Ange ditt nya lösenord
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nytt lösenord
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                placeholder="Minst 8 tecken"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Måste innehålla minst 8 tecken, en bokstav och en siffra
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bekräfta nytt lösenord
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3D4A2B] focus:border-transparent"
                placeholder="Upprepa lösenordet"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              disabled={loading}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-bold disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4 inline mr-2" />
              Tillbaka
            </button>
            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#556B2F] to-[#3D4A2B] text-white rounded-xl hover:shadow-lg transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <ShieldProgressSpinner size="sm" color="olive" />
                  <span>Återställer...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Återställ lösenord</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

