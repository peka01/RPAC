-- Migration: Simplify help requests by removing category field
-- Date: 2025-10-29
-- Description: Remove categorization from help requests to simplify the workflow

-- Remove category column from help_requests table
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'help_requests' AND column_name = 'category'
  ) THEN
    ALTER TABLE help_requests DROP COLUMN category;
    RAISE NOTICE '✅ Removed category column from help_requests';
  ELSE
    RAISE NOTICE 'ℹ️ Category column already removed from help_requests';
  END IF;
END $$;

RAISE NOTICE '✅ Help requests simplified - category field removed successfully!';
