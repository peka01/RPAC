-- =============================================
-- DEBUG SUPER ADMIN ACCESS
-- =============================================
-- Run this to diagnose why you can't access /super-admin

-- Step 1: Check if user_tier column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name IN ('user_tier', 'license_type', 'is_license_active')
ORDER BY column_name;

-- Expected result: Should show 3 rows (user_tier, license_type, is_license_active)
-- If empty: You didn't run add-user-tier-system.sql migration!

-- Step 2: Check all users in auth.users
SELECT 
  id as user_id, 
  email, 
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- Find your email and copy the user_id (UUID)

-- Step 3: Check if you have a user_profiles row
-- Replace YOUR_USER_ID with the UUID from Step 2
SELECT 
  user_id,
  county,
  postal_code,
  user_tier,
  license_type,
  is_license_active,
  created_at
FROM user_profiles
WHERE user_id = 'YOUR_USER_ID';

-- If empty: You don't have a profile row! See Step 5 below.

-- Step 4: Check ALL super admins in the system
SELECT 
  user_id,
  county,
  user_tier,
  license_type,
  is_license_active
FROM user_profiles
WHERE user_tier = 'super_admin';

-- Expected: Should show at least one row (you)
-- If empty: The UPDATE didn't work, or user_tier is NULL

-- Step 5: If you don't have a profile row, create it
-- Replace YOUR_USER_ID with your actual UUID from Step 2

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
--   'YOUR_USER_ID',
--   'super_admin',
--   'free',
--   true,
--   'svealand',
--   1,
--   NOW(),
--   NOW()
-- );

-- Step 6: If you DO have a profile row but user_tier is NULL or wrong, update it
-- Replace YOUR_USER_ID with your actual UUID

-- UPDATE user_profiles 
-- SET 
--   user_tier = 'super_admin',
--   license_type = 'free',
--   is_license_active = true
-- WHERE user_id = 'YOUR_USER_ID';

-- Step 7: Final verification - this should return YOUR row
SELECT 
  user_id,
  user_tier,
  license_type,
  is_license_active
FROM user_profiles
WHERE user_tier = 'super_admin';

-- TROUBLESHOOTING CHECKLIST:
-- □ Ran add-user-tier-system.sql migration (Step 1 shows columns)
-- □ Found my user_id from auth.users (Step 2)
-- □ Have a user_profiles row (Step 3 returns data)
-- □ user_tier is set to 'super_admin' (Step 4 shows my user)
-- □ is_license_active is true
-- □ Hard refreshed browser (Ctrl+Shift+R)
-- □ Cleared browser cache or tried incognito

