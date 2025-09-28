// Runtime configuration for environment variables
// This handles cases where process.env is not available at runtime

export interface RuntimeConfig {
  openaiApiKey?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

let runtimeConfig: RuntimeConfig = {};

// Initialize runtime configuration
export function initializeRuntimeConfig() {
  if (typeof window !== 'undefined') {
    // Client-side: try to get from window object or process.env
    runtimeConfig = {
      openaiApiKey: (window as any).NEXT_PUBLIC_OPENAI_API_KEY || 
                   process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      supabaseUrl: (window as any).NEXT_PUBLIC_SUPABASE_URL || 
                  process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: (window as any).NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    };
  } else {
    // Server-side: use process.env
    runtimeConfig = {
      openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    };
  }
}

export function getRuntimeConfig(): RuntimeConfig {
  return runtimeConfig;
}

export function getOpenAIApiKey(): string | undefined {
  return runtimeConfig.openaiApiKey;
}

// Auto-initialize on import
if (typeof window !== 'undefined') {
  initializeRuntimeConfig();
}
