// API Key Manager for user-configurable OpenAI API keys
// This provides a secure way for users to configure their own API keys

export interface APIKeyConfig {
  openaiApiKey?: string;
  isConfigured: boolean;
  lastUsed?: string;
}

class APIKeyManager {
  private static readonly STORAGE_KEY = 'rpac_api_config';
  private static readonly ENCRYPTION_KEY = 'rpac_secure_2025'; // Simple obfuscation

  // Simple obfuscation (not real encryption, but better than plain text)
  private static obfuscate(text: string): string {
    return btoa(text.split('').reverse().join(''));
  }

  private static deobfuscate(text: string): string {
    try {
      return atob(text).split('').reverse().join('');
    } catch {
      return '';
    }
  }

  static getAPIKeyConfig(): APIKeyConfig {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return { isConfigured: false };
      }

      const deobfuscated = this.deobfuscate(stored);
      const config = JSON.parse(deobfuscated);
      
      return {
        ...config,
        isConfigured: !!config.openaiApiKey
      };
    } catch (error) {
      console.error('Error reading API key config:', error);
      return { isConfigured: false };
    }
  }

  static setAPIKey(apiKey: string): boolean {
    try {
      if (!apiKey || !apiKey.startsWith('sk-')) {
        return false;
      }

      const config: APIKeyConfig = {
        openaiApiKey: apiKey,
        isConfigured: true,
        lastUsed: new Date().toISOString()
      };

      const obfuscated = this.obfuscate(JSON.stringify(config));
      localStorage.setItem(this.STORAGE_KEY, obfuscated);
      
      return true;
    } catch (error) {
      console.error('Error saving API key:', error);
      return false;
    }
  }

  static getAPIKey(): string | null {
    const config = this.getAPIKeyConfig();
    return config.openaiApiKey || null;
  }

  static clearAPIKey(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  static validateAPIKey(apiKey: string): boolean {
    return !!apiKey && apiKey.startsWith('sk-') && apiKey.length > 20;
  }

  static async testAPIKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('API key test failed:', error);
      return false;
    }
  }
}

export { APIKeyManager };
