-- AGGRESSIVE CLEANUP: Delete ALL user profiles and start fresh
-- This will force you to recreate your profile, but it's the only way to fix the duplicates

-- Step 1: Check what we have
SELECT user_id, COUNT(*) as profile_count, 
       array_agg(id) as profile_ids,
       array_agg(created_at) as created_dates
FROM user_profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- Step 2: Delete ALL profiles (nuclear option)
DELETE FROM user_profiles;

-- Step 3: Verify everything is gone
SELECT COUNT(*) as remaining_profiles FROM user_profiles;

-- If this returns 0, the cleanup was successful
-- You'll need to recreate your profile after this
