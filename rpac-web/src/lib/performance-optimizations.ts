/**
 * Performance optimization utilities for RPAC
 */

import { supabase } from './supabase';

// Cache for frequently accessed data
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Cache TTL in milliseconds
const CACHE_TTL = {
  USER_PROFILE: 5 * 60 * 1000, // 5 minutes
  COMMUNITY_DATA: 2 * 60 * 1000, // 2 minutes
  RESOURCES: 1 * 60 * 1000, // 1 minute
  STATISTICS: 10 * 60 * 1000, // 10 minutes
};

/**
 * Generic cache wrapper
 */
export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): Promise<T> {
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < cached.ttl) {
    return Promise.resolve(cached.data);
  }

  return fetcher().then(data => {
    cache.set(key, { data, timestamp: now, ttl });
    return data;
  });
}

/**
 * Optimized user profile loading
 */
export async function getCachedUserProfile(userId: string) {
  return withCache(
    `user_profile_${userId}`,
    async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('display_name, first_name, last_name, name_display_preference, household_size, postal_code')
        .eq('user_id', userId)
        .single();
      return data;
    },
    CACHE_TTL.USER_PROFILE
  );
}

/**
 * Optimized resources loading with minimal fields
 */
export async function getCachedResources(userId: string) {
  return withCache(
    `resources_${userId}`,
    async () => {
      const { data } = await supabase
        .from('resources')
        .select('id, category, quantity, days_remaining, is_msb_recommended, msb_priority')
        .eq('user_id', userId)
        .order('is_msb_recommended', { ascending: false })
        .order('msb_priority', { ascending: true });
      return data;
    },
    CACHE_TTL.RESOURCES
  );
}

/**
 * Optimized community data loading
 */
export async function getCachedCommunityData(communityId: string) {
  return withCache(
    `community_${communityId}`,
    async () => {
      const { data } = await supabase
        .from('local_communities')
        .select('id, community_name, description, county, location, member_count, is_public')
        .eq('id', communityId)
        .single();
      return data;
    },
    CACHE_TTL.COMMUNITY_DATA
  );
}

/**
 * Batch multiple queries together
 */
export async function batchQueries(queries: Array<() => Promise<any>>) {
  return Promise.all(queries.map(query => query()));
}

/**
 * Debounced function for search
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttled function for scroll events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Clear cache for specific user
 */
export function clearUserCache(userId: string) {
  for (const [key] of cache) {
    if (key.includes(userId)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear all cache
 */
export function clearAllCache() {
  cache.clear();
}

/**
 * Preload critical data
 */
export async function preloadCriticalData(userId: string) {
  const queries = [
    () => getCachedUserProfile(userId),
    () => getCachedResources(userId),
  ];
  
  return batchQueries(queries);
}