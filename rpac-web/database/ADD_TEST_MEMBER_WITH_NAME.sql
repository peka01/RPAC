-- =============================================
-- ADD TEST MEMBER WITH PROPER NAME
-- =============================================
-- This adds a test member activity with a proper name to verify the display

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
  'cd857625-a53a-4bb6-9970-b60db3cb8c73', -- Replace with your community ID
  'member_joined',
  'Ny medlem välkommen',
  'Anna Andersson gick med i samhället',
  '👥',
  gen_random_uuid(),
  'Anna Andersson',
  true
);

-- Verify the test activity was added
SELECT 
  'Test member activity added!' as status,
  user_name,
  description
FROM homespace_activity_log 
WHERE community_id = 'cd857625-a53a-4bb6-9970-b60db3cb8c73' -- Replace with your community ID
  AND activity_type = 'member_joined'
  AND user_name = 'Anna Andersson'
ORDER BY id DESC 
LIMIT 1;
