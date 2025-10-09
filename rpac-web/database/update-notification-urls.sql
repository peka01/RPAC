-- =============================================
-- UPDATE OLD NOTIFICATION URLs
-- =============================================
-- This migration updates old notification action_url formats
-- to use the new messaging route structure
-- =============================================

-- Update message/emergency notifications with old /local?tab=messaging format
UPDATE notifications
SET action_url = REPLACE(action_url, '/local?tab=messaging&community=', '/local/messages/community?communityId=')
WHERE action_url LIKE '/local?tab=messaging&community=%';

UPDATE notifications
SET action_url = '/local/messages/community'
WHERE action_url = '/local?tab=messaging';

-- Log the changes
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % notification URLs to new format', updated_count;
END $$;

