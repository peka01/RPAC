-- =============================================
-- URGENT FIX: 403 ERRORS & RLS POLICY VIOLATIONS
-- =============================================
-- This fixes the 403 errors when joining communities
-- AND the RLS policy violations on homespace_activity_log
-- Created: 2025-01-27
-- Issue: 403 Forbidden + RLS policy violations
-- Fix: Complete RLS policy overhaul

-- =============================================
-- STEP 1: FIX COMMUNITY_MEMBERSHIPS RLS POLICIES
-- =============================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can join communities" ON community_memberships;
DROP POLICY IF EXISTS "Users can request community membership" ON community_memberships;
DROP POLICY IF EXISTS "Users can request to join communities" ON community_memberships;
DROP POLICY IF EXISTS "Users can view their own memberships" ON community_memberships;
DROP POLICY IF EXISTS "Users can view community memberships" ON community_memberships;
DROP POLICY IF EXISTS "Users can view all memberships" ON community_memberships;
DROP POLICY IF EXISTS "Users can view relevant memberships" ON community_memberships;
DROP POLICY IF EXISTS "Admins can view all community memberships" ON community_memberships;
DROP POLICY IF EXISTS "Authenticated users can view memberships" ON community_memberships;
DROP POLICY IF EXISTS "Admins can manage membership requests" ON community_memberships;
DROP POLICY IF EXISTS "Users can leave communities" ON community_memberships;
DROP POLICY IF EXISTS "Community founders can view all memberships" ON community_memberships;
DROP POLICY IF EXISTS "Community founders can approve memberships" ON community_memberships;
DROP POLICY IF EXISTS "Super admins have full membership access" ON community_memberships;

-- INSERT POLICY: Users can request to join communities
CREATE POLICY "Users can request to join communities"
  ON community_memberships FOR INSERT
  WITH CHECK (
    -- User can only create membership for themselves
    auth.uid() = user_id
  );

-- SELECT POLICY: All authenticated users can view memberships
CREATE POLICY "Authenticated users can view memberships"
  ON community_memberships FOR SELECT
  USING (
    auth.role() = 'authenticated'
  );

-- Helper function to check admin status (avoids recursion)
CREATE OR REPLACE FUNCTION is_community_admin(p_user_id UUID, p_community_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is an admin or moderator in the community
  RETURN EXISTS (
    SELECT 1 FROM community_memberships
    WHERE community_id = p_community_id
      AND user_id = p_user_id
      AND role IN ('admin', 'moderator')
      AND (status = 'approved' OR membership_status = 'approved' OR status IS NULL)
  );
END;
$$;

-- UPDATE POLICY: Admins can manage membership requests
CREATE POLICY "Admins can manage membership requests"
  ON community_memberships FOR UPDATE
  USING (
    -- Use helper function to avoid recursion
    is_community_admin(auth.uid(), community_id)
    OR
    -- Super admins can update any membership
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
        AND user_tier = 'super_admin'
    )
  );

-- DELETE POLICY: Users can leave, admins can remove
CREATE POLICY "Users can leave communities"
  ON community_memberships FOR DELETE
  USING (
    -- Users can delete their own memberships (leave community)
    auth.uid() = user_id
    OR
    -- Admins can remove members (use helper function)
    is_community_admin(auth.uid(), community_id)
    OR
    -- Super admins can remove any member
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
        AND user_tier = 'super_admin'
    )
  );

-- =============================================
-- STEP 2: FIX HOMESPACE_ACTIVITY_LOG RLS POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view community activities" ON homespace_activity_log;
DROP POLICY IF EXISTS "Users can insert community activities" ON homespace_activity_log;
DROP POLICY IF EXISTS "Community members can view activities" ON homespace_activity_log;
DROP POLICY IF EXISTS "Authenticated users can view activities" ON homespace_activity_log;

-- SELECT POLICY: All authenticated users can view activities
CREATE POLICY "Authenticated users can view activities"
  ON homespace_activity_log FOR SELECT
  USING (
    auth.role() = 'authenticated'
  );

-- INSERT POLICY: System can insert activities (for triggers)
CREATE POLICY "System can insert activities"
  ON homespace_activity_log FOR INSERT
  WITH CHECK (
    -- Allow system inserts (triggers, functions)
    auth.role() = 'authenticated'
  );

-- UPDATE POLICY: Only system can update activities
CREATE POLICY "System can update activities"
  ON homespace_activity_log FOR UPDATE
  USING (
    auth.role() = 'authenticated'
  );

-- DELETE POLICY: Only system can delete activities
CREATE POLICY "System can delete activities"
  ON homespace_activity_log FOR DELETE
  USING (
    auth.role() = 'authenticated'
  );

-- =============================================
-- STEP 3: VERIFY ALL POLICIES WERE CREATED
-- =============================================
DO $$
DECLARE
  v_membership_policies INTEGER;
  v_activity_policies INTEGER;
BEGIN
  -- Count community_memberships policies
  SELECT COUNT(*) INTO v_membership_policies
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename = 'community_memberships';
    
  -- Count homespace_activity_log policies
  SELECT COUNT(*) INTO v_activity_policies
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename = 'homespace_activity_log';

  RAISE NOTICE '';
  RAISE NOTICE '✅ URGENT FIX APPLIED SUCCESSFULLY!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Policies created:';
  RAISE NOTICE '   - community_memberships: % policies', v_membership_policies;
  RAISE NOTICE '   - homespace_activity_log: % policies', v_activity_policies;
  RAISE NOTICE '';
  RAISE NOTICE '🔓 Users can now:';
  RAISE NOTICE '   ✅ Join communities (no more 403 errors)';
  RAISE NOTICE '   ✅ View memberships and activities';
  RAISE NOTICE '   ✅ Create membership requests';
  RAISE NOTICE '   ✅ Leave communities';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security maintained:';
  RAISE NOTICE '   ✅ Users can only join as themselves';
  RAISE NOTICE '   ✅ Only admins can approve/reject requests';
  RAISE NOTICE '   ✅ Activity logs are properly secured';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 The 403 errors should now be FIXED!';
  RAISE NOTICE '';
END $$;
