-- Add foreign key relationship between help_requests.user_id and user_profiles.user_id
-- This fixes the error: "Could not find a relationship between 'help_requests' and 'user_profiles'"

-- First, ensure all existing help_requests reference valid user_profiles
-- (Clean up orphaned records if any)
DELETE FROM help_requests
WHERE user_id NOT IN (SELECT user_id FROM user_profiles);

-- Add the foreign key constraint
ALTER TABLE help_requests
ADD CONSTRAINT help_requests_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES user_profiles(user_id)
ON DELETE CASCADE;

-- Create an index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_help_requests_user_id ON help_requests(user_id);

-- Verify the constraint was created
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'help_requests'
  AND kcu.column_name = 'user_id';
