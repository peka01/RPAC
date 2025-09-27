-- Fix duplicate user profiles issue
-- Run this in your Supabase SQL editor

-- First, let's see how many duplicate profiles exist
SELECT user_id, COUNT(*) as profile_count
FROM user_profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- If you see duplicates, we need to keep only the most recent one
-- This will delete older duplicates and keep the newest profile for each user
WITH ranked_profiles AS (
  SELECT id, user_id, created_at,
         ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM user_profiles
)
DELETE FROM user_profiles 
WHERE id IN (
  SELECT id FROM ranked_profiles WHERE rn > 1
);

-- Verify the fix worked
SELECT user_id, COUNT(*) as profile_count
FROM user_profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- If no results above, the duplicates are fixed!
