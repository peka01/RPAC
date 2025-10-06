'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  showText?: boolean;
}

export function LoadingSpinner({ size = 'md', className = '', text, showText = true }: LoadingSpinnerProps) {
  const sizeMap = {
    sm: 'w-12 h-12',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className={`relative ${sizeMap[size]} ${className}`} style={{ perspective: '400px' }}>
        {/* Main shield image */}
        <img
          src="/beready-shield.png"
          alt="Laddar..."
          className="w-full h-full object-contain relative z-10"
        />
      
      {/* 3D Orbital spark with tail */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
          {/* First spark (lead) */}
          <div className="absolute inset-0 animate-orbit-3d" style={{ transformStyle: 'preserve-3d' }}>
            {/* Spark head (brightest) */}
            <div 
              className="absolute left-1/2 top-0 -translate-x-1/2"
              style={{
                width: '12%',
                height: '12%',
              }}
            >
              <div 
                className="w-full h-full rounded-full animate-spark-glow"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 232, 124, 1) 0%, rgba(218, 165, 32, 0.95) 30%, rgba(218, 165, 32, 0.7) 50%, transparent 75%)',
                  boxShadow: '0 0 5px 2px rgba(218, 165, 32, 0.4), 0 0 8px 3px rgba(218, 165, 32, 0.2)'
                }}
              />
            </div>
            
            {/* Tail segment 1 */}
            <div 
              className="absolute left-1/2 top-0 -translate-x-1/2 translate-y-1"
              style={{
                width: '10%',
                height: '20%',
                opacity: 0.75
              }}
            >
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, rgba(218, 165, 32, 0.6) 0%, rgba(218, 165, 32, 0.4) 50%, transparent 100%)',
                  filter: 'blur(2px)'
                }}
              />
            </div>
            
            {/* Tail segment 2 */}
            <div 
              className="absolute left-1/2 top-0 -translate-x-1/2 translate-y-3"
              style={{
                width: '8%',
                height: '25%',
                opacity: 0.5
              }}
            >
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, rgba(218, 165, 32, 0.4) 0%, rgba(218, 165, 32, 0.2) 50%, transparent 100%)',
                  filter: 'blur(3px)'
                }}
              />
            </div>
            
            {/* Tail segment 3 (longest, faintest) */}
            <div 
              className="absolute left-1/2 top-0 -translate-x-1/2 translate-y-5"
              style={{
                width: '6%',
                height: '30%',
                opacity: 0.3
              }}
            >
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, rgba(218, 165, 32, 0.3) 0%, rgba(218, 165, 32, 0.1) 40%, transparent 100%)',
                  filter: 'blur(4px)'
                }}
              />
            </div>
          </div>

          {/* Second spark (120 degrees behind) */}
          <div className="absolute inset-0 animate-orbit-3d-delayed-1" style={{ transformStyle: 'preserve-3d' }}>
            {/* Spark head */}
            <div 
              className="absolute left-1/2 top-0 -translate-x-1/2"
              style={{
                width: '12%',
                height: '12%',
              }}
            >
              <div 
                className="w-full h-full rounded-full animate-spark-glow"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 232, 124, 0.9) 0%, rgba(218, 165, 32, 0.85) 30%, rgba(218, 165, 32, 0.6) 50%, transparent 75%)',
                  boxShadow: '0 0 4px 2px rgba(218, 165, 32, 0.38), 0 0 7px 2px rgba(218, 165, 32, 0.18)'
                }}
              />
            </div>
            
            {/* Tail segments */}
            <div 
              className="absolute left-1/2 top-0 -translate-x-1/2 translate-y-1"
              style={{
                width: '10%',
                height: '20%',
                opacity: 0.75
              }}
            >
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, rgba(218, 165, 32, 0.6) 0%, rgba(218, 165, 32, 0.4) 50%, transparent 100%)',
                  filter: 'blur(2px)'
                }}
              />
            </div>
            
            <div 
              className="absolute left-1/2 top-0 -translate-x-1/2 translate-y-3"
              style={{
                width: '8%',
                height: '25%',
                opacity: 0.5
              }}
            >
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, rgba(218, 165, 32, 0.4) 0%, rgba(218, 165, 32, 0.2) 50%, transparent 100%)',
                  filter: 'blur(3px)'
                }}
              />
            </div>
          </div>

          {/* Third spark (240 degrees behind) */}
          <div className="absolute inset-0 animate-orbit-3d-delayed-2" style={{ transformStyle: 'preserve-3d' }}>
            {/* Spark head */}
            <div 
              className="absolute left-1/2 top-0 -translate-x-1/2"
              style={{
                width: '12%',
                height: '12%',
              }}
            >
              <div 
                className="w-full h-full rounded-full animate-spark-glow"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 232, 124, 0.8) 0%, rgba(218, 165, 32, 0.75) 30%, rgba(218, 165, 32, 0.5) 50%, transparent 75%)',
                  boxShadow: '0 0 4px 1px rgba(218, 165, 32, 0.35), 0 0 7px 2px rgba(218, 165, 32, 0.15)'
                }}
              />
            </div>
            
            {/* Tail segments */}
            <div 
              className="absolute left-1/2 top-0 -translate-x-1/2 translate-y-1"
              style={{
                width: '10%',
                height: '20%',
                opacity: 0.75
              }}
            >
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, rgba(218, 165, 32, 0.6) 0%, rgba(218, 165, 32, 0.4) 50%, transparent 100%)',
                  filter: 'blur(2px)'
                }}
              />
            </div>
            
            <div 
              className="absolute left-1/2 top-0 -translate-x-1/2 translate-y-3"
              style={{
                width: '8%',
                height: '25%',
                opacity: 0.5
              }}
            >
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, rgba(218, 165, 32, 0.4) 0%, rgba(218, 165, 32, 0.2) 50%, transparent 100%)',
                  filter: 'blur(3px)'
                }}
              />
            </div>
          </div>

          {/* Fourth spark (60 degrees from start) */}
          <div className="absolute inset-0 animate-orbit-3d-delayed-3" style={{ transformStyle: 'preserve-3d' }}>
            <div 
              className="absolute left-1/2 top-0 -translate-x-1/2"
              style={{
                width: '12%',
                height: '12%',
              }}
            >
              <div 
                className="w-full h-full rounded-full animate-spark-glow"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 232, 124, 0.7) 0%, rgba(218, 165, 32, 0.65) 30%, rgba(218, 165, 32, 0.4) 50%, transparent 75%)',
                  boxShadow: '0 0 3px 1px rgba(218, 165, 32, 0.3), 0 0 6px 2px rgba(218, 165, 32, 0.12)'
                }}
              />
            </div>
            
            <div 
              className="absolute left-1/2 top-0 -translate-x-1/2 translate-y-1"
              style={{
                width: '10%',
                height: '20%',
                opacity: 0.75
              }}
            >
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, rgba(218, 165, 32, 0.6) 0%, rgba(218, 165, 32, 0.4) 50%, transparent 100%)',
                  filter: 'blur(2px)'
                }}
              />
            </div>
            
            <div 
              className="absolute left-1/2 top-0 -translate-x-1/2 translate-y-3"
              style={{
                width: '8%',
                height: '25%',
                opacity: 0.5
              }}
            >
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, rgba(218, 165, 32, 0.4) 0%, rgba(218, 165, 32, 0.2) 50%, transparent 100%)',
                  filter: 'blur(3px)'
                }}
              />
            </div>
          </div>

          {/* Fifth spark (180 degrees from start) */}
          <div className="absolute inset-0 animate-orbit-3d-delayed-4" style={{ transformStyle: 'preserve-3d' }}>
            <div 
              className="absolute left-1/2 top-0 -translate-x-1/2"
              style={{
                width: '12%',
                height: '12%',
              }}
            >
              <div 
                className="w-full h-full rounded-full animate-spark-glow"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 232, 124, 0.6) 0%, rgba(218, 165, 32, 0.55) 30%, rgba(218, 165, 32, 0.35) 50%, transparent 75%)',
                  boxShadow: '0 0 3px 1px rgba(218, 165, 32, 0.25), 0 0 5px 1px rgba(218, 165, 32, 0.1)'
                }}
              />
            </div>
            
            <div 
              className="absolute left-1/2 top-0 -translate-x-1/2 translate-y-1"
              style={{
                width: '10%',
                height: '20%',
                opacity: 0.75
              }}
            >
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, rgba(218, 165, 32, 0.6) 0%, rgba(218, 165, 32, 0.4) 50%, transparent 100%)',
                  filter: 'blur(2px)'
                }}
              />
            </div>
            
            <div 
              className="absolute left-1/2 top-0 -translate-x-1/2 translate-y-3"
              style={{
                width: '8%',
                height: '25%',
                opacity: 0.5
              }}
            >
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, rgba(218, 165, 32, 0.4) 0%, rgba(218, 165, 32, 0.2) 50%, transparent 100%)',
                  filter: 'blur(3px)'
                }}
              />
            </div>
          </div>

          {/* Sixth spark (300 degrees from start) */}
          <div className="absolute inset-0 animate-orbit-3d-delayed-5" style={{ transformStyle: 'preserve-3d' }}>
            <div 
              className="absolute left-1/2 top-0 -translate-x-1/2"
              style={{
                width: '12%',
                height: '12%',
              }}
            >
              <div 
                className="w-full h-full rounded-full animate-spark-glow"
                style={{
                  background: 'radial-gradient(circle, rgba(255, 232, 124, 0.5) 0%, rgba(218, 165, 32, 0.45) 30%, rgba(218, 165, 32, 0.28) 50%, transparent 75%)',
                  boxShadow: '0 0 2px 1px rgba(218, 165, 32, 0.2), 0 0 4px 1px rgba(218, 165, 32, 0.08)'
                }}
              />
            </div>
            
            <div 
              className="absolute left-1/2 top-0 -translate-x-1/2 translate-y-1"
              style={{
                width: '10%',
                height: '20%',
                opacity: 0.75
              }}
            >
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, rgba(218, 165, 32, 0.6) 0%, rgba(218, 165, 32, 0.4) 50%, transparent 100%)',
                  filter: 'blur(2px)'
                }}
              />
            </div>
            
            <div 
              className="absolute left-1/2 top-0 -translate-x-1/2 translate-y-3"
              style={{
                width: '8%',
                height: '25%',
                opacity: 0.5
              }}
            >
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: 'linear-gradient(to bottom, rgba(218, 165, 32, 0.4) 0%, rgba(218, 165, 32, 0.2) 50%, transparent 100%)',
                  filter: 'blur(3px)'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes orbit-3d {
          0% {
            transform: rotateX(60deg) rotateZ(0deg);
          }
          100% {
            transform: rotateX(60deg) rotateZ(360deg);
          }
        }

        @keyframes orbit-3d-delayed-1 {
          0% {
            transform: rotateX(60deg) rotateZ(-120deg);
          }
          100% {
            transform: rotateX(60deg) rotateZ(240deg);
          }
        }

        @keyframes orbit-3d-delayed-2 {
          0% {
            transform: rotateX(60deg) rotateZ(-240deg);
          }
          100% {
            transform: rotateX(60deg) rotateZ(120deg);
          }
        }

        @keyframes orbit-3d-delayed-3 {
          0% {
            transform: rotateX(60deg) rotateZ(-60deg);
          }
          100% {
            transform: rotateX(60deg) rotateZ(300deg);
          }
        }

        @keyframes orbit-3d-delayed-4 {
          0% {
            transform: rotateX(60deg) rotateZ(-180deg);
          }
          100% {
            transform: rotateX(60deg) rotateZ(180deg);
          }
        }

        @keyframes orbit-3d-delayed-5 {
          0% {
            transform: rotateX(60deg) rotateZ(-300deg);
          }
          100% {
            transform: rotateX(60deg) rotateZ(60deg);
          }
        }

        @keyframes spark-glow {
          0%, 100% {
            opacity: 0.9;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }

        .animate-orbit-3d {
          animation: orbit-3d 3s linear infinite;
        }

        .animate-orbit-3d-delayed-1 {
          animation: orbit-3d-delayed-1 3s linear infinite;
        }

        .animate-orbit-3d-delayed-2 {
          animation: orbit-3d-delayed-2 3s linear infinite;
        }

        .animate-orbit-3d-delayed-3 {
          animation: orbit-3d-delayed-3 3s linear infinite;
        }

        .animate-orbit-3d-delayed-4 {
          animation: orbit-3d-delayed-4 3s linear infinite;
        }

        .animate-orbit-3d-delayed-5 {
          animation: orbit-3d-delayed-5 3s linear infinite;
        }

        .animate-spark-glow {
          animation: spark-glow 0.8s ease-in-out infinite;
        }
      `}</style>
      </div>
      
      {/* Optional loading text */}
      {showText && text && (
        <p className="text-base font-medium text-gray-700">
          {text}
        </p>
      )}
    </div>
  );
}

