-- =============================================
-- CLEAR ALL MESSAGES - FRESH START
-- =============================================
-- Delete all existing messages to start with a clean slate
-- Then add the integrity constraint
-- Created: 2025-10-03

-- Show current message count
DO $$
DECLARE
  msg_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO msg_count FROM messages;
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🗑️ CLEARING ALL MESSAGES';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Current message count: %', msg_count;
  RAISE NOTICE '';
END $$;

-- Delete ALL messages
DELETE FROM messages;

-- Verify deletion
DO $$
DECLARE
  remaining INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining FROM messages;
  RAISE NOTICE '✅ All messages deleted. Remaining: %', remaining;
  RAISE NOTICE '';
END $$;

-- Drop any existing constraint
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_type_integrity;

-- Add CHECK constraint to ensure message type integrity
ALTER TABLE messages ADD CONSTRAINT messages_type_integrity
  CHECK (
    (receiver_id IS NOT NULL AND community_id IS NULL) OR
    (receiver_id IS NULL AND community_id IS NOT NULL)
  );

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ FRESH START COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'MESSAGE RULES (enforced by database):';
  RAISE NOTICE '- Direct message: receiver_id SET, community_id NULL';
  RAISE NOTICE '- Community message: community_id SET, receiver_id NULL';
  RAISE NOTICE '- NEVER both fields set (constraint prevents this)';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now start sending messages with confidence!';
  RAISE NOTICE '';
END $$;

-- Show the constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conname = 'messages_type_integrity';

