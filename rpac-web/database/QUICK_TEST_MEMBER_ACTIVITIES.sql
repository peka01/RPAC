-- =============================================
-- QUICK TEST: Add Sample Member Activities
-- =============================================
-- Run this to add test member join activities
-- Replace 'cd857625-a53a-4bb6-9970-b60db3cb8c73' with your actual community ID

-- Add 5 test member join activities with different names and timestamps
INSERT INTO homespace_activity_log (
  community_id,
  activity_type,
  title,
  description,
  icon,
  user_id,
  user_name,
  visible_public,
  created_at
) VALUES 
-- Very recent (just now)
(
  'cd857625-a53a-4bb6-9970-b60db3cb8c73', -- Replace with your community ID
  'member_joined',
  'Ny medlem välkommen',
  'Anna Andersson gick med i samhället',
  '👥',
  gen_random_uuid(),
  'Anna Andersson',
  true,
  NOW()
),
-- Recent (1 hour ago)
(
  'cd857625-a53a-4bb6-9970-b60db3cb8c73', -- Replace with your community ID
  'member_joined',
  'Ny medlem välkommen',
  'Erik Svensson gick med i samhället',
  '👥',
  gen_random_uuid(),
  'Erik Svensson',
  true,
  NOW() - INTERVAL '1 hour'
),
-- Recent (2 hours ago)
(
  'cd857625-a53a-4bb6-9970-b60db3cb8c73', -- Replace with your community ID
  'member_joined',
  'Ny medlem välkommen',
  'Maria Johansson gick med i samhället',
  '👥',
  gen_random_uuid(),
  'Maria Johansson',
  true,
  NOW() - INTERVAL '2 hours'
),
-- Yesterday
(
  'cd857625-a53a-4bb6-9970-b60db3cb8c73', -- Replace with your community ID
  'member_joined',
  'Ny medlem välkommen',
  'Lars Nilsson gick med i samhället',
  '👥',
  gen_random_uuid(),
  'Lars Nilsson',
  true,
  NOW() - INTERVAL '1 day'
),
-- 2 days ago
(
  'cd857625-a53a-4bb6-9970-b60db3cb8c73', -- Replace with your community ID
  'member_joined',
  'Ny medlem välkommen',
  'Sofia Karlsson gick med i samhället',
  '👥',
  gen_random_uuid(),
  'Sofia Karlsson',
  true,
  NOW() - INTERVAL '2 days'
);

-- Check the results
SELECT 
  'Test member activities added!' as status,
  user_name,
  created_at,
  description
FROM homespace_activity_log 
WHERE community_id = 'cd857625-a53a-4bb6-9970-b60db3cb8c73' -- Replace with your community ID
  AND activity_type = 'member_joined'
ORDER BY created_at DESC;
