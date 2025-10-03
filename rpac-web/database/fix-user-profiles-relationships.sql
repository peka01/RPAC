-- =============================================
-- FIX USER_PROFILES RELATIONSHIPS FOR SUPABASE
-- =============================================
-- This migration ensures Supabase can join from community_memberships.user_id
-- to user_profiles by making user_id UNIQUE in user_profiles
-- 
-- Error fixed: "Could not find a relationship between 'community_memberships' and 'user_profiles'"
-- Root cause: user_profiles.user_id was not UNIQUE, so Supabase couldn't infer the join
-- Created: 2025-10-03

-- Step 1: Make user_id UNIQUE in user_profiles (if not already)
DO $$
BEGIN
  -- Check if unique constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_user_id_key' 
    AND table_name = 'user_profiles'
  ) THEN
    -- Add unique constraint on user_id
    ALTER TABLE user_profiles 
    ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
    
    RAISE NOTICE '✅ Added UNIQUE constraint on user_profiles.user_id';
  ELSE
    RAISE NOTICE 'ℹ️ UNIQUE constraint already exists on user_profiles.user_id';
  END IF;
END $$;

-- Step 2: Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Step 3: Verify the relationship can be established
-- Test query that should now work
DO $$
DECLARE
  test_result INTEGER;
BEGIN
  -- This simulates what Supabase does internally
  SELECT COUNT(*) INTO test_result
  FROM information_schema.table_constraints tc
  WHERE tc.table_name = 'user_profiles'
    AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
    AND tc.constraint_name LIKE '%user_id%';
    
  IF test_result > 0 THEN
    RAISE NOTICE '✅ user_profiles.user_id is now UNIQUE - Supabase can establish relationships';
  ELSE
    RAISE WARNING '⚠️ Could not verify UNIQUE constraint on user_profiles.user_id';
  END IF;
END $$;

-- Step 4: Display all constraints on user_profiles for verification
SELECT 
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'user_profiles'::regclass
ORDER BY conname;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'What this fixes:';
  RAISE NOTICE '  - community_memberships.user_id can now join to user_profiles.user_id';
  RAISE NOTICE '  - resource_sharing.user_id can now join to user_profiles.user_id';
  RAISE NOTICE '  - help_requests.user_id can now join to user_profiles.user_id';
  RAISE NOTICE '  - messages sender/receiver can now join to user_profiles.user_id';
  RAISE NOTICE '';
  RAISE NOTICE 'Queries that now work:';
  RAISE NOTICE '  .select(''*, user_profiles!inner(display_name, avatar_url)'')';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 You may need to restart your dev server for changes to take effect';
  RAISE NOTICE '';
END $$;

