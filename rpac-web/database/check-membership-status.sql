-- =============================================
-- CHECK MEMBERSHIP STATUS
-- =============================================
-- Check what the actual membership record looks like
-- Created: 2025-01-27

-- Check if status column exists
SELECT 
  'STATUS COLUMN CHECK:' as info,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'community_memberships' 
  AND column_name = 'status';

-- Check the actual membership record
SELECT 
  'DEMO USER MEMBERSHIP:' as info,
  cm.*,
  lc.community_name
FROM community_memberships cm
JOIN local_communities lc ON lc.id = cm.community_id
JOIN user_profiles up ON up.user_id = cm.user_id
JOIN auth.users au ON au.id = up.user_id
WHERE (au.email LIKE '%demo%' OR up.display_name LIKE '%demo%')
  AND cm.role = 'admin';

-- If status column doesn't exist, add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_memberships' AND column_name = 'status'
  ) THEN
    ALTER TABLE community_memberships 
    ADD COLUMN status VARCHAR(20) DEFAULT 'approved';
    
    -- Update existing records
    UPDATE community_memberships 
    SET status = 'approved' 
    WHERE status IS NULL;
    
    RAISE NOTICE '✅ Added status column to community_memberships';
  ELSE
    RAISE NOTICE '✅ Status column already exists';
  END IF;
END $$;

-- Verify the final result
SELECT 
  'FINAL CHECK:' as info,
  cm.community_id,
  cm.user_id,
  cm.role,
  cm.status,
  lc.community_name,
  au.email
FROM community_memberships cm
JOIN local_communities lc ON lc.id = cm.community_id
JOIN user_profiles up ON up.user_id = cm.user_id
JOIN auth.users au ON au.id = up.user_id
WHERE (au.email LIKE '%demo%' OR up.display_name LIKE '%demo%')
  AND cm.role = 'admin';
