-- =============================================
-- FIX RESOURCE_SHARING TABLE SCHEMA
-- =============================================
-- Adds missing columns to resource_sharing table
-- Created: 2025-10-03

-- Add location column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_sharing' AND column_name = 'location'
  ) THEN
    ALTER TABLE resource_sharing ADD COLUMN location VARCHAR(100);
    RAISE NOTICE '✅ Added location column';
  ELSE
    RAISE NOTICE 'ℹ️ location column already exists';
  END IF;
END $$;

-- Add notes column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_sharing' AND column_name = 'notes'
  ) THEN
    ALTER TABLE resource_sharing ADD COLUMN notes TEXT;
    RAISE NOTICE '✅ Added notes column';
  ELSE
    RAISE NOTICE 'ℹ️ notes column already exists';
  END IF;
END $$;

-- Verify the table structure
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'resource_sharing'
ORDER BY ordinal_position;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RESOURCE_SHARING TABLE SCHEMA FIXED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Required columns:';
  RAISE NOTICE '  ✅ location (VARCHAR)';
  RAISE NOTICE '  ✅ notes (TEXT)';
  RAISE NOTICE '';
END $$;

