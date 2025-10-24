-- =============================================
-- DEBUG ACTUAL FUNCTION IN DATABASE
-- =============================================
-- This script checks what the actual get_all_users function looks like
-- Run this in Supabase SQL Editor to see the real function definition
--
-- Created: 2025-01-27
-- Purpose: Debug the actual function that's causing type mismatches

-- Check what functions exist with get_all_users name
SELECT 
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%get_all_users%'
  AND routine_schema = 'public';

-- Check the actual function definition
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_all_users'
  AND n.nspname = 'public';

-- Check what columns actually exist in user_profiles
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND table_schema = 'public'
  AND column_name IN ('display_name', 'user_tier', 'license_type')
ORDER BY column_name;

-- Test a simple query to see what types are returned
SELECT 
  au.id,
  au.email,
  up.display_name,
  up.user_tier,
  up.license_type
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.user_id = au.id
LIMIT 1;
