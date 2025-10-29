-- Fix foreign key to reference user_profiles.user_id instead of user_profiles.id
-- auth.users.id == user_profiles.user_id (confirmed by data check)

-- 1. Drop the incorrect foreign key
ALTER TABLE help_requests
DROP CONSTRAINT IF EXISTS help_requests_user_id_fkey;

-- 2. Clean up any orphaned records
DELETE FROM help_requests
WHERE user_id NOT IN (SELECT user_id FROM user_profiles WHERE user_id IS NOT NULL);

-- 3. Create the CORRECT foreign key constraint
-- help_requests.user_id -> user_profiles.user_id (NOT user_profiles.id!)
ALTER TABLE help_requests
ADD CONSTRAINT help_requests_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES user_profiles(user_id)
ON DELETE CASCADE;

-- 4. Ensure user_profiles.user_id has a unique constraint (required for foreign key)
-- First check if it exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_profiles_user_id_key'
    ) THEN
        ALTER TABLE user_profiles
        ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 5. Create index for performance
CREATE INDEX IF NOT EXISTS idx_help_requests_user_id ON help_requests(user_id);

-- 6. Verify the constraint was created correctly
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'help_requests'
  AND kcu.column_name = 'user_id';
