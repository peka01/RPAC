-- Fix infinite recursion in community_memberships RLS policy
-- Issue: Error code 42P17 - infinite recursion detected in policy
-- Root cause: "Users can view community memberships" policy references community_memberships table
-- within its own policy check, causing infinite recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view community memberships" ON community_memberships;

-- Recreate the policy without self-referential logic
-- Users can view their own memberships, and we don't need to check other memberships
CREATE POLICY "Users can view community memberships" ON community_memberships
  FOR SELECT USING (auth.uid() = user_id);

-- This simpler policy:
-- - Allows users to view only their own membership records
-- - Avoids recursion by not querying community_memberships within the policy
-- - Still maintains security by restricting to the authenticated user's records
