-- Simple cleanup: Just delete all profiles
DELETE FROM user_profiles;

-- Verify cleanup
SELECT COUNT(*) as remaining_profiles FROM user_profiles;
