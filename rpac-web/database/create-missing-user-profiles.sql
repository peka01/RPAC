-- =============================================
-- CREATE MISSING USER PROFILES
-- =============================================
-- This migration creates user_profiles for any auth.users who don't have one
-- Especially important for users who joined communities before profiles were required
-- Created: 2025-10-03

-- Create profiles for users in community_memberships who don't have profiles
DO $$
DECLARE
  user_record RECORD;
  user_email TEXT;
  display_name_value TEXT;
  profile_count INTEGER;
BEGIN
  RAISE NOTICE 'Creating missing user profiles...';
  RAISE NOTICE '';
  
  -- Find all users in community_memberships without profiles
  FOR user_record IN 
    SELECT DISTINCT cm.user_id
    FROM community_memberships cm
    LEFT JOIN user_profiles up ON cm.user_id = up.user_id
    WHERE up.user_id IS NULL
  LOOP
    -- Get email from auth.users
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_record.user_id;
    
    IF user_email IS NOT NULL THEN
      -- Extract display name from email
      display_name_value := split_part(user_email, '@', 1);
      
      -- Create the profile
      INSERT INTO user_profiles (
        user_id,
        display_name,
        name_display_preference,
        created_at,
        updated_at
      ) VALUES (
        user_record.user_id,
        display_name_value,
        'display_name',
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id) DO NOTHING;
      
      RAISE NOTICE '✅ Created profile for user_id: % (display_name: %)', 
        user_record.user_id, 
        display_name_value;
    ELSE
      RAISE WARNING '⚠️ Could not find email for user_id: %', user_record.user_id;
    END IF;
  END LOOP;
  
  -- Count results
  SELECT COUNT(*) INTO profile_count FROM user_profiles;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PROFILE CREATION COMPLETED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total user profiles: %', profile_count;
  RAISE NOTICE '';
END $$;

-- Verify: Check if all community members now have profiles
DO $$
DECLARE
  members_without_profiles INTEGER;
BEGIN
  SELECT COUNT(DISTINCT cm.user_id) INTO members_without_profiles
  FROM community_memberships cm
  LEFT JOIN user_profiles up ON cm.user_id = up.user_id
  WHERE up.user_id IS NULL;
  
  RAISE NOTICE 'Verification:';
  RAISE NOTICE 'Community members without profiles: %', members_without_profiles;
  RAISE NOTICE '';
  
  IF members_without_profiles = 0 THEN
    RAISE NOTICE '✅ All community members now have profiles!';
  ELSE
    RAISE WARNING '⚠️ % community members still missing profiles', members_without_profiles;
  END IF;
  
  RAISE NOTICE '';
END $$;

-- Show all profiles with their display names
SELECT 
  up.user_id,
  up.display_name,
  up.first_name,
  up.last_name,
  up.name_display_preference,
  au.email,
  up.created_at
FROM user_profiles up
JOIN auth.users au ON up.user_id = au.id
ORDER BY up.created_at DESC;

