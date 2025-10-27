'use client';

import React, { useState, useEffect } from 'react';
import { t } from '@/lib/locales';

interface ShieldProgressSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'olive' | 'gold' | 'blue' | 'green';
  showProgress?: boolean;
  progress?: number;
  message?: string;
  className?: string;
}

export const ShieldProgressSpinner: React.FC<ShieldProgressSpinnerProps> = ({
  size = 'md',
  color = 'olive',
  showProgress = false,
  progress = 0,
  message,
  className = ''
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    if (showProgress && progress > 0) {
      const timer = setTimeout(() => {
        setCurrentProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [progress, showProgress]);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const colorClasses = {
    olive: {
      primary: '#3D4A2B',
      secondary: '#5C6B47',
      accent: '#E5E7EB',
      glow: 'rgba(61, 74, 43, 0.3)'
    },
    gold: {
      primary: '#DAA520',
      secondary: '#B8860B',
      accent: '#E5E7EB',
      glow: 'rgba(218, 165, 32, 0.3)'
    },
    blue: {
      primary: '#2563EB',
      secondary: '#1D4ED8',
      accent: '#E5E7EB',
      glow: 'rgba(37, 99, 235, 0.3)'
    },
    green: {
      primary: '#16A34A',
      secondary: '#15803D',
      accent: '#E5E7EB',
      glow: 'rgba(22, 163, 74, 0.3)'
    }
  };

  const colors = colorClasses[color];

  const ProgressRing = () => (
    <div className="relative">
      <svg className={`${sizeClasses[size]} transform -rotate-90`}>
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={colors.glow}
          strokeWidth="4"
          className="opacity-30"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={colors.accent}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 45}`}
          strokeDashoffset={`${2 * Math.PI * 45 * (1 - currentProgress / 100)}`}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`${sizeClasses[size]} relative`}>
          <img 
            src="/favicon.svg" 
            alt="RPAC Shield" 
            className="w-full h-full"
            style={{
              animation: 'spinVertical 2s linear infinite'
            }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style jsx>{`
        @keyframes spinVertical {
          0% {
            transform: rotateY(0deg);
          }
          100% {
            transform: rotateY(360deg);
          }
        }
      `}</style>
      <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
        <div className="relative">
          {showProgress ? (
            <ProgressRing />
          ) : (
            <div className={`${sizeClasses[size]} relative`}>
              <img 
                src="/favicon.svg" 
                alt="RPAC Shield" 
                className="w-full h-full"
                style={{
                  animation: 'spinVertical 2s linear infinite'
                }}
              />
            </div>
          )}
        </div>
        
        {message && (
          <div className="text-center">
            <p className="text-lg font-medium" style={{ color: colors.primary }}>
              {message}
            </p>
          </div>
        )}
        
        {showProgress && (
          <div className="text-center">
            <p className="text-lg font-bold" style={{ color: colors.primary }}>
              {Math.round(currentProgress)}%
            </p>
          </div>
        )}
      </div>
    </>
  );
};