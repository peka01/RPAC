-- =============================================
-- DIAGNOSE AND FIX AUTHENTICATION ISSUES
-- =============================================

-- STEP 1: List ALL users in auth.users
SELECT 
  '=== ALL USERS IN AUTH.USERS ===' as step,
  NULL as id,
  NULL as email,
  NULL as created_at;

SELECT 
  'User' as step,
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- STEP 2: List ALL user_profiles
SELECT 
  '=== ALL USER PROFILES ===' as step,
  NULL as user_id,
  NULL as user_tier,
  NULL as email;

SELECT 
  'Profile' as step,
  up.user_id,
  up.user_tier,
  au.email
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
ORDER BY up.created_at DESC;

-- STEP 3: Find orphaned profiles (profiles without auth.users entry)
SELECT 
  '=== ORPHANED PROFILES (no auth.users entry) ===' as step,
  NULL as user_id,
  NULL as user_tier;

SELECT 
  'Orphan' as step,
  up.user_id,
  up.user_tier
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE au.id IS NULL;

-- STEP 4: Find profiles for per.karlsson@title.se
SELECT 
  '=== PROFILES FOR per.karlsson@title.se ===' as step,
  NULL as user_id,
  NULL as email,
  NULL as user_tier;

SELECT 
  'Match' as step,
  au.id as user_id,
  au.email,
  up.user_tier
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
WHERE au.email = 'per.karlsson@title.se';

-- STEP 5: Check if user_tier column exists
SELECT 
  '=== CHECKING user_tier COLUMN ===' as step,
  NULL as column_name,
  NULL as data_type;

SELECT 
  'Column' as step,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles' 
AND column_name IN ('user_tier', 'license_type', 'is_license_active');

