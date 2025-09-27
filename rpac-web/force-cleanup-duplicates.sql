-- Force cleanup of duplicate user profiles
-- This script will delete ALL profiles for your user and let you recreate one

-- Step 1: Check current duplicates
SELECT user_id, COUNT(*) as profile_count, 
       array_agg(id) as profile_ids,
       array_agg(created_at) as created_dates
FROM user_profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- Step 2: Delete ALL profiles for users with duplicates
-- (This will force you to recreate your profile, but it's the cleanest solution)
DELETE FROM user_profiles 
WHERE user_id IN (
  SELECT user_id 
  FROM user_profiles 
  GROUP BY user_id 
  HAVING COUNT(*) > 1
);

-- Step 3: Verify cleanup
SELECT user_id, COUNT(*) as profile_count
FROM user_profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- If this returns no results, the cleanup was successful
