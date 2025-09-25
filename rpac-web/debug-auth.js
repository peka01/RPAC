const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dsoujjudzrrtkkqwhpge.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3VqanVkenJydGtrcXdocGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NTY3NjYsImV4cCI6MjA3NDIzMjc2Nn0.v95nh5WQWzrndcbElsmqTUVnO-jnuDtM1YcPUZNsHRA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAuth() {
  console.log('=== DEBUGGING AUTH AND DATABASE ===');
  
  try {
    // 1. Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Current user:', user ? user.id : 'No user');
    if (userError) console.log('User error:', userError);
    
    // 2. Try to sign in demo user
    console.log('\n--- Signing in demo user ---');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'demo@rpac.se',
      password: 'demo123'
    });
    
    if (signInError) {
      console.log('Sign in error:', signInError);
      
      // Try to sign up demo user
      console.log('\n--- Trying to sign up demo user ---');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'demo@rpac.se',
        password: 'demo123',
        options: {
          data: {
            name: 'Demo User'
          }
        }
      });
      
      if (signUpError) {
        console.log('Sign up error:', signUpError);
      } else {
        console.log('Demo user created:', signUpData.user?.id);
      }
    } else {
      console.log('Demo user signed in:', signInData.user?.id);
    }
    
    // 3. Check if we can read from local_communities
    console.log('\n--- Testing local_communities read ---');
    const { data: communities, error: readError } = await supabase
      .from('local_communities')
      .select('*')
      .limit(5);
    
    if (readError) {
      console.log('Read error:', readError);
    } else {
      console.log('Communities found:', communities?.length || 0);
    }
    
    // 4. Try to insert a test community
    console.log('\n--- Testing local_communities insert ---');
    const { data: insertData, error: insertError } = await supabase
      .from('local_communities')
      .insert({
        community_name: 'Test Community',
        location: 'Test Location',
        description: 'Test Description',
        created_by: signInData?.user?.id || '00000000-0000-0000-0000-000000000000'
      })
      .select();
    
    if (insertError) {
      console.log('Insert error:', insertError);
    } else {
      console.log('Insert successful:', insertData);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

debugAuth();
