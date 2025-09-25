const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dsoujjudzrrtkkqwhpge.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3VqanVkenJydGtrcXdocGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2NTY3NjYsImV4cCI6MjA3NDIzMjc2Nn0.v95nh5WQWzrndcbElsmqTUVnO-jnuDtM1YcPUZNsHRA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugResources() {
  console.log('=== DEBUGGING RESOURCES LOADING ===');
  
  try {
    // 1. Check current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Current user:', user ? user.id : 'No user');
    if (userError) console.log('User error:', userError);
    
    // 2. Try to sign in demo user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'demo@rpac.se',
      password: 'demo123'
    });
    
    if (signInError) {
      console.log('Sign in error:', signInError);
    } else {
      console.log('Demo user signed in:', signInData.user?.id);
      
      // 3. Try to get resources for this user
      console.log('\n--- Testing resources query ---');
      const { data: resources, error: resourcesError } = await supabase
        .from('resources')
        .select('*')
        .eq('user_id', signInData.user.id);
      
      if (resourcesError) {
        console.log('Resources error:', resourcesError);
      } else {
        console.log('Resources found:', resources?.length || 0);
        if (resources && resources.length > 0) {
          console.log('First resource:', resources[0]);
        }
      }
      
      // 4. Try without user filter (all resources)
      console.log('\n--- Testing all resources query ---');
      const { data: allResources, error: allResourcesError } = await supabase
        .from('resources')
        .select('*');
      
      if (allResourcesError) {
        console.log('All resources error:', allResourcesError);
      } else {
        console.log('All resources found:', allResources?.length || 0);
      }
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

debugResources();
