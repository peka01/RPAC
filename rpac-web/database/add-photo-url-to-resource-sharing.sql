-- Add photo_url column to resource_sharing table
-- This allows sharing resources with images

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resource_sharing' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE resource_sharing ADD COLUMN photo_url TEXT;
    RAISE NOTICE '✅ Added photo_url column to resource_sharing';
  ELSE
    RAISE NOTICE 'ℹ️ photo_url column already exists in resource_sharing';
  END IF;
END $$;

