-- =============================================
-- CHECK AND FIX MEMBER ACTIVITIES
-- =============================================
-- This script checks current activities and adds a test one

-- First, let's see what's currently in the activity log
SELECT 
  'Current activities:' as status,
  id,
  community_id,
  activity_type,
  title,
  description,
  user_name
FROM homespace_activity_log 
WHERE community_id = 'cd857625-a53a-4bb6-9970-b60db3cb8c73'
ORDER BY id DESC 
LIMIT 10;

-- Add a test member activity with a proper name
INSERT INTO homespace_activity_log (
  community_id,
  activity_type,
  title,
  description,
  icon,
  user_id,
  user_name,
  visible_public
) VALUES (
  'cd857625-a53a-4bb6-9970-b60db3cb8c73',
  'member_joined',
  'Ny medlem välkommen',
  'Anna Andersson gick med i samhället',
  '👥',
  '966c09bc-4ead-4ca7-a715-af079e232c67',
  'Anna Andersson',
  true
);

-- Check the result
SELECT 
  'Test activity added!' as status,
  user_name,
  description
FROM homespace_activity_log 
WHERE community_id = 'cd857625-a53a-4bb6-9970-b60db3cb8c73'
  AND activity_type = 'member_joined'
  AND user_name = 'Anna Andersson'
ORDER BY id DESC 
LIMIT 1;
