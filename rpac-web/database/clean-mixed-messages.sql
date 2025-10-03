-- =============================================
-- CLEAN UP MIXED MESSAGES
-- =============================================
-- Remove ambiguous messages that have both community_id and receiver_id set
-- A message should be EITHER direct (receiver_id only) OR community (community_id only)
-- Created: 2025-10-03

-- First, show what we're going to fix
SELECT 
  id,
  sender_id,
  receiver_id,
  community_id,
  content,
  created_at,
  CASE 
    WHEN receiver_id IS NOT NULL AND community_id IS NOT NULL THEN '❌ MIXED (has both)'
    WHEN receiver_id IS NOT NULL AND community_id IS NULL THEN '✅ Direct message'
    WHEN receiver_id IS NULL AND community_id IS NOT NULL THEN '✅ Community message'
    ELSE '⚠️ Neither (orphan)'
  END as message_type
FROM messages
ORDER BY created_at DESC
LIMIT 50;

-- Fix messages that have both: if they have receiver_id, remove community_id (treat as direct)
UPDATE messages
SET community_id = NULL
WHERE receiver_id IS NOT NULL 
  AND community_id IS NOT NULL;

-- Log the fix
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  GET DIAGNOSTICS fixed_count = ROW_COUNT;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ CLEANED UP MIXED MESSAGES';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Fixed % messages that had both receiver_id and community_id', fixed_count;
  RAISE NOTICE 'These are now treated as direct messages (community_id removed)';
  RAISE NOTICE '';
  RAISE NOTICE 'MESSAGE RULES:';
  RAISE NOTICE '- Direct message: receiver_id SET, community_id NULL';
  RAISE NOTICE '- Community message: community_id SET, receiver_id NULL';
  RAISE NOTICE '';
END $$;

-- Verify the fix
SELECT 
  COUNT(*) FILTER (WHERE receiver_id IS NOT NULL AND community_id IS NULL) as direct_messages,
  COUNT(*) FILTER (WHERE receiver_id IS NULL AND community_id IS NOT NULL) as community_messages,
  COUNT(*) FILTER (WHERE receiver_id IS NOT NULL AND community_id IS NOT NULL) as mixed_messages_remaining,
  COUNT(*) as total_messages
FROM messages;

