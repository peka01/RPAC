-- =============================================
-- DEBUG COMMUNITY MEMBERSHIPS
-- =============================================
-- This script helps debug community membership issues
-- Created: 2025-10-04

-- Check if community_memberships table exists
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'community_memberships'
ORDER BY ordinal_position;

-- Check all memberships
SELECT 
  cm.id,
  cm.user_id,
  cm.community_id,
  cm.role,
  cm.joined_at,
  lc.name as community_name
FROM community_memberships cm
LEFT JOIN local_communities lc ON cm.community_id = lc.id
ORDER BY cm.joined_at DESC;

-- Check if your user has any memberships
-- (Replace 'YOUR_USER_ID' with your actual user ID)
SELECT 
  cm.*,
  lc.name as community_name,
  lc.description
FROM community_memberships cm
LEFT JOIN local_communities lc ON cm.community_id = lc.id
WHERE cm.user_id = auth.uid(); -- This will show YOUR memberships when run in authenticated context

-- Count memberships per user
SELECT 
  user_id,
  COUNT(*) as membership_count
FROM community_memberships
GROUP BY user_id
ORDER BY membership_count DESC;

-- Check communities table
SELECT 
  id,
  name,
  created_by,
  member_count,
  created_at
FROM local_communities
ORDER BY created_at DESC;

-- Show all users in communities
SELECT 
  lc.name as community_name,
  COUNT(cm.user_id) as actual_members,
  lc.member_count as recorded_count
FROM local_communities lc
LEFT JOIN community_memberships cm ON lc.id = cm.community_id
GROUP BY lc.id, lc.name, lc.member_count
ORDER BY actual_members DESC;

