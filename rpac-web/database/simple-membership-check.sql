-- =============================================
-- SIMPLE MEMBERSHIP CHECK
-- =============================================
-- Step-by-step debugging for community membership
-- Created: 2025-01-27

-- Step 1: Find the demo user
SELECT 
  'DEMO USER:' as info,
  up.user_id,
  au.email,
  up.display_name,
  up.user_tier
FROM user_profiles up
JOIN auth.users au ON au.id = up.user_id
WHERE au.email LIKE '%demo%' OR up.display_name LIKE '%demo%'
ORDER BY up.created_at DESC
LIMIT 1;

-- Step 2: Find all communities
SELECT 
  'ALL COMMUNITIES:' as info,
  lc.id as community_id,
  lc.community_name,
  lc.created_by
FROM local_communities lc
ORDER BY lc.created_at DESC;

-- Step 3: Check if demo user has ANY memberships
SELECT 
  'DEMO USER MEMBERSHIPS:' as info,
  cm.*,
  lc.community_name
FROM community_memberships cm
JOIN local_communities lc ON lc.id = cm.community_id
JOIN user_profiles up ON up.user_id = cm.user_id
JOIN auth.users au ON au.id = up.user_id
WHERE au.email LIKE '%demo%' OR up.display_name LIKE '%demo%'
ORDER BY lc.created_at DESC;

-- Step 4: If no memberships found, add demo user as admin of latest community
-- (Only run this if Step 3 shows no results)
INSERT INTO community_memberships (
  community_id,
  user_id,
  role,
  status,
  joined_at
) 
SELECT 
  lc.id,
  up.user_id,
  'admin',
  'approved',
  NOW()
FROM user_profiles up
JOIN auth.users au ON au.id = up.user_id
CROSS JOIN local_communities lc
WHERE (au.email LIKE '%demo%' OR up.display_name LIKE '%demo%')
  AND lc.id = (
    SELECT id FROM local_communities 
    ORDER BY created_at DESC 
    LIMIT 1
  )
ON CONFLICT (community_id, user_id) 
DO UPDATE SET 
  role = 'admin',
  status = 'approved',
  updated_at = NOW();

-- Step 5: Verify the result
SELECT 
  'FINAL CHECK:' as info,
  cm.*,
  lc.community_name
FROM community_memberships cm
JOIN local_communities lc ON lc.id = cm.community_id
JOIN user_profiles up ON up.user_id = cm.user_id
JOIN auth.users au ON au.id = up.user_id
WHERE (au.email LIKE '%demo%' OR up.display_name LIKE '%demo%')
  AND cm.role = 'admin';

RAISE NOTICE '🎯 Run this step by step to debug and fix the membership issue';
