'use client';

import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';
import { t } from '@/lib/locales';

export default function LoadingPreviewPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Loading Spinner Preview
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Animerad laddningsindikator med roterande gnista
          </p>
        </div>

        {/* Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Different Sizes */}
          <div className="rounded-lg p-8" style={{ backgroundColor: 'var(--bg-card)' }}>
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              Olika storlekar
            </h2>
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <ShieldProgressSpinner variant="bounce" size="sm" color="olive" />
                <span style={{ color: 'var(--text-secondary)' }}>Liten (sm)</span>
              </div>
              <div className="flex items-center gap-4">
                <ShieldProgressSpinner variant="bounce" size="md" color="olive" />
                <span style={{ color: 'var(--text-secondary)' }}>Medium (md)</span>
              </div>
              <div className="flex items-center gap-4">
                <ShieldProgressSpinner variant="bounce" size="lg" color="olive" />
                <span style={{ color: 'var(--text-secondary)' }}>Stor (lg)</span>
              </div>
              <div className="flex items-center gap-4">
                <ShieldProgressSpinner variant="bounce" size="xl" color="olive" />
                <span style={{ color: 'var(--text-secondary)' }}>Extra stor (xl)</span>
              </div>
            </div>
          </div>

          {/* Centered Loading States */}
          <div className="rounded-lg p-8" style={{ backgroundColor: 'var(--bg-card)' }}>
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              Centrerad laddning
            </h2>
            <div className="space-y-8">
              
              {/* Loading example 1 */}
              <div className="text-center py-8 border-2 border-dashed rounded-lg" style={{ borderColor: 'var(--color-muted)' }}>
                <ShieldProgressSpinner variant="bounce" size="md" color="olive" message="Laddar ditt hem..." />
              </div>

              {/* Loading example 2 */}
              <div className="text-center py-8 border-2 border-dashed rounded-lg" style={{ borderColor: 'var(--color-muted)' }}>
                <ShieldProgressSpinner variant="bounce" size="lg" color="olive" message="Hämtar information" />
              </div>
              
              {/* Loading example 3 - without text */}
              <div className="text-center py-8 border-2 border-dashed rounded-lg" style={{ borderColor: 'var(--color-muted)' }}>
                <ShieldProgressSpinner variant="bounce" size="md" color="olive" />
              </div>
            </div>
          </div>

          {/* Dark Background Example */}
          <div 
            className="rounded-lg p-8"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <h2 className="text-xl font-bold mb-6 text-white">
              På mörk bakgrund
            </h2>
            <div className="flex justify-center py-8">
              <ShieldProgressSpinner variant="bounce" size="lg" color="olive" />
            </div>
          </div>

          {/* Fullscreen Loading Example */}
          <div className="rounded-lg p-8 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', minHeight: '400px' }}>
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
              Helskärmsläge
            </h2>
            <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}>
              <ShieldProgressSpinner variant="bounce" size="xl" color="olive" message="Laddar RPAC" />
            </div>
          </div>

        </div>

        {/* Usage Instructions */}
        <div className="mt-12 rounded-lg p-8" style={{ backgroundColor: 'var(--bg-card)' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Användning
          </h2>
          <div className="space-y-4" style={{ color: 'var(--text-secondary)' }}>
            <p>Importera komponenten:</p>
            <pre className="p-4 rounded bg-gray-100 overflow-x-auto">
              <code>{`import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';`}</code>
            </pre>
            
            <p className="mt-4">Använd i din komponent:</p>
            <pre className="p-4 rounded bg-gray-100 overflow-x-auto">
              <code>{`<ShieldProgressSpinner variant="bounce" size="md" color="olive" message="Laddar..." />
<ShieldProgressSpinner variant="bounce" size="lg" color="olive" />
<ShieldProgressSpinner variant="bounce" size="xl" color="olive" message="Hämtar data" />`}</code>
            </pre>

            <div className="mt-4">
              <p className="font-semibold mb-2">Tillgängliga storlekar:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><code>sm</code> - 48px (w-12 h-12)</li>
                <li><code>md</code> - 96px (w-24 h-24) - Standard</li>
                <li><code>lg</code> - 128px (w-32 h-32)</li>
                <li><code>xl</code> - 192px (w-48 h-48)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

