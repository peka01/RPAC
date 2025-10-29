-- =====================================================
-- FIX HELP REQUESTS VISIBILITY
-- Date: 2025-10-29
-- Issue: Users can't see help requests from other community members
-- =====================================================

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Users can view help requests in their communities" ON help_requests;

-- Create new policy that allows viewing help requests in communities where user is a member
-- This uses a simple approach: allow viewing if the help_request has a community_id
-- Community membership verification is done at application level before displaying
CREATE POLICY "Community members can view help requests" ON help_requests
  FOR SELECT USING (
    -- Users can view their own requests
    auth.uid() = user_id 
    OR
    -- OR users can view requests in communities they belong to
    EXISTS (
      SELECT 1 FROM community_memberships cm
      WHERE cm.community_id = help_requests.community_id
        AND cm.user_id = auth.uid()
    )
  );

-- Verification message
DO $$
BEGIN
  RAISE NOTICE '✅ Help requests visibility policy updated!';
  RAISE NOTICE 'Users can now view:';
  RAISE NOTICE '  • Their own help requests';
  RAISE NOTICE '  • Help requests in communities they are members of';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Note: This uses EXISTS with community_memberships';
  RAISE NOTICE '   But it only checks the simple membership table, not recursively';
  RAISE NOTICE '   Should not cause 42P17 errors because:';
  RAISE NOTICE '   - community_memberships policy is simple (auth.uid() = user_id)';
  RAISE NOTICE '   - No circular reference back to help_requests';
END $$;
