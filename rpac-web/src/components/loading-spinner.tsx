'use client';

import { Shield } from 'lucide-react';

/**
 * Global Loading Spinner Component
 * 
 * A reusable animated shield spinner with fade effect for RPAC.
 * Used throughout the app for loading states.
 * 
 * @param size - Spinner size: 'sm' | 'md' | 'lg' | 'xl' (default: 'lg')
 * @param text - Loading text to display (default: 'Laddar')
 * @param showText - Whether to show the loading text (default: true)
 * 
 * @example
 * <LoadingSpinner size="lg" text="Laddar" />
 * <LoadingSpinner size="md" showText={false} />
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  showText?: boolean;
}

export function LoadingSpinner({ size = 'lg', text = 'Laddar', showText = true }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Animated Shield Spinner */}
      <div className="relative">
        <div 
          className={`${sizeClasses[size]} rounded-lg flex items-center justify-center bg-[#5C6B47] animate-spin-fade`}
        >
          <Shield className="text-white" size={iconSizes[size]} strokeWidth={2} />
        </div>
      </div>

      {/* Loading Text */}
      {showText && (
        <p className={`${textSizes[size]} font-medium text-gray-700`}>
          {text}
        </p>
      )}

      <style jsx>{`
        @keyframes spin-fade {
          0% {
            transform: rotate(0deg);
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            transform: rotate(360deg);
            opacity: 1;
          }
        }

        .animate-spin-fade {
          animation: spin-fade 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
}

