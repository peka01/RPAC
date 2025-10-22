-- =============================================
-- ENSURE NOTIFICATIONS TABLE HAS ACTION_URL
-- =============================================
-- This ensures the notifications table has the action_url column
-- Created: 2025-10-22
-- Purpose: Make notifications clickable with proper links

-- Check if action_url column exists, add if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'action_url'
  ) THEN
    RAISE NOTICE '📝 Adding action_url column to notifications table...';
    ALTER TABLE notifications ADD COLUMN action_url TEXT;
    RAISE NOTICE '✅ action_url column added successfully!';
  ELSE
    RAISE NOTICE '✅ action_url column already exists';
  END IF;
END $$;

-- Check if sender_name column exists (also needed for notifications)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'sender_name'
  ) THEN
    RAISE NOTICE '📝 Adding sender_name column to notifications table...';
    ALTER TABLE notifications ADD COLUMN sender_name VARCHAR(100);
    RAISE NOTICE '✅ sender_name column added successfully!';
  ELSE
    RAISE NOTICE '✅ sender_name column already exists';
  END IF;
END $$;

-- Verify final schema
DO $$
DECLARE
  has_action_url BOOLEAN;
  has_sender_name BOOLEAN;
  has_content BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'action_url'
  ) INTO has_action_url;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'sender_name'
  ) INTO has_sender_name;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'content'
  ) INTO has_content;
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Notifications Table Status:';
  RAISE NOTICE '  content: %', CASE WHEN has_content THEN '✅' ELSE '❌' END;
  RAISE NOTICE '  action_url: %', CASE WHEN has_action_url THEN '✅' ELSE '❌' END;
  RAISE NOTICE '  sender_name: %', CASE WHEN has_sender_name THEN '✅' ELSE '❌' END;
  RAISE NOTICE '';
  
  IF has_content AND has_action_url AND has_sender_name THEN
    RAISE NOTICE '🎉 Notifications table is fully configured!';
  ELSE
    RAISE NOTICE '⚠️  Some columns are missing. Review the schema.';
  END IF;
END $$;

