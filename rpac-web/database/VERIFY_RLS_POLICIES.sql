-- =============================================
-- VERIFY RLS POLICIES ARE WORKING
-- =============================================
-- Run this after applying URGENT_FIX_403_ERRORS.sql
-- to verify that the policies are correctly set up

-- Check community_memberships policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'community_memberships'
ORDER BY cmd, policyname;

-- Check homespace_activity_log policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'homespace_activity_log'
ORDER BY cmd, policyname;

-- Test if the helper function exists
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_name = 'is_community_admin'
  AND routine_schema = 'public';

-- Summary
SELECT 
  'community_memberships' as table_name,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'community_memberships'

UNION ALL

SELECT 
  'homespace_activity_log' as table_name,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'homespace_activity_log';
