-- BACKFILL CREATED_BY FIELDS FOR EXISTING COMMUNITIES
-- ================================================================
-- Created: 2025-01-27
-- Purpose: Backfill created_by fields for existing communities that have null values
-- This fixes admin access issues where communities don't have proper creators
-- ================================================================

-- Step 1: Check current state of created_by fields
SELECT 
  'CURRENT STATE:' as info,
  lc.id as community_id,
  lc.community_name,
  lc.created_by,
  au.email as creator_email,
  lc.created_at
FROM local_communities lc
LEFT JOIN auth.users au ON au.id = lc.created_by
ORDER BY lc.created_at DESC;

-- Step 2: Find communities with null created_by
SELECT 
  'COMMUNITIES WITH NULL CREATED_BY:' as info,
  lc.id as community_id,
  lc.community_name,
  lc.created_by,
  lc.created_at
FROM local_communities lc
WHERE lc.created_by IS NULL
ORDER BY lc.created_at DESC;

-- Step 3: Find potential creators (users who are admins in these communities)
SELECT 
  'POTENTIAL CREATORS (ADMINS):' as info,
  cm.community_id,
  lc.community_name,
  cm.user_id,
  up.display_name,
  up.email,
  cm.role,
  cm.created_at as membership_created
FROM community_memberships cm
JOIN local_communities lc ON lc.id = cm.community_id
LEFT JOIN user_profiles up ON up.user_id = cm.user_id
WHERE lc.created_by IS NULL 
  AND cm.role IN ('admin', 'moderator')
ORDER BY cm.created_at ASC;

-- Step 4: Manual backfill script (run after reviewing the above queries)
-- Replace the user IDs and community IDs with actual values from the queries above

-- Example backfill (uncomment and modify with actual IDs):
-- UPDATE local_communities 
-- SET created_by = 'USER_ID_FROM_STEP_3' 
-- WHERE id = 'COMMUNITY_ID_FROM_STEP_2';

-- Step 5: Verify the backfill worked
SELECT 
  'AFTER BACKFILL:' as info,
  lc.id as community_id,
  lc.community_name,
  lc.created_by,
  au.email as creator_email,
  lc.created_at
FROM local_communities lc
LEFT JOIN auth.users au ON au.id = lc.created_by
ORDER BY lc.created_at DESC;

RAISE NOTICE '🔍 Run the SELECT queries above to identify communities with null created_by and their potential creators, then update the UPDATE statement with actual IDs';
