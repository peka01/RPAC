-- =============================================
-- CHECK IF user_tier COLUMN EXISTS
-- =============================================

-- Check if the user_tier column exists in user_profiles
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- This will show ALL columns in user_profiles
-- If you don't see 'user_tier' in the results, the migration DID NOT run successfully

