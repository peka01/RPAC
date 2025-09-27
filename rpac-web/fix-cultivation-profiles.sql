-- Fix cultivation_profiles table - add missing climate_zone column if it doesn't exist

-- Add climate_zone column if it doesn't exist
ALTER TABLE cultivation_profiles 
ADD COLUMN IF NOT EXISTS climate_zone TEXT DEFAULT 'svealand' 
CHECK (climate_zone IN ('gotaland', 'svealand', 'norrland'));

-- Add other missing columns if they don't exist
ALTER TABLE cultivation_profiles 
ADD COLUMN IF NOT EXISTS garden_size TEXT DEFAULT 'medium' 
CHECK (garden_size IN ('small', 'medium', 'large'));

ALTER TABLE cultivation_profiles 
ADD COLUMN IF NOT EXISTS experience_level TEXT DEFAULT 'beginner' 
CHECK (experience_level IN ('beginner', 'intermediate', 'advanced'));

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'cultivation_profiles' 
ORDER BY ordinal_position;
