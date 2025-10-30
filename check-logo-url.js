/**
 * Quick script to check what logo_url is actually stored in the database
 * Run with: node check-logo-url.js
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLogoUrl() {
  console.log('🔍 Checking logo URLs in database...\n');

  // Fetch all community homespaces with logos
  const { data, error } = await supabase
    .from('community_homespaces')
    .select(`
      id,
      slug,
      logo_url,
      updated_at,
      communities:local_communities (
        community_name
      )
    `)
    .not('logo_url', 'is', null)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching data:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('ℹ️  No communities with logos found.');
    return;
  }

  console.log(`Found ${data.length} community/communities with logos:\n`);

  data.forEach((homespace, index) => {
    const communityName = Array.isArray(homespace.communities) 
      ? homespace.communities[0]?.community_name 
      : homespace.communities?.community_name;

    console.log(`${index + 1}. ${communityName || 'Unknown'}`);
    console.log(`   Slug: ${homespace.slug}`);
    console.log(`   Logo URL: ${homespace.logo_url}`);
    console.log(`   Last Updated: ${new Date(homespace.updated_at).toLocaleString('sv-SE')}`);
    
    // Extract filename from URL to see if it's recent
    const match = homespace.logo_url?.match(/logo-(\d+)/);
    if (match) {
      const timestamp = parseInt(match[1]);
      const uploadDate = new Date(timestamp);
      console.log(`   Upload Date: ${uploadDate.toLocaleString('sv-SE')}`);
    }
    console.log('');
  });

  console.log('\n💡 Tips:');
  console.log('   - Check if the logo URL has today\'s timestamp');
  console.log('   - If the URL is old, the save may have failed');
  console.log('   - Open the logo URL in browser to verify it\'s the correct image\n');
}

checkLogoUrl();
