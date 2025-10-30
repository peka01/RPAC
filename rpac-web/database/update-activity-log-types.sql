-- =============================================
-- UPDATE ACTIVITY LOG TYPES
-- Add new activity types to homespace_activity_log constraint
-- =============================================

-- Update activity_type constraint to include all new types
ALTER TABLE homespace_activity_log 
DROP CONSTRAINT IF EXISTS homespace_activity_log_activity_type_check;

ALTER TABLE homespace_activity_log 
ADD CONSTRAINT homespace_activity_log_activity_type_check 
CHECK (activity_type IN (
  'member_joined',
  'resource_added',
  'resource_shared',
  'help_requested',
  'help_response_added',
  'community_resource_added',
  'community_resource_updated',
  'community_resource_deleted',
  'milestone',
  'exercise',
  'custom'
));

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'homespace_activity_log_activity_type_check';
