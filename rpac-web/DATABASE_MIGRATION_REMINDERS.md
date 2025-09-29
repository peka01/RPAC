# Database Migration: Enhanced Reminders for AI Integration

## Overview
This migration adds support for saving daily AI tips as reminders and tracking their source.

## SQL Migration Script
Run this in the Supabase SQL Editor:

```sql
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
```

## What This Enables

### Enhanced Reminder Tracking
- **Source Tracking**: Know if a reminder came from AI tips, manual entry, or calendar sync
- **Tip Metadata**: Store original tip information (description, action, priority, etc.)
- **User Notes**: Allow users to add personal notes to reminders
- **Completion Notes**: Track what was actually done when completing a reminder

### AI Integration Benefits
- **Smart Context**: AI can see which tips were saved and their completion status
- **Better Recommendations**: AI learns from user's reminder patterns
- **Progress Tracking**: Measure how well users follow AI recommendations
- **Personalization**: Adapt tips based on reminder completion rates

## Current Status
The application works with the existing schema, but running this migration will enable:
- Full tip metadata storage
- Better AI context awareness
- Enhanced user experience
- Progress tracking and analytics

## How to Apply
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the SQL script above
3. Click "Run" to execute the migration
4. The application will automatically start using the new fields

## Rollback (if needed)
```sql
-- Remove the new columns (this will lose data!)
ALTER TABLE cultivation_reminders DROP COLUMN IF EXISTS source_type;
ALTER TABLE cultivation_reminders DROP COLUMN IF EXISTS source_tip_id;
ALTER TABLE cultivation_reminders DROP COLUMN IF EXISTS tip_metadata;
ALTER TABLE cultivation_reminders DROP COLUMN IF EXISTS user_notes;
ALTER TABLE cultivation_reminders DROP COLUMN IF EXISTS completion_notes;
```
