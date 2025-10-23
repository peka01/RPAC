// Query user_profiles table using existing Supabase setup
const { createClient } = require('@supabase/supabase-js');

// Use the same configuration as your app
const supabaseUrl = 'https://dsoujjudzrrtkkqwhpge.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key-here';

console.log('🔧 Configuration:');
console.log('   URL:', supabaseUrl);
console.log('   Key:', supabaseKey ? 'Set' : 'Missing');
console.log('');

const supabase = createClient(supabaseUrl, supabaseKey);

async function queryUserProfiles() {
  try {
    console.log('🔍 Querying user_profiles table...');
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.log('❌ Error:', error.message);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('📭 No users found in user_profiles table');
      return;
    }
    
    console.log(`✅ Found ${data.length} users:`);
    console.log('=====================================');
    
    data.forEach((user, index) => {
      console.log(`${index + 1}. ${user.display_name || 'No display name'}`);
      console.log(`   User ID: ${user.user_id}`);
      console.log(`   Email: ${user.email || 'No email'}`);
      console.log(`   Location: ${user.location || 'No location'}`);
      console.log(`   Household Size: ${user.household_size || 'Not set'}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleDateString('sv-SE')}`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.log('❌ Connection error:', error.message);
    console.log('💡 Make sure your Supabase credentials are correct');
  }
}

queryUserProfiles();
