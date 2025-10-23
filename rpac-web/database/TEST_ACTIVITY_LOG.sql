-- =============================================
-- TEST ACTIVITY LOG ENTRIES
-- =============================================
-- Run this to check if the activity log is working properly
-- and if member names are being included

-- Check recent activity log entries
SELECT 
  id,
  community_id,
  activity_type,
  title,
  description,
  user_id,
  created_at
FROM homespace_activity_log 
WHERE activity_type = 'member_joined'
ORDER BY created_at DESC 
LIMIT 10;

-- Check if the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_log_member_joined'
  AND event_object_table = 'community_memberships';

-- Check if the function exists
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines 
WHERE routine_name = 'log_member_joined'
  AND routine_schema = 'public';
