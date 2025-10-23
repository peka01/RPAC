-- =============================================
-- FORCE UPDATE: Fix All Member Names in Activities
-- =============================================
-- This script will force update all member_joined activities with proper names

-- First, let's see what we have
SELECT 
  'Current member activities:' as status,
  id,
  user_id,
  user_name,
  description
FROM homespace_activity_log 
WHERE activity_type = 'member_joined'
  AND community_id = 'cd857625-a53a-4bb6-9970-b60db3cb8c73'
ORDER BY id DESC;

-- Update all member_joined activities with proper user names
UPDATE homespace_activity_log 
SET 
  user_name = COALESCE(
    (SELECT COALESCE(up.display_name, CONCAT(up.first_name, ' ', up.last_name), 'Ny medlem')
     FROM user_profiles up 
     WHERE up.user_id = homespace_activity_log.user_id),
    'Ny medlem'
  ),
  description = COALESCE(
    (SELECT COALESCE(up.display_name, CONCAT(up.first_name, ' ', up.last_name), 'Ny medlem')
     FROM user_profiles up 
     WHERE up.user_id = homespace_activity_log.user_id),
    'Ny medlem'
  ) || ' gick med i samhället'
WHERE activity_type = 'member_joined'
  AND community_id = 'cd857625-a53a-4bb6-9970-b60db3cb8c73';

-- Check the results
SELECT 
  'Updated member activities:' as status,
  id,
  user_id,
  user_name,
  description
FROM homespace_activity_log 
WHERE activity_type = 'member_joined'
  AND community_id = 'cd857625-a53a-4bb6-9970-b60db3cb8c73'
ORDER BY id DESC;
