-- Add is_primary column to cultivation_plans table
-- This allows users to mark one plan as their primary/default plan

-- Add the column if it doesn't exist
ALTER TABLE cultivation_plans 
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE;

-- Create an index for faster queries
CREATE INDEX IF NOT EXISTS idx_cultivation_plans_is_primary 
ON cultivation_plans(user_id, is_primary) 
WHERE is_primary = TRUE;

-- Add a comment
COMMENT ON COLUMN cultivation_plans.is_primary IS 'Indicates if this is the users primary/default cultivation plan';

-- Note: You may want to add a constraint to ensure only one plan per user can be primary
-- However, this can be enforced at the application level for more flexibility

