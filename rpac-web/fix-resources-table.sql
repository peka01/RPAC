-- Fix Resources Table - Add Missing Columns
-- Run this script to add missing columns to your existing resources table

-- Add missing columns to resources table
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS is_msb_recommended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS msb_priority VARCHAR(10) CHECK (msb_priority IN ('high', 'medium', 'low')),
ADD COLUMN IF NOT EXISTS is_filled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_resources_msb_recommended ON resources(is_msb_recommended);

-- Update existing records to have updated_at timestamp
UPDATE resources 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Resources table updated successfully!';
  RAISE NOTICE 'Added columns: is_msb_recommended, msb_priority, is_filled, notes, updated_at';
  RAISE NOTICE 'Created index: idx_resources_msb_recommended';
END $$;
