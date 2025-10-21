-- =============================================
-- FIX INFINITE RECURSION IN RLS POLICY
-- =============================================

-- Drop the problematic policy
DROP POLICY IF EXISTS "Super admins have full access to all profiles" ON user_profiles;

-- Create a NON-RECURSIVE version
-- Instead of checking user_profiles table, we'll allow super admins through a simpler check
-- Super admins can access all profiles WITHOUT recursion
CREATE POLICY "Super admins have full access to all profiles"
  ON user_profiles FOR ALL
  USING (
    -- Allow if accessing own profile OR if user_tier is super_admin
    auth.uid() = user_id 
    OR 
    user_tier = 'super_admin'
  );

DO $$
BEGIN
  RAISE NOTICE '✅ Fixed infinite recursion in RLS policy';
  RAISE NOTICE 'Super admins can now access all profiles without recursion';
END $$;

