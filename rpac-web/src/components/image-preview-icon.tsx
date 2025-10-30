'use client';

import { useState, useRef, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface ImagePreviewIconProps {
  imageUrl: string;
  size?: number;
  className?: string;
}

export function ImagePreviewIcon({ imageUrl, size = 14, className = '' }: ImagePreviewIconProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const iconRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 260, // Position above icon (240px image height + 20px margin)
        left: rect.left + rect.width / 2 - 160 // Center on icon (320px / 2)
      });
    }
  };

  useEffect(() => {
    if (showPreview) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [showPreview]);

  return (
    <>
      <div 
        ref={iconRef}
        className="relative inline-block"
        onMouseEnter={() => {
          setShowPreview(true);
          setImageError(false);
          updatePosition();
        }}
        onMouseLeave={() => {
          setShowPreview(false);
          // Keep image loaded state for faster re-hover
          setTimeout(() => {
            setImageLoaded(false);
          }, 300);
        }}
        onTouchStart={(e) => {
          // For mobile: toggle preview on tap
          e.preventDefault();
          setShowPreview(!showPreview);
          if (!showPreview) {
            setImageError(false);
            updatePosition();
          }
        }}
      >
        {/* Icon */}
        <div 
          className={`flex-shrink-0 bg-[#3D4A2B]/10 text-[#3D4A2B] p-1 rounded-md cursor-pointer transition-all hover:bg-[#3D4A2B]/20 ${className}`}
          title="Har bild - hovra för förhandsvisning"
        >
          <ImageIcon size={size} />
        </div>
      </div>

      {/* Preview Tooltip - Fixed positioning with very high z-index */}
      {showPreview && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 bg-black/20 z-[9998] md:hidden"
            onClick={() => setShowPreview(false)}
          />
          
          {/* Preview Container - Fixed positioning, highest z-index */}
          <div 
            className="fixed z-[9999] pointer-events-none md:pointer-events-auto"
            style={{ 
              top: `${position.top}px`,
              left: `${position.left}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-2 max-w-xs relative">
              {!imageError ? (
                <>
                  {!imageLoaded && (
                    <div className="w-64 h-48 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
                      <ImageIcon size={32} className="text-gray-400" />
                    </div>
                  )}
                  <img
                    src={imageUrl}
                    alt="Förhandsvisning"
                    className={`rounded-lg max-w-xs max-h-96 object-contain ${imageLoaded ? 'block' : 'hidden'}`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => {
                      setImageError(true);
                      setImageLoaded(false);
                    }}
                    style={{ maxWidth: '320px', maxHeight: '240px', display: imageLoaded ? 'block' : 'none' }}
                  />
                </>
              ) : (
                <div className="w-64 h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <ImageIcon size={32} className="mx-auto mb-2" />
                    <p className="text-xs">Kunde inte ladda bild</p>
                  </div>
                </div>
              )}
            </div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-200"></div>
            
            {/* Close button for mobile */}
            <button
              onClick={() => setShowPreview(false)}
              className="absolute -top-2 -right-2 md:hidden bg-red-500 text-white rounded-full p-1 shadow-lg z-[10000] pointer-events-auto"
              aria-label="Stäng förhandsvisning"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </>
      )}
    </>
  );
}



