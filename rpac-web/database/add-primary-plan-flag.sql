-- Add is_primary column to cultivation_plans table
ALTER TABLE cultivation_plans 
ADD COLUMN is_primary BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on primary plans
CREATE INDEX idx_cultivation_plans_primary ON cultivation_plans(user_id, is_primary);

-- Add constraint to ensure only one primary plan per user
-- Note: This constraint will be enforced at the application level
-- to avoid complex database triggers
