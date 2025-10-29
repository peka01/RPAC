-- =====================================================
-- CLEANUP DUPLICATE HELP_REQUESTS POLICIES
-- Date: 2025-10-29
-- =====================================================
-- Removes duplicate and old policies from help_requests table
-- keeping only the simplified, non-recursive versions
-- =====================================================

-- Drop all existing help_requests policies
DROP POLICY IF EXISTS "Users can view help requests in their communities" ON help_requests;
DROP POLICY IF EXISTS "Anyone can view open help requests" ON help_requests;
DROP POLICY IF EXISTS "Users can create help requests" ON help_requests;
DROP POLICY IF EXISTS "Users can insert their own help requests" ON help_requests;
DROP POLICY IF EXISTS "Users can update own help requests" ON help_requests;
DROP POLICY IF EXISTS "Users can update their own help requests" ON help_requests;
DROP POLICY IF EXISTS "Users can delete their own help requests" ON help_requests;

-- Recreate ONLY the simplified, correct policies
-- These are the non-recursive versions that prevent 42P17 errors

-- SELECT: Users can only view their own help requests
CREATE POLICY "Users can view help requests in their communities" ON help_requests
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Users can create help requests if they own them and community_id exists
CREATE POLICY "Users can create help requests" ON help_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id AND community_id IS NOT NULL);

-- UPDATE: Users can only update their own help requests
CREATE POLICY "Users can update own help requests" ON help_requests
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: Users can delete their own help requests
CREATE POLICY "Users can delete own help requests" ON help_requests
  FOR DELETE USING (auth.uid() = user_id);

-- Verification message
DO $$
BEGIN
  RAISE NOTICE '✅ Help requests policies cleaned up!';
  RAISE NOTICE 'Active policies:';
  RAISE NOTICE '  • SELECT: Users can view their own requests';
  RAISE NOTICE '  • INSERT: Users can create requests (requires community_id)';
  RAISE NOTICE '  • UPDATE: Users can update their own requests';
  RAISE NOTICE '  • DELETE: Users can delete their own requests';
  RAISE NOTICE '';
  RAISE NOTICE 'Removed duplicates and old policies:';
  RAISE NOTICE '  ✗ "Anyone can view open help requests" (too permissive)';
  RAISE NOTICE '  ✗ "Users can insert their own help requests" (duplicate)';
  RAISE NOTICE '  ✗ "Users can update their own help requests" (duplicate)';
  RAISE NOTICE '  ✗ "Users can delete their own help requests" (old version)';
END $$;
