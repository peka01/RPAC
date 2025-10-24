-- FIX DEMO SAMHÄLLE CREATOR
-- ================================================================
-- Created: 2025-01-27
-- Purpose: Manually assign a creator to the remaining Demo Samhälle community
-- ================================================================

-- Step 1: Check current state of Demo Samhälle
SELECT 
  'DEMO SAMHÄLLE CURRENT STATE:' as info,
  lc.id as community_id,
  lc.community_name,
  lc.created_by,
  lc.created_at
FROM local_communities lc
WHERE lc.community_name = 'Demo Samhälle';

-- Step 2: Find potential creators (all users)
SELECT 
  'AVAILABLE USERS:' as info,
  au.id as user_id,
  au.email,
  up.display_name,
  up.first_name,
  up.last_name
FROM auth.users au
LEFT JOIN user_profiles up ON up.user_id = au.id
WHERE au.email IS NOT NULL
ORDER BY au.created_at ASC;

-- Step 3: Check if there are any memberships for Demo Samhälle
SELECT 
  'DEMO SAMHÄLLE MEMBERSHIPS:' as info,
  cm.community_id,
  cm.user_id,
  cm.role,
  up.display_name,
  au.email
FROM community_memberships cm
JOIN local_communities lc ON lc.id = cm.community_id
LEFT JOIN user_profiles up ON up.user_id = cm.user_id
LEFT JOIN auth.users au ON au.id = cm.user_id
WHERE lc.community_name = 'Demo Samhälle';

-- Step 4: Manual assignment (choose one of the options below)
-- Option A: Assign to a specific user (replace with actual user ID)
-- UPDATE local_communities 
-- SET created_by = 'USER_ID_FROM_STEP_2' 
-- WHERE community_name = 'Demo Samhälle';

-- Option B: Assign to the first available user
UPDATE local_communities 
SET created_by = (
  SELECT au.id 
  FROM auth.users au 
  WHERE au.email IS NOT NULL 
  ORDER BY au.created_at ASC 
  LIMIT 1
)
WHERE community_name = 'Demo Samhälle' 
  AND created_by IS NULL;

-- Step 5: Verify the assignment
SELECT 
  'AFTER ASSIGNMENT:' as info,
  lc.id as community_id,
  lc.community_name,
  lc.created_by,
  au.email as creator_email,
  up.display_name as creator_name
FROM local_communities lc
LEFT JOIN auth.users au ON au.id = lc.created_by
LEFT JOIN user_profiles up ON up.user_id = lc.created_by
WHERE lc.community_name = 'Demo Samhälle';

RAISE NOTICE '✅ Demo Samhälle creator assigned! Check the results above.';
