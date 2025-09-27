// Supabase Configuration
// IMPORTANT: Create a .env.local file in the root directory with these values:
// NEXT_PUBLIC_SUPABASE_URL=https://dsoujjudzrrtkkqwhpge.supabase.co
// NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3VqanVkenJydGtrcXdocGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NTY3NjYsImV4cCI6MjA3NDIzMjc2Nn0.v95nh5WQWzrndcbElsmqTUVnO-jnuDtM1YcPUZNsHRA
// NEXT_PUBLIC_DEMO_MODE=false

// OpenAI Configuration
// IMPORTANT: Add your OpenAI API key to .env.local:
// OPENAI_API_KEY=your_openai_api_key_here

export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dsoujjudzrrtkkqwhpge.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3VqanVkenJydGtrcXdocGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NTY3NjYsImV4cCI6MjA3NDIzMjc2Nn0.v95nh5WQWzrndcbElsmqTUVnO-jnuDtM1YcPUZNsHRA'
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || ''
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
  },
  demo: {
    enabled: process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === '1',
    fallbackToDemo: !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
}

