/**
 * Geographic Service
 * Handles PostNummer-based community detection and location services for RPAC
 * 
 * Data Source: GeoNames (http://download.geonames.org/export/zip/)
 * Last Updated: Generated from SE.txt (18,846 Swedish postal codes)
 */

import { supabase } from './supabase';
import postalCodeMapping from '../data/postal-code-mapping.json';

export interface PostalCodeArea {
  postalCode: string;
  city: string;
  county: string;
  region: string; // Götaland, Svealand, Norrland
  latitude?: number;
  longitude?: number;
}

export interface NearbyArea {
  postalCode: string;
  city: string;
  distance: number; // km
  memberCount: number;
}

/**
 * Swedish postal code regions mapping
 * First digit determines main region
 */
const POSTAL_CODE_REGIONS: Record<string, string> = {
  '1': 'Svealand', // Stockholm
  '2': 'Svealand', // Uppland, Södermanland
  '3': 'Götaland', // Småland
  '4': 'Götaland', // Västra Götaland
  '5': 'Götaland', // Halland, Skåne
  '6': 'Svealand', // Värmland, Örebro, Västmanland
  '7': 'Götaland', // Östergötland, Gotland
  '8': 'Norrland', // Gävleborg, Västernorrland, Jämtland
  '9': 'Norrland' // Västerbotten, Norrbotten
};

/**
 * Swedish counties (län) by postal code prefix
 * Generated from GeoNames data (18,846 postal codes)
 * This data is accurate and sourced from official Swedish postal records
 */
const POSTAL_CODE_COUNTIES: Record<string, string> = postalCodeMapping as Record<string, string>;

export const geographicService = {
  /**
   * Validate Swedish postal code format (5 digits, space allowed after 3rd digit)
   */
  validatePostalCode(postalCode: string): boolean {
    const cleaned = postalCode.replace(/\s/g, '');
    return /^\d{5}$/.test(cleaned);
  },

  /**
   * Normalize postal code to format without spaces
   */
  normalizePostalCode(postalCode: string): string {
    return postalCode.replace(/\s/g, '').trim();
  },

  /**
   * Get region (Götaland, Svealand, Norrland) from postal code
   */
  getRegionFromPostalCode(postalCode: string): string {
    const normalized = this.normalizePostalCode(postalCode);
    const firstDigit = normalized.charAt(0);
    return POSTAL_CODE_REGIONS[firstDigit] || 'Okänd region';
  },

  /**
   * Get county (län) from postal code
   */
  getCountyFromPostalCode(postalCode: string): string {
    const normalized = this.normalizePostalCode(postalCode);
    const prefix = normalized.substring(0, 2);
    return POSTAL_CODE_COUNTIES[prefix] || 'Okänt län';
  },

  /**
   * Parse location information from postal code
   */
  parsePostalCode(postalCode: string): PostalCodeArea {
    const normalized = this.normalizePostalCode(postalCode);
    
    return {
      postalCode: normalized,
      city: '', // Would need external API or database for city names
      county: this.getCountyFromPostalCode(normalized),
      region: this.getRegionFromPostalCode(normalized)
    };
  },

  /**
   * Calculate simple distance between postal codes (rough approximation)
   * This uses the first 3 digits as proximity indicator
   */
  calculatePostalCodeDistance(postalCode1: string, postalCode2: string): number {
    const norm1 = this.normalizePostalCode(postalCode1);
    const norm2 = this.normalizePostalCode(postalCode2);
    
    // Same postal code
    if (norm1 === norm2) return 0;
    
    // Same first 3 digits = very close (within ~10km)
    if (norm1.substring(0, 3) === norm2.substring(0, 3)) {
      return Math.abs(parseInt(norm1) - parseInt(norm2)) * 0.5; // Rough estimate
    }
    
    // Same first 2 digits = nearby area (within ~50km)
    if (norm1.substring(0, 2) === norm2.substring(0, 2)) {
      return Math.abs(parseInt(norm1.substring(0, 3)) - parseInt(norm2.substring(0, 3))) * 5;
    }
    
    // Different county = far away (100+ km)
    return 100;
  },

  /**
   * Find communities near a postal code
   */
  async findNearbyCommunitiesByPostalCode(postalCode: string, maxDistance: number = 50): Promise<any[]> {
    const normalized = this.normalizePostalCode(postalCode);
    
    // Get all communities from database
    const { data: communities, error } = await supabase
      .from('local_communities')
      .select('*')
      .eq('is_public', true);
    
    if (error) throw error;
    if (!communities) return [];
    
    // Filter by proximity
    const nearbyCommunities = communities
      .map(community => ({
        ...community,
        distance: this.calculatePostalCodeDistance(normalized, community.postal_code || '')
      }))
      .filter(community => community.postal_code && community.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
    
    return nearbyCommunities;
  },

  /**
   * Find communities in the same region
   */
  async findCommunitiesByRegion(postalCode: string): Promise<any[]> {
    const region = this.getRegionFromPostalCode(postalCode);
    
    // Get all communities
    const { data: communities, error } = await supabase
      .from('local_communities')
      .select('*')
      .eq('is_public', true);
    
    if (error) throw error;
    if (!communities) return [];
    
    // Filter by region
    return communities.filter(community => {
      if (!community.postal_code) return false;
      const communityRegion = this.getRegionFromPostalCode(community.postal_code);
      return communityRegion === region;
    });
  },

  /**
   * Find communities in the same county
   */
  async findCommunitiesByCounty(postalCode: string): Promise<any[]> {
    const county = this.getCountyFromPostalCode(postalCode);
    
    const { data: communities, error } = await supabase
      .from('local_communities')
      .select('*')
      .eq('is_public', true);
    
    if (error) throw error;
    if (!communities) return [];
    
    return communities.filter(community => {
      if (!community.postal_code) return false;
      const communityCounty = this.getCountyFromPostalCode(community.postal_code);
      return communityCounty === county;
    });
  },

  /**
   * Get recommended search radius based on region
   * Norrland = larger radius (sparse population)
   * Götaland/Svealand = smaller radius (denser population)
   */
  getRecommendedRadius(postalCode: string): number {
    const region = this.getRegionFromPostalCode(postalCode);
    
    switch (region) {
      case 'Norrland':
        return 100; // km - sparse population
      case 'Svealand':
        return 30; // km - includes Stockholm area
      case 'Götaland':
        return 40; // km - medium density
      default:
        return 50; // km - default
    }
  },

  /**
   * Check if two postal codes are in the same immediate area (first 3 digits)
   */
  isImmediateNeighbor(postalCode1: string, postalCode2: string): boolean {
    const norm1 = this.normalizePostalCode(postalCode1);
    const norm2 = this.normalizePostalCode(postalCode2);
    return norm1.substring(0, 3) === norm2.substring(0, 3);
  },

  /**
   * Get location summary for display
   */
  getLocationSummary(postalCode: string): string {
    if (!this.validatePostalCode(postalCode)) {
      return 'Ogiltigt postnummer';
    }
    
    const county = this.getCountyFromPostalCode(postalCode);
    const region = this.getRegionFromPostalCode(postalCode);
    
    return `${county} (${region})`;
  }
};

