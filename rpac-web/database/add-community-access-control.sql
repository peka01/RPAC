-- =============================================
-- COMMUNITY ACCESS CONTROL MIGRATION
-- =============================================
-- Purpose: Add öppet/stängt (open/closed) access control for communities
-- Date: 2025-10-21

-- Add community access control to local_communities
DO $$ 
BEGIN
  -- Add access_type column (öppet/stängt)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'local_communities' AND column_name = 'access_type'
  ) THEN
    ALTER TABLE local_communities 
    ADD COLUMN access_type VARCHAR(20) DEFAULT 'öppet' 
    CHECK (access_type IN ('öppet', 'stängt'));
    
    RAISE NOTICE 'Added access_type column to local_communities';
  ELSE
    RAISE NOTICE 'access_type column already exists, skipping...';
  END IF;

  -- Add auto-approve setting
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'local_communities' AND column_name = 'auto_approve_members'
  ) THEN
    ALTER TABLE local_communities 
    ADD COLUMN auto_approve_members BOOLEAN DEFAULT true;
    
    RAISE NOTICE 'Added auto_approve_members column to local_communities';
  ELSE
    RAISE NOTICE 'auto_approve_members column already exists, skipping...';
  END IF;

  -- Add max members limit (for future scaling control)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'local_communities' AND column_name = 'max_members'
  ) THEN
    ALTER TABLE local_communities 
    ADD COLUMN max_members INTEGER DEFAULT NULL;
    
    RAISE NOTICE 'Added max_members column to local_communities';
  ELSE
    RAISE NOTICE 'max_members column already exists, skipping...';
  END IF;

  -- Add join approval message template
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'local_communities' AND column_name = 'join_approval_message'
  ) THEN
    ALTER TABLE local_communities 
    ADD COLUMN join_approval_message TEXT;
    
    RAISE NOTICE 'Added join_approval_message column to local_communities';
  ELSE
    RAISE NOTICE 'join_approval_message column already exists, skipping...';
  END IF;

  -- Add require_join_message flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'local_communities' AND column_name = 'require_join_message'
  ) THEN
    ALTER TABLE local_communities 
    ADD COLUMN require_join_message BOOLEAN DEFAULT false;
    
    RAISE NOTICE 'Added require_join_message column to local_communities';
  ELSE
    RAISE NOTICE 'require_join_message column already exists, skipping...';
  END IF;
END $$;

-- Create index for access type filtering
CREATE INDEX IF NOT EXISTS idx_local_communities_access_type 
  ON local_communities(access_type);

-- Create index for open communities (most common query)
CREATE INDEX IF NOT EXISTS idx_local_communities_open 
  ON local_communities(access_type, is_public) 
  WHERE access_type = 'öppet' AND is_public = true;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Community access control migration completed successfully!';
END $$;

