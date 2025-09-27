// Debug Supabase authentication and RLS
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Supabase URL:', supabaseUrl)
console.log('🔍 Supabase Anon Key:', supabaseAnonKey ? 'Present' : 'Missing')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugSupabase() {
  console.log('🔍 Starting Supabase debug...')
  
  // Check current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  console.log('👤 Current user:', user)
  console.log('👤 User ID:', user?.id)
  console.log('❌ User error:', userError)
  
  if (!user) {
    console.log('❌ No authenticated user found!')
    return
  }
  
  // Test direct query to user_profiles
  console.log('🔍 Testing direct user_profiles query...')
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
  
  console.log('📊 Query result:', { data, error })
  
  if (error) {
    console.log('❌ Query error details:')
    console.log('  - Code:', error.code)
    console.log('  - Message:', error.message)
    console.log('  - Details:', error.details)
    console.log('  - Hint:', error.hint)
  }
  
  // Test with different approach
  console.log('🔍 Testing alternative query...')
  const { data: data2, error: error2 } = await supabase
    .from('user_profiles')
    .select('id, user_id, display_name')
    .eq('user_id', user.id)
    .maybeSingle()
  
  console.log('📊 Alternative query result:', { data2, error2 })
  
  // Check if we can access other tables
  console.log('🔍 Testing other table access...')
  const { data: resources, error: resourcesError } = await supabase
    .from('resources')
    .select('id')
    .limit(1)
  
  console.log('📊 Resources table access:', { resources, resourcesError })
}

debugSupabase().catch(console.error)
