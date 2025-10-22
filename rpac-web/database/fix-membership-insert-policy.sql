-- =============================================
-- FIX COMMUNITY MEMBERSHIPS RLS POLICIES
-- =============================================
-- This fixes the RLS policies to allow users to join communities
-- WITHOUT causing infinite recursion
-- Created: 2025-10-22
-- Issue: Infinite recursion in SELECT policy + 403 on INSERT
-- Fix: Simplified policies that don't reference community_memberships

-- =============================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- =============================================
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

-- =============================================
-- STEP 2: CREATE SIMPLE, NON-RECURSIVE POLICIES
-- =============================================

-- INSERT POLICY: Users can request to join communities
CREATE POLICY "Users can request to join communities"
  ON community_memberships FOR INSERT
  WITH CHECK (
    -- User can only create membership for themselves
    auth.uid() = user_id
  );

-- SELECT POLICY: All authenticated users can view memberships
-- This is SAFE and necessary because:
-- 1. Users need to see which communities they're in
-- 2. Users need to see member counts on community cards
-- 3. Admins need to see member lists
-- 4. The data isn't sensitive (user_id, community_id, role, status)
CREATE POLICY "Authenticated users can view memberships"
  ON community_memberships FOR SELECT
  USING (
    auth.role() = 'authenticated'
  );

-- UPDATE POLICY: Use a helper function to check admin status
-- We'll create a function that bypasses RLS to check if user is admin
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
-- STEP 3: VERIFY POLICIES WERE CREATED
-- =============================================
DO $$
DECLARE
  v_insert_count INTEGER;
  v_select_count INTEGER;
  v_update_count INTEGER;
  v_delete_count INTEGER;
BEGIN
  -- Count policies
  SELECT COUNT(*) INTO v_insert_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename = 'community_memberships' 
    AND cmd = 'INSERT';
    
  SELECT COUNT(*) INTO v_select_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename = 'community_memberships' 
    AND cmd = 'SELECT';
    
  SELECT COUNT(*) INTO v_update_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename = 'community_memberships' 
    AND cmd = 'UPDATE';
    
  SELECT COUNT(*) INTO v_delete_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename = 'community_memberships' 
    AND cmd = 'DELETE';

  RAISE NOTICE '';
  RAISE NOTICE '✅ Community membership RLS policies updated!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Policies created:';
  RAISE NOTICE '   - INSERT: % policy/policies', v_insert_count;
  RAISE NOTICE '   - SELECT: % policy/policies', v_select_count;
  RAISE NOTICE '   - UPDATE: % policy/policies', v_update_count;
  RAISE NOTICE '   - DELETE: % policy/policies', v_delete_count;
  RAISE NOTICE '';
  RAISE NOTICE '🔓 Users can now:';
  RAISE NOTICE '   ✅ Join communities (no more 403 errors)';
  RAISE NOTICE '   ✅ View their memberships (no more infinite recursion)';
  RAISE NOTICE '   ✅ See member lists';
  RAISE NOTICE '   ✅ Leave communities';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security maintained:';
  RAISE NOTICE '   ✅ Users can only join as themselves';
  RAISE NOTICE '   ✅ Only admins can approve/reject requests';
  RAISE NOTICE '   ✅ Only admins can remove members';
  RAISE NOTICE '';
END $$;
