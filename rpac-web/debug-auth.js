// Debug script to check Supabase authentication and RLS
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugAuth() {
  console.log('🔍 Debugging Supabase Authentication and RLS...')
  
  // Check current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  console.log('👤 Current user:', user ? user.id : 'Not authenticated')
  if (userError) console.error('❌ User error:', userError)
  
  if (user) {
    // Test user_profiles query
    console.log('🔍 Testing user_profiles query...')
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (error) {
      console.error('❌ user_profiles query error:', error)
      console.error('Error code:', error.code)
      console.error('Error message:', error.message)
      console.error('Error details:', error.details)
    } else {
      console.log('✅ user_profiles query successful:', data)
    }
    
    // Test with different query approach
    console.log('🔍 Testing alternative query...')
    const { data: data2, error: error2 } = await supabase
      .from('user_profiles')
      .select('id, user_id, display_name, household_size')
      .eq('user_id', user.id)
    
    if (error2) {
      console.error('❌ Alternative query error:', error2)
    } else {
      console.log('✅ Alternative query successful:', data2)
    }
  }
}

debugAuth().catch(console.error)