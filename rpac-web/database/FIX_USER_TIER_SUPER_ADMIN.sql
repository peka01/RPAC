-- Fix user_tier for super admin
-- Run this in Supabase SQL Editor

-- Update user_tier to 'super_admin' for your user
UPDATE user_profiles 
SET user_tier = 'super_admin',
    display_name = COALESCE(display_name, 'Per Karlsson')
WHERE id = '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721';

-- Verify the update
SELECT 
  au.id,
  au.email,
  up.user_tier,
  up.display_name
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.id = '34645cf8-7ee5-4a3c-ab06-d1ac8f2ab721';

