'use client';

import React, { useState } from 'react';
import { ShieldProgressSpinner } from '@/components/ShieldProgressSpinner';

export default function ProgressiveSpinnerTestPage() {
  const [showSpinner, setShowSpinner] = useState(false);

  const testShortDuration = () => {
    setShowSpinner(true);
    setTimeout(() => {
      setShowSpinner(false);
    }, 1500); // Less than 2 seconds - should stay gentle
  };

  const testMediumDuration = () => {
    setShowSpinner(true);
    setTimeout(() => {
      setShowSpinner(false);
    }, 3000); // More than 2 seconds - should escalate to full
  };

  const testLongDuration = () => {
    setShowSpinner(true);
    setTimeout(() => {
      setShowSpinner(false);
    }, 5000); // Long duration - should show full animation
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAF7] via-white to-[#F3F6EE] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#3D4A2B' }}>
            🛡️ Progressive Animation Test
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Test the progressive animation: gentle start → full animation after 2 seconds
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Short Duration Test */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4" style={{ color: '#3D4A2B' }}>
              Short Duration (1.5s)
            </h3>
            <p className="text-gray-600 mb-4">
              Should show gentle pulse animation only - no bounce, no falling dots
            </p>
            <button
              onClick={testShortDuration}
              className="w-full px-4 py-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#5C6B47] transition-colors"
            >
              Test Short Duration
            </button>
          </div>

          {/* Medium Duration Test */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4" style={{ color: '#3D4A2B' }}>
              Medium Duration (3s)
            </h3>
            <p className="text-gray-600 mb-4">
              Should start gentle, then escalate to full bounce with falling dots
            </p>
            <button
              onClick={testMediumDuration}
              className="w-full px-4 py-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#5C6B47] transition-colors"
            >
              Test Medium Duration
            </button>
          </div>

          {/* Long Duration Test */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4" style={{ color: '#3D4A2B' }}>
              Long Duration (5s)
            </h3>
            <p className="text-gray-600 mb-4">
              Should show full progression: gentle → full bounce with falling dots
            </p>
            <button
              onClick={testLongDuration}
              className="w-full px-4 py-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#5C6B47] transition-colors"
            >
              Test Long Duration
            </button>
          </div>
        </div>

        {/* Spinner Display */}
        {showSpinner && (
          <div className="mt-12 flex justify-center">
            <div className="bg-white rounded-lg p-8 shadow-xl">
              <ShieldProgressSpinner
                variant="bounce"
                size="xl"
                color="olive"
                message="Progressive Animation Test"
              />
            </div>
          </div>
        )}

        {/* Animation Timeline */}
        <div className="mt-12 bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#3D4A2B' }}>
            Progressive Animation Timeline
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-[#3D4A2B] rounded-full flex items-center justify-center text-white font-bold">0</div>
              <div className="flex-1">
                <h3 className="font-semibold">0-2 seconds: Gentle Phase</h3>
                <p className="text-gray-600 text-sm">Shield shows gentle pulse animation - smooth and non-jerky</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-[#5C6B47] rounded-full flex items-center justify-center text-white font-bold">2</div>
              <div className="flex-1">
                <h3 className="font-semibold">2+ seconds: Full Animation</h3>
                <p className="text-gray-600 text-sm">Shield starts bouncing with falling dots - engaging for longer operations</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Benefits:</h4>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>✅ No jerky animation on short loading states</li>
              <li>✅ Always shows some visual feedback</li>
              <li>✅ Escalates to engaging animation for longer operations</li>
              <li>✅ Smooth transition between animation phases</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
