-- Add membership notification types to notifications table
-- This enables notifications for membership requests, approvals, and rejections

-- Drop the existing check constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'notifications' 
    AND constraint_name = 'notifications_type_check'
  ) THEN
    ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
    RAISE NOTICE 'Dropped old notifications_type_check constraint';
  END IF;
END $$;

-- Add new check constraint with membership notification types
ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'message', 
  'resource_request', 
  'emergency', 
  'system',
  'membership_request',
  'membership_approved',
  'membership_rejected'
));

RAISE NOTICE '✅ Migration complete: notifications table now supports membership notification types';

