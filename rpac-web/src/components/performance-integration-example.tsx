'use client';

import { useEffect } from 'react';
import { PerformanceMonitor } from './performance-monitor';
import { OptimizedImage, LazyImage } from './optimized-image';
import { OptimizedResourceList } from './virtual-list';
import { getCachedUserProfile, getCachedResources } from '@/lib/performance-optimizations';

/**
 * Example component showing how to integrate performance optimizations
 * This is a reference implementation - existing components remain unchanged
 */
export function PerformanceIntegrationExample() {
  useEffect(() => {
    // Register service worker for caching
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Performance Monitor - only shows in development */}
      <PerformanceMonitor />
      
      {/* Example of optimized image usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OptimizedImage
          src="/logga-beready.png"
          alt="Beready Logo"
          width={400}
          height={200}
          priority={true}
          className="rounded-lg"
        />
        
        <LazyImage
          src="/logga-beready.png"
          alt="Beready Shield"
          width={400}
          height={200}
          className="rounded-lg"
        />
      </div>
      
      {/* Example of virtual scrolling for large lists */}
      <div className="bg-white rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-4">Optimized Resource List</h3>
        <OptimizedResourceList
          resources={[]} // This would be populated with actual resources
          onResourceClick={(resource) => {
            console.log('Resource clicked:', resource);
          }}
        />
      </div>
    </div>
  );
}

/**
 * Hook for using cached data loading
 */
export function useCachedData(userId: string) {
  useEffect(() => {
    if (!userId) return;

    // Example of using cached data loading
    const loadData = async () => {
      try {
        const [profile, resources] = await Promise.all([
          getCachedUserProfile(userId),
          getCachedResources(userId)
        ]);
        
        console.log('Cached data loaded:', { profile, resources });
      } catch (error) {
        console.error('Error loading cached data:', error);
      }
    };

    loadData();
  }, [userId]);
}
