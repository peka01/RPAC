-- =============================================
-- FIX MESSAGES TABLE SCHEMA
-- =============================================
-- Ensures all required columns exist in messages table
-- Created: 2025-10-03

-- Add is_emergency column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'is_emergency'
  ) THEN
    ALTER TABLE messages ADD COLUMN is_emergency BOOLEAN DEFAULT FALSE;
    RAISE NOTICE '✅ Added is_emergency column';
  ELSE
    RAISE NOTICE 'ℹ️ is_emergency column already exists';
  END IF;
END $$;

-- Ensure message_type has correct check constraint
DO $$
BEGIN
  -- Drop old constraint if exists
  ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_message_type_check;
  
  -- Add new constraint
  ALTER TABLE messages ADD CONSTRAINT messages_message_type_check 
    CHECK (message_type IN ('text', 'image', 'file', 'emergency'));
  
  RAISE NOTICE '✅ Updated message_type constraint';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'ℹ️ Constraint already exists';
END $$;

-- Add metadata column for emergency info if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE messages ADD COLUMN metadata JSONB;
    RAISE NOTICE '✅ Added metadata column';
  ELSE
    RAISE NOTICE 'ℹ️ metadata column already exists';
  END IF;
END $$;

-- Verify the table structure
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MESSAGES TABLE SCHEMA VERIFIED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Required columns:';
  RAISE NOTICE '  ✅ is_emergency (BOOLEAN)';
  RAISE NOTICE '  ✅ message_type (VARCHAR with CHECK)';
  RAISE NOTICE '  ✅ metadata (JSONB)';
  RAISE NOTICE '';
END $$;

