-- =============================================
-- MAKE USER 039b542f-570a-48a2-bc22-ec09f8990ace SUPER ADMIN
-- =============================================
-- Fixed version without ON CONFLICT

DO $$
BEGIN
  -- Check if profile exists
  IF EXISTS (SELECT 1 FROM user_profiles WHERE user_id = '039b542f-570a-48a2-bc22-ec09f8990ace') THEN
    -- Update existing profile
    UPDATE user_profiles
    SET 
      user_tier = 'super_admin',
      license_type = 'free',
      is_license_active = true,
      tier_upgraded_at = NOW(),
      updated_at = NOW()
    WHERE user_id = '039b542f-570a-48a2-bc22-ec09f8990ace';
    
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
      '039b542f-570a-48a2-bc22-ec09f8990ace',
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
  postal_code,
  climate_zone,
  created_at
FROM user_profiles
WHERE user_id = '039b542f-570a-48a2-bc22-ec09f8990ace';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ SUCCESS! User 039b542f-570a-48a2-bc22-ec09f8990ace is now a super admin!';
END $$;

