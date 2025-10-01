-- Add experience_level column to user_profiles table
-- Run this in your Supabase SQL editor

-- Add experience_level column if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS experience_level VARCHAR(20) DEFAULT 'beginner' 
CHECK (experience_level IN ('beginner', 'intermediate', 'advanced'));

-- Update existing records to have a default experience level
UPDATE user_profiles 
SET experience_level = 'beginner' 
WHERE experience_level IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name = 'experience_level';
