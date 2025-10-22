-- Verification script for membership status column migration
-- Run this to confirm the migration was successful

-- 1. Check if status column exists
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'community_memberships' 
  AND column_name = 'status';

-- Expected output:
-- column_name | data_type        | column_default | is_nullable
-- status      | character varying| 'approved'     | YES


-- 2. Check status values in existing memberships
SELECT 
    status, 
    COUNT(*) as count
FROM community_memberships 
GROUP BY status
ORDER BY count DESC;

-- Expected output:
-- status   | count 
-- approved | X (number of existing memberships)


-- 3. Check if indexes were created
SELECT 
    indexname, 
    indexdef
FROM pg_indexes 
WHERE tablename = 'community_memberships' 
  AND indexname LIKE '%status%';

-- Expected output (2 indexes):
-- idx_community_memberships_status
-- idx_community_memberships_community_status


-- 4. Check constraint
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'community_memberships' 
  AND constraint_name = 'community_memberships_status_check';

-- Expected output:
-- constraint_name                       | constraint_type
-- community_memberships_status_check    | CHECK


-- 5. Test query - Get all approved memberships (should return all existing ones)
SELECT 
    cm.user_id,
    cm.community_id,
    cm.role,
    cm.status,
    lc.community_name
FROM community_memberships cm
LEFT JOIN local_communities lc ON cm.community_id = lc.id
WHERE cm.status = 'approved'
LIMIT 5;

-- ✅ If all queries return results, migration was successful!

