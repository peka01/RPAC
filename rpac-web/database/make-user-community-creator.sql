-- =============================================
-- MAKE USER COMMUNITY CREATOR
-- =============================================
-- This makes a specific user the creator of a community
-- so they can edit the homepage
-- Created: 2025-01-27

-- Replace 'USER_ID_HERE' with the actual user ID
-- Replace 'COMMUNITY_ID_HERE' with the actual community ID

-- Example usage:
-- UPDATE local_communities 
-- SET created_by = 'e3b40ba6-cea4-4a2b-9873-093f...' 
-- WHERE id = 'community-id-here';

-- To find the user ID and community ID, run this first:
SELECT 
  lc.id as community_id,
  lc.community_name,
  lc.created_by as current_creator,
  au.email as creator_email
FROM local_communities lc
LEFT JOIN auth.users au ON au.id = lc.created_by
ORDER BY lc.created_at DESC;

-- To find the demo user:
SELECT 
  up.user_id,
  au.email,
  up.display_name
FROM user_profiles up
JOIN auth.users au ON au.id = up.user_id
WHERE au.email LIKE '%demo%' OR up.display_name LIKE '%demo%';

-- After finding the IDs, run:
-- UPDATE local_communities 
-- SET created_by = 'USER_ID_FROM_ABOVE_QUERY' 
-- WHERE id = 'COMMUNITY_ID_FROM_ABOVE_QUERY';

RAISE NOTICE '🔍 Run the SELECT queries above to find the user and community IDs, then update the UPDATE statement with the actual IDs';
