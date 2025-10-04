-- =============================================
-- MAKE USER ADMIN OF COMMUNITY
-- =============================================
-- This script updates a user's role to admin in a specific community
-- Created: 2025-10-04
-- Purpose: Grant admin privileges to users for community management

-- =============================================
-- UPDATE USER ROLE TO ADMIN
-- =============================================

-- Instructions:
-- 1. Replace 'YOUR_USER_ID_HERE' with the actual user ID from auth.users
-- 2. Replace 'YOUR_COMMUNITY_ID_HERE' with the actual community ID from local_communities
-- 3. Run this script in Supabase SQL Editor

-- Example: Find your user ID
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Example: Find community ID
-- SELECT id, community_name FROM local_communities WHERE community_name = 'Your Community Name';

-- Update the role to admin
UPDATE community_memberships
SET role = 'admin'
WHERE user_id = 'YOUR_USER_ID_HERE'
  AND community_id = 'YOUR_COMMUNITY_ID_HERE';

-- Verify the update
SELECT 
  cm.id,
  cm.role,
  cm.joined_at,
  lc.community_name,
  up.display_name as user_name
FROM community_memberships cm
JOIN local_communities lc ON cm.community_id = lc.id
JOIN user_profiles up ON cm.user_id = up.user_id
WHERE cm.user_id = 'YOUR_USER_ID_HERE'
  AND cm.community_id = 'YOUR_COMMUNITY_ID_HERE';

-- =============================================
-- ALTERNATIVE: Make community creator admin
-- =============================================
-- If the user created the community, this will make them admin automatically

UPDATE community_memberships cm
SET role = 'admin'
FROM local_communities lc
WHERE cm.community_id = lc.id
  AND cm.user_id = lc.created_by
  AND cm.role != 'admin';

-- Verify all admins in all communities
SELECT 
  lc.community_name,
  up.display_name as admin_name,
  up.user_id,
  cm.role,
  cm.joined_at
FROM community_memberships cm
JOIN local_communities lc ON cm.community_id = lc.id
JOIN user_profiles up ON cm.user_id = up.user_id
WHERE cm.role IN ('admin', 'moderator')
ORDER BY lc.community_name, cm.role;

