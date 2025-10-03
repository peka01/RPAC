-- =============================================
-- ADD COMMUNITY_ID TO RESOURCE_SHARING
-- =============================================
-- This migration adds community_id to resource_sharing table
-- for proper community-based resource sharing
-- Created: 2025-10-03
-- Purpose: Enable community-specific resource sharing

-- Add community_id column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_sharing' AND column_name = 'community_id'
  ) THEN
    ALTER TABLE resource_sharing ADD COLUMN community_id UUID REFERENCES local_communities(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for faster community resource lookups
CREATE INDEX IF NOT EXISTS idx_resource_sharing_community ON resource_sharing(community_id, status);

-- Update RLS policies to include community_id
DROP POLICY IF EXISTS "Users can view community shared resources" ON resource_sharing;
CREATE POLICY "Users can view community shared resources"
  ON resource_sharing FOR SELECT
  USING (
    community_id IN (
      SELECT community_id FROM community_memberships WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: community_id added to resource_sharing table';
END $$;

