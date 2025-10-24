-- =============================================
-- ADD USER AS COMMUNITY ADMIN
-- =============================================
-- Quick fix to make a user an admin of a community
-- Created: 2025-01-27

-- First, let's see what we have
SELECT 
  'DEMO USER:' as info,
  up.user_id,
  au.email,
  up.user_tier
FROM user_profiles up
JOIN auth.users au ON au.id = up.user_id
WHERE au.email LIKE '%demo%' OR up.display_name LIKE '%demo%'
LIMIT 1;

SELECT 
  'LATEST COMMUNITY:' as info,
  lc.id,
  lc.community_name
FROM local_communities lc
ORDER BY lc.created_at DESC
LIMIT 1;

-- Add the demo user as admin of the latest community
-- (Replace the IDs with actual values from above queries)
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
WHERE au.email LIKE '%demo%' 
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

-- Verify the change
SELECT 
  'VERIFICATION:' as info,
  cm.*,
  lc.community_name
FROM community_memberships cm
JOIN local_communities lc ON lc.id = cm.community_id
JOIN user_profiles up ON up.user_id = cm.user_id
JOIN auth.users au ON au.id = up.user_id
WHERE au.email LIKE '%demo%'
  AND cm.role = 'admin';

RAISE NOTICE '✅ Demo user should now be admin of the latest community';
