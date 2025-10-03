-- =============================================
-- ADD DENORMALIZED RESOURCE COLUMNS
-- =============================================
-- Adds resource_name, resource_category, resource_unit to resource_sharing
-- This allows storing resource info directly without referencing resources table
-- Created: 2025-10-03

-- Add resource_name column if missing (NOT NULL)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_sharing' AND column_name = 'resource_name'
  ) THEN
    ALTER TABLE resource_sharing ADD COLUMN resource_name VARCHAR(255) NOT NULL DEFAULT 'Unnamed Resource';
    -- Remove default after adding column
    ALTER TABLE resource_sharing ALTER COLUMN resource_name DROP DEFAULT;
    RAISE NOTICE '✅ Added resource_name column';
  ELSE
    RAISE NOTICE 'ℹ️ resource_name column already exists';
  END IF;
END $$;

-- Add resource_category column if missing (NOT NULL)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_sharing' AND column_name = 'resource_category'
  ) THEN
    ALTER TABLE resource_sharing ADD COLUMN resource_category VARCHAR(50) NOT NULL DEFAULT 'other';
    -- Remove default after adding column
    ALTER TABLE resource_sharing ALTER COLUMN resource_category DROP DEFAULT;
    RAISE NOTICE '✅ Added resource_category column';
  ELSE
    RAISE NOTICE 'ℹ️ resource_category column already exists';
  END IF;
  
  -- Add check constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'resource_sharing_category_check'
  ) THEN
    ALTER TABLE resource_sharing ADD CONSTRAINT resource_sharing_category_check 
      CHECK (resource_category IN ('food', 'water', 'medicine', 'energy', 'tools', 'other'));
    RAISE NOTICE '✅ Added category check constraint';
  ELSE
    RAISE NOTICE 'ℹ️ category check constraint already exists';
  END IF;
END $$;

-- Add resource_unit column if missing (NOT NULL)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_sharing' AND column_name = 'resource_unit'
  ) THEN
    ALTER TABLE resource_sharing ADD COLUMN resource_unit VARCHAR(50) NOT NULL DEFAULT 'st';
    -- Remove default after adding column
    ALTER TABLE resource_sharing ALTER COLUMN resource_unit DROP DEFAULT;
    RAISE NOTICE '✅ Added resource_unit column';
  ELSE
    RAISE NOTICE 'ℹ️ resource_unit column already exists';
  END IF;
END $$;

-- Verify final structure
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DENORMALIZED COLUMNS ADDED';
  RAISE NOTICE '========================================';
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
  RAISE NOTICE 'Resource sharing table now has:';
  RAISE NOTICE '  ✅ resource_name (VARCHAR, NOT NULL)';
  RAISE NOTICE '  ✅ resource_category (VARCHAR, NOT NULL, CHECK constraint)';
  RAISE NOTICE '  ✅ resource_unit (VARCHAR, NOT NULL)';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Refresh browser and try again!';
  RAISE NOTICE '';
END $$;

