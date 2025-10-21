-- =============================================
-- ADD SUPER ADMIN DELETE POLICIES
-- =============================================
-- Allow super admins to delete communities and memberships

-- 1. Allow super admins to delete communities
DROP POLICY IF EXISTS "Super admins can delete any community" ON local_communities;

CREATE POLICY "Super admins can delete any community"
  ON local_communities FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND user_tier = 'super_admin'
    )
  );

-- 2. Allow super admins to delete community memberships
DROP POLICY IF EXISTS "Super admins can delete any membership" ON community_memberships;

CREATE POLICY "Super admins can delete any membership"
  ON community_memberships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND user_tier = 'super_admin'
    )
  );

-- 3. Allow super admins to view all communities
DROP POLICY IF EXISTS "Super admins can view all communities" ON local_communities;

CREATE POLICY "Super admins can view all communities"
  ON local_communities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND user_tier = 'super_admin'
    )
    OR is_public = true
    OR created_by = auth.uid()
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Super admin delete policies added successfully!';
  RAISE NOTICE 'Super admins can now:';
  RAISE NOTICE '  - Delete any community';
  RAISE NOTICE '  - Delete any membership';
  RAISE NOTICE '  - View all communities';
END $$;

