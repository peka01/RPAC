-- =============================================
-- MEMBERSHIP APPROVAL WORKFLOW MIGRATION
-- =============================================
-- Purpose: Add approval workflow for closed communities
-- Statuses: pending, approved, rejected, banned
-- Date: 2025-10-21

-- Enhanced community_memberships with approval workflow
DO $$ 
BEGIN
  -- Add membership_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_memberships' AND column_name = 'membership_status'
  ) THEN
    ALTER TABLE community_memberships 
    ADD COLUMN membership_status VARCHAR(20) DEFAULT 'approved' 
    CHECK (membership_status IN ('pending', 'approved', 'rejected', 'banned'));
    
    RAISE NOTICE 'Added membership_status column to community_memberships';
  ELSE
    RAISE NOTICE 'membership_status column already exists, skipping...';
  END IF;

  -- Add request timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_memberships' AND column_name = 'requested_at'
  ) THEN
    ALTER TABLE community_memberships 
    ADD COLUMN requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    RAISE NOTICE 'Added requested_at column to community_memberships';
  ELSE
    RAISE NOTICE 'requested_at column already exists, skipping...';
  END IF;

  -- Add approval/rejection info
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_memberships' AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE community_memberships 
    ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
    
    RAISE NOTICE 'Added reviewed_at column to community_memberships';
  ELSE
    RAISE NOTICE 'reviewed_at column already exists, skipping...';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_memberships' AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE community_memberships 
    ADD COLUMN reviewed_by UUID REFERENCES auth.users(id);
    
    RAISE NOTICE 'Added reviewed_by column to community_memberships';
  ELSE
    RAISE NOTICE 'reviewed_by column already exists, skipping...';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_memberships' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE community_memberships 
    ADD COLUMN rejection_reason TEXT;
    
    RAISE NOTICE 'Added rejection_reason column to community_memberships';
  ELSE
    RAISE NOTICE 'rejection_reason column already exists, skipping...';
  END IF;

  -- Add join request message
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_memberships' AND column_name = 'join_message'
  ) THEN
    ALTER TABLE community_memberships 
    ADD COLUMN join_message TEXT;
    
    RAISE NOTICE 'Added join_message column to community_memberships';
  ELSE
    RAISE NOTICE 'join_message column already exists, skipping...';
  END IF;

  -- Add ban info
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_memberships' AND column_name = 'banned_at'
  ) THEN
    ALTER TABLE community_memberships 
    ADD COLUMN banned_at TIMESTAMP WITH TIME ZONE;
    
    RAISE NOTICE 'Added banned_at column to community_memberships';
  ELSE
    RAISE NOTICE 'banned_at column already exists, skipping...';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_memberships' AND column_name = 'banned_by'
  ) THEN
    ALTER TABLE community_memberships 
    ADD COLUMN banned_by UUID REFERENCES auth.users(id);
    
    RAISE NOTICE 'Added banned_by column to community_memberships';
  ELSE
    RAISE NOTICE 'banned_by column already exists, skipping...';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'community_memberships' AND column_name = 'ban_reason'
  ) THEN
    ALTER TABLE community_memberships 
    ADD COLUMN ban_reason TEXT;
    
    RAISE NOTICE 'Added ban_reason column to community_memberships';
  ELSE
    RAISE NOTICE 'ban_reason column already exists, skipping...';
  END IF;
END $$;

-- Create indexes for approval workflow
CREATE INDEX IF NOT EXISTS idx_community_memberships_status 
  ON community_memberships(membership_status);

CREATE INDEX IF NOT EXISTS idx_community_memberships_pending 
  ON community_memberships(community_id, membership_status) 
  WHERE membership_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_community_memberships_approved 
  ON community_memberships(community_id, membership_status) 
  WHERE membership_status = 'approved';

-- Create index for reviewer tracking
CREATE INDEX IF NOT EXISTS idx_community_memberships_reviewer 
  ON community_memberships(reviewed_by) 
  WHERE reviewed_by IS NOT NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Membership approval workflow migration completed successfully!';
END $$;

