'use client';

import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';

export default function SpinnerTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAF7] via-white to-[#F3F6EE] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#3D4A2B' }}>
            🛡️ Shield Spinner Test
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Testing the simplified ShieldProgressSpinner with spin animation
          </p>
        </div>

        {/* Main Test - Spin Animation */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: '#3D4A2B' }}>
            🌪️ Spin Animation
          </h2>
          <div className="flex justify-center">
            <ShieldProgressSpinner
              size="xl"
              color="olive"
              message="Spinner runt sin axel..."
            />
          </div>
        </div>

        {/* Size Comparison */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: '#3D4A2B' }}>
            Size Comparison
          </h2>
          <div className="flex justify-center items-end space-x-8">
            <div className="text-center">
              <div className="mb-4">
                <ShieldProgressSpinner
                  size="sm"
                  color="olive"
                />
              </div>
              <p className="text-sm font-medium">Small</p>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <ShieldProgressSpinner
                  size="md"
                  color="olive"
                />
              </div>
              <p className="text-sm font-medium">Medium</p>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <ShieldProgressSpinner
                  size="lg"
                  color="olive"
                />
              </div>
              <p className="text-sm font-medium">Large</p>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <ShieldProgressSpinner
                  size="xl"
                  color="olive"
                />
              </div>
              <p className="text-sm font-medium">Extra Large</p>
            </div>
          </div>
        </div>

        {/* Color Comparison */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: '#3D4A2B' }}>
            Color Variants
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="mb-4">
                <ShieldProgressSpinner
                  size="lg"
                  color="olive"
                  message="Olive"
                />
              </div>
              <p className="text-sm font-medium">Olive</p>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <ShieldProgressSpinner
                  size="lg"
                  color="gold"
                  message="Gold"
                />
              </div>
              <p className="text-sm font-medium">Gold</p>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <ShieldProgressSpinner
                  size="lg"
                  color="blue"
                  message="Blue"
                />
              </div>
              <p className="text-sm font-medium">Blue</p>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <ShieldProgressSpinner
                  size="lg"
                  color="green"
                  message="Green"
                />
              </div>
              <p className="text-sm font-medium">Green</p>
            </div>
          </div>
        </div>

        {/* Progress Ring Demo */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: '#3D4A2B' }}>
            Progress Ring with Spin
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mb-4">
                <ShieldProgressSpinner
                  size="lg"
                  color="olive"
                  showProgress={true}
                  progress={25}
                  message="25% klar"
                />
              </div>
              <p className="text-sm font-medium">25% Progress</p>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <ShieldProgressSpinner
                  size="lg"
                  color="olive"
                  showProgress={true}
                  progress={75}
                  message="75% klar"
                />
              </div>
              <p className="text-sm font-medium">75% Progress</p>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <ShieldProgressSpinner
                  size="lg"
                  color="olive"
                  showProgress={true}
                  progress={100}
                  message="Klar!"
                />
              </div>
              <p className="text-sm font-medium">100% Complete</p>
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#3D4A2B' }}>
            Real Usage Examples
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Loading States</h3>
              <div className="space-y-4">
                <ShieldProgressSpinner size="md" message="Laddar data..." />
                <ShieldProgressSpinner size="md" message="Bearbetar..." />
                <ShieldProgressSpinner size="md" message="Sparar..." />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Dashboard Loading</h3>
              <div className="space-y-4">
                <ShieldProgressSpinner size="lg" message="Laddar ditt hem" />
                <ShieldProgressSpinner size="lg" message="Hämtar information" />
                <ShieldProgressSpinner size="lg" message="Redo att hjälpa!" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}