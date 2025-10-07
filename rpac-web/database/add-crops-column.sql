-- Add crops column to cultivation_plans if it doesn't exist
-- This migration ensures the crops JSONB column exists for storing crop data

-- Check if crops column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'cultivation_plans' 
        AND column_name = 'crops'
    ) THEN
        ALTER TABLE cultivation_plans ADD COLUMN crops JSONB DEFAULT '[]';
    END IF;
END $$;

-- Update existing rows to have empty crops array if they don't have one
UPDATE cultivation_plans 
SET crops = '[]' 
WHERE crops IS NULL;

-- Add comment to the column
COMMENT ON COLUMN cultivation_plans.crops IS 'JSONB array containing crop data with nutrition information';



