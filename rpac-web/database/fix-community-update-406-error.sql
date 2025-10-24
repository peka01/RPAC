-- ================================================================
-- FIX COMMUNITY UPDATE 406 ERROR
-- ================================================================
-- Created: 2025-01-27
-- Purpose: Fix RLS policies that are using wrong column name (user_id vs created_by)
-- This fixes the 406 error when updating communities
-- ================================================================

-- Drop existing policies that use the wrong column name
DROP POLICY IF EXISTS "Community managers can create communities" ON local_communities;
DROP POLICY IF EXISTS "Community creators can manage their communities" ON local_communities;

-- Recreate policies with correct column name (created_by)
CREATE POLICY "Community managers can create communities" 
  ON local_communities FOR INSERT 
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND user_tier IN ('community_manager', 'super_admin')
      AND is_license_active = true
    )
  );

-- Community creators and admins can manage their communities
CREATE POLICY "Community creators can manage their communities" 
  ON local_communities FOR ALL 
  USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM community_memberships 
      WHERE community_id = local_communities.id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
      AND membership_status = 'approved'
    ) OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
      AND user_tier = 'super_admin'
      AND is_license_active = true
    )
  );

-- Log the fix
DO $$
BEGIN
  RAISE NOTICE '✅ Fixed RLS policies for local_communities - 406 error should be resolved';
END $$;
