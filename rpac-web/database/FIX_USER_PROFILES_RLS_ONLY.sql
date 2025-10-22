-- =============================================
-- FIX USER_PROFILES RLS POLICIES ONLY
-- =============================================
-- This ONLY fixes the user_profiles table to allow reading user_tier

-- Drop existing user_profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Super admins have full access to all profiles" ON user_profiles;

-- Allow users to view their own profile (including tier info)
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Super admins can view and modify all profiles
CREATE POLICY "Super admins have full access to all profiles"
  ON user_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND up.user_tier = 'super_admin'
    )
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ user_profiles RLS policies updated successfully!';
  RAISE NOTICE 'You should now be able to read user_tier, license_type, and is_license_active columns.';
END $$;

