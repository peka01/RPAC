-- =============================================
-- SIMPLE LICENSE CONSTRAINT FIX
-- =============================================
-- Direct fix for the license_type constraint issue
-- Created: 2025-01-27

-- Step 1: Drop the problematic constraint
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS license_type_check;
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_license_type_check;

-- Step 2: Clean up any invalid values
UPDATE user_profiles 
SET license_type = 'individual' 
WHERE license_type IS NULL 
   OR license_type NOT IN ('free', 'individual', 'community_manager');

-- Step 3: Add the correct constraint
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_license_type_check 
CHECK (license_type IN ('free', 'individual', 'community_manager'));

-- Step 4: Test that it works
SELECT 'License constraint fix completed successfully!' as status;
