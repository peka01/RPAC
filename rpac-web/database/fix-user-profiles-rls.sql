-- =============================================
-- FIX USER PROFILES RLS POLICIES
-- =============================================
-- Allow users to see profiles of other community members
-- Created: 2025-10-03

-- Drop existing overly restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;

-- Allow authenticated users to view ALL profiles
-- (needed for messaging, community member lists, etc.)
CREATE POLICY "Allow authenticated users to view all profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Allow users to create own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own profile (optional, usually not needed)
CREATE POLICY "Allow users to delete own profile"
ON user_profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ USER PROFILES RLS POLICIES UPDATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Authenticated users can now:';
  RAISE NOTICE '  ✅ View ALL user profiles (needed for messaging)';
  RAISE NOTICE '  ✅ Create their own profile';
  RAISE NOTICE '  ✅ Update their own profile';
  RAISE NOTICE '  ✅ Delete their own profile';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ Note: All profiles are visible to authenticated users';
  RAISE NOTICE 'This is by design for community features (messaging, member lists)';
  RAISE NOTICE 'Users control what info to display via name_display_preference';
  RAISE NOTICE '';
END $$;

