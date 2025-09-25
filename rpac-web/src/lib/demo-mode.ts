/**
 * Demo Mode Configuration
 * Ensures demo version continues to work during Supabase migration
 */

export interface DemoModeConfig {
  enabled: boolean;
  useLocalStorage: boolean;
  useSupabase: boolean;
  showMigrationWizard: boolean;
  fallbackToDemo: boolean;
}

export class DemoModeManager {
  private static instance: DemoModeManager;
  private config: DemoModeConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): DemoModeManager {
    if (!DemoModeManager.instance) {
      DemoModeManager.instance = new DemoModeManager();
    }
    return DemoModeManager.instance;
  }

  /**
   * Load demo mode configuration from environment and localStorage
   */
  private loadConfig(): DemoModeConfig {
    // Check environment variable first
    const envDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE;
    const isDemoModeEnabled = envDemoMode === 'true' || envDemoMode === '1';

    // Check localStorage for user preference
    let localStorageDemoMode = false;
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('rpac-demo-mode');
        localStorageDemoMode = stored === 'true';
      }
    } catch (error) {
      console.warn('Could not read demo mode from localStorage:', error);
    }

    // Check if Supabase is properly configured
    const supabaseConfigured = this.isSupabaseConfigured();

    return {
      enabled: isDemoModeEnabled || localStorageDemoMode,
      useLocalStorage: isDemoModeEnabled || localStorageDemoMode || !supabaseConfigured,
      useSupabase: supabaseConfigured && !isDemoModeEnabled && !localStorageDemoMode,
      showMigrationWizard: supabaseConfigured && (isDemoModeEnabled || localStorageDemoMode),
      fallbackToDemo: !supabaseConfigured
    };
  }

  /**
   * Check if Supabase is properly configured
   */
  private isSupabaseConfigured(): boolean {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      return !!(url && key && url !== 'undefined' && key !== 'undefined');
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current demo mode configuration
   */
  public getConfig(): DemoModeConfig {
    return { ...this.config };
  }

  /**
   * Check if demo mode is enabled
   */
  public isDemoMode(): boolean {
    return this.config.enabled;
  }

  /**
   * Check if should use localStorage
   */
  public shouldUseLocalStorage(): boolean {
    return this.config.useLocalStorage;
  }

  /**
   * Check if should use Supabase
   */
  public shouldUseSupabase(): boolean {
    return this.config.useSupabase;
  }

  /**
   * Check if should show migration wizard
   */
  public shouldShowMigrationWizard(): boolean {
    return this.config.showMigrationWizard;
  }

  /**
   * Check if should fallback to demo
   */
  public shouldFallbackToDemo(): boolean {
    return this.config.fallbackToDemo;
  }

  /**
   * Enable demo mode
   */
  public enableDemoMode(): void {
    this.config.enabled = true;
    this.config.useLocalStorage = true;
    this.config.useSupabase = false;
    this.config.showMigrationWizard = false;
    
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('rpac-demo-mode', 'true');
      }
    } catch (error) {
      console.warn('Could not save demo mode to localStorage:', error);
    }
  }

  /**
   * Disable demo mode (enable Supabase)
   */
  public disableDemoMode(): void {
    this.config.enabled = false;
    this.config.useLocalStorage = false;
    this.config.useSupabase = true;
    this.config.showMigrationWizard = false;
    
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('rpac-demo-mode', 'false');
      }
    } catch (error) {
      console.warn('Could not save demo mode to localStorage:', error);
    }
  }

  /**
   * Force refresh configuration
   */
  public refreshConfig(): void {
    this.config = this.loadConfig();
  }

  /**
   * Get demo user for demo mode
   */
  public getDemoUser() {
    return {
      id: 'demo-user',
      email: 'demo@rpac.se',
      user_metadata: { 
        name: 'Demo Användare',
        demo_mode: true
      }
    };
  }

  /**
   * Check if user is demo user
   */
  public isDemoUser(user: any): boolean {
    return user?.id === 'demo-user' || user?.user_metadata?.demo_mode === true;
  }

  /**
   * Get storage key for demo data
   */
  public getStorageKey(key: string, userId?: string): string {
    if (this.shouldUseLocalStorage()) {
      return userId ? `${key}_${userId}` : key;
    }
    return key;
  }

  /**
   * Get demo data for a specific key
   */
  public getDemoData(key: string, userId?: string): any {
    if (!this.shouldUseLocalStorage()) return null;

    try {
      const storageKey = this.getStorageKey(key, userId);
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn(`Could not get demo data for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Set demo data for a specific key
   */
  public setDemoData(key: string, data: any, userId?: string): void {
    if (!this.shouldUseLocalStorage()) return;

    try {
      const storageKey = this.getStorageKey(key, userId);
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn(`Could not set demo data for key: ${key}`, error);
    }
  }

  /**
   * Remove demo data for a specific key
   */
  public removeDemoData(key: string, userId?: string): void {
    if (!this.shouldUseLocalStorage()) return;

    try {
      const storageKey = this.getStorageKey(key, userId);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn(`Could not remove demo data for key: ${key}`, error);
    }
  }

  /**
   * Get all demo data keys
   */
  public getAllDemoDataKeys(userId?: string): string[] {
    if (!this.shouldUseLocalStorage()) return [];

    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('rpac-') || key.startsWith('userProfile_') || key.startsWith('cultivation'))) {
          if (!userId || key.includes(userId)) {
            keys.push(key);
          }
        }
      }
      return keys;
    } catch (error) {
      console.warn('Could not get demo data keys:', error);
      return [];
    }
  }

  /**
   * Clear all demo data
   */
  public clearAllDemoData(userId?: string): void {
    if (!this.shouldUseLocalStorage()) return;

    try {
      const keys = this.getAllDemoDataKeys(userId);
      keys.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Could not clear demo data:', error);
    }
  }

  /**
   * Get demo mode status message
   */
  public getStatusMessage(): string {
    if (this.config.enabled) {
      return 'Demo-läge aktiverat - data sparas lokalt';
    } else if (this.config.useSupabase) {
      return 'Produktionsläge - data sparas i Supabase';
    } else if (this.config.fallbackToDemo) {
      return 'Fallback till demo-läge - Supabase inte konfigurerat';
    } else {
      return 'Okänt läge';
    }
  }

  /**
   * Get demo mode status for UI
   */
  public getStatusInfo(): {
    mode: 'demo' | 'production' | 'fallback';
    message: string;
    canMigrate: boolean;
    showWarning: boolean;
  } {
    if (this.config.enabled) {
      return {
        mode: 'demo',
        message: 'Demo-läge aktiverat',
        canMigrate: this.config.showMigrationWizard,
        showWarning: false
      };
    } else if (this.config.useSupabase) {
      return {
        mode: 'production',
        message: 'Produktionsläge',
        canMigrate: false,
        showWarning: false
      };
    } else {
      return {
        mode: 'fallback',
        message: 'Fallback till demo-läge',
        canMigrate: false,
        showWarning: true
      };
    }
  }
}

// Export singleton instance
export const demoMode = DemoModeManager.getInstance();

// Export utility functions
export const isDemoMode = () => demoMode.isDemoMode();
export const shouldUseLocalStorage = () => demoMode.shouldUseLocalStorage();
export const shouldUseSupabase = () => demoMode.shouldUseSupabase();
export const shouldShowMigrationWizard = () => demoMode.shouldShowMigrationWizard();
export const getDemoUser = () => demoMode.getDemoUser();
export const isDemoUser = (user: any) => demoMode.isDemoUser(user);
