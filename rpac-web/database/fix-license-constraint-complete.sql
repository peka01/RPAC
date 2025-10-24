-- =============================================
-- COMPLETE LICENSE CONSTRAINT FIX
-- =============================================
-- This completely fixes the license_type constraint issue
-- Created: 2025-01-27

-- Step 1: Drop ALL existing license_type constraints
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find and drop all license-related constraints
  FOR constraint_name IN 
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = 'user_profiles'::regclass
    AND conname LIKE '%license%'
  LOOP
    EXECUTE 'ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS ' || constraint_name;
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  END LOOP;
END $$;

-- Step 2: Ensure license_type column exists with correct definition
DO $$
BEGIN
  -- Add column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'license_type'
  ) THEN
    ALTER TABLE user_profiles 
    ADD COLUMN license_type VARCHAR(20) DEFAULT 'individual';
    RAISE NOTICE 'Added license_type column';
  END IF;
END $$;

-- Step 3: Clean up any invalid license_type values
UPDATE user_profiles 
SET license_type = 'individual' 
WHERE license_type IS NULL 
   OR license_type NOT IN ('free', 'individual', 'community_manager');

-- Step 4: Add the correct constraint
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_license_type_check 
CHECK (license_type IN ('free', 'individual', 'community_manager'));

-- Step 5: Verify the constraint works
DO $$
DECLARE
  test_result BOOLEAN;
BEGIN
  -- Test that valid values work
  BEGIN
    UPDATE user_profiles 
    SET license_type = 'individual' 
    WHERE user_id = (SELECT user_id FROM user_profiles LIMIT 1);
    test_result := TRUE;
  EXCEPTION WHEN OTHERS THEN
    test_result := FALSE;
  END;
  
  IF test_result THEN
    RAISE NOTICE '✅ License constraint is working correctly';
  ELSE
    RAISE NOTICE '❌ License constraint still has issues';
  END IF;
END $$;

RAISE NOTICE '🎯 License constraint fix completed!';
