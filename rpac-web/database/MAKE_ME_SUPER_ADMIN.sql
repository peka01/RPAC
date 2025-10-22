-- =============================================
-- MAKE YOURSELF SUPER ADMIN
-- =============================================
-- Run this in Supabase SQL Editor after you've run all migrations

-- STEP 1: Find your user_id
-- Go to Supabase Dashboard → Authentication → Users
-- Copy your UUID (looks like: abc-123-def-456-ghi-789)

-- STEP 2: Replace YOUR_USER_ID_HERE with your actual user_id below
-- STEP 3: Run this query

UPDATE user_profiles 
SET 
  user_tier = 'super_admin',
  license_type = 'free',
  is_license_active = true,
  tier_upgraded_at = NOW()
WHERE user_id = 'YOUR_USER_ID_HERE';

-- STEP 4: Verify it worked (check columns that actually exist)
SELECT 
  user_id,
  county,
  postal_code,
  user_tier,
  license_type,
  is_license_active
FROM user_profiles
WHERE user_tier = 'super_admin';

-- You should see your user with user_tier = 'super_admin'

-- STEP 5: If you don't have a user_profiles row yet, create it:
-- (Uncomment and run this if the UPDATE above returned "0 rows updated")

-- INSERT INTO user_profiles (
--   user_id,
--   user_tier,
--   license_type,
--   is_license_active,
--   climate_zone,
--   family_size,
--   created_at,
--   updated_at
-- )
-- VALUES (
--   'YOUR_USER_ID_HERE',  -- Replace with your actual UUID
--   'super_admin',
--   'free',
--   true,
--   'svealand',
--   1,
--   NOW(),
--   NOW()
-- );

-- STEP 6: Refresh your browser and try accessing /super-admin again

-- TROUBLESHOOTING:
-- If you get "column does not exist" error, run the migrations first:
-- 1. add-user-tier-system.sql
-- 2. add-community-access-control.sql
-- etc.
