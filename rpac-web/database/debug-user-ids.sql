-- =============================================
-- DEBUG USER IDS MISMATCH
-- =============================================
-- Check if user_ids match between tables

-- Check community memberships
SELECT 
  'Community Memberships' as source,
  cm.user_id,
  cm.community_id,
  cm.role
FROM community_memberships cm
WHERE cm.community_id = 'cd857625-a53a-4bb6-9970-b60db3cb8c73'
ORDER BY cm.user_id;

-- Check user profiles
SELECT 
  'User Profiles' as source,
  up.user_id,
  up.display_name,
  up.first_name,
  up.last_name
FROM user_profiles up
WHERE up.user_id IN (
  SELECT user_id FROM community_memberships 
  WHERE community_id = 'cd857625-a53a-4bb6-9970-b60db3cb8c73'
)
ORDER BY up.user_id;

-- Check for profiles that don't match memberships
SELECT 
  'Profiles WITHOUT matching membership' as issue,
  up.user_id,
  up.display_name
FROM user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM community_memberships cm
  WHERE cm.user_id = up.user_id
);

-- Check for memberships that don't have profiles
SELECT 
  'Memberships WITHOUT matching profile' as issue,
  cm.user_id,
  cm.community_id,
  au.email
FROM community_memberships cm
LEFT JOIN user_profiles up ON cm.user_id = up.user_id
LEFT JOIN auth.users au ON cm.user_id = au.id
WHERE up.user_id IS NULL
  AND cm.community_id = 'cd857625-a53a-4bb6-9970-b60db3cb8c73';

-- Check the specific problematic user
SELECT 
  'Checking specific user: 1def1560-5a92-454c-af4b-f97442c9403e' as check_type,
  up.user_id,
  up.display_name,
  au.email,
  cm.community_id
FROM user_profiles up
FULL OUTER JOIN auth.users au ON up.user_id = au.id
FULL OUTER JOIN community_memberships cm ON up.user_id = cm.user_id
WHERE up.user_id = '1def1560-5a92-454c-af4b-f97442c9403e'
   OR au.id = '1def1560-5a92-454c-af4b-f97442c9403e'
   OR cm.user_id = '1def1560-5a92-454c-af4b-f97442c9403e';

