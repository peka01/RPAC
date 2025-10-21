-- =============================================
-- CREATE SUPER ADMIN PROFILE
-- =============================================
-- This script will:
-- 1. Find your user ID from auth.users
-- 2. Create or update your user_profiles entry
-- 3. Set you as super_admin

-- STEP 1: First, run add-user-tier-system.sql if you haven't already
-- (This adds the user_tier column)

-- STEP 2: Replace 'per.karlsson@title.se' with your actual email below

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'per.karlsson@title.se'; -- CHANGE THIS TO YOUR EMAIL
BEGIN
  -- Find the user ID from auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found in auth.users. Please check the email address.', v_email;
  END IF;

  RAISE NOTICE '✅ Found user: % (ID: %)', v_email, v_user_id;

  -- Check if user_profiles entry exists
  IF EXISTS (SELECT 1 FROM user_profiles WHERE user_id = v_user_id) THEN
    -- Update existing profile
    UPDATE user_profiles
    SET 
      user_tier = 'super_admin',
      license_type = 'free',
      is_license_active = true,
      tier_upgraded_at = NOW(),
      updated_at = NOW()
    WHERE user_id = v_user_id;
    
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
      tier_upgraded_at,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      'super_admin',
      'free',
      true,
      'svealand', -- Default climate zone
      1,          -- Default family size
      NOW(),
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Created new profile as super_admin';
  END IF;

  -- Verify the change
  RAISE NOTICE '✅ SUCCESS! You are now a super admin.';
  RAISE NOTICE 'Your user ID: %', v_user_id;
  
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
WHERE user_tier = 'super_admin';

