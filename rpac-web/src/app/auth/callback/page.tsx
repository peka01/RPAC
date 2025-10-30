'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react';

// Configure for Edge Runtime (required for Cloudflare Pages)
export const runtime = 'edge';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle password reset flow - check for hash fragment first
        // Supabase sends recovery tokens in the URL hash (#type=recovery&access_token=...)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const type = hashParams.get('type');
          
          // If this is a password recovery callback, redirect to reset password page
          if (type === 'recovery') {
            const accessToken = hashParams.get('access_token');
            const refreshToken = hashParams.get('refresh_token');
            
            if (accessToken && refreshToken) {
              // Exchange the tokens for a session
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              
              if (sessionError) {
                console.error('Session error:', sessionError);
                setError('Ett fel uppstod vid autentisering. Försök igen.');
                setLoading(false);
                return;
              }
              
              if (sessionData.session) {
                // Redirect to reset password page
                router.push('/auth/reset-password');
                return;
              }
            }
          }
        }
        
        // Regular auth callback flow - check URL params for OAuth callbacks
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setError('Ett fel uppstod vid autentisering. Försök igen.');
          setLoading(false);
          return;
        }

        if (data.session) {
          // User is authenticated, redirect to dashboard or specified page
          const next = searchParams.get('next') || '/dashboard';
          setSuccess(true);
          
          // Small delay to show success message
          setTimeout(() => {
            router.push(next);
          }, 1000);
        } else {
          setError('Autentisering misslyckades. Kontrollera att länken är korrekt.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Ett oväntat fel uppstod. Försök igen.');
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#5C6B47]/10 to-[#707C5F]/10">
        <div className="text-center">
          <ShieldProgressSpinner size="xl" color="olive" message="Verifierar autentisering" />
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Autentisering lyckades!</h2>
          <p className="text-gray-600 mb-6">
            Du omdirigeras till din dashboard...
          </p>
          <ShieldProgressSpinner size="md" color="olive" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#5C6B47]/10 to-[#707C5F]/10">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Autentisering misslyckades</h2>
        <p className="text-gray-600 mb-6">
          {error}
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-[#3D4A2B] text-white font-medium rounded-lg hover:bg-[#2A331E] transition-colors"
        >
          Tillbaka till inloggning
        </button>
      </div>
    </div>
  );
}
