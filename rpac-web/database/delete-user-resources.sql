-- Delete All Resources for a Specific User
-- This script will delete all resources owned by a specific user
-- 
-- USAGE:
-- 1. Replace 'YOUR_USER_ID_HERE' with your actual user_id
-- 2. Run this script in your Supabase SQL editor
-- 3. Check the output to see how many rows were deleted
--
-- SAFETY: This only deletes resources for the specified user_id
-- It will NOT affect other users' resources

-- ============================================
-- STEP 1: Replace this with your user_id
-- ============================================
-- You can find your user_id by running:
-- SELECT auth.uid();
-- Or by checking the auth.users table

DO $$
DECLARE
  target_user_id UUID := 'YOUR_USER_ID_HERE'; -- REPLACE THIS
  deleted_count INT;
BEGIN
  -- Check if user_id looks valid (not placeholder)
  IF target_user_id::text = 'YOUR_USER_ID_HERE' THEN
    RAISE EXCEPTION 'Please replace YOUR_USER_ID_HERE with your actual user_id!';
  END IF;

  -- Delete all resources for this user
  DELETE FROM resources 
  WHERE user_id = target_user_id;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Successfully deleted % resources for user %', deleted_count, target_user_id;
END $$;

-- ============================================
-- Alternative: Simple one-liner (after testing above)
-- ============================================
-- Once you've tested and confirmed it works, you can use this simpler version:
-- DELETE FROM resources WHERE user_id = 'YOUR_USER_ID_HERE';

-- ============================================
-- OPTIONAL: Verify deletion
-- ============================================
-- Run this to confirm your resources are deleted:
-- SELECT COUNT(*) as remaining_resources 
-- FROM resources 
-- WHERE user_id = 'YOUR_USER_ID_HERE';

