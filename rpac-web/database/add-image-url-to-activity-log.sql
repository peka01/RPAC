-- Add image_url column to homespace_activity_log table
-- This allows activities to display associated images (e.g., shared resources with photos)

-- Add the column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'homespace_activity_log' 
    AND column_name = 'image_url'
  ) THEN
    ALTER TABLE homespace_activity_log 
    ADD COLUMN image_url TEXT;
    
    RAISE NOTICE 'Added image_url column to homespace_activity_log';
  ELSE
    RAISE NOTICE 'image_url column already exists in homespace_activity_log';
  END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN homespace_activity_log.image_url IS 'Optional image URL associated with the activity (e.g., photo of shared resource)';
