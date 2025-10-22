-- =============================================
-- MAKE USER 039b542f-570a-48a2-bc22-ec09f8990ace SUPER ADMIN
-- =============================================

-- Create or update the user profile to be super admin
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
)
ON CONFLICT (user_id) DO UPDATE SET
  user_tier = 'super_admin',
  license_type = 'free',
  is_license_active = true,
  tier_upgraded_at = NOW(),
  updated_at = NOW();

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

