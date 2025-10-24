-- =============================================
-- MAKE USER COMMUNITY ADMIN
-- =============================================
-- This makes a user an admin of a specific community
-- so they can edit the homepage
-- Created: 2025-01-27

-- Step 1: Find the demo user and community
SELECT 
  'DEMO USER INFO:' as info,
  up.user_id,
  au.email,
  up.display_name
FROM user_profiles up
JOIN auth.users au ON au.id = up.user_id
WHERE au.email LIKE '%demo%' OR up.display_name LIKE '%demo%';

SELECT 
  'COMMUNITY INFO:' as info,
  lc.id as community_id,
  lc.community_name,
  lc.created_by as current_creator
FROM local_communities lc
ORDER BY lc.created_at DESC;

-- Step 2: Check if user is already a member
SELECT 
  'CURRENT MEMBERSHIP:' as info,
  cm.*,
  lc.community_name
FROM community_memberships cm
JOIN local_communities lc ON lc.id = cm.community_id
WHERE cm.user_id = 'REPLACE_WITH_DEMO_USER_ID'
  AND cm.community_id = 'REPLACE_WITH_COMMUNITY_ID';

-- Step 3: Add or update membership as admin
-- Replace the IDs with actual values from Step 1
INSERT INTO community_memberships (
  community_id,
  user_id,
  role,
  status,
  joined_at
) VALUES (
  'REPLACE_WITH_COMMUNITY_ID',
  'REPLACE_WITH_DEMO_USER_ID',
  'admin',
  'approved',
  NOW()
)
ON CONFLICT (community_id, user_id) 
DO UPDATE SET 
  role = 'admin',
  status = 'approved',
  updated_at = NOW();

-- Step 4: Verify the change
SELECT 
  'VERIFICATION:' as info,
  cm.*,
  lc.community_name
FROM community_memberships cm
JOIN local_communities lc ON lc.id = cm.community_id
WHERE cm.user_id = 'REPLACE_WITH_DEMO_USER_ID'
  AND cm.community_id = 'REPLACE_WITH_COMMUNITY_ID';

RAISE NOTICE '🔍 Run Step 1 to get the IDs, then replace the placeholder IDs in Steps 2-4';
