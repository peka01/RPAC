-- Robust fix for user_tier - with detailed debugging
-- Run this in Supabase SQL Editor

-- Step 1: Check if the user_profiles record exists
SELECT 
  'Step 1: Checking user_profiles record' as step,
  id,
  user_tier,
  display_name
FROM user_profiles
WHERE id = '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721';

-- Step 2: If the record doesn't exist, create it
INSERT INTO user_profiles (id, user_tier, display_name)
SELECT 
  '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721',
  'super_admin',
  'Per Karlsson'
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles WHERE id = '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721'
);

-- Step 3: Update the record (whether it existed or was just created)
UPDATE user_profiles 
SET 
  user_tier = 'super_admin',
  display_name = COALESCE(display_name, 'Per Karlsson')
WHERE id = '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721';

-- Step 4: Verify the final result
SELECT 
  'Step 4: Final verification' as step,
  au.id,
  au.email,
  up.user_tier,
  up.display_name,
  CASE 
    WHEN up.user_tier = 'super_admin' THEN '✅ SUCCESS'
    ELSE '❌ FAILED'
  END as status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.id = '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721';

