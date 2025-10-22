-- =============================================
-- DIAGNOSE get_all_users FUNCTION
-- =============================================
-- Run this to check if the function exists and what signature it has

-- 1. Check if function exists
SELECT 
  routine_name,
  routine_type,
  routine_schema,
  data_type as return_type
FROM information_schema.routines
WHERE routine_name = 'get_all_users'
ORDER BY routine_name;

-- 2. Check function parameters
SELECT 
  r.routine_name,
  p.parameter_name,
  p.data_type,
  p.parameter_mode,
  p.ordinal_position
FROM information_schema.routines r
LEFT JOIN information_schema.parameters p ON r.specific_name = p.specific_name
WHERE r.routine_name = 'get_all_users'
ORDER BY p.ordinal_position;

-- 3. Check current user's tier (are you a super_admin?)
SELECT 
  user_id,
  user_tier,
  email
FROM user_profiles
WHERE user_id = auth.uid();

-- 4. Test if function can be called (this will fail if it doesn't exist or has wrong signature)
-- Uncomment to test:
-- SELECT * FROM get_all_users(auth.uid(), NULL, 10, 0);

