-- Create missing user_profiles for users who have auth accounts but no profile
-- This happens when users were created before the user_profiles table existed
-- or when the profile creation trigger failed

-- First, let's see which users are missing profiles
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM auth.users au
  WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.user_id = au.id
  );
  
  RAISE NOTICE 'Found % users without profiles', missing_count;
END $$;

-- Create user_profiles for all auth.users that don't have one
INSERT INTO user_profiles (
  user_id,
  display_name,
  created_at,
  updated_at
)
SELECT 
  au.id as user_id,
  -- Generate display name from email using the same logic as our function
  CASE 
    WHEN au.email IS NOT NULL THEN
      -- Extract local part and capitalize
      array_to_string(
        ARRAY(
          SELECT initcap(part)
          FROM regexp_split_to_table(split_part(au.email, '@', 1), '[._-]') AS part
          WHERE length(part) > 0
        ),
        ' '
      )
    ELSE 'Användare'
  END as display_name,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.user_id = au.id
)
AND au.email IS NOT NULL;

-- Verify the results
DO $$
DECLARE
  total_auth_users INTEGER;
  total_profiles INTEGER;
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_auth_users FROM auth.users;
  SELECT COUNT(*) INTO total_profiles FROM user_profiles;
  
  SELECT COUNT(*) INTO missing_count
  FROM auth.users au
  WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.user_id = au.id
  );
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total auth users: %', total_auth_users;
  RAISE NOTICE 'Total user profiles: %', total_profiles;
  RAISE NOTICE 'Users still missing profiles: %', missing_count;
  RAISE NOTICE '========================================';
  
  IF missing_count > 0 THEN
    RAISE WARNING 'There are still % users without profiles!', missing_count;
  ELSE
    RAISE NOTICE 'SUCCESS! All users now have profiles.';
  END IF;
END $$;

-- Show the newly created profiles
SELECT 
  up.user_id,
  up.display_name,
  au.email,
  'NEWLY CREATED' as status
FROM user_profiles up
JOIN auth.users au ON up.user_id = au.id
WHERE up.created_at >= NOW() - INTERVAL '1 minute'
ORDER BY up.created_at DESC;
