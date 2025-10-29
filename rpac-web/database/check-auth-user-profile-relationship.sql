-- Check the relationship between auth.users and user_profiles

-- 1. See structure of user_profiles
SELECT 
  id as profile_id,
  user_id as profile_user_id,
  display_name
FROM user_profiles
LIMIT 3;

-- 2. Compare with auth.users
SELECT 
  au.id as auth_user_id,
  up.id as profile_id,
  up.user_id as profile_user_id,
  up.display_name
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
LIMIT 3;

-- 3. Check if user_profiles.id == auth.users.id or user_profiles.user_id == auth.users.id
SELECT 
  'Match on user_profiles.id' as match_type,
  COUNT(*) as count
FROM auth.users au
JOIN user_profiles up ON au.id = up.id

UNION ALL

SELECT 
  'Match on user_profiles.user_id' as match_type,
  COUNT(*) as count
FROM auth.users au
JOIN user_profiles up ON au.id = up.user_id;
