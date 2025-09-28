// Simple environment variable test
export function testEnvironmentVariables() {
  const results = {
    nodeEnv: process.env.NODE_ENV,
    hasOpenAIKey: !!process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('NEXT_PUBLIC')),
    isClient: typeof window !== 'undefined',
    isServer: typeof window === 'undefined',
  };

  console.log('Environment Test Results:', results);
  return results;
}

// Test on import
if (typeof window !== 'undefined') {
  testEnvironmentVariables();
}
