-- =============================================
-- FINAL RESOURCE_SHARING FIX
-- =============================================
-- Shows current structure and adds ALL missing columns
-- Created: 2025-10-03

-- Show current structure
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CURRENT STRUCTURE:';
  RAISE NOTICE '========================================';
END $$;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'resource_sharing'
ORDER BY ordinal_position;

-- Now add ALL possibly missing columns
DO $$ 
BEGIN
  -- Add category if missing (seems to exist based on error)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_sharing' AND column_name = 'category'
  ) THEN
    ALTER TABLE resource_sharing ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'other';
    ALTER TABLE resource_sharing ALTER COLUMN category DROP DEFAULT;
    RAISE NOTICE '✅ Added category column';
  ELSE
    RAISE NOTICE 'ℹ️ category column exists';
  END IF;

  -- Add resource_name if missing (likely exists based on previous error)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_sharing' AND column_name = 'resource_name'
  ) THEN
    ALTER TABLE resource_sharing ADD COLUMN resource_name VARCHAR(255) NOT NULL DEFAULT 'Unknown';
    ALTER TABLE resource_sharing ALTER COLUMN resource_name DROP DEFAULT;
    RAISE NOTICE '✅ Added resource_name column';
  ELSE
    RAISE NOTICE 'ℹ️ resource_name column exists';
  END IF;

  -- Add unit if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_sharing' AND column_name = 'unit'
  ) THEN
    ALTER TABLE resource_sharing ADD COLUMN unit VARCHAR(50) NOT NULL DEFAULT 'st';
    ALTER TABLE resource_sharing ALTER COLUMN unit DROP DEFAULT;
    RAISE NOTICE '✅ Added unit column';
  ELSE
    RAISE NOTICE 'ℹ️ unit column exists';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '✅ All standard columns checked!';
  RAISE NOTICE '';
END $$;

-- Show final structure
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FINAL STRUCTURE:';
  RAISE NOTICE '========================================';
END $$;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'resource_sharing'
ORDER BY ordinal_position;

