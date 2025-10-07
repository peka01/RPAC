'use client';

import React from 'react';
import { ShieldProgressSpinner } from './ShieldProgressSpinner';

interface ShieldLoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
  variant?: 'pulse' | 'rotate' | 'bounce' | 'glow' | 'wave' | 'orbit' | 'original';
}

export const ShieldLoadingOverlay: React.FC<ShieldLoadingOverlayProps> = ({
  isVisible,
  message = "Laddar...",
  progress,
  variant = 'original'
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-xl">
        <ShieldProgressSpinner
          variant={variant}
          size="xl"
          color="olive"
          message={message}
          showProgress={progress !== undefined}
          progress={progress}
        />
      </div>
    </div>
  );
};

// Example usage component
export const ExampleUsage: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const startLoading = () => {
    setIsLoading(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsLoading(false), 500);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  return (
    <div className="p-8">
      <button
        onClick={startLoading}
        className="px-6 py-3 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#5C6B47] transition-colors"
      >
        Start Loading Demo
      </button>
      
      <ShieldLoadingOverlay
        isVisible={isLoading}
        message="Bearbetar din begäran..."
        progress={progress}
        variant="pulse"
      />
    </div>
  );
};
