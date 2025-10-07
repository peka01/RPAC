'use client';

import React from 'react';
import { useGlobalLoading } from '@/components/GlobalLoadingProvider';

export default function GlobalSpinnerDemoPage() {
  const { showLoading, hideLoading, updateProgress } = useGlobalLoading();

  const simulateLoading = async () => {
    showLoading("Laddar ditt hem...");
    
    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      updateProgress(i);
    }
    
    setTimeout(() => {
      hideLoading();
    }, 500);
  };

  const simulateQuickLoading = async () => {
    showLoading("Bearbetar begäran...");
    
    setTimeout(() => {
      hideLoading();
    }, 2000);
  };

  const simulateErrorLoading = async () => {
    showLoading("Ansluter till server...");
    
    setTimeout(() => {
      hideLoading();
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAF7] via-white to-[#F3F6EE] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#3D4A2B' }}>
            🛡️ Global Loading Spinner Demo
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Test the global shield spinner with different scenarios
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Progress Loading */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4" style={{ color: '#3D4A2B' }}>
              Progress Loading
            </h3>
            <p className="text-gray-600 mb-4">
              Shows progress from 0% to 100% with the shield spinner
            </p>
            <button
              onClick={simulateLoading}
              className="w-full px-4 py-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#5C6B47] transition-colors"
            >
              Start Progress Demo
            </button>
          </div>

          {/* Quick Loading */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4" style={{ color: '#3D4A2B' }}>
              Quick Loading
            </h3>
            <p className="text-gray-600 mb-4">
              Simple loading with custom message
            </p>
            <button
              onClick={simulateQuickLoading}
              className="w-full px-4 py-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#5C6B47] transition-colors"
            >
              Start Quick Demo
            </button>
          </div>

          {/* Error Loading */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4" style={{ color: '#3D4A2B' }}>
              Long Loading
            </h3>
            <p className="text-gray-600 mb-4">
              Simulates a longer loading process
            </p>
            <button
              onClick={simulateErrorLoading}
              className="w-full px-4 py-2 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#5C6B47] transition-colors"
            >
              Start Long Demo
            </button>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-12 bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#3D4A2B' }}>
            How to Use Global Spinner
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Import and Use</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import { useGlobalLoading } from '@/components/GlobalLoadingProvider';

function MyComponent() {
  const { showLoading, hideLoading, updateProgress } = useGlobalLoading();
  
  const handleAction = async () => {
    showLoading("Laddar data...");
    // Your async operation
    hideLoading();
  };
}`}
              </pre>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Available Methods</h3>
              <ul className="space-y-2 text-sm">
                <li><code className="bg-gray-100 px-2 py-1 rounded">showLoading(message?, progress?)</code> - Show spinner</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">hideLoading()</code> - Hide spinner</li>
                <li><code className="bg-gray-100 px-2 py-1 rounded">updateProgress(progress)</code> - Update progress</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
