-- =============================================
-- DEBUG USER MEMBERSHIP STATUS
-- =============================================
-- This helps debug why a community manager can't edit homepage
-- Created: 2025-01-27

-- Step 1: Find the current user
SELECT 
  'CURRENT USER INFO:' as info,
  up.user_id,
  au.email,
  up.display_name,
  up.user_tier
FROM user_profiles up
JOIN auth.users au ON au.id = up.user_id
WHERE au.email LIKE '%demo%' OR up.display_name LIKE '%demo%'
ORDER BY up.created_at DESC;

-- Step 2: Find all communities
SELECT 
  'ALL COMMUNITIES:' as info,
  lc.id as community_id,
  lc.community_name,
  lc.created_by,
  au.email as creator_email
FROM local_communities lc
LEFT JOIN auth.users au ON au.id = lc.created_by
ORDER BY lc.created_at DESC;

-- Step 3: Check user's memberships (run this after getting the user ID from Step 1)
-- First, get the user ID from Step 1, then replace it in this query:
/*
SELECT 
  'USER MEMBERSHIPS:' as info,
  cm.*,
  lc.community_name
FROM community_memberships cm
JOIN local_communities lc ON lc.id = cm.community_id
WHERE cm.user_id = 'ACTUAL_USER_ID_HERE'
ORDER BY cm.created_at DESC;
*/

-- Step 4: Check if user is creator of any communities
SELECT 
  'USER AS CREATOR:' as info,
  lc.id as community_id,
  lc.community_name,
  lc.created_by
FROM local_communities lc
WHERE lc.created_by = 'REPLACE_WITH_USER_ID_FROM_STEP_1';

-- Step 5: Check specific community membership (replace with actual community ID)
SELECT 
  'SPECIFIC COMMUNITY MEMBERSHIP:' as info,
  cm.*,
  lc.community_name
FROM community_memberships cm
JOIN local_communities lc ON lc.id = cm.community_id
WHERE cm.user_id = 'REPLACE_WITH_USER_ID_FROM_STEP_1'
  AND cm.community_id = 'REPLACE_WITH_COMMUNITY_ID';

RAISE NOTICE '🔍 Run this step by step to debug the membership issue';
