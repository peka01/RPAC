-- =============================================
-- FIX DIRECT MESSAGE NOTIFICATION URLs
-- =============================================
-- This migration fixes notification action URLs for direct messages
-- to properly link to /local/messages/direct?userId={senderId}
-- =============================================

-- First, let's see what we're dealing with
DO $$
DECLARE
  total_message_notifs INTEGER;
  community_notifs INTEGER;
  direct_notifs INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_message_notifs
  FROM notifications
  WHERE type IN ('message', 'emergency');
  
  SELECT COUNT(*) INTO community_notifs
  FROM notifications
  WHERE type IN ('message', 'emergency')
    AND (action_url LIKE '%/local/messages/community%' 
         OR metadata->>'is_community_message' = 'true'
         OR metadata->>'community_id' IS NOT NULL);
  
  SELECT COUNT(*) INTO direct_notifs
  FROM notifications
  WHERE type IN ('message', 'emergency')
    AND (metadata->>'is_community_message' = 'false' 
         OR (metadata->>'community_id' IS NULL AND metadata->>'sender_id' IS NOT NULL)
         OR action_url = '/local/messages/community');
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'NOTIFICATION URL ANALYSIS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total message notifications: %', total_message_notifs;
  RAISE NOTICE 'Community message notifications: %', community_notifs;
  RAISE NOTICE 'Direct message notifications (needs fix): %', direct_notifs;
  RAISE NOTICE '========================================';
END $$;

-- Update direct message notifications to use the correct URL format
-- If metadata has sender_id, use it. Otherwise, default to /local/messages/direct
UPDATE notifications
SET action_url = CASE
  WHEN metadata->>'sender_id' IS NOT NULL THEN
    '/local/messages/direct?userId=' || (metadata->>'sender_id')
  ELSE
    '/local/messages/direct'
END
WHERE type IN ('message', 'emergency')
  AND (
    -- Notifications that explicitly say they're not community messages
    metadata->>'is_community_message' = 'false'
    OR
    -- Notifications with sender_id but no community_id
    (metadata->>'sender_id' IS NOT NULL AND metadata->>'community_id' IS NULL)
    OR
    -- Old format direct messages (pointing to /local/messages/community without communityId)
    (action_url = '/local/messages/community' AND metadata->>'community_id' IS NULL)
  );

-- Verify the results
DO $$
DECLARE
  updated_count INTEGER;
  direct_with_userid INTEGER;
  direct_without_userid INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  SELECT COUNT(*) INTO direct_with_userid
  FROM notifications
  WHERE action_url LIKE '/local/messages/direct?userId=%';
  
  SELECT COUNT(*) INTO direct_without_userid
  FROM notifications
  WHERE action_url = '/local/messages/direct';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'UPDATE RESULTS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Updated % notifications', updated_count;
  RAISE NOTICE 'Direct messages with specific user: %', direct_with_userid;
  RAISE NOTICE 'Direct messages (general): %', direct_without_userid;
  RAISE NOTICE '========================================';
END $$;

-- Show sample of updated notifications
SELECT 
  id,
  type,
  title,
  action_url,
  metadata->>'sender_id' as sender_id,
  metadata->>'is_community_message' as is_community,
  created_at
FROM notifications
WHERE action_url LIKE '/local/messages/direct%'
ORDER BY created_at DESC
LIMIT 10;

