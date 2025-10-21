'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle, Bell, ArrowRight, X } from 'lucide-react';

interface SuccessNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  tipTitle: string;
  onNavigateToReminders: () => void;
  actionType?: 'saved' | 'completed';
}

export function SuccessNotification({ 
  isVisible, 
  onClose, 
  tipTitle, 
  onNavigateToReminders,
  actionType = 'saved'
}: SuccessNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div 
        className={`transform transition-all duration-300 ease-in-out ${
          isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        <div 
          className="bg-white rounded-lg shadow-lg border-l-4 p-4"
          style={{ 
            borderLeftColor: 'var(--color-sage)',
            backgroundColor: 'var(--bg-card)'
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                   style={{ backgroundColor: 'var(--color-sage)' }}>
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                  {actionType === 'saved' ? 'Tips sparad!' : 'Tips markerat som klart!'}
                </h4>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {actionType === 'saved' ? 'Din påminnelse har lagts till' : 'Bra jobbat! Tipset är markerat som klart'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tip Preview */}
          <div className="mb-3 p-2 rounded" style={{ backgroundColor: 'var(--bg-olive-light)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              "{tipTitle}"
            </p>
          </div>

          {/* Navigation Action */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <Bell className="w-4 h-4" />
              <span>{actionType === 'saved' ? 'Hittas i Påminnelser' : 'Tips markerat som klart'}</span>
            </div>
            {actionType === 'saved' ? (
              <Link
                href="/individual?section=cultivation&subsection=reminders"
                className="flex items-center space-x-1 px-3 py-1 text-sm rounded transition-all duration-200 hover:shadow-sm"
                style={{ 
                  backgroundColor: 'var(--color-sage)',
                  color: 'white',
                  textDecoration: 'none'
                }}
              >
                <span>Visa</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex items-center space-x-1 px-3 py-1 text-sm rounded"
                   style={{ 
                     backgroundColor: 'var(--color-green)',
                     color: 'white'
                   }}>
                <span>Klar!</span>
                <CheckCircle className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
