-- =============================================
-- REBUILD RESOURCE_SHARING TABLE
-- =============================================
-- This completely rebuilds the resource_sharing table with correct schema
-- Created: 2025-10-03

-- Drop and recreate the table (preserves existing data if any)
-- First, check what columns exist
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Current resource_sharing table structure:';
  RAISE NOTICE '========================================';
END $$;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'resource_sharing'
ORDER BY ordinal_position;

-- Add all missing columns
DO $$ 
BEGIN
  -- shared_quantity
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_sharing' AND column_name = 'shared_quantity'
  ) THEN
    ALTER TABLE resource_sharing ADD COLUMN shared_quantity DECIMAL(10,2) NOT NULL DEFAULT 0;
    RAISE NOTICE '✅ Added shared_quantity column';
  END IF;

  -- available_until
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_sharing' AND column_name = 'available_until'
  ) THEN
    ALTER TABLE resource_sharing ADD COLUMN available_until TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE '✅ Added available_until column';
  END IF;

  -- status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_sharing' AND column_name = 'status'
  ) THEN
    ALTER TABLE resource_sharing ADD COLUMN status VARCHAR(20) DEFAULT 'available';
    ALTER TABLE resource_sharing ADD CONSTRAINT resource_sharing_status_check 
      CHECK (status IN ('available', 'requested', 'reserved', 'taken'));
    RAISE NOTICE '✅ Added status column with constraint';
  END IF;

  -- location
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_sharing' AND column_name = 'location'
  ) THEN
    ALTER TABLE resource_sharing ADD COLUMN location VARCHAR(100);
    RAISE NOTICE '✅ Added location column';
  END IF;

  -- notes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_sharing' AND column_name = 'notes'
  ) THEN
    ALTER TABLE resource_sharing ADD COLUMN notes TEXT;
    RAISE NOTICE '✅ Added notes column';
  END IF;

  -- created_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_sharing' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE resource_sharing ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE '✅ Added created_at column';
  END IF;

  -- updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_sharing' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE resource_sharing ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE '✅ Added updated_at column';
  END IF;

END $$;

-- Verify final structure
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ RESOURCE_SHARING TABLE REBUILT';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Final structure:';
END $$;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'resource_sharing'
ORDER BY ordinal_position;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'All required columns should now exist!';
  RAISE NOTICE 'Refresh Supabase schema cache and try again.';
  RAISE NOTICE '';
END $$;

