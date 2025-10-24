-- ASSIGN SPECIFIC USER AS DEMO SAMHÄLLE CREATOR
-- ================================================================
-- Created: 2025-01-27
-- Purpose: Assign user 2c94f0e7-adc0-4c15-8bef-d4d593131325 as creator of Demo Samhälle
-- ================================================================

-- Step 1: Check current state
SELECT 
  'BEFORE ASSIGNMENT:' as info,
  lc.id as community_id,
  lc.community_name,
  lc.created_by,
  lc.created_at
FROM local_communities lc
WHERE lc.community_name = 'Demo Samhälle';

-- Step 2: Verify the user exists
SELECT 
  'USER VERIFICATION:' as info,
  au.id as user_id,
  au.email,
  up.display_name,
  up.first_name,
  up.last_name
FROM auth.users au
LEFT JOIN user_profiles up ON up.user_id = au.id
WHERE au.id = '2c94f0e7-adc0-4c15-8bef-d4d593131325';

-- Step 3: Assign the creator
UPDATE local_communities 
SET created_by = '2c94f0e7-adc0-4c15-8bef-d4d593131325'
WHERE community_name = 'Demo Samhälle' 
  AND created_by IS NULL;

-- Step 4: Verify the assignment
SELECT 
  'AFTER ASSIGNMENT:' as info,
  lc.id as community_id,
  lc.community_name,
  lc.created_by,
  au.email as creator_email,
  up.display_name as creator_name
FROM local_communities lc
LEFT JOIN auth.users au ON au.id = lc.created_by
LEFT JOIN user_profiles up ON up.user_id = lc.created_by
WHERE lc.community_name = 'Demo Samhälle';

-- Step 5: Final verification - check all communities now have creators
SELECT 
  'FINAL VERIFICATION - ALL COMMUNITIES:' as info,
  lc.id as community_id,
  lc.community_name,
  lc.created_by,
  au.email as creator_email,
  up.display_name as creator_name
FROM local_communities lc
LEFT JOIN auth.users au ON au.id = lc.created_by
LEFT JOIN user_profiles up ON up.user_id = lc.created_by
ORDER BY lc.created_at DESC;

RAISE NOTICE '✅ Demo Samhälle creator assigned to user 2c94f0e7-adc0-4c15-8bef-d4d593131325!';
