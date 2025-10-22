-- =============================================
-- FIX: Ensure access_type and auto_approve_members exist
-- =============================================
-- This script safely adds the missing columns to local_communities
-- Date: 2025-10-22

-- Add access_type column (Swedish values: öppet/stängt)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'local_communities' AND column_name = 'access_type'
  ) THEN
    ALTER TABLE local_communities 
    ADD COLUMN access_type VARCHAR(20) DEFAULT 'öppet';
    
    -- Add check constraint
    ALTER TABLE local_communities 
    ADD CONSTRAINT local_communities_access_type_check 
    CHECK (access_type IN ('öppet', 'stängt'));
    
    -- Create index
    CREATE INDEX idx_local_communities_access_type 
    ON local_communities(access_type);
    
    RAISE NOTICE '✅ Added access_type column to local_communities';
  ELSE
    RAISE NOTICE '⏭️  access_type column already exists';
  END IF;
END $$;

-- Add auto_approve_members column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'local_communities' AND column_name = 'auto_approve_members'
  ) THEN
    ALTER TABLE local_communities 
    ADD COLUMN auto_approve_members BOOLEAN DEFAULT true;
    
    RAISE NOTICE '✅ Added auto_approve_members column to local_communities';
  ELSE
    RAISE NOTICE '⏭️  auto_approve_members column already exists';
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Community access control columns check complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'Columns added/verified:';
  RAISE NOTICE '  - access_type (öppet/stängt)';
  RAISE NOTICE '  - auto_approve_members (boolean)';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Next step: Refresh your app and try saving community settings';
END $$;

