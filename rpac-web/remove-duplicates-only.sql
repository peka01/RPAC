-- Remove only duplicate profiles, keeping the most recent one for each user

-- Step 1: Check current duplicates
SELECT user_id, COUNT(*) as profile_count, 
       array_agg(id) as profile_ids,
       array_agg(created_at) as created_dates
FROM user_profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- Step 2: Delete duplicate profiles, keeping the most recent one for each user
DELETE FROM user_profiles
WHERE id IN (
    SELECT id
    FROM (
        SELECT
            id,
            user_id,
            ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC, id DESC) as rn
        FROM user_profiles
    ) AS sub
    WHERE sub.rn > 1
);

-- Step 3: Verify that duplicates are gone
SELECT user_id, COUNT(*) as profile_count
FROM user_profiles 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- If this returns no results, the cleanup was successful
