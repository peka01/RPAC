-- =============================================
-- DEBUG: Check Member Activity Data
-- =============================================
-- Run this to see what's actually in the database

-- Check recent member join activities
SELECT 
  id,
  community_id,
  activity_type,
  title,
  description,
  user_id,
  user_name
FROM homespace_activity_log 
WHERE activity_type = 'member_joined'
ORDER BY id DESC 
LIMIT 10;

-- Check if the trigger exists and is working
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

-- Check recent community memberships
SELECT 
  id,
  community_id,
  user_id,
  role,
  status
FROM community_memberships 
ORDER BY id DESC 
LIMIT 5;
