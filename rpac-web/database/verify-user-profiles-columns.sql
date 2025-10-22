-- =============================================
-- VERIFY USER_PROFILES COLUMNS
-- =============================================
-- This script checks which columns exist in user_profiles table
-- Run this in Supabase SQL Editor to see what's missing
--
-- Created: 2025-10-22
-- Purpose: Diagnose missing columns causing "Okänd användare" errors

-- Check which columns exist
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if display_name column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'display_name'
  ) THEN
    RAISE NOTICE '✅ display_name column EXISTS';
  ELSE
    RAISE NOTICE '❌ display_name column MISSING - Run add-display-name-to-profiles.sql';
  END IF;
END $$;

-- Check if family_size column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'family_size'
  ) THEN
    RAISE NOTICE '✅ family_size column EXISTS';
  ELSE
    RAISE NOTICE '❌ family_size column MISSING - This is required in base schema';
  END IF;
END $$;

-- Sample query to see actual profile data
SELECT 
  user_id,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'display_name')
    THEN 'display_name column exists'
    ELSE 'display_name column missing'
  END as display_name_status,
  postal_code,
  county
FROM user_profiles
LIMIT 5;

