-- =============================================
-- FIX DEMO USER MEMBERSHIP
-- =============================================
-- Simple fix to add demo user as community admin
-- Created: 2025-01-27

-- Step 1: Find demo user
SELECT 
  'DEMO USER:' as info,
  up.user_id,
  au.email,
  up.display_name
FROM user_profiles up
JOIN auth.users au ON au.id = up.user_id
WHERE au.email LIKE '%demo%' OR up.display_name LIKE '%demo%'
LIMIT 1;

-- Step 2: Find latest community
SELECT 
  'LATEST COMMUNITY:' as info,
  lc.id,
  lc.community_name
FROM local_communities lc
ORDER BY lc.created_at DESC
LIMIT 1;

-- Step 3: Add demo user as admin of latest community
INSERT INTO community_memberships (
  community_id,
  user_id,
  role,
  joined_at
) 
SELECT 
  lc.id,
  up.user_id,
  'admin',
  NOW()
FROM user_profiles up
JOIN auth.users au ON au.id = up.user_id
CROSS JOIN local_communities lc
WHERE (au.email LIKE '%demo%' OR up.display_name LIKE '%demo%')
  AND lc.id = (
    SELECT id FROM local_communities 
    ORDER BY lc.created_at DESC 
    LIMIT 1
  )
ON CONFLICT (community_id, user_id) 
DO UPDATE SET 
  role = 'admin',
  joined_at = NOW();

-- Step 4: Verify the result
SELECT 
  'VERIFICATION:' as info,
  cm.community_id,
  cm.user_id,
  cm.role,
  lc.community_name,
  au.email
FROM community_memberships cm
JOIN local_communities lc ON lc.id = cm.community_id
JOIN user_profiles up ON up.user_id = cm.user_id
JOIN auth.users au ON au.id = up.user_id
WHERE (au.email LIKE '%demo%' OR up.display_name LIKE '%demo%')
  AND cm.role = 'admin';

RAISE NOTICE '✅ Demo user should now be admin of the latest community';
