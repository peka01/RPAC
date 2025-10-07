'use client';

import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';

export default function ShieldPreviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAF7] via-white to-[#F3F6EE] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-8" style={{ color: '#3D4A2B' }}>
          🛡️ Shield Preview
        </h1>
        
        <div className="mb-8">
          <ShieldProgressSpinner
            variant="original"
            size="xl"
            color="olive"
            message="Original Shield with Bounce"
          />
        </div>
        
        <div className="mb-8">
          <ShieldProgressSpinner
            variant="bounce"
            size="xl"
            color="olive"
            message="Bounce Variant"
          />
        </div>
        
        <p className="text-lg text-gray-600">
          Check the animations above to see if they're correct
        </p>
      </div>
    </div>
  );
}
