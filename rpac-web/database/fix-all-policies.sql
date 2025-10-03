-- =============================================
-- FIX ALL COMMUNITY POLICIES - COMPLETE FIX
-- =============================================
-- This script fixes both the 500 error AND missing buttons
-- Run this in Supabase SQL Editor

-- =============================================
-- FIX LOCAL_COMMUNITIES POLICIES
-- =============================================

ALTER TABLE local_communities DISABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view public communities" ON local_communities';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create communities" ON local_communities';
    EXECUTE 'DROP POLICY IF EXISTS "Creators can update their communities" ON local_communities';
    EXECUTE 'DROP POLICY IF EXISTS "Creators can delete their communities" ON local_communities';
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE local_communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public communities"
  ON local_communities FOR SELECT
  TO authenticated
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create communities"
  ON local_communities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creators can update their communities"
  ON local_communities FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Creators can delete their communities"
  ON local_communities FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- =============================================
-- FIX COMMUNITY_MEMBERSHIPS POLICIES
-- =============================================

ALTER TABLE community_memberships DISABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view memberships in their communities" ON community_memberships';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own memberships" ON community_memberships';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view all memberships" ON community_memberships';
    EXECUTE 'DROP POLICY IF EXISTS "Users can join communities" ON community_memberships';
    EXECUTE 'DROP POLICY IF EXISTS "Users can leave communities" ON community_memberships';
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE community_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all memberships"
  ON community_memberships FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join communities"
  ON community_memberships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities"
  ON community_memberships FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- VERIFY POLICIES
-- =============================================

SELECT 'local_communities' as table_name, policyname, cmd
FROM pg_policies
WHERE tablename = 'local_communities'
UNION ALL
SELECT 'community_memberships' as table_name, policyname, cmd
FROM pg_policies
WHERE tablename = 'community_memberships'
ORDER BY table_name, cmd;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ All community policies fixed successfully!';
  RAISE NOTICE '✅ You should now be able to:';
  RAISE NOTICE '   - See Gå med / Lämna buttons';
  RAISE NOTICE '   - Delete communities you created';
  RAISE NOTICE '   - Edit communities you created';
END $$;

