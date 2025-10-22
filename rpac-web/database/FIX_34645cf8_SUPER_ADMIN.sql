-- =============================================
-- MAKE THE REAL USER (34645cf8) SUPER ADMIN
-- =============================================
-- This is the user that Supabase Auth creates when per.karlsson@title.se logs in

DO $$
BEGIN
  -- Check if this user exists in user_profiles
  IF EXISTS (SELECT 1 FROM user_profiles WHERE user_id = '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721') THEN
    -- Update existing profile
    UPDATE user_profiles
    SET 
      user_tier = 'super_admin',
      license_type = 'free',
      is_license_active = true,
      tier_upgraded_at = NOW(),
      updated_at = NOW()
    WHERE user_id = '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721';
    
    RAISE NOTICE '✅ Updated existing profile to super_admin';
  ELSE
    -- Create new profile
    INSERT INTO user_profiles (
      user_id,
      user_tier,
      license_type,
      is_license_active,
      climate_zone,
      family_size,
      created_at,
      updated_at
    ) VALUES (
      '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721',
      'super_admin',
      'free',
      true,
      'svealand',
      1,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Created new profile as super_admin';
  END IF;
END $$;

-- Verify the result
SELECT 
  user_id,
  user_tier,
  license_type,
  is_license_active,
  county,
  climate_zone,
  created_at
FROM user_profiles
WHERE user_id = '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=================================================';
  RAISE NOTICE '✅ SUCCESS! User 34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721 is now a super admin!';
  RAISE NOTICE '=================================================';
  RAISE NOTICE 'Now:';
  RAISE NOTICE '1. Clear browser cache (Ctrl+Shift+R)';
  RAISE NOTICE '2. Go to /super-admin/login';
  RAISE NOTICE '3. Sign in with per.karlsson@title.se';
  RAISE NOTICE '4. You should be in! 🎉';
END $$;

