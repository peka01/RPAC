-- =====================================================
-- ADD MISSING NOTIFICATION TYPES
-- Date: 2025-10-29
-- Issue: notifications_type_check constraint missing 'help_request' type
-- =====================================================

-- First, check what notification types exist in the table
DO $$
DECLARE
  existing_types TEXT;
BEGIN
  SELECT string_agg(DISTINCT type, ', ') INTO existing_types
  FROM notifications;
  
  RAISE NOTICE 'Existing notification types in database: %', COALESCE(existing_types, 'none');
END $$;

-- Update any invalid types to 'system' before adding new constraint
UPDATE notifications 
SET type = 'system' 
WHERE type NOT IN ('message', 'resource_request', 'help_request', 'emergency', 'system');

-- Drop the old constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add new constraint with all required notification types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'message',
    'resource_request', 
    'help_request',        -- NEW: For help request notifications
    'emergency',
    'system'
  ));

-- Verification message
DO $$
BEGIN
  RAISE NOTICE '✅ Notifications type constraint updated!';
  RAISE NOTICE 'Allowed notification types:';
  RAISE NOTICE '  • message';
  RAISE NOTICE '  • resource_request';
  RAISE NOTICE '  • help_request (newly added)';
  RAISE NOTICE '  • emergency';
  RAISE NOTICE '  • system';
END $$;
