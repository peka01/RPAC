-- =============================================
-- DEBUG LICENSE CONSTRAINT ISSUE
-- =============================================
-- This script helps identify the exact constraint causing the issue
-- Created: 2025-01-27

-- Check all constraints on user_profiles table
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'user_profiles'
  AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- Check specifically for license_type constraints
SELECT 
  cc.constraint_name,
  cc.check_clause
FROM information_schema.check_constraints cc
JOIN information_schema.table_constraints tc 
  ON cc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'user_profiles' 
  AND cc.constraint_name LIKE '%license%';

-- Check the actual column definition
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'user_profiles' 
  AND column_name = 'license_type';

-- Check if there are any existing license_type values that might be invalid
SELECT 
  license_type,
  COUNT(*) as count
FROM user_profiles 
GROUP BY license_type;
