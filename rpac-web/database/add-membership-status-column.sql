-- Add status column to community_memberships table
-- This enables pending/approved/rejected membership workflow

-- Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_memberships' AND column_name = 'status'
  ) THEN
    ALTER TABLE community_memberships 
    ADD COLUMN status VARCHAR(20) DEFAULT 'approved';
    
    RAISE NOTICE 'Added status column to community_memberships';
  ELSE
    RAISE NOTICE 'Status column already exists in community_memberships';
  END IF;
END $$;

-- Update existing NULL values to 'approved' (backwards compatibility)
UPDATE community_memberships 
SET status = 'approved' 
WHERE status IS NULL;

-- Add check constraint for valid status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'community_memberships' 
    AND constraint_name = 'community_memberships_status_check'
  ) THEN
    ALTER TABLE community_memberships
    ADD CONSTRAINT community_memberships_status_check 
    CHECK (status IN ('approved', 'pending', 'rejected'));
    
    RAISE NOTICE 'Added check constraint for status column';
  ELSE
    RAISE NOTICE 'Status check constraint already exists';
  END IF;
END $$;

-- Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_community_memberships_status 
ON community_memberships(status);

-- Create index for pending membership queries
CREATE INDEX IF NOT EXISTS idx_community_memberships_community_status 
ON community_memberships(community_id, status);

RAISE NOTICE '✅ Migration complete: community_memberships now supports status workflow';

