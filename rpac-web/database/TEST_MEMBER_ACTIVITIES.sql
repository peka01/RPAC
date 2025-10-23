-- =============================================
-- TEST MEMBER ACTIVITIES FOR DISPLAY TESTING
-- =============================================
-- This script adds sample member join activities to test the enhanced display
-- Run this in Supabase SQL Editor to add test data

-- First, let's check what communities exist
SELECT 
  id,
  community_name,
  created_at
FROM local_communities 
ORDER BY created_at DESC 
LIMIT 5;

-- Add some test member join activities
-- Replace 'YOUR_COMMUNITY_ID' with an actual community ID from the query above

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
-- Recent member joins (last few hours)
(
  (SELECT id FROM local_communities ORDER BY created_at DESC LIMIT 1),
  'member_joined',
  'Ny medlem välkommen',
  'Anna Andersson gick med i samhället',
  '👥',
  gen_random_uuid(),
  'Anna Andersson',
  true,
  NOW() - INTERVAL '2 hours'
),
(
  (SELECT id FROM local_communities ORDER BY created_at DESC LIMIT 1),
  'member_joined',
  'Ny medlem välkommen',
  'Erik Svensson gick med i samhället',
  '👥',
  gen_random_uuid(),
  'Erik Svensson',
  true,
  NOW() - INTERVAL '1 hour'
),
(
  (SELECT id FROM local_communities ORDER BY created_at DESC LIMIT 1),
  'member_joined',
  'Ny medlem välkommen',
  'Maria Johansson gick med i samhället',
  '👥',
  gen_random_uuid(),
  'Maria Johansson',
  true,
  NOW() - INTERVAL '30 minutes'
),
-- Older member joins (yesterday)
(
  (SELECT id FROM local_communities ORDER BY created_at DESC LIMIT 1),
  'member_joined',
  'Ny medlem välkommen',
  'Lars Nilsson gick med i samhället',
  '👥',
  gen_random_uuid(),
  'Lars Nilsson',
  true,
  NOW() - INTERVAL '1 day'
),
(
  (SELECT id FROM local_communities ORDER BY created_at DESC LIMIT 1),
  'member_joined',
  'Ny medlem välkommen',
  'Sofia Karlsson gick med i samhället',
  '👥',
  gen_random_uuid(),
  'Sofia Karlsson',
  true,
  NOW() - INTERVAL '2 days'
);

-- Verify the test data was added
SELECT 
  id,
  community_id,
  activity_type,
  title,
  description,
  user_name,
  created_at
FROM homespace_activity_log 
WHERE activity_type = 'member_joined'
ORDER BY created_at DESC 
LIMIT 10;

-- Show a summary
SELECT 
  'Test activities added successfully!' as status,
  COUNT(*) as total_member_activities
FROM homespace_activity_log 
WHERE activity_type = 'member_joined';
