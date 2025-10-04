-- =============================================
-- TROUBLESHOOT ADMIN ACCESS FOR COMMUNITY RESOURCES
-- =============================================
-- This script helps diagnose why you can't add community resources
-- Run these queries one by one in Supabase SQL Editor

-- =============================================
-- STEP 1: Check if tables exist
-- =============================================
SELECT 
  table_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'community_resources') 
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM (VALUES ('community_resources'), ('community_memberships'), ('local_communities')) AS t(table_name);

-- =============================================
-- STEP 2: Check your user ID
-- =============================================
SELECT 
  auth.uid() as your_user_id,
  au.email as your_email
FROM auth.users au
WHERE au.id = auth.uid();

-- =============================================
-- STEP 3: Check your communities and roles
-- =============================================
SELECT 
  lc.id as community_id,
  lc.community_name,
  cm.role as your_role,
  cm.joined_at,
  lc.created_by,
  CASE 
    WHEN cm.role IN ('admin', 'moderator') THEN '✅ CAN ADD RESOURCES'
    ELSE '❌ NO PERMISSION (role: ' || cm.role || ')'
  END as permission_status
FROM community_memberships cm
JOIN local_communities lc ON cm.community_id = lc.id
WHERE cm.user_id = auth.uid()
ORDER BY cm.joined_at DESC;

-- =============================================
-- STEP 4: Check if RLS is enabled
-- =============================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '⚠️ RLS Disabled'
  END as status
FROM pg_tables
WHERE tablename IN ('community_resources', 'community_memberships', 'local_communities')
  AND schemaname = 'public';

-- =============================================
-- STEP 5: Check RLS policies
-- =============================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'community_resources'
  AND schemaname = 'public'
ORDER BY policyname;

-- =============================================
-- STEP 6: Test if you can query community_resources
-- =============================================
SELECT 
  COUNT(*) as resource_count,
  community_id
FROM community_resources
GROUP BY community_id;

-- =============================================
-- STEP 7: Verify admin membership exists
-- =============================================
-- Replace 'YOUR_COMMUNITY_ID' with actual community ID from Step 3
SELECT 
  cm.user_id,
  cm.role,
  up.display_name,
  CASE 
    WHEN cm.role IN ('admin', 'moderator') THEN '✅ HAS PERMISSION'
    ELSE '❌ NO PERMISSION'
  END as can_add_resources
FROM community_memberships cm
LEFT JOIN user_profiles up ON cm.user_id = up.user_id
WHERE cm.community_id = 'YOUR_COMMUNITY_ID'  -- ← Replace this
  AND cm.user_id = auth.uid();

-- =============================================
-- STEP 8: Check if community_resources table has correct structure
-- =============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'community_resources'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- QUICK FIX: Make all community creators admins
-- =============================================
-- Uncomment and run this if creators are not marked as admin
/*
UPDATE community_memberships cm
SET role = 'admin'
FROM local_communities lc
WHERE cm.community_id = lc.id
  AND cm.user_id = lc.created_by
  AND cm.role != 'admin';

SELECT 
  lc.community_name,
  up.display_name,
  cm.role as updated_role
FROM community_memberships cm
JOIN local_communities lc ON cm.community_id = lc.id
JOIN user_profiles up ON cm.user_id = up.user_id
WHERE cm.user_id = lc.created_by;
*/

-- =============================================
-- MANUAL FIX: Make yourself admin
-- =============================================
-- Uncomment and replace YOUR_COMMUNITY_ID with actual ID from Step 3
/*
UPDATE community_memberships
SET role = 'admin'
WHERE user_id = auth.uid()
  AND community_id = 'YOUR_COMMUNITY_ID';  -- ← Replace this

-- Verify
SELECT role FROM community_memberships
WHERE user_id = auth.uid()
  AND community_id = 'YOUR_COMMUNITY_ID';  -- ← Replace this
*/

