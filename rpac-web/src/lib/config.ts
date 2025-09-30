// Supabase Configuration
// IMPORTANT: Create a .env.local file in the root directory with these values:
// NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
// NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
// NEXT_PUBLIC_DEMO_MODE=false

// OpenAI Configuration
// IMPORTANT: Add your OpenAI API key to .env.local:
// OPENAI_API_KEY=your_openai_api_key_here

// Validate required environment variables
function validateConfig() {
  const requiredVars = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please create a .env.local file with the required variables.\n' +
      'See .env.example for reference.'
    );
  }
}

// Validate configuration on import
if (typeof window === 'undefined') {
  // Only validate on server-side to avoid client-side errors
  try {
    validateConfig();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown configuration error';
    console.error('Configuration validation failed:', errorMessage);
  }
}

export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || ''
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || ''
  },
  demo: {
    enabled: process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === '1',
    fallbackToDemo: false // Disable fallback to demo mode for security
  }
}

