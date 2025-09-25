/**
 * RPAC Migration Service
 * Handles migration from localStorage to Supabase
 */

import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface MigrationStatus {
  step: string;
  completed: boolean;
  error?: string;
  data?: any;
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  postal_code?: string;
  city?: string;
  county?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
  medical_conditions?: string;
  medications?: string;
  allergies?: string;
  blood_type?: string;
  special_needs?: string;
  household_size?: number;
  has_children?: boolean;
  has_elderly?: boolean;
  has_pets?: boolean;
  pet_types?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Resource {
  id: string;
  user_id: string;
  name: string;
  category: 'food' | 'water' | 'medicine' | 'energy' | 'tools';
  quantity: number;
  unit: string;
  days_remaining: number;
  is_msb_recommended?: boolean;
  msb_priority?: 'high' | 'medium' | 'low';
  is_filled?: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CultivationReminder {
  id: string;
  type: string;
  crop: string;
  date: string;
  isRecurring: boolean;
  isCompleted: boolean;
  notes?: string;
}

export interface CultivationSettings {
  notifications: boolean;
  emailReminders: boolean;
  pushNotifications: boolean;
}

export class MigrationService {
  private user: User | null = null;

  constructor(user: User | null) {
    this.user = user;
  }

  /**
   * Check if user has localStorage data to migrate
   */
  async checkMigrationNeeded(): Promise<boolean> {
    if (!this.user) return false;

    try {
      // Check if user profile exists in Supabase
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', this.user.id)
        .single();

      // If profile exists in Supabase, no migration needed
      if (existingProfile) return false;

      // Check if localStorage data exists
      const hasLocalStorageData = this.hasLocalStorageData();
      return hasLocalStorageData;
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  }

  /**
   * Check if localStorage contains data for this user
   */
  private hasLocalStorageData(): boolean {
    if (!this.user) return false;

    const localStorageKeys = [
      `userProfile_${this.user.id}`,
      'rpac-demo-resources',
      'cultivationReminders',
      'reminderSettings',
      'rpac-demo-communities',
      'rpac-demo-requests'
    ];

    return localStorageKeys.some(key => {
      try {
        return localStorage.getItem(key) !== null;
      } catch {
        return false;
      }
    });
  }

  /**
   * Perform complete migration from localStorage to Supabase
   */
  async migrateAllData(): Promise<MigrationStatus[]> {
    const results: MigrationStatus[] = [];

    if (!this.user) {
      results.push({
        step: 'user_check',
        completed: false,
        error: 'No user found for migration'
      });
      return results;
    }

    try {
      // Step 1: Migrate user profile
      const profileResult = await this.migrateUserProfile();
      results.push(profileResult);

      if (!profileResult.completed) {
        return results; // Stop if profile migration fails
      }

      // Step 2: Migrate resources
      const resourcesResult = await this.migrateResources();
      results.push(resourcesResult);

      // Step 3: Migrate cultivation data
      const cultivationResult = await this.migrateCultivationData();
      results.push(cultivationResult);

      // Step 4: Migrate community data
      const communityResult = await this.migrateCommunityData();
      results.push(communityResult);

      // Step 5: Clean up localStorage (optional)
      const cleanupResult = await this.cleanupLocalStorage();
      results.push(cleanupResult);

    } catch (error) {
      results.push({
        step: 'migration_error',
        completed: false,
        error: error instanceof Error ? error.message : 'Unknown migration error'
      });
    }

    return results;
  }

  /**
   * Migrate user profile from localStorage to Supabase
   */
  private async migrateUserProfile(): Promise<MigrationStatus> {
    try {
      if (!this.user) {
        return {
          step: 'user_profile',
          completed: false,
          error: 'No user found'
        };
      }

      // Get profile from localStorage
      const profileKey = `userProfile_${this.user.id}`;
      const savedProfile = localStorage.getItem(profileKey);

      if (!savedProfile) {
        // Create default profile in Supabase
        const defaultProfile = {
          user_id: this.user.id,
          display_name: this.user.user_metadata?.full_name || this.user.email?.split('@')[0] || 'Användare',
          email: this.user.email || '',
          household_size: 1,
          has_children: false,
          has_elderly: false,
          has_pets: false
        };

        const { data, error } = await supabase
          .from('user_profiles')
          .insert([defaultProfile])
          .select()
          .single();

        if (error) throw error;

        return {
          step: 'user_profile',
          completed: true,
          data: { created: 'default_profile', profile: data }
        };
      }

      // Parse and migrate existing profile
      const profileData = JSON.parse(savedProfile);
      
      const profileToInsert = {
        user_id: this.user.id,
        display_name: profileData.display_name || this.user.user_metadata?.full_name || this.user.email?.split('@')[0] || 'Användare',
        email: profileData.email || this.user.email || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        postal_code: profileData.postal_code || '',
        city: profileData.city || '',
        county: profileData.county || '',
        emergency_contact_name: profileData.emergency_contact_name || '',
        emergency_contact_phone: profileData.emergency_contact_phone || '',
        emergency_contact_relation: profileData.emergency_contact_relation || '',
        medical_conditions: profileData.medical_conditions || '',
        medications: profileData.medications || '',
        allergies: profileData.allergies || '',
        blood_type: profileData.blood_type || '',
        special_needs: profileData.special_needs || '',
        household_size: profileData.household_size || profileData.family_size || 1,
        has_children: profileData.has_children || false,
        has_elderly: profileData.has_elderly || false,
        has_pets: profileData.has_pets || (profileData.pets && profileData.pets.length > 0) || false,
        pet_types: profileData.pet_types || (profileData.pets ? profileData.pets.join(', ') : '')
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profileToInsert])
        .select()
        .single();

      if (error) throw error;

      return {
        step: 'user_profile',
        completed: true,
        data: { migrated: true, profile: data }
      };

    } catch (error) {
      return {
        step: 'user_profile',
        completed: false,
        error: error instanceof Error ? error.message : 'Profile migration failed'
      };
    }
  }

  /**
   * Migrate resources from localStorage to Supabase
   */
  private async migrateResources(): Promise<MigrationStatus> {
    try {
      if (!this.user) {
        return {
          step: 'resources',
          completed: false,
          error: 'No user found'
        };
      }

      // Get resources from localStorage
      const resourcesKey = 'rpac-demo-resources';
      const savedResources = localStorage.getItem(resourcesKey);

      if (!savedResources) {
        // Initialize MSB resources in Supabase
        await this.initializeMsbResources();
        return {
          step: 'resources',
          completed: true,
          data: { initialized: 'msb_resources' }
        };
      }

      // Parse and migrate existing resources
      const resourcesData: Resource[] = JSON.parse(savedResources);
      
      const resourcesToInsert = resourcesData.map(resource => ({
        user_id: this.user!.id,
        name: resource.name,
        category: resource.category,
        quantity: resource.quantity,
        unit: resource.unit,
        days_remaining: resource.days_remaining,
        is_msb_recommended: resource.is_msb_recommended || false,
        msb_priority: resource.msb_priority,
        is_filled: resource.is_filled || false,
        notes: resource.notes
      }));

      const { data, error } = await supabase
        .from('resources')
        .insert(resourcesToInsert)
        .select();

      if (error) throw error;

      return {
        step: 'resources',
        completed: true,
        data: { migrated: resourcesToInsert.length, resources: data }
      };

    } catch (error) {
      return {
        step: 'resources',
        completed: false,
        error: error instanceof Error ? error.message : 'Resources migration failed'
      };
    }
  }

  /**
   * Initialize MSB recommended resources for user
   */
  private async initializeMsbResources(): Promise<void> {
    if (!this.user) return;

    // MSB recommended items
    const msbItems = [
      // Food
      { name: 'Konserver och burkar', category: 'food', unit: 'burkar', msb_priority: 'high' },
      { name: 'Knäckebröd eller hårt bröd', category: 'food', unit: 'paket', msb_priority: 'high' },
      { name: 'Kött- eller fiskkonserver', category: 'food', unit: 'burkar', msb_priority: 'high' },
      { name: 'Frukt och nötter', category: 'food', unit: 'kg', msb_priority: 'medium' },
      
      // Water
      { name: 'Dricksvatten', category: 'water', unit: 'liter', msb_priority: 'high' },
      { name: 'Vattenreningstavletter', category: 'water', unit: 'förpackningar', msb_priority: 'medium' },
      { name: 'Extra vattenbehållare', category: 'water', unit: 'stycken', msb_priority: 'medium' },
      
      // Medicine
      { name: 'Receptbelagda mediciner', category: 'medicine', unit: 'dagars förbrukning', msb_priority: 'high' },
      { name: 'Första hjälpen-kit', category: 'medicine', unit: 'kit', msb_priority: 'high' },
      { name: 'Smärtstillande', category: 'medicine', unit: 'förpackningar', msb_priority: 'medium' },
      { name: 'Termometer', category: 'medicine', unit: 'stycken', msb_priority: 'medium' },
      
      // Energy
      { name: 'Batterier (olika storlekar)', category: 'energy', unit: 'förpackningar', msb_priority: 'high' },
      { name: 'Ficklampor', category: 'energy', unit: 'stycken', msb_priority: 'high' },
      { name: 'Batteridriven radio', category: 'energy', unit: 'stycken', msb_priority: 'high' },
      { name: 'Ljus och tändstickor', category: 'energy', unit: 'förpackningar', msb_priority: 'medium' },
      
      // Tools
      { name: 'Viktiga papper (vattentätt)', category: 'tools', unit: 'mapp', msb_priority: 'high' },
      { name: 'Kontanter', category: 'tools', unit: 'mindre mängder', msb_priority: 'high' },
      { name: 'Varma filtar', category: 'tools', unit: 'stycken', msb_priority: 'medium' },
      { name: 'Multiverktyg eller kniv', category: 'tools', unit: 'stycken', msb_priority: 'medium' },
    ];

    const resourcesToInsert = msbItems.map(item => ({
      user_id: this.user!.id,
      name: item.name,
      category: item.category as Resource['category'],
      quantity: 0,
      unit: item.unit,
      days_remaining: 0,
      is_msb_recommended: true,
      msb_priority: item.msb_priority as 'high' | 'medium' | 'low',
      is_filled: false
    }));

    const { error } = await supabase
      .from('resources')
      .insert(resourcesToInsert);

    if (error) throw error;
  }

  /**
   * Migrate cultivation data from localStorage to Supabase
   */
  private async migrateCultivationData(): Promise<MigrationStatus> {
    try {
      if (!this.user) {
        return {
          step: 'cultivation',
          completed: false,
          error: 'No user found'
        };
      }

      let migratedCount = 0;

      // Migrate cultivation reminders
      const remindersKey = 'cultivationReminders';
      const savedReminders = localStorage.getItem(remindersKey);

      if (savedReminders) {
        const remindersData: CultivationReminder[] = JSON.parse(savedReminders);
        
        const remindersToInsert = remindersData.map(reminder => ({
          user_id: this.user!.id,
          plant_id: null, // Will be linked to cultivation_data if needed
          reminder_type: reminder.type,
          reminder_date: reminder.date,
          reminder_time: null,
          message: reminder.notes || `${reminder.type} för ${reminder.crop}`,
          is_completed: reminder.isCompleted
        }));

        const { error: remindersError } = await supabase
          .from('cultivation_reminders')
          .insert(remindersToInsert);

        if (remindersError) throw remindersError;
        migratedCount += remindersToInsert.length;
      }

      // Migrate reminder settings (could be stored in user profile or separate table)
      const settingsKey = 'reminderSettings';
      const savedSettings = localStorage.getItem(settingsKey);

      if (savedSettings) {
        const settingsData: CultivationSettings = JSON.parse(savedSettings);
        // Store settings in user profile or create a settings table
        // For now, we'll skip this as it's not critical
      }

      return {
        step: 'cultivation',
        completed: true,
        data: { migrated: migratedCount }
      };

    } catch (error) {
      return {
        step: 'cultivation',
        completed: false,
        error: error instanceof Error ? error.message : 'Cultivation migration failed'
      };
    }
  }

  /**
   * Migrate community data from localStorage to Supabase
   */
  private async migrateCommunityData(): Promise<MigrationStatus> {
    try {
      if (!this.user) {
        return {
          step: 'community',
          completed: false,
          error: 'No user found'
        };
      }

      let migratedCount = 0;

      // Migrate communities
      const communitiesKey = 'rpac-demo-communities';
      const savedCommunities = localStorage.getItem(communitiesKey);

      if (savedCommunities) {
        const communitiesData = JSON.parse(savedCommunities);
        
        const communitiesToInsert = communitiesData.map((community: any) => ({
          community_name: community.community_name || community.name || 'Lokal gemenskap',
          description: community.description || '',
          location: community.location || '',
          postal_code: community.postal_code || '',
          county: community.county || '',
          is_public: community.is_public !== undefined ? community.is_public : true,
          member_count: community.member_count || 1,
          created_by: this.user!.id
        }));

        const { data: communities, error: communitiesError } = await supabase
          .from('local_communities')
          .insert(communitiesToInsert)
          .select();

        if (communitiesError) throw communitiesError;
        migratedCount += communitiesToInsert.length;
      }

      // Migrate help requests
      const requestsKey = 'rpac-demo-requests';
      const savedRequests = localStorage.getItem(requestsKey);

      if (savedRequests) {
        const requestsData = JSON.parse(savedRequests);
        
        const requestsToInsert = requestsData.map((request: any) => ({
          user_id: this.user!.id,
          community_id: null, // Will need to be linked to actual community
          title: request.title || 'Hjälpbegäran',
          description: request.description || '',
          category: request.category || 'general',
          urgency: request.urgency || 'medium',
          location: request.location || '',
          status: request.status || 'open',
          priority: request.priority || 0
        }));

        const { error: requestsError } = await supabase
          .from('help_requests')
          .insert(requestsToInsert);

        if (requestsError) throw requestsError;
        migratedCount += requestsToInsert.length;
      }

      return {
        step: 'community',
        completed: true,
        data: { migrated: migratedCount }
      };

    } catch (error) {
      return {
        step: 'community',
        completed: false,
        error: error instanceof Error ? error.message : 'Community migration failed'
      };
    }
  }

  /**
   * Clean up localStorage after successful migration
   */
  private async cleanupLocalStorage(): Promise<MigrationStatus> {
    try {
      if (!this.user) {
        return {
          step: 'cleanup',
          completed: false,
          error: 'No user found'
        };
      }

      const keysToRemove = [
        `userProfile_${this.user.id}`,
        'rpac-demo-resources',
        'cultivationReminders',
        'reminderSettings',
        'rpac-demo-communities',
        'rpac-demo-requests'
      ];

      let removedCount = 0;
      keysToRemove.forEach(key => {
        try {
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            removedCount++;
          }
        } catch (error) {
          console.warn(`Could not remove localStorage key: ${key}`, error);
        }
      });

      return {
        step: 'cleanup',
        completed: true,
        data: { removed: removedCount }
      };

    } catch (error) {
      return {
        step: 'cleanup',
        completed: false,
        error: error instanceof Error ? error.message : 'Cleanup failed'
      };
    }
  }

  /**
   * Get migration status for user
   */
  async getMigrationStatus(): Promise<{
    needsMigration: boolean;
    hasLocalStorageData: boolean;
    hasSupabaseData: boolean;
  }> {
    if (!this.user) {
      return {
        needsMigration: false,
        hasLocalStorageData: false,
        hasSupabaseData: false
      };
    }

    const hasLocalStorageData = this.hasLocalStorageData();
    
    let hasSupabaseData = false;
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', this.user.id)
        .single();
      
      hasSupabaseData = !!data;
    } catch {
      hasSupabaseData = false;
    }

    return {
      needsMigration: hasLocalStorageData && !hasSupabaseData,
      hasLocalStorageData,
      hasSupabaseData
    };
  }
}

// Export singleton instance
export const migrationService = new MigrationService(null);

// Export factory function
export function createMigrationService(user: User | null): MigrationService {
  return new MigrationService(user);
}
