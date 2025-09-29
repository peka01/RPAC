-- Add new fields to cultivation_reminders table for AI tip integration
-- This migration adds support for saving daily tips as reminders

-- Add source tracking fields
ALTER TABLE cultivation_reminders 
ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'manual';

ALTER TABLE cultivation_reminders 
ADD COLUMN IF NOT EXISTS source_tip_id VARCHAR(100);

ALTER TABLE cultivation_reminders 
ADD COLUMN IF NOT EXISTS tip_metadata JSONB;

-- Add user notes field for additional context
ALTER TABLE cultivation_reminders 
ADD COLUMN IF NOT EXISTS user_notes TEXT;

-- Add completion notes field
ALTER TABLE cultivation_reminders 
ADD COLUMN IF NOT EXISTS completion_notes TEXT;

-- Create index for better performance on source queries
CREATE INDEX IF NOT EXISTS idx_reminders_source_type ON cultivation_reminders(source_type);
CREATE INDEX IF NOT EXISTS idx_reminders_source_tip_id ON cultivation_reminders(source_tip_id);

-- Update existing records to have 'manual' as source_type
UPDATE cultivation_reminders 
SET source_type = 'manual' 
WHERE source_type IS NULL;

-- Add check constraint for source_type values
ALTER TABLE cultivation_reminders 
ADD CONSTRAINT check_source_type 
CHECK (source_type IN ('manual', 'daily_tip', 'ai_generated', 'calendar_sync'));
