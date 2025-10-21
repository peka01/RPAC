-- =============================================
-- FIND ALL REAL AUTHENTICATED USERS
-- =============================================

-- List all users from auth.users (these are the REAL users)
SELECT 
  id as user_id,
  email,
  created_at,
  last_sign_in_at,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed'
    ELSE '⏳ Not confirmed'
  END as status
FROM auth.users
ORDER BY created_at DESC;

-- Check which of these have profiles
SELECT 
  au.id as user_id,
  au.email,
  CASE 
    WHEN up.user_id IS NOT NULL THEN '✅ Has profile'
    ELSE '❌ No profile'
  END as has_profile,
  up.user_tier,
  up.county,
  up.climate_zone
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.user_id
ORDER BY au.created_at DESC;

