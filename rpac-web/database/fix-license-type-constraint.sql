-- =============================================
-- FIX LICENSE_TYPE CONSTRAINT ISSUE
-- =============================================
-- This fixes the license_type_check constraint violation
-- when upgrading user tiers via super admin page
-- Created: 2025-01-27

-- First, check if license_type column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'license_type'
  ) THEN
    -- Add license_type column if it doesn't exist
    ALTER TABLE user_profiles 
    ADD COLUMN license_type VARCHAR(20) DEFAULT 'individual' 
    CHECK (license_type IN ('free', 'individual', 'community_manager'));
    
    RAISE NOTICE '✅ Added license_type column to user_profiles';
  ELSE
    RAISE NOTICE '✅ license_type column already exists';
  END IF;
END $$;

-- Check current constraint and fix if needed
DO $$
BEGIN
  -- Drop existing constraint if it exists and is wrong
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_profiles_license_type_check'
  ) THEN
    ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_license_type_check;
    RAISE NOTICE 'Dropped old license_type constraint';
  END IF;
  
  -- Add correct constraint
  ALTER TABLE user_profiles 
  ADD CONSTRAINT user_profiles_license_type_check 
  CHECK (license_type IN ('free', 'individual', 'community_manager'));
  
  RAISE NOTICE '✅ Added correct license_type constraint';
END $$;

-- Update any existing NULL license_type values
UPDATE user_profiles 
SET license_type = 'individual' 
WHERE license_type IS NULL;

-- Verify the constraint works
DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.check_constraints 
  WHERE constraint_name = 'user_profiles_license_type_check';
  
  IF constraint_count > 0 THEN
    RAISE NOTICE '✅ license_type constraint is properly set up';
  ELSE
    RAISE NOTICE '❌ license_type constraint setup failed';
  END IF;
END $$;

RAISE NOTICE '🎯 License type constraint fix completed successfully!';
