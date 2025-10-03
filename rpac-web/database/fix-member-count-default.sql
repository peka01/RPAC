-- =============================================
-- FIX MEMBER COUNT DEFAULT VALUE
-- =============================================
-- This script fixes the member_count default to start at 0
-- and ensures counts match actual memberships

-- Step 1: Fix the default value for new communities
ALTER TABLE local_communities 
ALTER COLUMN member_count SET DEFAULT 0;

-- Step 2: Sync existing communities' member_count with actual memberships
UPDATE local_communities lc
SET member_count = (
  SELECT COUNT(*)
  FROM community_memberships cm
  WHERE cm.community_id = lc.id
),
updated_at = NOW();

-- Step 3: Verify the results
SELECT 
  lc.id,
  lc.community_name as name,
  lc.member_count as stored_count,
  COUNT(cm.user_id) as actual_count,
  lc.created_by,
  CASE 
    WHEN lc.member_count = COUNT(cm.user_id) THEN '✓ OK'
    ELSE '✗ MISMATCH'
  END as status
FROM local_communities lc
LEFT JOIN community_memberships cm ON lc.id = cm.community_id
GROUP BY lc.id, lc.community_name, lc.member_count, lc.created_by
ORDER BY lc.created_at DESC;

-- Step 4: Ensure creators who don't have memberships are added
INSERT INTO community_memberships (community_id, user_id, role)
SELECT lc.id, lc.created_by, 'admin'
FROM local_communities lc
WHERE lc.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 
    FROM community_memberships cm 
    WHERE cm.community_id = lc.id 
      AND cm.user_id = lc.created_by
  );

-- Step 5: Update counts again after adding missing memberships
UPDATE local_communities lc
SET member_count = (
  SELECT COUNT(*)
  FROM community_memberships cm
  WHERE cm.community_id = lc.id
),
updated_at = NOW();

-- Step 6: Final verification
SELECT 
  lc.id,
  lc.community_name as name,
  lc.member_count as stored_count,
  COUNT(cm.user_id) as actual_count,
  STRING_AGG(cm.role, ', ') as member_roles,
  CASE 
    WHEN lc.member_count = COUNT(cm.user_id) THEN '✓ OK'
    ELSE '✗ MISMATCH'
  END as status
FROM local_communities lc
LEFT JOIN community_memberships cm ON lc.id = cm.community_id
GROUP BY lc.id, lc.community_name, lc.member_count, lc.created_by
ORDER BY lc.created_at DESC;

