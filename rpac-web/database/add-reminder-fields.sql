-- Add missing fields to cultivation_reminders table
-- This will enable proper reminder functionality with titles and descriptions

-- Add title field for reminder headers
ALTER TABLE cultivation_reminders 
ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- Add description field for detailed reminder text
ALTER TABLE cultivation_reminders 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add crop_name field to identify which crop the reminder is for
ALTER TABLE cultivation_reminders 
ADD COLUMN IF NOT EXISTS crop_name VARCHAR(100);

-- Add plant_count field to show how many plants
ALTER TABLE cultivation_reminders 
ADD COLUMN IF NOT EXISTS plant_count INTEGER DEFAULT 0;

-- Add notes field for additional information
ALTER TABLE cultivation_reminders 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update the table comment
COMMENT ON TABLE cultivation_reminders IS 'Enhanced cultivation reminders with title, description, and crop information';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cultivation_reminders_title ON cultivation_reminders(title);
CREATE INDEX IF NOT EXISTS idx_cultivation_reminders_crop_name ON cultivation_reminders(crop_name);
CREATE INDEX IF NOT EXISTS idx_cultivation_reminders_plant_count ON cultivation_reminders(plant_count);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cultivation_reminders' 
ORDER BY ordinal_position;