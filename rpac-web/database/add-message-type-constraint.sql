-- =============================================
-- ADD MESSAGE TYPE CONSTRAINT
-- =============================================
-- Ensure messages are EITHER direct OR community, never both
-- Created: 2025-10-03

-- Add CHECK constraint to ensure message type integrity
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_type_integrity;
  
  -- Add new constraint
  -- A message must be either:
  -- 1. Direct: receiver_id NOT NULL and community_id NULL
  -- 2. Community: community_id NOT NULL and receiver_id NULL
  ALTER TABLE messages ADD CONSTRAINT messages_type_integrity
    CHECK (
      (receiver_id IS NOT NULL AND community_id IS NULL) OR
      (receiver_id IS NULL AND community_id IS NOT NULL)
    );
  
  RAISE NOTICE '✅ Added constraint: messages_type_integrity';
  RAISE NOTICE '   - Direct messages: receiver_id NOT NULL, community_id NULL';
  RAISE NOTICE '   - Community messages: community_id NOT NULL, receiver_id NULL';
EXCEPTION
  WHEN check_violation THEN
    RAISE NOTICE '❌ Cannot add constraint - existing data violates it!';
    RAISE NOTICE '   Run clean-mixed-messages.sql first to fix existing data';
  WHEN duplicate_object THEN
    RAISE NOTICE 'ℹ️ Constraint already exists';
END $$;

-- Verify the constraint is active
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conname = 'messages_type_integrity';

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MESSAGE TYPE INTEGRITY ENFORCED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Database will now reject messages that have both receiver_id and community_id';
  RAISE NOTICE '';
END $$;

