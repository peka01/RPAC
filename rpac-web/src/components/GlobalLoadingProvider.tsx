'use client';

import React, { createContext, useContext, useState } from 'react';
import { GlobalLoadingSpinner } from './GlobalLoadingSpinner';

interface GlobalLoadingContextType {
  isLoading: boolean;
  loadingMessage: string;
  loadingProgress: number | undefined;
  showLoading: (message?: string, progress?: number) => void;
  hideLoading: () => void;
  updateProgress: (progress: number) => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export const GlobalLoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Laddar...");
  const [loadingProgress, setLoadingProgress] = useState<number | undefined>(undefined);

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

  return (
    <GlobalLoadingContext.Provider
      value={{
        isLoading,
        loadingMessage,
        loadingProgress,
        showLoading,
        hideLoading,
        updateProgress
      }}
    >
      {children}
      <GlobalLoadingSpinner
        isVisible={isLoading}
        message={loadingMessage}
        progress={loadingProgress}
      />
    </GlobalLoadingContext.Provider>
  );
};

export const useGlobalLoading = () => {
  const context = useContext(GlobalLoadingContext);
  if (context === undefined) {
    throw new Error('useGlobalLoading must be used within a GlobalLoadingProvider');
  }
  return context;
};
