-- AUTO BACKFILL CREATED_BY FIELDS FOR EXISTING COMMUNITIES
-- ================================================================
-- Created: 2025-01-27
-- Purpose: Automatically backfill created_by fields using admin memberships
-- This script assigns the earliest admin as the creator for communities with null created_by
-- ================================================================

-- Step 1: Create a temporary table with the assignments
CREATE TEMP TABLE community_creator_assignments AS
SELECT 
  lc.id as community_id,
  lc.community_name,
  cm.user_id as assigned_creator,
  up.display_name as creator_name,
  up.email as creator_email,
  cm.role,
  lc.created_at as community_created,
  ROW_NUMBER() OVER (PARTITION BY lc.id ORDER BY lc.created_at ASC) as rn
FROM local_communities lc
JOIN community_memberships cm ON cm.community_id = lc.id
LEFT JOIN user_profiles up ON up.user_id = cm.user_id
WHERE lc.created_by IS NULL 
  AND cm.role IN ('admin', 'moderator')
  AND cm.user_id IS NOT NULL;

-- Step 2: Show what will be assigned (preview)
SELECT 
  'ASSIGNMENTS PREVIEW:' as info,
  community_id,
  community_name,
  assigned_creator,
  creator_name,
  creator_email,
  role,
  community_created
FROM community_creator_assignments
WHERE rn = 1
ORDER BY community_name;

-- Step 3: Perform the backfill (only for the first admin of each community)
UPDATE local_communities 
SET created_by = cca.assigned_creator
FROM community_creator_assignments cca
WHERE local_communities.id = cca.community_id
  AND cca.rn = 1;

-- Step 4: Show results
SELECT 
  'BACKFILL RESULTS:' as info,
  lc.id as community_id,
  lc.community_name,
  lc.created_by,
  au.email as creator_email,
  lc.created_at
FROM local_communities lc
LEFT JOIN auth.users au ON au.id = lc.created_by
WHERE lc.created_by IS NOT NULL
ORDER BY lc.created_at DESC;

-- Step 5: Show any remaining communities with null created_by
SELECT 
  'REMAINING NULL CREATED_BY:' as info,
  lc.id as community_id,
  lc.community_name,
  lc.created_by,
  lc.created_at
FROM local_communities lc
WHERE lc.created_by IS NULL
ORDER BY lc.created_at DESC;

-- Clean up
DROP TABLE IF EXISTS community_creator_assignments;

RAISE NOTICE '✅ Backfill completed! Check the results above to verify the assignments.';
