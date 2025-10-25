'use client';

import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, AlertTriangle } from 'lucide-react';
import { t } from '@/lib/locales';

export default function NotFound() {
  const router = useRouter();

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        background: 'var(--bg-primary)',
        height: '100vh',
        width: '100vw'
      }}
    >
      <div className="text-center max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src="/logga-beready.png" 
            alt="BE READY" 
            className="h-16 w-auto"
          />
        </div>

        {/* Error Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" 
             style={{ backgroundColor: 'var(--color-danger)20' }}>
          <AlertTriangle className="w-10 h-10" style={{ color: 'var(--color-danger)' }} />
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          404 - Sidan hittades inte
        </h1>
        
        <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
          Den sida du letar efter finns inte eller har flyttats.
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => router.push('/')}
            className="w-full modern-button flex items-center justify-center space-x-2 px-6 py-3 text-white"
            style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)' }}
          >
            <Home className="w-5 h-5" />
            <span>Tillbaka till startsidan</span>
          </button>

          <button
            onClick={() => router.back()}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 border-2 rounded-lg text-sm font-medium transition-colors"
            style={{ 
              borderColor: 'var(--color-secondary)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-primary)'
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Gå tillbaka</span>
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-primary)10' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Om du tror att detta är ett fel, kontakta support eller försök igen senare.
          </p>
        </div>
      </div>
    </div>
  );
}
