'use client';

import React, { useState, useEffect } from 'react';
import { t } from '@/lib/locales';

interface ShieldProgressSpinnerProps {
  variant?: 'pulse' | 'rotate' | 'bounce' | 'glow' | 'wave' | 'orbit' | 'original';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'olive' | 'gold' | 'blue' | 'green';
  showProgress?: boolean;
  progress?: number;
  message?: string;
  className?: string;
}

export const ShieldProgressSpinner: React.FC<ShieldProgressSpinnerProps> = ({
  variant = 'pulse',
  size = 'md',
  color = 'olive',
  showProgress = false,
  progress = 0,
  message,
  className = ''
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);
  const [animationIntensity, setAnimationIntensity] = useState('full'); // Start with full animation immediately

  // Removed progressive animation delay - show full animation immediately

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
      primary: '#3D4A2B', // Solid olive green like the original
      secondary: '#5C6B47',
      accent: '#E5E7EB', // Light gray border like the original
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

  const getAnimationClasses = () => {
    const isGentle = animationIntensity === 'gentle';
    
    switch (variant) {
      case 'pulse':
        return isGentle ? 'animate-pulse' : 'animate-pulse';
      case 'rotate':
        return isGentle ? 'animate-spin' : 'animate-spin';
      case 'bounce':
        return isGentle ? 'animate-pulse' : 'animate-bounce'; // Start with gentle pulse, then bounce
      case 'glow':
        return isGentle ? 'animate-pulse' : 'animate-pulse';
      case 'wave':
        return isGentle ? 'animate-pulse' : 'animate-pulse';
      case 'orbit':
        return isGentle ? 'animate-spin' : 'animate-spin';
      case 'original':
        return isGentle ? 'animate-pulse' : 'animate-pulse';
      default:
        return isGentle ? 'animate-pulse' : 'animate-pulse';
    }
  };

  const OriginalShield = () => (
    <svg
      viewBox="0 0 100 100"
      className={`${sizeClasses[size]} ${getAnimationClasses()}`}
    >
      <defs>
        {/* Olive green heraldic shield */}
        <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#3D4A2B', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#2A331E', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Stylized heraldic shield with thin light green border */}
      <path
        d="M 50 8 L 75 16 L 80 35 L 80 55 L 50 88 L 20 55 L 20 35 L 25 16 Z"
        fill="url(#shieldGradient)"
        stroke="#90A67A"
        strokeWidth="2"
      />
      
        {/* Bold white checkmark with bounce animation */}
        <path
          d="M 30 50 L 45 65 L 65 35"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={variant === 'bounce' ? 'animate-bounce' : ''}
          style={{
            animationDelay: variant === 'bounce' ? '0.1s' : '0s'
          }}
        />
        
        {/* Dots that are shaken off when shield hits lowest point - only in bounce variant and full intensity */}
        {variant === 'bounce' && animationIntensity === 'full' && (
          <>
            {/* Small dots - static until shaken off */}
            <circle
              cx="30"
              cy="85"
              r="1.5"
              fill="#90A67A"
              className="animate-bounce"
              style={{
                animationDuration: '1.2s',
                animationDelay: '0.5s',
                animationTimingFunction: 'ease-out'
              }}
            />
            <circle
              cx="70"
              cy="88"
              r="1.5"
              fill="#90A67A"
              className="animate-bounce"
              style={{
                animationDuration: '1.2s',
                animationDelay: '0.6s',
                animationTimingFunction: 'ease-out'
              }}
            />
            {/* Medium dots - static until shaken off */}
            <circle
              cx="40"
              cy="82"
              r="2"
              fill="#90A67A"
              className="animate-bounce"
              style={{
                animationDuration: '1.4s',
                animationDelay: '0.7s',
                animationTimingFunction: 'ease-out'
              }}
            />
            <circle
              cx="60"
              cy="85"
              r="2"
              fill="#90A67A"
              className="animate-bounce"
              style={{
                animationDuration: '1.4s',
                animationDelay: '0.8s',
                animationTimingFunction: 'ease-out'
              }}
            />
            {/* Large dots - static until shaken off */}
            <circle
              cx="50"
              cy="80"
              r="2.5"
              fill="#90A67A"
              className="animate-bounce"
              style={{
                animationDuration: '1.6s',
                animationDelay: '0.9s',
                animationTimingFunction: 'ease-out'
              }}
            />
            <circle
              cx="35"
              cy="87"
              r="2.5"
              fill="#90A67A"
              className="animate-bounce"
              style={{
                animationDuration: '1.6s',
                animationDelay: '1.0s',
                animationTimingFunction: 'ease-out'
              }}
            />
            <circle
              cx="65"
              cy="83"
              r="2.5"
              fill="#90A67A"
              className="animate-bounce"
              style={{
                animationDuration: '1.6s',
                animationDelay: '1.1s',
                animationTimingFunction: 'ease-out'
              }}
            />
          </>
        )}
    </svg>
  );

  const ShieldIcon = () => {
    if (variant === 'original') {
      return <OriginalShield />;
    }

    return (
      <svg
        viewBox="0 0 100 100"
        className={`${sizeClasses[size]} ${getAnimationClasses()}`}
        style={{
          filter: variant === 'glow' ? `drop-shadow(0 0 20px ${colors.glow})` : 'none'
        }}
      >
        <defs>
          {variant === 'wave' && (
            <filter id={`waveFilter-${color}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          )}
        </defs>
        
        {/* Stylized heraldic shield with thin light green border */}
        <path
          d="M 50 8 L 75 16 L 80 35 L 80 55 L 50 88 L 20 55 L 20 35 L 25 16 Z"
          fill={colors.primary}
          stroke="#90A67A"
          strokeWidth="2"
          filter={variant === 'wave' ? `url(#waveFilter-${color})` : 'none'}
        />
        
        {/* Bold white checkmark with independent bounce animation */}
        <path
          d="M 30 50 L 45 65 L 65 35"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={variant === 'bounce' ? 'animate-bounce' : ''}
          style={{
            animationDelay: variant === 'bounce' ? '0.1s' : '0s'
          }}
        />
        
        {/* Dots that are shaken off when shield hits lowest point - only in bounce variant and full intensity */}
        {variant === 'bounce' && animationIntensity === 'full' && (
          <>
            {/* Small dots - static until shaken off */}
            <circle
              cx="30"
              cy="85"
              r="1.5"
              fill="#90A67A"
              className="animate-bounce"
              style={{
                animationDuration: '1.2s',
                animationDelay: '0.5s',
                animationTimingFunction: 'ease-out'
              }}
            />
            <circle
              cx="70"
              cy="88"
              r="1.5"
              fill="#90A67A"
              className="animate-bounce"
              style={{
                animationDuration: '1.2s',
                animationDelay: '0.6s',
                animationTimingFunction: 'ease-out'
              }}
            />
            {/* Medium dots - static until shaken off */}
            <circle
              cx="40"
              cy="82"
              r="2"
              fill="#90A67A"
              className="animate-bounce"
              style={{
                animationDuration: '1.4s',
                animationDelay: '0.7s',
                animationTimingFunction: 'ease-out'
              }}
            />
            <circle
              cx="60"
              cy="85"
              r="2"
              fill="#90A67A"
              className="animate-bounce"
              style={{
                animationDuration: '1.4s',
                animationDelay: '0.8s',
                animationTimingFunction: 'ease-out'
              }}
            />
            {/* Large dots - static until shaken off */}
            <circle
              cx="50"
              cy="80"
              r="2.5"
              fill="#90A67A"
              className="animate-bounce"
              style={{
                animationDuration: '1.6s',
                animationDelay: '0.9s',
                animationTimingFunction: 'ease-out'
              }}
            />
            <circle
              cx="35"
              cy="87"
              r="2.5"
              fill="#90A67A"
              className="animate-bounce"
              style={{
                animationDuration: '1.6s',
                animationDelay: '1.0s',
                animationTimingFunction: 'ease-out'
              }}
            />
            <circle
              cx="65"
              cy="83"
              r="2.5"
              fill="#90A67A"
              className="animate-bounce"
              style={{
                animationDuration: '1.6s',
                animationDelay: '1.1s',
                animationTimingFunction: 'ease-out'
              }}
            />
          </>
        )}
      </svg>
    );
  };

  const OrbitShield = () => (
    <div className="relative">
      {/* Outer orbit */}
      <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
        <div className="w-2 h-2 rounded-full absolute top-0 left-1/2 transform -translate-x-1/2" 
             style={{ backgroundColor: colors.accent }} />
      </div>
      {/* Inner orbit */}
      <div className="absolute inset-2 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}>
        <div className="w-1 h-1 rounded-full absolute top-0 left-1/2 transform -translate-x-1/2" 
             style={{ backgroundColor: colors.primary }} />
      </div>
      {/* Center shield */}
      <ShieldIcon />
    </div>
  );

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
        <ShieldIcon />
      </div>
    </div>
  );

  const renderSpinner = () => {
    if (variant === 'orbit') {
      return <OrbitShield />;
    }
    
    if (showProgress) {
      return <ProgressRing />;
    }
    
    return <ShieldIcon />;
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="relative">
        {renderSpinner()}
        
        {/* Floating particles for wave variant */}
        {variant === 'wave' && (
          <>
            <div 
              className="absolute w-1 h-1 rounded-full animate-ping"
              style={{ 
                backgroundColor: colors.accent,
                top: '10%',
                left: '20%',
                animationDelay: '0s'
              }}
            />
            <div 
              className="absolute w-1 h-1 rounded-full animate-ping"
              style={{ 
                backgroundColor: colors.primary,
                top: '30%',
                right: '15%',
                animationDelay: '0.5s'
              }}
            />
            <div 
              className="absolute w-1 h-1 rounded-full animate-ping"
              style={{ 
                backgroundColor: colors.secondary,
                bottom: '20%',
                left: '30%',
                animationDelay: '1s'
              }}
            />
          </>
        )}
      </div>
      
      {message && (
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: colors.primary }}>
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
  );
};

// Demo component for testing
export const ShieldSpinnerDemo: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const variants = ['pulse', 'rotate', 'bounce', 'glow', 'wave', 'orbit', 'original'] as const;
  const colors = ['olive', 'gold', 'blue', 'green'] as const;
  const sizes = ['sm', 'md', 'lg', 'xl'] as const;

  const simulateProgress = () => {
    setIsLoading(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsLoading(false);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAF7] via-white to-[#F3F6EE] p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#3D4A2B' }}>
            🛡️ Shield Progress Spinner Demo
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            {t('krister.assistant.title')} - Stunning progress animations with your shield icon
          </p>
          
          <button
            onClick={simulateProgress}
            disabled={isLoading}
            className="px-6 py-3 bg-[#3D4A2B] text-white rounded-lg hover:bg-[#5C6B47] transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Start Progress Demo'}
          </button>
        </div>

        {/* Progress Demo */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: '#3D4A2B' }}>
            Progress Ring Demo
          </h2>
          <div className="flex justify-center">
            <ShieldProgressSpinner
              variant="pulse"
              size="xl"
              color="olive"
              showProgress={true}
              progress={progress}
              message={isLoading ? "Laddar ditt hem..." : "Redo att hjälpa!"}
            />
          </div>
        </div>

        {/* Original Design Highlight */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: '#3D4A2B' }}>
            🎯 Original Design Match
          </h2>
          <div className="flex justify-center">
            <div className="text-center">
              <div className="mb-4">
                <ShieldProgressSpinner
                  variant="original"
                  size="xl"
                  color="olive"
                  message="Exakt match med originalfilen"
                />
              </div>
              <p className="text-lg font-medium">Original Design</p>
              <p className="text-sm text-gray-600">Solid olive green shield med vit checkmark</p>
            </div>
          </div>
        </div>

        {/* Variants Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: '#3D4A2B' }}>
            Animation Variants
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-8">
            {variants.map((variant) => (
              <div key={variant} className="text-center">
                <div className="mb-4">
                  <ShieldProgressSpinner
                    variant={variant}
                    size="lg"
                    color="olive"
                    message={`${variant.charAt(0).toUpperCase() + variant.slice(1)}`}
                  />
                </div>
                <p className="text-sm font-medium capitalize">{variant}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Colors Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: '#3D4A2B' }}>
            Color Variants
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {colors.map((color) => (
              <div key={color} className="text-center">
                <div className="mb-4">
                  <ShieldProgressSpinner
                    variant="pulse"
                    size="lg"
                    color={color}
                    message={`${color.charAt(0).toUpperCase() + color.slice(1)}`}
                  />
                </div>
                <p className="text-sm font-medium capitalize">{color}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sizes Grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: '#3D4A2B' }}>
            Size Variants
          </h2>
          <div className="flex justify-center items-end space-x-8">
            {sizes.map((size) => (
              <div key={size} className="text-center">
                <div className="mb-4">
                  <ShieldProgressSpinner
                    variant="rotate"
                    size={size}
                    color="olive"
                  />
                </div>
                <p className="text-sm font-medium capitalize">{size}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Examples */}
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#3D4A2B' }}>
            Usage Examples
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Loading States</h3>
              <div className="space-y-4">
                <ShieldProgressSpinner variant="pulse" size="md" message="Laddar data..." />
                <ShieldProgressSpinner variant="rotate" size="md" message="Bearbetar..." />
                <ShieldProgressSpinner variant="bounce" size="md" message="Sparar..." />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Progress States</h3>
              <div className="space-y-4">
                <ShieldProgressSpinner 
                  variant="pulse" 
                  size="md" 
                  showProgress={true} 
                  progress={25} 
                  message="25% klar" 
                />
                <ShieldProgressSpinner 
                  variant="pulse" 
                  size="md" 
                  showProgress={true} 
                  progress={75} 
                  message="75% klar" 
                />
                <ShieldProgressSpinner 
                  variant="pulse" 
                  size="md" 
                  showProgress={true} 
                  progress={100} 
                  message="Klar!" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
