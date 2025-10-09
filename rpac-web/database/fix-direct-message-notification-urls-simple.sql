-- =============================================
-- FIX DIRECT MESSAGE NOTIFICATION URLs (SIMPLE)
-- =============================================
-- Since we don't have metadata in the notifications table,
-- we'll use a simple heuristic: any message/emergency notification
-- that points to /local/messages/community without a communityId parameter
-- is likely a direct message that needs fixing.
-- =============================================

-- First, let's see what we're dealing with
DO $$
DECLARE
  total_message_notifs INTEGER;
  needs_fix INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_message_notifs
  FROM notifications
  WHERE type IN ('message', 'emergency');
  
  -- Count notifications that point to community page without communityId
  -- These are likely direct messages that need fixing
  SELECT COUNT(*) INTO needs_fix
  FROM notifications
  WHERE type IN ('message', 'emergency')
    AND action_url = '/local/messages/community';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NOTIFICATION URL ANALYSIS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total message notifications: %', total_message_notifs;
  RAISE NOTICE 'Notifications pointing to community without ID (likely direct messages): %', needs_fix;
  RAISE NOTICE '========================================';
END $$;

-- For now, we'll update all notifications that point to /local/messages/community
-- without a communityId parameter to point to /local/messages/direct instead
-- This is a safe fallback that will at least open the correct tab
UPDATE notifications
SET action_url = '/local/messages/direct'
WHERE type IN ('message', 'emergency')
  AND action_url = '/local/messages/community';

-- Verify the results
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'UPDATE RESULTS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Updated % notifications to use /local/messages/direct', updated_count;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NOTE: For future notifications, the code now properly sets';
  RAISE NOTICE 'action_url with ?userId parameter for direct messages.';
  RAISE NOTICE 'Existing notifications will open the direct messages page';
  RAISE NOTICE 'but wont auto-select a specific conversation.';
  RAISE NOTICE '========================================';
END $$;

-- Show sample of updated notifications
SELECT 
  id,
  type,
  title,
  sender_name,
  action_url,
  is_read,
  created_at
FROM notifications
WHERE type IN ('message', 'emergency')
  AND action_url LIKE '/local/messages/direct%'
ORDER BY created_at DESC
LIMIT 10;

