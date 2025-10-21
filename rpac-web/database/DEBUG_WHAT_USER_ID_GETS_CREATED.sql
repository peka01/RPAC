-- =============================================
-- DEBUG: What happens when per.karlsson@title.se signs in?
-- =============================================

-- Check what user ID is associated with per.karlsson@title.se
SELECT 
  'Auth User' as source,
  id as user_id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'per.karlsson@title.se';

-- Check if there are MULTIPLE users with similar emails
SELECT 
  'All Similar' as source,
  id as user_id,
  email,
  created_at
FROM auth.users
WHERE email ILIKE '%per%karlsson%'
ORDER BY created_at DESC;

-- Check user_profiles for both possible user IDs
SELECT 
  'Profile for 039b542f' as source,
  user_id,
  user_tier,
  license_type,
  created_at
FROM user_profiles
WHERE user_id = '039b542f-570a-48a2-bc22-ec09f8990ace';

SELECT 
  'Profile for 34645cf8 (ghost)' as source,
  user_id,
  user_tier,
  license_type,
  created_at
FROM user_profiles
WHERE user_id = '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721';

