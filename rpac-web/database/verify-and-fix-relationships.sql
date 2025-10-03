-- =============================================
-- VERIFY AND FIX USER_PROFILES RELATIONSHIPS
-- =============================================
-- This script diagnoses and fixes the relationship issue between
-- community_memberships and user_profiles
-- Created: 2025-10-03

-- Step 1: Check current state of user_profiles table
SELECT 
  'Current user_profiles constraints:' as info,
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'user_profiles'::regclass
ORDER BY conname;

-- Step 2: Check if user_id is unique
SELECT 
  'Checking user_id uniqueness:' as info,
  COUNT(*) as total_profiles,
  COUNT(DISTINCT user_id) as distinct_user_ids,
  CASE 
    WHEN COUNT(*) = COUNT(DISTINCT user_id) THEN '✅ All user_ids are unique'
    ELSE '❌ Duplicate user_ids found!'
  END as status
FROM user_profiles;

-- Step 3: Make user_id UNIQUE (this is the key fix)
DO $$
BEGIN
  -- Remove the constraint if it exists (in case we need to recreate it)
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_profiles_user_id_key' 
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_user_id_key;
    RAISE NOTICE '🔄 Dropped existing UNIQUE constraint';
  END IF;
  
  -- Add the UNIQUE constraint
  ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
  RAISE NOTICE '✅ Added UNIQUE constraint on user_profiles.user_id';
  
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION '❌ Cannot add UNIQUE constraint: duplicate user_ids exist in user_profiles table. Clean up duplicates first.';
  WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Error adding UNIQUE constraint: %', SQLERRM;
END $$;

-- Step 4: Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
RAISE NOTICE '✅ Created index on user_profiles.user_id';

-- Step 5: Verify the constraint was added
DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints
  WHERE table_name = 'user_profiles'
    AND constraint_type = 'UNIQUE'
    AND constraint_name = 'user_profiles_user_id_key';
  
  IF constraint_count > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SUCCESS! Constraint verified';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'user_profiles.user_id is now UNIQUE';
    RAISE NOTICE 'Supabase should now be able to infer the relationship';
    RAISE NOTICE '';
  ELSE
    RAISE EXCEPTION '❌ UNIQUE constraint was not created properly';
  END IF;
END $$;

-- Step 6: Test the relationship by simulating what Supabase does
-- This checks if a join path exists from community_memberships to user_profiles
DO $$
DECLARE
  test_query TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Testing relationship inference...';
  RAISE NOTICE '';
  
  -- Test if we can join community_memberships to user_profiles via user_id
  PERFORM 1
  FROM community_memberships cm
  JOIN user_profiles up ON cm.user_id = up.user_id
  LIMIT 1;
  
  RAISE NOTICE '✅ JOIN test successful!';
  RAISE NOTICE 'Query: community_memberships.user_id → user_profiles.user_id';
  RAISE NOTICE '';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ JOIN test failed: %', SQLERRM;
END $$;

-- Step 7: Show final table structure
SELECT 
  'Final user_profiles constraints:' as info,
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'user_profiles'::regclass
ORDER BY conname;

-- Step 8: Final instructions
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📋 NEXT STEPS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '1. Go to Supabase Dashboard → Settings → API';
  RAISE NOTICE '2. Click "Reload schema" or wait 30 seconds';
  RAISE NOTICE '3. Restart your Next.js dev server';
  RAISE NOTICE '4. Hard refresh your browser (Ctrl+Shift+R)';
  RAISE NOTICE '5. Test the messaging interface';
  RAISE NOTICE '';
  RAISE NOTICE 'If it still doesn''t work, check the browser console';
  RAISE NOTICE 'for the exact error message.';
  RAISE NOTICE '';
END $$;

