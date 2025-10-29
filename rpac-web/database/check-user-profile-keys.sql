-- Check what help_requests.user_id actually contains and should reference

-- 1. Check if user_profiles.user_id is the primary key or if it's user_profiles.id
SELECT
  tc.constraint_name,
  kcu.column_name,
  tc.constraint_type
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_profiles'
  AND tc.constraint_type = 'PRIMARY KEY';

-- 2. Sample data check - what does help_requests.user_id contain?
SELECT 
  hr.id,
  hr.user_id as help_request_user_id,
  up_by_user_id.user_id as profile_user_id_match,
  up_by_id.user_id as profile_id_match
FROM help_requests hr
LEFT JOIN user_profiles up_by_user_id ON hr.user_id = up_by_user_id.user_id
LEFT JOIN user_profiles up_by_id ON hr.user_id = up_by_id.id
LIMIT 3;

-- 3. Check auth.users to understand the relationship
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'auth'
  AND table_name = 'users'
  AND column_name = 'id';
