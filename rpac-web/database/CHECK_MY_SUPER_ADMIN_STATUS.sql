-- =============================================
-- CHECK IF 039b542f IS SUPER ADMIN
-- =============================================

-- Check the user's profile
SELECT 
  user_id,
  user_tier,
  license_type,
  is_license_active,
  created_at,
  updated_at
FROM user_profiles
WHERE user_id = '039b542f-570a-48a2-bc22-ec09f8990ace';

-- If no results, the profile doesn't exist!
-- If user_tier is NOT 'super_admin', it's not set correctly!

