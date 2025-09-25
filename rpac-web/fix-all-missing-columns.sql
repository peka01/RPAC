-- Fix All Missing Columns - Complete Database Update
-- Run this script to add all missing columns to your existing tables

-- =============================================
-- FIX RESOURCES TABLE
-- =============================================
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS is_msb_recommended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS msb_priority VARCHAR(10) CHECK (msb_priority IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS is_filled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =============================================
-- FIX HELP_REQUESTS TABLE
-- =============================================
ALTER TABLE help_requests 
ADD COLUMN IF NOT EXISTS urgency VARCHAR(20) CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add community_id only if local_communities table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'local_communities') THEN
    ALTER TABLE help_requests 
    ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES local_communities(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =============================================
-- FIX LOCAL_COMMUNITIES TABLE (if exists)
-- =============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'local_communities') THEN
    ALTER TABLE local_communities 
    ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10),
    ADD COLUMN IF NOT EXISTS county VARCHAR(100),
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 1;
  END IF;
END $$;

-- =============================================
-- CREATE MISSING INDEXES
-- =============================================

-- Resources indexes
CREATE INDEX IF NOT EXISTS idx_resources_msb_recommended ON resources(is_msb_recommended);

-- Help requests indexes (only if columns exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'help_requests' AND column_name = 'urgency') THEN
    CREATE INDEX IF NOT EXISTS idx_help_requests_urgency ON help_requests(urgency);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'help_requests' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests(status);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'help_requests' AND column_name = 'priority') THEN
    CREATE INDEX IF NOT EXISTS idx_help_requests_priority ON help_requests(priority);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'help_requests' AND column_name = 'community_id') THEN
    CREATE INDEX IF NOT EXISTS idx_help_requests_community_id ON help_requests(community_id);
  END IF;
END $$;

-- =============================================
-- UPDATE EXISTING RECORDS
-- =============================================

-- Update resources table
UPDATE resources 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

-- Update help_requests table
UPDATE help_requests 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

-- Set default values for new columns
UPDATE resources 
SET is_msb_recommended = FALSE 
WHERE is_msb_recommended IS NULL;

UPDATE resources 
SET is_filled = FALSE 
WHERE is_filled IS NULL;

UPDATE help_requests 
SET status = 'open' 
WHERE status IS NULL;

UPDATE help_requests 
SET priority = 0 
WHERE priority IS NULL;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'Database Update Completed Successfully!';
  RAISE NOTICE '===============================================';
  RAISE NOTICE 'Resources table updated with:';
  RAISE NOTICE '  - is_msb_recommended, msb_priority, is_filled, notes, updated_at';
  RAISE NOTICE 'Help requests table updated with:';
  RAISE NOTICE '  - urgency, status, priority, updated_at, community_id (if applicable)';
  RAISE NOTICE 'Local communities table updated with:';
  RAISE NOTICE '  - postal_code, county, is_public, member_count (if applicable)';
  RAISE NOTICE 'All indexes created successfully!';
  RAISE NOTICE '===============================================';
END $$;
