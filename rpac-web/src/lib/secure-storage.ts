import CryptoJS from 'crypto-js';

// Get encryption key from environment or generate a fallback
const getEncryptionKey = (): string => {
  if (typeof window !== 'undefined') {
    // Client-side: use environment variable or generate key
    const envKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;
    if (envKey && envKey !== 'your_secure_encryption_key_here') {
      return envKey;
    }
    
    // Generate a key based on user agent and timestamp (not cryptographically secure, but better than nothing)
    const userAgent = navigator.userAgent;
    const timestamp = Date.now().toString();
    return CryptoJS.SHA256(userAgent + timestamp).toString();
  }
  
  // Server-side fallback
  return 'server-side-encryption-key';
};

/**
 * Secure Storage Utility for encrypting sensitive data in localStorage
 */
export class SecureStorage {
  private static readonly ENCRYPTION_KEY = getEncryptionKey();
  
  /**
   * Encrypt data before storing
   */
  private static encrypt(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      return CryptoJS.AES.encrypt(jsonString, this.ENCRYPTION_KEY).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }
  
  /**
   * Decrypt data after retrieving
   */
  private static decrypt(encryptedData: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }
      
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }
  
  /**
   * Store encrypted data in localStorage
   */
  static setItem(key: string, data: any): boolean {
    if (typeof window === 'undefined') {
      console.warn('SecureStorage.setItem called on server-side');
      return false;
    }
    
    try {
      const encrypted = this.encrypt(data);
      localStorage.setItem(key, encrypted);
      return true;
    } catch (error) {
      console.error('Failed to store encrypted data:', error);
      return false;
    }
  }
  
  /**
   * Retrieve and decrypt data from localStorage
   */
  static getItem<T = any>(key: string): T | null {
    if (typeof window === 'undefined') {
      console.warn('SecureStorage.getItem called on server-side');
      return null;
    }
    
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) {
        return null;
      }
      
      return this.decrypt(encrypted);
    } catch (error) {
      console.error('Failed to retrieve encrypted data:', error);
      return null;
    }
  }
  
  /**
   * Remove item from localStorage
   */
  static removeItem(key: string): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to remove item:', error);
      return false;
    }
  }
  
  /**
   * Clear all encrypted data (use with caution)
   */
  static clear(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    
    try {
      // Only clear items that look like they might be encrypted
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('rpac-') || key.includes('user') || key.includes('profile'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Failed to clear encrypted data:', error);
      return false;
    }
  }
  
  /**
   * Check if an item exists
   */
  static hasItem(key: string): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    
    return localStorage.getItem(key) !== null;
  }
  
  /**
   * Get all keys that might contain encrypted data
   */
  static getEncryptedKeys(): string[] {
    if (typeof window === 'undefined') {
      return [];
    }
    
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('rpac-') || key.includes('user') || key.includes('profile'))) {
        keys.push(key);
      }
    }
    return keys;
  }
}

/**
 * Migration utility to convert existing localStorage data to encrypted format
 */
export class StorageMigration {
  /**
   * Migrate existing localStorage data to encrypted format
   */
  static migrateToEncrypted(): void {
    if (typeof window === 'undefined') {
      return;
    }
    
    const keysToMigrate = [
      'rpac-user',
      'cultivationPlan',
      'cultivationCalendarItems',
      'ai-calendar-items',
      'reminderSettings'
    ];
    
    keysToMigrate.forEach(key => {
      try {
        const existingData = localStorage.getItem(key);
        if (existingData) {
          // Try to parse as JSON
          const parsedData = JSON.parse(existingData);
          
          // Store encrypted version
          const success = SecureStorage.setItem(key, parsedData);
          
          if (success) {
            console.log(`Migrated ${key} to encrypted storage`);
            // Remove original unencrypted data
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.warn(`Failed to migrate ${key}:`, error);
      }
    });
  }
  
  /**
   * Check if migration is needed
   */
  static needsMigration(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    
    const keysToCheck = [
      'rpac-user',
      'cultivationPlan',
      'cultivationCalendarItems'
    ];
    
    return keysToCheck.some(key => {
      const data = localStorage.getItem(key);
      return data && !data.startsWith('U2FsdGVkX1'); // Encrypted data starts with this prefix
    });
  }
}
