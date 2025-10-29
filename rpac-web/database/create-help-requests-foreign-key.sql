-- Create proper foreign key relationship between help_requests and user_profiles
-- help_requests.user_id should reference user_profiles.id (the primary key)

-- 1. First, drop any existing broken foreign key if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'help_requests_user_id_fkey' 
        AND table_name = 'help_requests'
    ) THEN
        ALTER TABLE help_requests DROP CONSTRAINT help_requests_user_id_fkey;
    END IF;
END $$;

-- 2. Clean up any orphaned records (help_requests with no matching user_profile)
DELETE FROM help_requests
WHERE user_id NOT IN (SELECT id FROM user_profiles);

-- 3. Create the correct foreign key constraint
-- help_requests.user_id -> user_profiles.id (the primary key)
ALTER TABLE help_requests
ADD CONSTRAINT help_requests_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES user_profiles(id)
ON DELETE CASCADE;

-- 4. Create index for performance
CREATE INDEX IF NOT EXISTS idx_help_requests_user_id ON help_requests(user_id);

-- 5. Verify the constraint was created correctly
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
