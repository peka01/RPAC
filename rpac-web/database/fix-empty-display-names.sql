-- =============================================
-- FIX EMPTY AND NULL DISPLAY NAMES
-- =============================================
-- This migration fixes user_profiles that have NULL or empty display_name
-- by populating them from auth.users email
-- Created: 2025-10-03

-- Update NULL display_names
DO $$
DECLARE
  profile_record RECORD;
  user_email TEXT;
BEGIN
  RAISE NOTICE 'Fixing NULL and empty display_names...';
  
  FOR profile_record IN 
    SELECT id, user_id, display_name 
    FROM user_profiles 
    WHERE display_name IS NULL OR display_name = '' OR TRIM(display_name) = ''
  LOOP
    -- Get email for this user
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = profile_record.user_id;
    
    -- Update with email prefix
    IF user_email IS NOT NULL THEN
      UPDATE user_profiles
      SET display_name = split_part(user_email, '@', 1)
      WHERE id = profile_record.id;
      
      RAISE NOTICE 'Updated user_id % with display_name: %', 
        profile_record.user_id, 
        split_part(user_email, '@', 1);
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Display name fix completed!';
END $$;

-- Verify the fix
DO $$
DECLARE
  null_count INTEGER;
  empty_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM user_profiles;
  SELECT COUNT(*) INTO null_count FROM user_profiles WHERE display_name IS NULL;
  SELECT COUNT(*) INTO empty_count FROM user_profiles WHERE display_name = '' OR TRIM(display_name) = '';
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICATION RESULTS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total profiles: %', total_count;
  RAISE NOTICE 'NULL display_names: %', null_count;
  RAISE NOTICE 'Empty display_names: %', empty_count;
  RAISE NOTICE '';
  
  IF null_count = 0 AND empty_count = 0 THEN
    RAISE NOTICE '✅ All profiles have valid display_names!';
  ELSE
    RAISE WARNING '⚠️ Some profiles still have NULL or empty display_names';
    RAISE NOTICE 'This might happen if auth.users email is missing';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- Show sample of updated profiles
SELECT 
  user_id,
  display_name,
  first_name,
  last_name,
  name_display_preference
FROM user_profiles
ORDER BY updated_at DESC
LIMIT 10;

