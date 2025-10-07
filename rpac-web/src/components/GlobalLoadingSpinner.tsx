'use client';

import React from 'react';
import { ShieldProgressSpinner } from './ShieldProgressSpinner';

interface GlobalLoadingSpinnerProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
}

export const GlobalLoadingSpinner: React.FC<GlobalLoadingSpinnerProps> = ({
  isVisible,
  message = "Laddar...",
  progress
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-xl max-w-sm mx-4">
        <div className="text-center">
          <ShieldProgressSpinner
            variant="bounce"
            size="xl"
            color="olive"
            message={message}
            showProgress={progress !== undefined}
            progress={progress}
          />
        </div>
      </div>
    </div>
  );
};

// Hook for managing global loading state
export const useGlobalLoading = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState("Laddar...");
  const [loadingProgress, setLoadingProgress] = React.useState<number | undefined>(undefined);

  const showLoading = (message?: string, progress?: number) => {
    setLoadingMessage(message || "Laddar...");
    setLoadingProgress(progress);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
    setLoadingMessage("Laddar...");
    setLoadingProgress(undefined);
  };

  const updateProgress = (progress: number) => {
    setLoadingProgress(progress);
  };

  return {
    isLoading,
    loadingMessage,
    loadingProgress,
    showLoading,
    hideLoading,
    updateProgress
  };
};
