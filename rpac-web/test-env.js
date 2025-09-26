// Test script to check environment variables
const result1 = require('dotenv').config({ path: '.env.local' });
console.log('Dotenv .env.local result:', result1);

console.log('=== Environment Variable Test ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing');
console.log('NEXT_PUBLIC_GEMINI_API_KEY:', process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 'Present' : 'Missing');
console.log('All NEXT_PUBLIC vars:', Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC')));
console.log('All env vars containing GEMINI:', Object.keys(process.env).filter(key => key.includes('GEMINI')));
console.log('=== End Test ===');
