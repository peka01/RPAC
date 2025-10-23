-- =============================================
-- ADD REAL MEMBER ACTIVITY WITH PROPER NAME
-- =============================================
-- This adds a test activity using a real user ID from your community

-- Get a real user ID from your community
SELECT 
  'Real user IDs in your community:' as info,
  user_id,
  role
FROM community_memberships 
WHERE community_id = 'cd857625-a53a-4bb6-9970-b60db3cb8c73'
ORDER BY id DESC 
LIMIT 3;

-- Add a test activity with a real user ID
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
  'Test User gick med i samhället',
  '👥',
  '966c09bc-4ead-4ca7-a715-af079e232c67', -- Real user ID from your community
  'Test User',
  true
);

-- Verify the test activity
SELECT 
  'Test activity added!' as status,
  user_id,
  user_name,
  description
FROM homespace_activity_log 
WHERE community_id = 'cd857625-a53a-4bb6-9970-b60db3cb8c73'
  AND activity_type = 'member_joined'
  AND user_name = 'Test User'
ORDER BY id DESC 
LIMIT 1;
