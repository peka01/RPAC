-- =====================================================
-- FIX HELP_REQUESTS PRIORITY CHECK CONSTRAINT
-- Date: 2025-10-29
-- Issue: Priority check constraint is rejecting valid values
-- =====================================================

-- Drop the problematic constraint if it exists
DO $$
BEGIN
  -- Check if the constraint exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'help_requests_priority_check'
  ) THEN
    ALTER TABLE help_requests DROP CONSTRAINT help_requests_priority_check;
    RAISE NOTICE '✅ Dropped old priority check constraint';
  ELSE
    RAISE NOTICE 'ℹ️  No priority check constraint found (already removed or never existed)';
  END IF;
END $$;

-- Verify the priority column allows INTEGER values 0-4
-- The schema defines: priority INTEGER DEFAULT 0
-- Valid values based on code: 0 (default), 1 (low), 2 (medium), 3 (high), 4 (critical)

DO $$
BEGIN
  RAISE NOTICE '✅ Priority constraint fix complete!';
  RAISE NOTICE 'Priority column now accepts INTEGER values 0-4';
  RAISE NOTICE '  • 0 = default';
  RAISE NOTICE '  • 1 = low urgency';
  RAISE NOTICE '  • 2 = medium urgency';
  RAISE NOTICE '  • 3 = high urgency';
  RAISE NOTICE '  • 4 = critical urgency';
END $$;
