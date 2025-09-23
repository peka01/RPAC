// Supabase Configuration
// IMPORTANT: Create a .env.local file in the root directory with these values:
// NEXT_PUBLIC_SUPABASE_URL=https://dsoujjudzrrtkkqwhpge.supabase.co
// NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3VqanVkenJydGtrcXdocGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NTY3NjYsImV4cCI6MjA3NDIzMjc2Nn0.v95nh5WQWzrndcbElsmqTUVnO-jnuDtM1YcPUZNsHRA

export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dsoujjudzrrtkkqwhpge.supabase.co',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3VqanVkenJydGtrcXdocGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NTY3NjYsImV4cCI6MjA3NDIzMjc2Nn0.v95nh5WQWzrndcbElsmqTUVnO-jnuDtM1YcPUZNsHRA'
  }
}
